const crypto = require('crypto');

const COOKIE_NAME = 'joao_admin_session';
const SESSION_HOURS = 24 * 7; // 7 dias

function sign(value) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) throw new Error('ADMIN_SECRET não configurado nas variáveis de ambiente da Vercel.');
  return crypto.createHmac('sha256', secret).update(value).digest('hex');
}

function createSessionCookie() {
  const expires = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  const payload = String(expires);
  const sig = sign(payload);
  const value = `${payload}.${sig}`;
  return `${COOKIE_NAME}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_HOURS * 3600}`;
}

function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

function parseCookies(req) {
  const header = req.headers.cookie || '';
  const out = {};
  header.split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx === -1) return;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  });
  return out;
}

function isAuthenticated(req) {
  try {
    const cookies = parseCookies(req);
    const value = cookies[COOKIE_NAME];
    if (!value) return false;
    const [expires, sig] = value.split('.');
    if (!expires || !sig) return false;
    const expectedSig = sign(expires);
    const sigBuf = Buffer.from(sig, 'hex');
    const expectedBuf = Buffer.from(expectedSig, 'hex');
    if (sigBuf.length !== expectedBuf.length) return false;
    if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return false;
    if (Date.now() > Number(expires)) return false;
    return true;
  } catch {
    return false;
  }
}

function safeEqual(value, expected) {
  if (!expected || typeof value !== 'string') return false;
  const a = Buffer.from(value);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function checkPassword(password) {
  return safeEqual(password, process.env.ADMIN_PASSWORD);
}

function checkCredentials(email, password) {
  const emailOk = safeEqual(
    String(email || '').trim().toLowerCase(),
    String(process.env.ADMIN_EMAIL || '').trim().toLowerCase()
  );
  return emailOk && checkPassword(password);
}

function requireAuth(req, res) {
  if (!isAuthenticated(req)) {
    res.status(401).json({ error: 'Não autenticado.' });
    return false;
  }
  return true;
}

module.exports = {
  COOKIE_NAME,
  createSessionCookie,
  clearSessionCookie,
  isAuthenticated,
  checkPassword,
  checkCredentials,
  requireAuth,
  parseCookies,
};
