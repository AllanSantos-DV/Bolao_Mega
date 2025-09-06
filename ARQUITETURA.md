# 🏗️ ARQUITETURA DO SISTEMA DE BOLÕES

## 📊 Estrutura de Arquivos Definida

```
Bolao_Mega/
├── 📁 lotofacil/                          # Pasta da Lotofácil
│   ├── 📄 bolao-principal.xlsx            # Planilha do Bolão Principal
│   ├── 📄 bolao-principal.html            # HTML do Bolão Principal
│   ├── 📄 bolao-secundario.xlsx           # Planilha do Bolão Secundário
│   ├── 📄 bolao-secundario.html           # HTML do Bolão Secundário
│   ├── 📄 bolao-pequeno.xlsx              # Planilha do Bolão Pequeno
│   ├── 📄 bolao-pequeno.html              # HTML do Bolão Pequeno
│   ├── 📄 resultado.txt                   # Resultado único da Lotofácil
│   └── 📄 config.json                     # Configuração dos bolões
├── 📁 mega-sena/                          # Pasta da Mega-Sena
│   ├── 📄 bolao-mega-001.xlsx             # Planilha do Bolão 001
│   ├── 📄 bolao-mega-001.html             # HTML do Bolão 001
│   ├── 📄 bolao-mega-002.xlsx             # Planilha do Bolão 002
│   ├── 📄 bolao-mega-002.html             # HTML do Bolão 002
│   ├── 📄 resultado.txt                   # Resultado único da Mega-Sena
│   └── 📄 config.json                     # Configuração dos bolões
├── 📁 quina/                              # Pasta da Quina
│   ├── 📄 bolao-quina-001.xlsx            # Planilha do Bolão 001
│   ├── 📄 bolao-quina-001.html            # HTML do Bolão 001
│   ├── 📄 resultado.txt                   # Resultado único da Quina
│   └── 📄 config.json                     # Configuração dos bolões
├── 📁 lotomania/                          # Pasta da Lotomania
│   ├── 📄 bolao-lotomania-001.xlsx        # Planilha do Bolão 001
│   ├── 📄 bolao-lotomania-001.html        # HTML do Bolão 001
│   ├── 📄 resultado.txt                   # Resultado único da Lotomania
│   └── 📄 config.json                     # Configuração dos bolões
├── 📁 comprovantes/                       # Pasta de comprovantes PDF
│   ├── 📁 lotofacil/                      # Comprovantes da Lotofácil
│   │   └── 📄 [Nome definido no config]    # PDFs dos comprovantes
│   ├── 📁 mega-sena/                      # Comprovantes da Mega-Sena
│   │   └── 📄 [Nome definido no config]    # PDFs dos comprovantes
│   ├── 📁 quina/                          # Comprovantes da Quina
│   │   └── 📄 [Nome definido no config]    # PDFs dos comprovantes
│   └── 📁 lotomania/                      # Comprovantes da Lotomania
│       └── 📄 [Nome definido no config]    # PDFs dos comprovantes
└── 📄 index.html                          # Página principal (hub de loterias)
```

## 🔄 Fluxo de Dados

```
1. 📝 Upload Manual de Arquivos
   ├── Admin upa planilhas separadas via Git
   ├── Admin cria resultado.txt manualmente
   ├── Admin cria config.json manualmente
   └── Admin upa HTMLs individuais via Git

2. 📊 Estrutura da Planilha
   ├── Cada planilha = um bolão específico
   ├── Cabeçalho: Bola 1, Bola 2, Bola 3, etc.
   ├── Cada linha = um jogo completo
   ├── Números organizados por colunas
   └── Nome da planilha definido no config.json

3. 🌐 Hub Principal (index.html)
   ├── Detecta loterias disponíveis
   ├── Lê configurações de cada loteria
   ├── Gera links para páginas HTML individuais
   └── Exibe status dos resultados

4. 📄 Visualização das Páginas HTML Individuais
   ├── Cada HTML lê seu próprio config.json
   ├── HTML identifica arquivos específicos pelo nome
   ├── Sistema lê planilha Excel específica
   ├── Calcula acertos com resultado único
   ├── Exibe página HTML específica do bolão
   └── URLs únicas para cada bolão
```

## 📋 Formato das Planilhas por Loteria

