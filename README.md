# 🎯 Sistema de Bolões - Documentação

## 📋 Visão Geral

Sistema estático para hub e visualização de bolões (Lotofácil e outras), pronto para GitHub Pages e com suporte a Firebase (Firestore) para cache de resultados.

## 🏗️ Estrutura Atual (modular)

```
Bolao_Mega/
├── index.html                     # Hub principal
├── bolao-template.html            # Template de página de bolão
├── comprovantes/
│   └── index.html                 # Página de comprovantes (JS/CSS externos)
├── assets/
│   ├── css/
│   │   ├── hub.css
│   │   ├── bolao.css
│   │   ├── comprovantes.css
│   │   └── 404.css
│   └── js/
│       ├── api/
│       │   ├── http.js           # fetch com timeout e logs
│       │   └── caixa.js          # API da Caixa (usa http.js)
│       ├── data/
│       │   └── cache.js          # cache local (localStorage)
│       ├── domain/
│       │   └── loterias.js       # validações e comparações de resultados
│       ├── firebase/
│       │   └── init.js           # inicialização do Firebase (SDK oficial)
│       └── ui/
│           ├── hub.js            # entrypoint do hub
│           ├── bolao.js          # entrypoint do template
│           ├── comprovantes.js   # entrypoint da página de comprovantes
│           └── includes.js       # loader de includes client-side
├── partials/
│   ├── cache-control.html         # sem onclick; eventos ligados no hub.js
│   └── footer.html
├── loterias/
│   ├── index.json
│   └── lotofacil/
│       ├── config.json
│       ├── Bolão independencia - 130.xlsx
│       └── Bolão independencia - 30.xlsx
├── docs/
│   ├── ARQUITETURA.md
│   └── README-LOCAL.md
├── server-auto.js                 # servidor local com .env em Documentos
├── firebase.json                  # config de hosting/firestore
├── firestore.rules                # regras endurecidas (leitura pública; escrita bloqueada)
├── firestore.indexes.json
└── README.md
```

## 🚀 Como Usar

### Desenvolvimento Local
- Requer servidor HTTP (não abrir por file://).
- Com Node.js:
```
npm run start
```
- Abre em: `http://localhost:3000`
- `server-auto.js` carrega `.env` de: `~/Documents/mega bolao/.env`

Variáveis esperadas (ver `env.example`):
- FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, FIREBASE_PROJECT_ID, FIREBASE_STORAGE_BUCKET, FIREBASE_MESSAGING_SENDER_ID, FIREBASE_APP_ID, PORT

### Produção (GitHub Pages)
- Faça push para a branch configurada no Pages.
- A aplicação funciona como estática. Observações:
  - A rota dinâmica `/firebase-config.js` não existe no Pages. Use configuração estática para produção (ou defina um arquivo gerado no build) se precisar do Firebase em produção via Pages.
  - Roteamento: `404.html` presente e com CSS externo.
  - Versionamento de assets com `?v=${window.VERSION}` para evitar cache agressivo.

## 🔌 Firebase e Firestore
- Hub e template usam SDK oficial do Firebase via gstatic.
- Estrutura no Firestore: `loterias/{loteria}/{concurso}` (doc id = concurso).
- Regras (`firestore.rules`): leitura pública dos caminhos de loterias e cache; escrita bloqueada (produção).

## 📦 Cache e API da Caixa
- Ordem de consulta (hub e template):
  1) Cache local (localStorage) por 24h
  2) Firebase (se disponível)
  3) API oficial da Caixa
  4) Config local (fallback)
- Módulos relevantes: `assets/js/api/http.js`, `assets/js/api/caixa.js`, `assets/js/data/cache.js`, `assets/js/domain/loterias.js`.

## 🧩 Includes Client-side
- Partials em `partials/` são injetados com `[data-include]` via `assets/js/ui/includes.js`.
- Ex.: `<div data-include="./partials/footer.html"></div>`
- Botões do `cache-control.html` são ligados via `addEventListener` em `hub.js` (sem `onclick`).

## 🗂️ Manifesto de Loterias
- O hub carrega `./loterias/index.json` para descobrir quais loterias exibir.
- Para cada item do manifesto, o hub busca `./loterias/{loteria}/config.json`.
- Para adicionar uma nova loteria:
  1) Crie a pasta `loterias/{loteria}/` com `config.json` e arquivos necessários (ex.: planilhas).
  2) Atualize `loterias/index.json` adicionando o nome da loteria.
  3) (Opcional) Adicione comprovantes em `comprovantes/{loteria}/...` e aponte a pasta no `config.json`.

## ✅ Validação Rápida
- Rodar `npm start` e abrir o hub.
- Verificar no console:
  - Carregamento de `config.json` da loteria
  - Carregamento de partials
  - Consultas à API da Caixa (com logs/timeout)
  - Cache local sendo lido/salvo
  - Acesso ao Firestore (se `.env` configurado)

## 📚 Notas de Manutenção
- Módulos ESM com caminhos relativos (compatível com GitHub Pages).
- Versionamento de assets com `?v=window.VERSION` para evitar cache agressivo.
- Preferir centralização de lógica em `assets/js/` (evitar duplicação em HTMLs).
- Documentação local em `docs/`.
