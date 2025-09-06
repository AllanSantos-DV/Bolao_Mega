# 🎯 Sistema de Bolões - Documentação

## 📋 Visão Geral

Sistema completo de gerenciamento de bolões para loterias, desenvolvido para funcionar com GitHub Pages. Permite criar, gerenciar e visualizar bolões de diferentes modalidades de loteria.

## 🏗️ Estrutura do Sistema

```
Bolao_Mega/
├── 📄 index.html                          # Hub principal
├── 📁 lotofacil/                          # Pasta da Lotofácil
│   ├── 📄 Bolão independencia - 130.xlsx  # Planilha do bolão
│   ├── 📄 bolao-130.html                  # HTML do bolão
│   ├── 📄 config.json                     # Configuração
│   └── 📄 resultado.txt                   # Resultado
├── 📁 comprovantes/                       # Pasta de comprovantes
│   └── 📁 lotofacil/
│       └── 📁 comprovantes-lotofacil-3480/ # PDFs específicos
└── 📄 ARQUITETURA.md                      # Documentação técnica
```

## 🚀 Como Usar

### 1. Acessar o Sistema
**IMPORTANTE:** Para funcionar corretamente, o sistema deve ser executado em um servidor HTTP (não pode ser aberto diretamente no navegador).

**Opção 1 - Servidor Python (Recomendado):**
```bash
python -m http.server 8000
```
Depois acesse: `http://localhost:8000`

**Opção 2 - Servidor Node.js:**
```bash
npx http-server -p 8000
```
Depois acesse: `http://localhost:8000`

**Opção 3 - GitHub Pages:**
- Faça upload dos arquivos para um repositório GitHub
- Ative o GitHub Pages nas configurações do repositório
- Acesse o link fornecido pelo GitHub Pages

- O hub principal detectará automaticamente as loterias disponíveis

### 2. Visualizar Bolões
- Clique em "Acessar Bolão" para ver um bolão específico
- Cada bolão tem sua própria página HTML com:
  - Informações do bolão (cotas, jogos, modalidade)
  - Download da planilha e comprovantes
  - Números sorteados (quando disponível)
  - Contagem automática de acertos
  - Lista de jogos com destaque visual

### 3. Adicionar Resultados
- Edite o arquivo `resultado.txt` na pasta da loteria
- Formato: `CONCURSO-NUM1-NUM2-NUM3-...`
- Exemplo: `3480-01-02-03-04-05-06-07-08-09-10-11-12-13-14-15`

## ⚙️ Configuração

### Arquivo config.json
```json
{
  "loteria": {
    "modalidade": "Lotofácil",
    "concurso": "3480",
    "numeros_por_jogo": 15,
    "range_acertos": {"minimo": 11, "maximo": 15}
  },
  "boloes": {
    "bolao-130": {
      "planilha": "Bolão independencia - 130.xlsx",
      "cotas": 13,
      "nome": "Bolão 130 Jogos",
      "comprovantes": {"pasta": "comprovantes-lotofacil-3480"}
    }
  }
}
```

## 📊 Funcionalidades

### ✅ Implementadas
- **Hub principal** com detecção automática de loterias
- **Páginas individuais** para cada bolão
- **Leitura de planilhas Excel** usando SheetJS
- **Contagem automática** de acertos
- **Destaque visual** de números acertados
- **Download de arquivos** (planilhas e comprovantes)
- **Interface responsiva** e moderna
- **Atualização automática** de status

### 🔧 Características Técnicas
- **JavaScript vanilla** (sem dependências externas além do SheetJS)
- **Compatível com GitHub Pages**
- **Leitura automática** de configurações
- **Fallback** para jogos simulados em caso de erro
- **Processamento dinâmico** de dados

## 📱 Compatibilidade

- ✅ **GitHub Pages**
- ✅ **Navegadores modernos** (Chrome, Firefox, Safari, Edge)
- ✅ **Dispositivos móveis** (responsivo)
- ✅ **Arquivos estáticos** (sem backend necessário)

## 🎯 Modalidades Suportadas

- **Lotofácil** (15 números por jogo)
- **Mega-Sena** (6 números por jogo)
- **Quina** (5 números por jogo)
- **Lotomania** (20 números por jogo)

## 📈 Próximos Passos

1. **Adicionar mais bolões** conforme necessário
2. **Implementar outras modalidades** de loteria
3. **Melhorar interface** com mais recursos visuais
4. **Adicionar estatísticas** avançadas
5. **Implementar notificações** de resultados

## 🛠️ Desenvolvimento

### Para Adicionar Nova Loteria:
1. Criar pasta com nome da loteria
2. Adicionar `config.json` com configurações
3. Adicionar planilhas Excel dos bolões
4. Criar HTMLs individuais para cada bolão
5. Adicionar pasta de comprovantes se necessário

### Para Adicionar Novo Bolão:
1. Adicionar entrada no `config.json`
2. Criar arquivo HTML correspondente
3. Adicionar planilha Excel
4. Configurar pasta de comprovantes

---

**Sistema desenvolvido com foco em simplicidade, eficiência e compatibilidade com GitHub Pages.**
