// Sistema de debug e logging
// Arquivo separado para melhor organização

export class DebugSystem {
  constructor() {
    this.logs = [];
    this.isDebugMode = false;
  }

  initialize() {
    // Configurar modo de debug baseado no ambiente
    this.isDebugMode = window.location.hostname === 'localhost' ||
                      window.location.hostname === '127.0.0.1' ||
                      window.location.hostname.includes('staging');

    window.DEBUG = this.isDebugMode;
    window.LOGS = this.logs;

    if (this.isDebugMode) {
      this.setupDebugPanel();
    }
  }

  setupDebugPanel() {
    // Criar painel de debug se não existir
    if (!document.getElementById('debug-panel')) {
      this.createDebugPanel();
    }

    // Tornar função global
    window.toggleDebug = () => this.toggleDebug();
  }

  createDebugPanel() {
    const panel = document.createElement('div');
    panel.id = 'debug-panel';
    panel.className = 'debug-panel';
    panel.innerHTML = `
      <div><strong>DEBUG LOGS</strong></div>
      <div id="debug-logs"></div>
    `;

    // Adicionar estilos inline temporários até mover para CSS
    panel.style.cssText = `
      position: fixed;
      top: 50px;
      right: 10px;
      width: 400px;
      max-height: 300px;
      background: rgba(26, 26, 46, 0.95);
      border: 1px solid #00ff88;
      border-radius: 8px;
      padding: 12px;
      font-family: monospace;
      font-size: 11px;
      color: #00ff88;
      overflow-y: auto;
      z-index: 9998;
      display: none;
    `;

    document.body.appendChild(panel);
  }

  log(category, message, data = null) {
    const timestamp = new Date().toLocaleTimeString();
    let sanitizedData = data;

    if (data && typeof data === 'object') {
      sanitizedData = { ...data };
      if (sanitizedData.uid) sanitizedData.uid = sanitizedData.uid.substring(0, 8) + '...';
      if (sanitizedData.email) sanitizedData.email = sanitizedData.email.replace(/(.{3}).*(@.*)/, '$1***$2');
    }

    const logEntry = `[${timestamp}] [${category}] ${message}${sanitizedData ? ': ' + JSON.stringify(sanitizedData) : ''}`;
    this.logs.push(logEntry);

    if (this.isDebugMode) {
      console.log('🔍', logEntry);
    }
  }

  toggleDebug() {
    const panel = document.getElementById('debug-panel');
    const logs = document.getElementById('debug-logs');

    if (panel) {
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }

    if (logs) {
      logs.innerHTML = this.logs.slice(-50).join('<br>');
    }
  }

  updateDebugPanel() {
    const logs = document.getElementById('debug-logs');
    if (logs) {
      logs.innerHTML = this.logs.slice(-50).join('<br>');
    }
  }
}

// Instância global
export const debugSystem = new DebugSystem();
