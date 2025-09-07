# 🚀 Bolão Mega - Configuração Local

## 🔧 Configuração do Servidor Local

### **📁 Arquivos Locais (NÃO versionados):**
- `server-auto.js` - Servidor local com suas configurações
- `Documents/mega bolao/.env` - Suas credenciais Firebase
- `start-server.bat` - Script de inicialização

### **🌐 Arquivos Públicos (versionados):**
- `bolao-template.html` - Aplicação principal
- `firebase-config.js` - Configuração padrão
- `env.example` - Exemplo de variáveis

## 🚀 Como Usar

### **1. Configuração Local:**
```bash
# Copiar arquivo de exemplo
copy server-auto.example.js server-auto.js

# Editar configuração
notepad server-auto.js
# Mude: const ENV_SUBFOLDER = 'sua-pasta-aqui';

# Criar arquivo .env
copy env.example "Documents\mega bolao\.env"
notepad "Documents\mega bolao\.env"
# Preencha com suas credenciais reais
```

### **2. Iniciar Servidor:**
```bash
npm install
npm start
# ou
start-server.bat
```

### **3. Acessar:**
```
http://localhost:3000
```

## 🔒 Segurança

- ✅ **Local**: Usa suas credenciais reais
- ✅ **GitHub**: Usa variáveis de ambiente do repositório
- ✅ **Sem exposição**: Credenciais nunca vão para o Git

## 📝 Variáveis de Ambiente

### **Local (.env):**
```
FIREBASE_API_KEY=sua_api_key_real
FIREBASE_AUTH_DOMAIN=mega-bolao-2025.firebaseapp.com
FIREBASE_PROJECT_ID=mega-bolao-2025
FIREBASE_STORAGE_BUCKET=mega-bolao-2025.appspot.com
FIREBASE_MESSAGING_SENDER_ID=seu_sender_id_real
FIREBASE_APP_ID=seu_app_id_real
```

### **GitHub (Settings → Secrets):**
- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`
