# Contexto do Projeto: WikiProvas FCTE UNB

Este arquivo serve como base de conhecimento e diretriz de comportamento para qualquer agente de Inteligência Artificial que for atuar no desenvolvimento ou manutenção deste projeto.

## 1. Visão Geral
- **Objetivo:** Criar um repositório rico, colaborativo e público de provas antigas para a faculdade FCTE UNB, carinhosamente chamado de "Wikipedia de Provas".
- **Hospedagem:** O frontend é 100% estático e hospedado no **GitHub Pages**. Não há um servidor backend Node.js/Python rodando continuamente.
- **Idioma:** A comunicação com o usuário deve ser SEMPRE em Português do Brasil (pt-br).

## 2. Arquitetura (GitOps / IssueOps)
Como não temos um backend tradicional, utilizamos o próprio ecossistema do GitHub como servidor e banco de dados:
- **Banco de Dados:** Todos os metadados das provas ficam armazenados em um arquivo estático JSON (`public/data/exams.json`).
- **Ingestão de Dados (IssueOps):** Os alunos enviam provas abrindo uma **Issue** preenchendo um template YAML (`.github/ISSUE_TEMPLATE/nova_prova.yml`) com o PDF anexado.
- **Processamento Automático:** Uma GitHub Action (`.github/workflows/process-exam.yml`) é acionada ao abrir a issue. Ela executa o script `scripts/process-issue.js`.

## 3. Detalhes do "Backend" (Script de Processamento)
O script `scripts/process-issue.js` possui um estado de "Perfeição Técnica" e as seguintes regras não devem ser removidas sem aprovação explícita:
- **Segurança (Magic Bytes):** Todo PDF anexado passa por uma verificação dos primeiros bytes (`%PDF-`) para evitar envio de malwares disfarçados de `.pdf`.
- **Anti-Duplicidade (SHA-256):** O ID de cada prova no JSON é o hash SHA-256 do arquivo original. Se o hash colidir, o robô entende que a prova já existe e bloqueia a adição para poupar espaço.
- **Prevenção de Injeção de Comandos:** O processo de compressão usando `Ghostscript` é feito estritamente via `child_process.spawn`, nunca com `exec` ou `execSync`.
- **UX do Robô:** Tratamento de erros se comunica via API oficial do GitHub (`@actions/github`), comentando na Issue caso o usuário tenha cometido um erro, em vez de falhar silenciosamente.

## 4. Diretrizes de Frontend
- **Stack:** React + Vite.
- **Estilização:** CSS Vanilla ou CSS Modules. **Não utilize TailwindCSS** (a menos que o usuário solicite explicitamente uma mudança de stack).
- **Design:** O projeto deve ter um visual extremamente "Premium". 
  - Foco em **Dark Mode** moderno.
  - Uso de **Glassmorphism** (efeitos de vidro, transparências suaves).
  - Micro-animações e efeitos visuais impactantes ao passar o mouse ou abrir filtros.
  - Tipografia moderna (como Inter, Roboto ou Outfit).
- **Funcionalidades Core:** A interface precisará consumir o `exams.json` e implementar filtros complexos (Professor, Matéria, Semestre, Dificuldade).

## 5. Regras de Conduta do Agente
- Sempre valide o impacto no limite de armazenamento do GitHub ao sugerir inclusão de novas mídias.
- Respeite o `CODE_OF_CONDUCT.md` ao redigir textos voltados ao público.
- Qualquer alteração na lógica de parse das Issues deve ser retrocompatível ou coordenada com a edição de `.github/ISSUE_TEMPLATE/nova_prova.yml`.
