const express = require('express');
const https = require('https');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.static(path.join(__dirname)));


app.get('/cdn/tailwindcss', (req, res) => {
  const url = 'https://cdn.tailwindcss.com';
  https.get(url, (response) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'text/javascript');
    response.pipe(res);
  }).on('error', (err) => {
    console.error('Erro ao buscar Tailwind CSS:', err.message);
    res.status(500).send('Erro ao carregar Tailwind CSS');
  });
});

app.use((req, res, next) => {
  if (req.path.startsWith('/cdn/')) return next();
  if (path.extname(req.path)) return res.status(404).end();
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`NovoApp servidor rodando em http://localhost:${PORT}`);
});


