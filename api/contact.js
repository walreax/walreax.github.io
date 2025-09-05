// Vercel serverless function to handle contact form POST requests
const fs = require('fs');

module.exports = (req, res) => {
  if (req.method === 'POST' && req.url === '/contact') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        // Log the contact form data (name, email, message)
        console.log('Contact form submission:', data);
        // Optionally, save to a file or send an email here
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
