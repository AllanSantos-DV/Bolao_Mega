const express = require('express');
const https = require('https');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

// Configurar CORS para recursos externos
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.static(path.join(__dirname)));



// Middleware para arquivos específicos necessários
app.get('/firebase-config.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'firebase-config.js'));
});

app.use((req, res, next) => {
  if (req.path.startsWith('/cdn/')) return next();
  if (path.extname(req.path)) return res.status(404).end();
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`NovoApp servidor rodando em http://localhost:${PORT}`);
});


