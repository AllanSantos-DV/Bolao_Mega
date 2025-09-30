# 🎯 WIREFRAME - TELA DO HUB

## 📱 Layout Principal

```
┌─────────────────────────────────────────────────────────────────┐
│ 🏠 MEGA-BOLÃO 2025                    👤 Usuário    [Sair]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🧠 CONTROLE DE CACHE                                        │ │
│ │ Status: ✅ Online                                           │ │
│ │ [🗑️ Limpar] [🔄 Atualizar] [✅ Validar]                    │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 👥 PARTICIPANTES (badge: total)  🎲 LOTERIAS E BOLÕES (badge: total) │ │
│ │ [➕ Criar] [✏️ Editar]           [➕ Criar Loteria] [✏️ Editar]      │ │
│ │                                   [🎯 Criar Bolão]                  │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 📊 LOTERIAS E BOLÕES                                        │ │
│ │                                                             │ │
│ │ ┌─────────────────────────────────────────────────────────┐ │ │
│ │ │ 🎲 LOTOFÁCIL                    3 bolões • R$ 2,50      │ │ │
│ │ │                                                         │ │ │
│ │ │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐         │ │ │
│ │ │ │ Bolão 001   │ │ Bolão 002   │ │ Bolão 003   │         │ │ │
│ │ │ │ 15 jogos    │ │ 20 jogos    │ │ 25 jogos    │         │ │ │
│ │ │ │ 2 concursos │ │ 3 concursos │ │ 1 concurso  │         │ │ │
│ │ │ │ 8 participantes│ │ 12 participantes│ │ 5 participantes│ │
│ │ │ │ [🔗][👁️][✏️] │ │ [🔗][👁️][✏️] │ │ [🔗][👁️][✏️] │         │ │ │
│ │ │ └─────────────┘ └─────────────┘ └─────────────┘         │ │ │
│ │ └─────────────────────────────────────────────────────────┘ │ │
│ │                                                             │ │
│ │ ┌─────────────────────────────────────────────────────────┐ │ │
│ │ │ 🎯 MEGA-SENA                   2 bolões • R$ 4,50      │ │ │
│ │ │                                                         │ │ │
│ │ │ ┌─────────────┐ ┌─────────────┐                         │ │ │
│ │ │ │ Bolão 001   │ │ Bolão 002   │                         │ │ │
│ │ │ │ 6 jogos     │ │ 8 jogos     │                         │ │ │
│ │ │ │ 1 concurso  │ │ 2 concursos │                         │ │ │
│ │ │ │ 15 participantes│ │ 20 participantes│                 │ │
│ │ │ │ [🔗][👁️][✏️] │ │ [🔗][👁️][✏️] │                         │ │ │
│ │ │ └─────────────┘ └─────────────┘                         │ │ │
│ │ └─────────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 📊 RELATÓRIOS                                               │ │
│ │ [📊 Relatórios Gerais] [📈 Estatísticas]                   │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ⚡ SISTEMA                    📈 ESTATÍSTICAS DO SISTEMA   │ │
│ │ Status: ✅ Online            ┌─────────┐ ┌─────────┐     │ │
│ │ Última: 29/01/2025 20:15    │    5    │ │   12    │     │ │
│ │ Ambiente: Produção          │ Loterias│ │ Bolões  │     │ │
│ │                              └─────────┘ └─────────┘     │ │
│ │                              ┌─────────┐ ┌─────────┐     │ │
│ │                              │    3    │ │  1.2.3  │     │ │
│ │                              │Resultados│ │ Versão  │     │ │
│ │                              └─────────┘ └─────────┘     │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 🎨 Elementos de Design

### **Header:**
- Logo/Título centralizado
- Avatar do usuário à direita
- Botão de logout

### **Cards Administrativos:**
- **Grid 2x1:** Participantes + Loterias e Bolões
- Badges de contagem no título:
  - Participantes: total de participantes (apenas quando autenticado)
  - Loterias e Bolões: total de loterias cadastradas
- Botões de ação: Criar, Editar, Criar Bolão
- Design consistente com ícones

### **Card Principal:**
- **📊 Loterias e Bolões:** Visualização principal
- Renderizar somente loterias que possuem bolões (se não houver bolões no sistema, ocultar a grade e exibir estado vazio global)
- Grid de loterias com seus respectivos bolões
- Ações por bolão: Link, Visualizar, Editar

### **Card de Relatórios:**
- **📊 Relatórios:** Análise e consulta
- Botões: Relatórios Gerais, Estatísticas

### **Grid Sistema (Última Linha):**
- **⚡ Sistema:** Status, atualização, ambiente
- **📈 Estatísticas:** Métricas consolidadas
- Grid 2x1 com informações técnicas

## 🔄 Fluxo de Uso

### **1. Ações Administrativas:**
- **👥 Participantes:** Criar e editar usuários
- **🎲 Loterias e Bolões:** Gerenciar entidades principais

### **2. Visualização:**
- **📊 Loterias e Bolões:** Dados principais com ações por bolão
- Contadores carregados no onload (loterias) e via sessão autenticada (participantes)

### **3. Análise:**
- **📊 Relatórios:** Consultas e relatórios gerais

### **4. Sistema:**
- **⚡ Sistema + 📈 Estatísticas:** Informações técnicas na base

## 📱 Responsividade

### **Desktop (1200px+):**
- Grid 2x1 para cards administrativos
- Card único para visualização principal
- Grid 2x1 para sistema e estatísticas

### **Tablet (768px-1199px):**
- Cards empilhados verticalmente
- Grid mantido para sistema e estatísticas

### **Mobile (<768px):**
- Stack vertical completo
- Botões otimizados para toque
- Grid sistema em coluna única

## 🎯 Hierarquia Visual

### **Prioridade de Ações:**
1. **👥 Participantes + 🎲 Loterias e Bolões** (Ações administrativas)
2. **📊 Loterias e Bolões** (Visualização principal)
3. **📊 Relatórios** (Análise e consulta)
4. **⚡ Sistema + 📈 Estatísticas** (Informações técnicas - ÚLTIMA LINHA)

### **Agrupamento Lógico:**
- **Ações Administrativas:** Primeira linha (mais acessível)
- **Visualização:** Dados principais
- **Análise:** Relatórios
- **Sistema:** Informações técnicas na base

## 🗃️ Cache Local e Regras

- Armazenamento local (localStorage) com TTL e versionamento:
  - `loterias` (público)
  - `boloesByLoteria:{loteriaId}` (público)
  - `jogos:{bolaoId}` (público)
  - `counts` (público)
  - `bolaoAgg:{bolaoId}` (público): { totalCotas, participantesCount }
- (Opcional implementado): `bolões.{id}.agg` persistido no Firestore para leitura pública direta e sincronismo com cache local.
- Participantes (sensível): não persistir PII em localStorage; somente derivados agregados por bolão em `bolaoAgg`. Dados completos apenas em sessão admin.
- Invalidação: CRUD em participantes/loterias/bolões limpa chaves afetadas e re-sincroniza com Firestore.

## 🌐 Rede e Resiliência

- Retry com backoff (exponential + jitter) nas leituras públicas (loterias/bolões): 5 tentativas, base 300ms, 2×, jitter 30%, timeout 7s.
- SWR (stale-while-revalidate): renderiza cache imediato e revalida em segundo plano, atualizando a UI ao concluir.
- Degradação: quando offline/erro, exibe cache (se disponível) com aviso; sem cache, estado “Indisponível” com CTA de tentar novamente.
- Revalidação automática: ao ganhar foco/voltar online.
- Sincronização entre abas: `storage` event para revalidar quando chaves de cache forem alteradas em outra aba.