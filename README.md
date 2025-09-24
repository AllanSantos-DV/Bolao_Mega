# 🎲 Bolão Mega - Sistema de Bolões

Sistema completo de gerenciamento de bolões de loteria otimizado para **GitHub Pages**.

## 🌐 Acesso Online

**🔗 [Acesse o sistema online](https://allansantos-dv.github.io/Bolao_Mega/)**

## ✨ Funcionalidades

- 🎯 **Hub Principal** - Gerencie e visualize todos os bolões
- 🔧 **Controle de Cache** - Cache inteligente multi-camada
- ✅ **Validação Automática** - Verificação automática de resultados
- 🏆 **Premiação Oficial** - Dados oficiais da Caixa
- 📱 **Interface Responsiva** - Funciona em qualquer dispositivo
- 🚀 **Deploy Automático** - Atualizações via branch do GitHub Pages

## 🏗️ Arquitetura

### **Frontend (GitHub Pages)**
- **Tecnologia**: JavaScript Vanilla (ES6 modules)
- **Arquitetura**: Single Page Application (SPA)
- **Cache**: LocalStorage + Firebase Firestore
- **Deploy**: GitHub Pages (branch direta)

### **Backend (Firebase)**
- **Banco**: Firebase Firestore
- **Cache**: Firestore como cache persistente
- **API**: Integração com API oficial da Caixa
- **Segurança**: Regras Firestore configuradas

## 📁 Estrutura do Projeto

```
/
├── assets/
│   ├── css/           # Estilos CSS
│   └── js/            # Módulos JavaScript
│       ├── api/       # Integração com APIs
│       ├── data/      # Gerenciamento de cache
│       ├── domain/    # Lógica de domínio
│       ├── firebase/  # Configuração Firebase
│       └── ui/        # Interface do usuário
├── loterias/          # Configurações por modalidade
│   └── lotofacil/     # Configuração Lotofácil
├── partials/          # Componentes HTML reutilizáveis
└── firebase.json      # Configuração Firebase
```

## 🔄 Fluxo de Dados

1. **Cache Local** → Verificação inicial (24h TTL)
2. **Firebase Firestore** → Cache persistente compartilhado
3. **API Caixa** → Dados oficiais (com fallback estático)
4. **Config.json** → Fallback local para resultados

## 🚀 Deploy Automático

O sistema usa **deploy direto da branch** para GitHub Pages:

- ✅ **Push para branch configurada** → Deploy automático
- ✅ **Variáveis do repositório** → Configuração Firebase segura
- ✅ **Cache busting** → Atualizações instantâneas
- ✅ **404 handling** → Roteamento SPA

## 🔧 Configuração Firebase

### **Variáveis do Repositório (Settings → Repository variables):**
- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`

## 📦 Cache e Performance

- **Cache Local**: LocalStorage com TTL de 24h
- **Cache Firebase**: Persistente e compartilhado
- **Dados Estáticos**: Fallback para GitHub Pages
- **Versionamento**: Cache busting automático

## 🎯 Modalidades Suportadas

- **Lotofácil** ✅ (configurada)
- **Mega-Sena** 🔄 (em desenvolvimento)
- **Quina** 🔄 (em desenvolvimento)

## 🛠️ Desenvolvimento

### **Para contribuir:**
1. Fork o repositório
2. Clone localmente
3. Faça suas alterações
4. Teste localmente (servidor HTTP simples)
5. Push para sua branch
6. Abra Pull Request

### **Teste Local:**
```bash
# Servidor HTTP simples (qualquer um)
python -m http.server 8000
# ou
npx serve .
# ou
live-server
```

## 📄 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes.

## 🤝 Contribuição

Contribuições são bem-vindas! Abra uma issue ou pull request.

---

**🎲 Sistema de Bolões - Otimizado para GitHub Pages**