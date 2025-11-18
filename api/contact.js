// Vercel serverless function to handle contact form POST requests
const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  if (req.method === 'POST' && req.url === '/contact') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        // Log the contact form data (name, email, message)
        console.log('Contact form submission:', data);

        // Write to a result.txt file
        const writableDir = process.env.WRITABLE_DIR || (process.env.VERCEL ? '/tmp' : __dirname);
        const filePath = path.join(writableDir, 'result.txt');
        const ip = (req.headers['x-forwarded-for']||'').split(',')[0].trim() || req.socket.remoteAddress || '';
        const ua = req.headers['user-agent'] || '';
        const record = `[${new Date().toISOString()}] contact name="${(data.name||'').replace(/\s+/g,' ').trim()}" email="${(data.email||'').trim()}" ip="${ip}" ua="${ua.replace(/"/g,'')}" msg=${JSON.stringify((data.message||'').toString()).slice(0,2000)}\n`;
        try {
          fs.appendFile(filePath, record, 'utf8', (err)=>{ if(err) console.error('append contact failed:', err); });
        } catch(e) { console.error('write contact failed:', e); }

        // Respond success
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.statusCode = 400;
        res.end('Invalid data');
      }
    });
  } else {
    res.statusCode = 404;
    res.end('Not found');
  }
};
