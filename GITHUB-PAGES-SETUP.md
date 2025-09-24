# 🚀 Configuração para GitHub Pages

## 📋 Checklist para Deploy

### ✅ 1. Configurar Secrets no GitHub
- [ ] **FIREBASE_API_KEY**: API Key do Firebase
- [ ] **FIREBASE_AUTH_DOMAIN**: Auth Domain do Firebase
- [ ] **FIREBASE_PROJECT_ID**: Project ID do Firebase
- [ ] **FIREBASE_STORAGE_BUCKET**: Storage Bucket do Firebase
- [ ] **FIREBASE_MESSAGING_SENDER_ID**: Messaging Sender ID do Firebase
- [ ] **FIREBASE_APP_ID**: App ID do Firebase
- [ ] **FIREBASE_AUTH_EMAIL**: Email do usuário Firebase
- [ ] **FIREBASE_AUTH_PASSWORD**: Senha do usuário Firebase

### ✅ 2. Configuração Firebase
- [ ] **Usuário criado** no Firebase Console
- [ ] **Método E-mail/Senha** habilitado
- [ ] **Regras Firestore** atualizadas

### ✅ 3. Arquivos Ignorados
- [ ] **`.env`** - não versionado
- [ ] **`firebase-auth-config.js`** - não versionado
- [ ] **`server-auth.js`** - não versionado
- [ ] **`start-auth-server.bat`** - não versionado

## 🔧 Como Configurar Secrets no GitHub

### 1. Acessar Configurações do Repositório
1. Vá para: https://github.com/allansantos-dv/Bolao_Mega/settings
2. Clique em "Secrets and variables" → "Actions"
3. Clique em "New repository secret"

### 2. Adicionar Secrets
Adicione os seguintes secrets:

```
FIREBASE_API_KEY = SUA_API_KEY_AQUI
FIREBASE_AUTH_DOMAIN = mega-bolao-2025.firebaseapp.com
FIREBASE_PROJECT_ID = mega-bolao-2025
FIREBASE_STORAGE_BUCKET = mega-bolao-2025.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID = SEU_MESSAGING_SENDER_ID_AQUI
FIREBASE_APP_ID = SEU_APP_ID_AQUI
FIREBASE_AUTH_EMAIL = SEU_EMAIL_AQUI
FIREBASE_AUTH_PASSWORD = SUA_SENHA_AQUI
```

### 3. Obter Chaves Firebase
1. Acesse: https://console.firebase.google.com/project/mega-bolao-2025/settings/general
2. Clique em "Configurações do projeto" (ícone de engrenagem)
3. Vá para a aba "Geral"
4. Role até "Seus aplicativos"
5. Clique no ícone de configuração do seu app web

### 4. Testar Localmente
1. Execute: `node server-auth.js`
2. Acesse: `http://localhost:3000/config`
3. Configure as credenciais
4. Teste a conexão

### 5. Deploy para GitHub Pages
1. Commit das mudanças
2. Push para branch `main`
3. GitHub Actions irá:
   - Gerar `firebase-config.public.js` com os secrets
   - Fazer deploy para GitHub Pages

## 🌐 Funcionamento no GitHub Pages

### ✅ O que funciona:
- **Autenticação Firebase** (credenciais das variáveis de ambiente)
- **Leitura/escrita Firestore** (com autenticação)
- **Cache local** (localStorage)
- **Validação de concursos**
- **Interface completa**

### ❌ O que não funciona:
- **Servidor local** (`server-auth.js`)
- **Upload de arquivos .env**
- **Configuração via interface web**

### 🔄 Fallback Automático:
- **GitHub Pages**: Usa variáveis de ambiente (secrets)
- **Desenvolvimento local**: Usa servidor local (se disponível)
- **Fallback**: Usa credenciais padrão

## 🚨 Importante

### Segurança:
- **API Keys Firebase** são públicas e seguras para front-end
- **Credenciais de autenticação** são injetadas via GitHub Secrets
- **Regras Firestore** protegem contra acesso não autorizado

### Performance:
- **Cache local** reduz chamadas ao Firebase
- **Prioridade Firebase** sobre config.json
- **Fallback inteligente** para API da Caixa

## 📞 Suporte

Se houver problemas:
1. Verificar console do navegador
2. Verificar Firebase Console
3. Verificar regras Firestore
4. Verificar GitHub Secrets
5. Testar localmente primeiro
