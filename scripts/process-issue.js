const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const https = require('https');
const crypto = require('crypto');
const core = require('@actions/core');
const github = require('@actions/github');

const ISSUE_BODY = process.env.ISSUE_BODY || '';
const ISSUE_NUMBER = parseInt(process.env.ISSUE_NUMBER || '0', 10);
const REPO_OWNER = process.env.REPO_OWNER || '';
const REPO_NAME = process.env.REPO_NAME || '';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

const octokit = GITHUB_TOKEN ? github.getOctokit(GITHUB_TOKEN) : null;

// --- Helper Functions ---

// Send a comment to the issue
async function postComment(body) {
  if (!octokit) return console.log(`[Local Run] Would post comment: ${body}`);
  await octokit.rest.issues.createComment({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    issue_number: ISSUE_NUMBER,
    body: body
  });
}

// Close the issue
async function closeIssue() {
  if (!octokit) return console.log(`[Local Run] Would close issue.`);
  await octokit.rest.issues.update({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    issue_number: ISSUE_NUMBER,
    state: 'closed'
  });
}

// Extract field from Issue Form Body
function extractField(body, header) {
  const regex = new RegExp(`### ${header}\\s*\\n+([^#]+)`, 'i');
  const match = body.match(regex);
  return match ? match[1].trim().replace(/<[^>]*>?/gm, '') : ''; // Simple HTML sanitization
}

// Extract PDF URL from body
function extractPdfUrl(body) {
  const regex = /(https:\/\/github\.com\/[^/]+\/[^/]+\/files\/[^\s)]+\.pdf)/i;
  const match = body.match(regex);
  if (match) return match[1];
  
  const genericPdfRegex = /(https:\/\/[^\s)]+\.pdf)/i;
  const matchGeneric = body.match(genericPdfRegex);
  return matchGeneric ? matchGeneric[1] : null;
}

// Download File
async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        https.get(response.headers.location, (res) => {
          res.pipe(file);
          file.on('finish', () => file.close(resolve));
        }).on('error', reject);
      } else {
        response.pipe(file);
        file.on('finish', () => file.close(resolve));
      }
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

// Verify Magic Bytes (%PDF-)
function verifyPdfMagicBytes(filePath) {
  const buffer = Buffer.alloc(5);
  const fd = fs.openSync(filePath, 'r');
  fs.readSync(fd, buffer, 0, 5, 0);
  fs.closeSync(fd);
  return buffer.toString('utf8') === '%PDF-';
}

// Generate SHA-256 Hash of a file
function generateFileHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

