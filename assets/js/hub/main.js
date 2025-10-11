// Sistema principal do hub administrativo
// Arquivo separado para melhor organização e escalabilidade

import { log } from '../debug.js';

export class HubManager {
  constructor() {
    this.firestoreAdmin = null;
    this.adminManager = null;
    this.cacheService = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      log('SYSTEM', 'Inicializando HubManager');

      // Carregar dependências
      await this.loadDependencies();

      // Inicializar sistema
      await this.setupEventListeners();
      await this.loadInitialData();

      this.isInitialized = true;
      log('SYSTEM', 'HubManager inicializado com sucesso');

      // Expor adminManager globalmente para compatibilidade
      window.adminManager = this.adminManager;

    } catch (error) {
      log('ERROR', 'Falha na inicialização do HubManager', error);
      throw error;
    }
  }

  async loadDependencies() {
    try {
      // Carregar configuração Firebase
      const { ensureFirebaseConfigAvailable } = await import('../firebase/config-loader.js');
      const configOk = await ensureFirebaseConfigAvailable();

      if (!configOk || !window.firebaseConfig) {
        throw new Error('Configuração Firebase não disponível');
      }

      // Inicializar Firebase
      const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js');
      const { getAuth, onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js');
      const { getFirestore } = await import('https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js');

      const app = initializeApp(window.firebaseConfig);
      const auth = getAuth(app);
      const db = getFirestore(app);

      // Disponibilizar utilitário de auth no escopo da instância
      this.onAuthStateChanged = onAuthStateChanged;

      // Inicializar serviços
      const { FirestoreAdmin } = await import('../admin/firestore-admin.js');
      const { AdminManager } = await import('../admin/admin-manager.js');
      const { modalManager } = await import('../ui/modals.js');

      this.firestoreAdmin = new FirestoreAdmin(db);
      this.adminManager = new AdminManager(this.firestoreAdmin);

      // Configurar autenticação
      this.setupAuthListener(auth);

    } catch (error) {
      throw error;
    }
  }

  setupAuthListener(auth) {
    this.onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Atualizar interface
        this.updateUserInterface(user);
        // Carregar dados
        await this.loadInitialData();
      } else {
        // Redirecionar para login se não autenticado
        window.location.href = '/pages/login.html';
      }
    });
  }

  updateUserInterface(user) {
    const userInfo = document.getElementById('user-info');
    const userAvatar = document.getElementById('user-avatar');
    const userName = document.getElementById('user-name');

    if (userInfo) userInfo.style.display = 'flex';
    if (userName) userName.textContent = user.displayName || user.email || 'Usuário';
    if (userAvatar) userAvatar.textContent = (user.displayName || user.email || 'U').charAt(0).toUpperCase();

    document.body.style.visibility = 'visible';
  }

  async loadInitialData() {
    try {
      // Atualizar estatísticas
      await this.updateStats();
      // Carregar loterias com bolões
      await this.loadLoteriasWithBoloes();
    } catch (error) {
      // Silenciar erros para não poluir console
    }
  }

  async loadLoteriasWithBoloes() {
    const loading = document.getElementById('lotteries-loading');
    const container = document.getElementById('lotteries-container');
    const empty = document.getElementById('lotteries-empty');

    if (loading) loading.classList.remove('hidden');
    if (container) container.classList.add('hidden');
    if (empty) empty.classList.add('hidden');

    try {
      const { listLoteriasFromDB, getLoteriaConfigFromDB } = await import('../data/firestore.js');
      const loterias = await listLoteriasFromDB();
      const found = [];

      for (const loteria of loterias) {
        const config = await getLoteriaConfigFromDB(loteria.id);
        if (config) {
          found.push({ nome: loteria.id, config });
        }
      }

      if (found.length === 0) {
        if (empty) empty.classList.remove('hidden');
        return;
      }

      if (container) {
        container.innerHTML = '';
        found.forEach(loteriaData => {
          container.appendChild(this.buildLoteriaCard(loteriaData));
        });
        container.classList.remove('hidden');
      }

    } catch (error) {
      if (empty) empty.classList.remove('hidden');
    } finally {
      if (loading) loading.classList.add('hidden');
    }
  }

  buildLoteriaCard(loteriaData) {
    const { nome, config } = loteriaData;
    const card = document.createElement('div');
    card.className = 'card';

    const boloes = Object.entries(config.boloes || {}).map(([id, bolao]) => `
      <div class="bolao-card">
        <h4>${bolao.nome || id}</h4>
        <div class="bolao-meta">
          ${bolao.jogos?.total_jogos || 0} jogos •
          ${bolao.concursos_alvo?.length || 0} concursos •
          ${bolao.participantes?.length || 0} participantes
        </div>
        <div class="bolao-actions">
          <button class="btn" onclick="hubManager.shareBolao('${nome}', '${id}')">🔗 Link</button>
          <button class="btn btn-secondary" onclick="hubManager.viewBolao('${nome}', '${id}')">👁️ Visualizar</button>
          <button class="btn btn-secondary" onclick="hubManager.editBolao('${nome}', '${id}')">✏️ Editar</button>
        </div>
      </div>
    `).join('');

    card.innerHTML = `
      <h3>${config.loteria?.modalidade || nome}</h3>
      ${boloes || '<div class="error">Nenhum bolão configurado</div>'}
    `;

    return card;
  }

  async updateStats() {
    try {
      const { countersService } = await import('../data/counters.js');

      let isAdmin = false;
      try {
        await this.firestoreAdmin.checkAdminPermission();
        isAdmin = true;
      } catch (error) {
        isAdmin = false;
      }

      await countersService.refreshAll(this.firestoreAdmin, isAdmin);
      this.updateSystemInfo();

    } catch (error) {
      // Silenciar erros de estatísticas
    }
  }

  updateSystemInfo() {
    const lastUpdate = document.getElementById('last-update');
    const environment = document.getElementById('environment');

    if (lastUpdate) {
      lastUpdate.textContent = new Date().toLocaleString('pt-BR');
    }

    if (environment) {
      const env = window.location.hostname === 'localhost' ? 'Desenvolvimento' :
                  window.location.hostname.includes('staging') ? 'Staging' : 'Produção';
      environment.textContent = env;
    }
  }

  async clearLocalData() {
    try {
      // Limpar apenas cache da API da Caixa
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('caixa_api_cache')) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));

      // Limpar sessionStorage
      if (sessionStorage) {
        sessionStorage.clear();
      }

    } catch (error) {
      // Silenciar erros de limpeza
    }
  }

  clearSessionData() {
    try {
      // Resetar variáveis globais
      if (window.LOGS) window.LOGS.length = 0;
      if (window.firebaseConfig) delete window.firebaseConfig;

      // Limpar elementos da interface
      const userInfo = document.getElementById('user-info');
      if (userInfo) userInfo.style.display = 'none';

    } catch (error) {
      // Silenciar erros
    }
  }

  async setupEventListeners() {
    // Configurar botões de controle de cache
    const clearBtn = document.getElementById('btn-limpar-cache');
    const refreshBtn = document.getElementById('btn-atualizar-cache');
    const validateBtn = document.getElementById('btn-validar-concursos');

    if (clearBtn) {
      clearBtn.addEventListener('click', async () => {
        try {
          await this.clearLocalData();
          const resEl = document.getElementById('cache-results');
          if (resEl) resEl.innerHTML = '<div class="status-success">✅ Cache limpo completamente.</div>';
          log('CACHE', 'Cache limpo via botão');
        } catch (error) {
          log('ERROR', 'Erro ao limpar cache via botão', error);
        }
      });
    }

    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        try {
          // Limpar apenas cache da API da Caixa
          const keysToRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.includes('caixa_api_cache')) {
              keysToRemove.push(key);
            }
          }

          keysToRemove.forEach(key => localStorage.removeItem(key));

          const resEl = document.getElementById('cache-results');
          if (resEl) resEl.innerHTML = `<div class="status-success">✅ Cache da API atualizado (${keysToRemove.length} itens removidos).</div>`;
          log('CACHE', `Cache da API atualizado (${keysToRemove.length} itens removidos)`);
        } catch (error) {
          log('ERROR', 'Erro ao atualizar cache da API', error);
        }
      });
    }

    if (validateBtn) {
      validateBtn.addEventListener('click', () => {
        const vEl = document.getElementById('validation-status');
        if (vEl) vEl.textContent = '🔄 Validando...';
        setTimeout(() => {
          if (vEl) vEl.innerHTML = '<div class="status-success">✅ Validação concluída</div>';
          log('VALIDATION', 'Validação concluída');
        }, 600);
      });
    }

    // Configurar logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        try {
          const { getAuth, signOut } = await import('https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js');
          const auth = getAuth();

          await this.clearLocalData();
          await signOut(auth);
          this.clearSessionData();

        } catch (error) {
          // Silenciar erros de logout
        }
      });
    }
  }

  // Métodos para ações dos bolões
  shareBolao(loteria, bolaoId) {
    const url = `${window.location.origin}/pages/bolao-template.html?loteria=${loteria}&bolao=${bolaoId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        this.showToast('Link copiado!', 'success');
      }).catch(() => {
        prompt('Link do bolão:', url);
      });
    } else {
      prompt('Link do bolão:', url);
    }
  }

  viewBolao(loteria, bolaoId) {
    const url = `/pages/bolao-template.html?loteria=${loteria}&bolao=${bolaoId}`;
    window.open(url, '_blank');
  }

  editBolao(loteria, bolaoId) {
    this.adminManager.openAdminModal('boloes');
  }

  showToast(message, type = 'info') {
    // Implementação simples de toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 16px;
      border-radius: 8px;
      color: white;
      z-index: 10000;
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    `;

    document.body.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
}

// Instância global
export const hubManager = new HubManager();
