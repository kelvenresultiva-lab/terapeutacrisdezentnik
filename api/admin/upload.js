const { requireAuth } = require('../_lib/auth');
const { putFileBase64 } = require('../_lib/github');

const ALLOWED = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const MAX_BYTES = 4 * 1024 * 1024;

module.exports = async (req, res) => {
  if (!requireAuth(req, res)) return;
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido.' });
    return;
  }

  let body = req.body;
  if (!body || typeof body === 'string') {
    try { body = JSON.parse(body || '{}'); } catch { body = {}; }
  }
  const { filename, contentType, dataBase64 } = body || {};

  const ext = ALLOWED[contentType];
  if (!ext) {
    res.status(400).json({ error: 'Formato de imagem não suportado (use JPG, PNG ou WEBP).' });
    return;
  }
  if (!dataBase64 || dataBase64.length > MAX_BYTES * 1.4) {
    res.status(400).json({ error: 'Imagem muito grande (máximo 4MB).' });
    return;
  }

  const safeName = String(filename || 'imagem').replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
  const path = `blog/uploads/${Date.now()}-${safeName}.${ext}`;

  await putFileBase64(path, dataBase64, `Blog: envia imagem ${safeName}`);

  res.status(201).json({ url: `/${path}` });
};