// Compress PDF using spawn to prevent command injection
async function compressPdf(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const gsArgs = [
      '-sDEVICE=pdfwrite',
      '-dCompatibilityLevel=1.4',
      '-dPDFSETTINGS=/screen',
      '-dNOPAUSE',
      '-dQUIET',
      '-dBATCH',
      `-sOutputFile=${outputPath}`,
      inputPath
    ];

    const gs = spawn('gs', gsArgs);

    gs.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Ghostscript exited with code ${code}`));
    });
    
    gs.on('error', (err) => reject(err));
  });
}

// --- Main Execution ---

async function run() {
  let tempPdfPath = '';
  try {
    console.log('Starting issue processing...');
    
    // 1. Parse & Sanitize
    const professor = extractField(ISSUE_BODY, 'Professor\\(a\\)');
    const subject = extractField(ISSUE_BODY, 'Matéria');
    const semester = extractField(ISSUE_BODY, 'Semestre');
    const examType = extractField(ISSUE_BODY, 'Tipo de Avaliação');
    const difficultyStr = extractField(ISSUE_BODY, 'Dificuldade');
    const hasAnswerKeyStr = extractField(ISSUE_BODY, 'Gabarito e Resolução');
    const tips = extractField(ISSUE_BODY, 'Dica de Ouro \\(Opcional\\)');
    const pdfUrl = extractPdfUrl(ISSUE_BODY);

    const hasAnswerKey = hasAnswerKeyStr.toLowerCase().includes('[x]');

    if (!professor || !subject || !semester || !examType || !pdfUrl) {
      throw new Error('Formulário incompleto. Certifique-se de preencher todos os campos obrigatórios e anexar o PDF.');
    }

    // Validação de formato do semestre (ex: 2023.1)
    if (!/^\d{4}\.\d$/.test(semester)) {
      throw new Error('O semestre deve estar no formato YYYY.S (ex: 2023.1).');
    }

    // 2. Download
    const examsDir = path.join(__dirname, '../public/exams');
    if (!fs.existsSync(examsDir)) {
      fs.mkdirSync(examsDir, { recursive: true });
    }

    tempPdfPath = path.join(examsDir, `temp_${Date.now()}.pdf`);
    console.log(`Downloading PDF from ${pdfUrl}...`);
    await downloadFile(pdfUrl, tempPdfPath);

    // 3. Verificação de Magic Bytes
    if (!verifyPdfMagicBytes(tempPdfPath)) {
      throw new Error('O arquivo anexado não é um PDF válido (Magic Bytes incorretos). Por favor, anexe um documento PDF real.');
    }

    // 4. Geração de Hash (Anti-duplicidade)
    const fileHash = generateFileHash(tempPdfPath);
    const dbPath = path.join(__dirname, '../public/data/exams.json');
    
    let exams = [];
    if (fs.existsSync(dbPath)) {
      exams = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    }

    const isDuplicate = exams.some(exam => exam.id === fileHash);
    if (isDuplicate) {
      // Deleta o temp baixado
      fs.unlinkSync(tempPdfPath);
      await postComment('⚠️ **Prova Duplicada!**\nEsta exata mesma prova já existe no nosso banco de dados. Obrigado pela intenção, mas não precisamos adicioná-la novamente!');
      await closeIssue();
      console.log('Duplicate found, aborting.');
      return; // Sai com sucesso, pois não é um erro do sistema, apenas uma regra de negócio.
    }

    // 5. Compressão
    const safeSubject = subject.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const fileName = `${safeSubject}_${fileHash.substring(0, 8)}.pdf`;
    const finalPdfPath = path.join(examsDir, fileName);

    console.log('Compressing PDF...');
    await compressPdf(tempPdfPath, finalPdfPath);
    
    // Limpa o temp
    if (fs.existsSync(tempPdfPath)) {
      fs.unlinkSync(tempPdfPath);
    }

    // 6. Atualização do Banco de Dados
    const newExam = {
      id: fileHash,
      subject,
      professor,
      semester,
      examType,
      difficulty: parseInt(difficultyStr, 10) || 3,
      hasAnswerKey,
      tips: tips === '_No response_' ? '' : tips, // Github defaults empty optionals to _No response_
      pdfUrl: `/exams/${fileName}`,
      dateAdded: new Date().toISOString(),
      contributor: process.env.ISSUE_AUTHOR || 'Anônimo'
    };

    exams.push(newExam);
    fs.writeFileSync(dbPath, JSON.stringify(exams, null, 2));
    console.log('Database updated.');

    // 7. Sucesso!
    await postComment(`🎉 **Sucesso!**\nA sua prova de **${subject}** foi processada, otimizada e adicionada ao repositório! Muito obrigado pela contribuição, @${process.env.ISSUE_AUTHOR}!`);
    await closeIssue();

  } catch (error) {
    console.error('Error:', error.message);
    if (fs.existsSync(tempPdfPath)) {
      fs.unlinkSync(tempPdfPath); // Limpeza em caso de erro
    }
    
    // Posta o erro na issue (deixa aberta para correção)
    const errorMsg = `❌ **Erro ao processar a prova!**\n\n${error.message}\n\nPor favor, corrija o problema editando a Issue ou abrindo uma nova.`;
    await postComment(errorMsg);
    
    // Sinaliza erro para o Github Actions parar o step de commit
    process.exit(1);
  }
}

run();
