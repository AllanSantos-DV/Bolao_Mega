const express = require('express');
const path = require('path');
const fs = require('fs');
const { config } = require('dotenv');
const os = require('os');

// CONFIGURAÇÃO: Edite o nome da subpasta aqui
const ENV_SUBFOLDER = 'SUA_SUBPASTA_AQUI'; // ← Edite esta linha com o nome da sua subpasta

// Detectar caminho do .env automaticamente
const homeDir = os.homedir();
const envPath = path.join(homeDir, 'Documents', ENV_SUBFOLDER, '.env');

console.log(`🔍 Procurando arquivo .env em: ${envPath}`);

// Verificar se o arquivo existe
if (fs.existsSync(envPath)) {
    console.log('✅ Arquivo .env encontrado!');
    config({ path: envPath });
    console.log(`🔧 Variáveis de ambiente carregadas de: ${envPath}`);
} else {
    console.log('⚠️ Arquivo .env não encontrado!');
    console.log(`💡 Dica: Crie um arquivo .env em: ${envPath}`);
    console.log(`🔧 Ou edite a variável ENV_SUBFOLDER no arquivo server-auto.js`);
    // Tentar carregar do diretório atual como fallback
    config();
}

const app = express();
const PORT = process.env.PORT || 3000;

// Servir arquivos estáticos
app.use(express.static('.'));

// Rota para servir configuração do Firebase com variáveis de ambiente
app.get('/firebase-config.js', (req, res) => {
    const config = {
        apiKey: process.env.FIREBASE_API_KEY || "CONFIG_PADRAO_API_KEY",
        authDomain: process.env.FIREBASE_AUTH_DOMAIN || "mega-bolao-2025.firebaseapp.com",
        projectId: process.env.FIREBASE_PROJECT_ID || "mega-bolao-2025",
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "mega-bolao-2025.appspot.com",
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "CONFIG_PADRAO_SENDER_ID",
        appId: process.env.FIREBASE_APP_ID || "CONFIG_PADRAO_APP_ID"
    };

    console.log('🔧 Configuração Firebase carregada:', {
        projectId: config.projectId,
        apiKey: config.apiKey ? `${config.apiKey.substring(0, 10)}...` : 'NÃO DEFINIDA'
    });

    const configScript = `
        window.FIREBASE_API_KEY = "${config.apiKey}";
        window.FIREBASE_AUTH_DOMAIN = "${config.authDomain}";
        window.FIREBASE_PROJECT_ID = "${config.projectId}";
        window.FIREBASE_STORAGE_BUCKET = "${config.storageBucket}";
        window.FIREBASE_MESSAGING_SENDER_ID = "${config.messagingSenderId}";
        window.FIREBASE_APP_ID = "${config.appId}";
    `;

    res.setHeader('Content-Type', 'application/javascript');
    res.send(configScript);
});

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📁 Servindo arquivos estáticos da pasta atual`);
    console.log(`🔧 Variáveis de ambiente carregadas de: ${envPath}`);
});
