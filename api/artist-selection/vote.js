const { verifyToken, readJson, setNoStore } = require('../_utils');
const fs = require('fs');
const path = require('path');

// In-memory store (stateless platforms will reset between invocations). For persistency, connect a Redis like Upstash.
const counters = Object.create(null);
const ALLOW = new Set(['ujjivan','indusind','mankind','mpl','lg','dt','ndfc']);

function ok(res, data){ res.statusCode=200; res.setHeader('Content-Type','application/json'); res.end(JSON.stringify({ ok:true, ...data })); }
function bad(res, code, message){ res.statusCode=code; res.setHeader('Content-Type','application/json'); res.end(JSON.stringify({ ok:false, message })); }

module.exports = async (req, res) => {
  setNoStore(res);
  if(req.method !== 'POST') return bad(res, 405, 'method_not_allowed');

  const origin = req.headers['origin']||''; const host = req.headers['host']||'';
  if(origin && !origin.includes(host)) return bad(res, 403, 'forbidden');

  const secret = process.env.POLL_SECRET || process.env.SECRET || 'dev-secret-change-me';
  const ip = (req.headers['x-forwarded-for']||'').split(',')[0].trim() || req.socket.remoteAddress || '0.0.0.0';
  const csrf = req.headers['x-csrf-token'];
  const claims = verifyToken(secret, csrf);
  if(!claims || claims.ip !== ip) return bad(res, 403, 'csrf_invalid');

  let body;
  try{ body = await readJson(req); }
  catch(e){ return bad(res, 400, e.message); }
  const { artistId } = body||{};
  if(!ALLOW.has(artistId)) return bad(res, 400, 'invalid_artist');

  // Rate limit & duplicate vote via cookie + ip
  const cookie = (req.headers['cookie']||'');
  if(/poll_voted=1/.test(cookie)) return bad(res, 409, 'duplicate_vote');

  // Increment counter
  counters[artistId] = (counters[artistId]||0) + 1;

  // Mark as voted for 30 days
  res.setHeader('Set-Cookie', 'poll_voted=1; Path=/; Max-Age=2592000; HttpOnly; SameSite=Lax');

  // Append to result file (best-effort)
  try {
    const writableDir = process.env.WRITABLE_DIR || (process.env.VERCEL ? '/tmp' : __dirname);
    const filePath = path.join(writableDir, 'result.txt');
    const ua = req.headers['user-agent'] || '';
    const record = `[${new Date().toISOString()}] vote artistId="${artistId}" ip="${ip}" ua="${ua.replace(/"/g,'')}"\n`;
    fs.appendFile(filePath, record, 'utf8', (err)=>{ if(err) console.error('append vote failed:', err); });
  } catch(e) { console.error('write vote failed:', e); }

  ok(res, { counts: { [artistId]: counters[artistId] } });
};
