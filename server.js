// Simple Express server to serve two routes
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve index.html at '/'
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve anwesha/theme/index.html at '/anwesha/theme'
app.get('/anwesha/theme', (req, res) => {
  res.sendFile(path.join(__dirname, 'anwesha', 'theme', 'index.html'));
});

// Optionally serve static files
app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
