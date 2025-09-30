const express = require('express');
const https = require('https');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.static(path.join(__dirname)));



app.use((req, res, next) => {
  if (req.path.startsWith('/cdn/')) return next();
  if (path.extname(req.path)) return res.status(404).end();
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`NovoApp servidor rodando em http://localhost:${PORT}`);
});


