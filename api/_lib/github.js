// Helper para ler/gravar arquivos do repositório via GitHub Contents API.
// Cada publicação de post vira um commit real no GitHub, que dispara um novo deploy na Vercel.

const API = 'https://api.github.com';

function repoInfo() {
  const repo = process.env.GITHUB_REPO; // ex: "kelvenresultiva-lab/psicologojoaobatista"
  const branch = process.env.GITHUB_BRANCH || 'main';
  const token = process.env.GITHUB_TOKEN;
  if (!repo || !token) {
    throw new Error('GITHUB_REPO ou GITHUB_TOKEN não configurados nas variáveis de ambiente da Vercel.');
  }
  return { repo, branch, token };
}

async function ghFetch(path, options = {}) {
  const { token } = repoInfo();
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'joao-blog-admin',
      ...(options.headers || {}),
    },
  });
  return res;
}

// Lê um arquivo do repo. Retorna { content, sha } ou null se não existir.
async function getFile(filePath) {
  const { repo, branch } = repoInfo();
  const res = await ghFetch(`/repos/${repo}/contents/${filePath}?ref=${branch}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Falha ao ler ${filePath} no GitHub: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const content = Buffer.from(data.content, 'base64').toString('utf8');
  return { content, sha: data.sha };
}

// Cria ou atualiza um arquivo no repo (um commit).
async function putFile(filePath, content, message) {
  const { repo, branch } = repoInfo();
  const existing = await getFile(filePath);
  const body = {
    message,
    content: Buffer.from(content, 'utf8').toString('base64'),
    branch,
  };
  if (existing) body.sha = existing.sha;
  const res = await ghFetch(`/repos/${repo}/contents/${filePath}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Falha ao gravar ${filePath} no GitHub: ${res.status} ${await res.text()}`);
  return res.json();
}

// Grava um arquivo binário (ex: imagem) já em base64.
async function putFileBase64(filePath, base64Content, message) {
  const { repo, branch } = repoInfo();
  const existing = await getFile(filePath).catch(() => null);
  const body = { message, content: base64Content, branch };
  if (existing) body.sha = existing.sha;
  const res = await ghFetch(`/repos/${repo}/contents/${filePath}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Falha ao gravar ${filePath} no GitHub: ${res.status} ${await res.text()}`);
  return res.json();
}

async function deleteFile(filePath, message) {
  const existing = await getFile(filePath);
  if (!existing) return;
  const { repo, branch } = repoInfo();
  const res = await ghFetch(`/repos/${repo}/contents/${filePath}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sha: existing.sha, branch }),
  });
  if (!res.ok) throw new Error(`Falha ao apagar ${filePath} no GitHub: ${res.status} ${await res.text()}`);
}

module.exports = { getFile, putFile, putFileBase64, deleteFile };
