const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');

const ISSUE_BODY = process.env.ISSUE_BODY || '';
const ISSUE_NUMBER = process.env.ISSUE_NUMBER || '0';

// Helper to extract value from issue body (format varies based on issue form template)
// Issue forms usually format data as:
// ### Professor(a)
//
// João Silva
function extractField(body, header) {
  const regex = new RegExp(`### ${header}\\s*\\n+([^#]+)`, 'i');
  const match = body.match(regex);
  return match ? match[1].trim() : '';
}

// Extract PDF URL from markdown link or raw URL
function extractPdfUrl(body) {
  const regex = /(https:\/\/github\.com\/[^/]+\/[^/]+\/files\/[^\s)]+\.pdf)/i;
  const match = body.match(regex);
  return match ? match[1] : null;
}

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirect
        https.get(response.headers.location, (res) => {
          res.pipe(file);
          file.on('finish', () => {
            file.close(resolve);
          });
        }).on('error', reject);
      } else {
        response.pipe(file);
        file.on('finish', () => {
          file.close(resolve);
        });
      }
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

async function run() {
  try {
    const professor = extractField(ISSUE_BODY, 'Professor\\(a\\)');
    const subject = extractField(ISSUE_BODY, 'Matéria');
    const semester = extractField(ISSUE_BODY, 'Semestre');
    const difficultyStr = extractField(ISSUE_BODY, 'Dificuldade');
    let pdfUrl = extractPdfUrl(ISSUE_BODY);

    if (!pdfUrl) {
      // Fallback: look for generic https links ending in .pdf
      const genericPdfRegex = /(https:\/\/[^\s)]+\.pdf)/i;
      const match = ISSUE_BODY.match(genericPdfRegex);
      if (match) pdfUrl = match[1];
    }

    if (!pdfUrl) {
      console.error('No PDF URL found in the issue body.');
      process.exit(1);
    }

    const timestamp = new Date().getTime();
    const safeSubject = subject.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const fileName = `${safeSubject}_${timestamp}.pdf`;
    
    const examsDir = path.join(__dirname, '../public/exams');
    if (!fs.existsSync(examsDir)) {
      fs.mkdirSync(examsDir, { recursive: true });
    }

    const tempPdfPath = path.join(examsDir, `temp_${fileName}`);
    const finalPdfPath = path.join(examsDir, fileName);

    console.log(`Downloading PDF from ${pdfUrl}...`);
    await downloadFile(pdfUrl, tempPdfPath);

    console.log(`Compressing PDF using Ghostscript...`);
    // Compress PDF
    execSync(`gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/screen -dNOPAUSE -dQUIET -dBATCH -sOutputFile=${finalPdfPath} ${tempPdfPath}`);

    // Clean up temp file
    fs.unlinkSync(tempPdfPath);
    console.log(`PDF compressed and saved to ${finalPdfPath}`);

    // Update database
    const dbPath = path.join(__dirname, '../public/data/exams.json');
    let exams = [];
    if (fs.existsSync(dbPath)) {
      exams = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    }

    const newExam = {
      id: `issue-${ISSUE_NUMBER}-${timestamp}`,
      subject,
      professor,
      semester,
      difficulty: parseInt(difficultyStr, 10) || 3,
      pdfUrl: `/exams/${fileName}`,
      dateAdded: new Date().toISOString()
    };

    exams.push(newExam);
    fs.writeFileSync(dbPath, JSON.stringify(exams, null, 2));

    console.log('Database updated successfully.');

  } catch (error) {
    console.error('Error processing issue:', error);
    process.exit(1);
  }
}

run();
