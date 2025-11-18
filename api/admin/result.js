const fs = require('fs');
const path = require('path');

function send(res, code, body, type='text/plain'){ res.statusCode=code; res.setHeader('Content-Type', type); res.end(body); }

function tryRead(p){ try{ return fs.existsSync(p) ? fs.readFileSync(p,'utf8') : ''; } catch { return ''; } }

module.exports = async (req, res) => {
  // Require admin key
  const ADMIN_KEY = process.env.ADMIN_KEY || process.env.X_ADMIN_KEY || process.env.x_admin_key;
  const key = req.headers['x-admin-key'];
  if(!ADMIN_KEY){ return send(res, 500, 'Admin key not configured. Set ADMIN_KEY (or X_ADMIN_KEY / x_admin_key) in environment.'); }
  if(key !== ADMIN_KEY){ return send(res, 401, 'Unauthorized'); }

  // Determine writable dir used by other functions
  const writableDir = process.env.WRITABLE_DIR || (process.env.VERCEL ? '/tmp' : null);
  let content = '';

  if(writableDir){
    content = tryRead(path.join(writableDir, 'result.txt'));
  } else {
    // Local dev: attempt both locations used by our functions
    const contactPath = path.join(__dirname, '..', 'result.txt');
    const votePath = path.join(__dirname, '..', 'artist-selection', 'result.txt');
    content = [tryRead(contactPath), tryRead(votePath)].filter(Boolean).join('\n');
  }

  if(!content) return send(res, 204, '');

  // Provide as a downloadable text
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Disposition', 'inline; filename="result.txt"');
  return send(res, 200, content, 'text/plain; charset=utf-8');
};
