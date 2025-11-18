const { createToken, setNoStore } = require('../_utils');

module.exports = (req, res) => {
  if(req.method !== 'GET'){ res.statusCode=405; return res.end('Method Not Allowed'); }
  const origin = req.headers['origin']||'';
  const host = req.headers['host']||'';
  // Basic origin check
  if(origin && !origin.includes(host)){ res.statusCode=403; return res.end('Forbidden'); }

  const secret = process.env.POLL_SECRET || process.env.SECRET || 'dev-secret-change-me';
  const ip = (req.headers['x-forwarded-for']||'').split(',')[0].trim() || req.socket.remoteAddress || '0.0.0.0';
  const token = createToken(secret, { ip }, 900);
  setNoStore(res);
  res.setHeader('Content-Type','application/json');
  // Also bind anti-replay cookie for duplicate-vote prevention later
  res.setHeader('Set-Cookie', `poll_seen=1; Path=/; Max-Age=2592000; HttpOnly; SameSite=Lax`);
  res.end(JSON.stringify({ token }));
};