### 🎯 Lotofácil (15 números por jogo)
```
Cabeçalho: Bola 1 | Bola 2 | Bola 3 | Bola 4 | Bola 5 | Bola 6 | Bola 7 | Bola 8 | Bola 9 | Bola 10 | Bola 11 | Bola 12 | Bola 13 | Bola 14 | Bola 15
Jogo 1:    2      | 3      | 4      | 6      | 7      | 8      | 10     | 11     | 15     | 16      | 17      | 18      | 22      | 23      | 25
Jogo 2:    1      | 2      | 3      | 6      | 7      | 8      | 9      | 10     | 12     | 15      | 16      | 17      | 19      | 21      | 22
Jogo 3:    1      | 3      | 4      | 5      | 6      | 7      | 8      | 10     | 15     | 16      | 17      | 18      | 20      | 22      | 23
```

### 🎯 Mega-Sena (6 números por jogo)
```
Cabeçalho: Bola 1 | Bola 2 | Bola 3 | Bola 4 | Bola 5 | Bola 6
Jogo 1:    1      | 5      | 10     | 15     | 20     | 25
Jogo 2:    2      | 8      | 12     | 18     | 22     | 28
Jogo 3:    3      | 7      | 14     | 19     | 24     | 30
```

### 🎯 Quina (5 números por jogo)
```
Cabeçalho: Bola 1 | Bola 2 | Bola 3 | Bola 4 | Bola 5
Jogo 1:    10     | 20     | 30     | 40     | 50
Jogo 2:    15     | 25     | 35     | 45     | 55
```

### 🎯 Lotomania (20 números por jogo)
```
Cabeçalho: Bola 1 | Bola 2 | Bola 3 | ... | Bola 18 | Bola 19 | Bola 20
Jogo 1:    00     | 01     | 02     | ... | 17      | 18      | 19
Jogo 2:    01     | 03     | 05     | ... | 19      | 20      | 21
```

## 🔧 Especificações Técnicas

### 📊 Formato dos Arquivos de Resultado
```
# Formato único por loteria (sem nome da aba)
# Exemplo para cada loteria:

lotofacil/resultado.txt:
2810-01-02-03-04-05-06-07-08-09-10-11-12-13-14-15

mega-sena/resultado.txt:
2810-01-19-17-29-50-57

quina/resultado.txt:
6000-10-20-30-40-50

lotomania/resultado.txt:
2500-00-01-02-03-04-05-06-07-08-09-10-11-12-13-14-15-16-17-18-19
```

### 📊 Configuração por Loteria
```
# Exemplos de config.json para cada loteria:

# lotofacil/config.json
{
  "loteria": {
    "modalidade": "Lotofácil",
    "concurso": "2810",
    "numeros_por_jogo": 15,
    "range_acertos": {"minimo": 11, "maximo": 15}
  },
  "boloes": {
    "bolao-principal": {
      "planilha": "bolao-principal.xlsx",
      "cotas": 10,
      "nome": "Bolão Principal",
      "comprovantes": {"pasta": "comprovantes-lotofacil-2810"}
    }
  }
}

# mega-sena/config.json
{
  "loteria": {
    "modalidade": "Mega-Sena",
    "concurso": "2810",
    "numeros_por_jogo": 6,
    "range_acertos": {"minimo": 4, "maximo": 6}
  },
  "boloes": {
    "bolao-mega-001": {
      "planilha": "bolao-mega-001.xlsx",
      "cotas": 15,
      "nome": "Bolão Mega 001",
      "comprovantes": {"pasta": "comprovantes-mega-sena-2810"}
    }
  }
}
```

### 📄 Arquivo de Configuração (config.json)
```json
{
  "loteria": {
    "modalidade": "Lotofácil",
    "concurso": "2810",
    "numeros_por_jogo": 15,
    "range_acertos": {
      "minimo": 11,
      "maximo": 15
    }
  },
  "boloes": {
    "bolao-principal": {
      "planilha": "bolao-principal.xlsx",
      "cotas": 10,
      "nome": "Bolão Principal",
      "comprovantes": {
        "pasta": "comprovantes-lotofacil-2810"
      }
    }
  }
}
```

### 🔧 Sistema de Identificação de Arquivos
```
# Algoritmo de identificação por HTML:
1. HTML lê config.json da pasta da loteria
2. HTML identifica seu próprio nome (ex: bolao-principal.html)
3. HTML busca configuração correspondente em boloes
4. HTML carrega arquivos específicos:
   ├── Planilha: boloes[bolao-principal].planilha
   ├── Resultado: resultado.txt (compartilhado)
   ├── Comprovantes: boloes[bolao-principal].comprovantes.pasta
   └── Configuração: config.json (completo)
```

### 🌐 URLs das Páginas HTML
```
# Hub Principal (index.html):
https://seu-usuario.github.io/repo/

# Páginas Individuais dos Bolões (HTML já existe no repositório):
# Lotofácil:
https://seu-usuario.github.io/repo/lotofacil/bolao-principal.html
https://seu-usuario.github.io/repo/lotofacil/bolao-secundario.html
https://seu-usuario.github.io/repo/lotofacil/bolao-pequeno.html

# Mega-Sena:
https://seu-usuario.github.io/repo/mega-sena/bolao-mega-001.html
https://seu-usuario.github.io/repo/mega-sena/bolao-mega-002.html

# Quina:
https://seu-usuario.github.io/repo/quina/bolao-quina-001.html

# Lotomania:
https://seu-usuario.github.io/repo/lotomania/bolao-lotomania-001.html
```

### 🌐 Funcionalidades do Hub Principal (index.html)
```
1. 📊 Detecção Automática de Loterias
   ├── Verifica pastas disponíveis
   ├── Detecta arquivos .xlsx
   ├── Lê configurações (config.json)
   └── Lista loterias ativas

2. 🔗 Geração de Links Individuais
   ├── Cria links para páginas HTML individuais
   ├── URLs únicas por bolão
   ├── Status dos resultados
   └── Informações específicas de cada bolão

3. 📄 Visualização de Status
   ├── Mostra configurações de cada loteria
   ├── Exibe status dos resultados
   ├── Informações dos comprovantes
   └── Links para páginas individuais dos bolões

4. 🎯 Interface Centralizada
   ├── Hub único para todas as loterias
   ├── Navegação fácil entre modalidades
   ├── Design responsivo
   └── Atualização automática
```

### 📱 Estrutura das Páginas HTML Individuais dos Bolões
```
1. 📋 Cabeçalho da Página
   ├── Nome do bolão (config.json > boloes > bolao-principal > nome)
   ├── Modalidade (config.json > loteria > modalidade)
   ├── Número do concurso (config.json > loteria > concurso)
   └── Data/hora de atualização

2. 📊 Informações do Bolão
   ├── Total de cotas (config.json > boloes > bolao-principal > cotas)
   ├── Total de jogos (contagem automática de linhas da planilha - cabeçalho)
   ├── Números por jogo (config.json > loteria > numeros_por_jogo)
   └── Range de acertos (config.json > loteria > range_acertos)

3. 📈 Contagem Automática de Acertos
   ├── Sistema conta acertos quando resultado é upado
   ├── Exibe contagem por faixa de acertos
   ├── Contagem dinâmica baseada nos jogos da planilha
   └── Atualização automática

4. 📥 Download de Arquivos
   ├── Botão para baixar planilha específica (boloes[bolao-principal].planilha)
   ├── Botão para baixar comprovantes (boloes[bolao-principal].comprovantes.pasta)
   └── Links diretos para arquivos

5. 🎯 Números Sorteados
   ├── Exibe números do resultado.txt (se existir)
   ├── Formatação visual dos números
   ├── Status: "Resultado disponível" ou "Aguardando resultado"
   └── Data do sorteio

6. 📈 Tabela de Acertos (se resultado disponível)
   ├── Contagem automática de acertos por faixa
   ├── Exemplo Lotofácil:
   │   ├── 2 acertos (15 números)
   │   ├── 20 acertos (14 números)
   │   ├── 200 acertos (13 números)
   │   ├── 2000 acertos (12 números)
   │   └── 20000 acertos (11 números)
   ├── Contagem dinâmica baseada nos jogos da planilha
   └── Destaque visual para acertos

7. 🎮 Lista de Jogos
   ├── Exibe todos os jogos da planilha
   ├── Destaca números acertados
   ├── Contador de acertos por jogo
   └── Formatação responsiva

8. 📄 Comprovantes
   ├── Lista PDFs disponíveis
   ├── Visualização inline (se possível)
   ├── Download individual
   └── Organização por pasta
```

### 📱 Compatibilidade
- ✅ GitHub Pages
- ✅ Arquivos estáticos
- ✅ JavaScript vanilla
- ✅ CSS3 responsivo
- ✅ Fetch API para leitura de arquivos
- ✅ Sem dependências externas
- ✅ PDF.js para visualização de comprovantes
