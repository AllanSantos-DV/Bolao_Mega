// Modal Management - ES6 Module

export class ModalManager {
  constructor() {
    this.currentModal = null;
  }

  // Criar modal genérico
  createModal(title, content) {
    // Remover modal existente se houver
    this.closeModal();
    
    const modal = document.createElement('div');
    modal.id = 'admin-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div class="modal-header">
          <h3 id="modal-title">${title}</h3>
          <button class="modal-close" aria-label="Fechar" onclick="modalManager.closeModal()">&times;</button>
        </div>
        <div class="modal-body">
          ${content}
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    this.currentModal = modal;
    // Focus management: focus first focusable element or close button
    setTimeout(() => {
      try {
        const focusable = modal.querySelector('input, select, textarea, button, [tabindex]:not([tabindex="-1"])');
        (focusable || modal.querySelector('.modal-close'))?.focus();
      } catch (_) {}
    }, 0);
    return modal;
  }

  // Fechar modal
  closeModal() {
    if (this.currentModal) {
      this.currentModal.remove();
      this.currentModal = null;
    }
  }

  // Mostrar mensagem de sucesso
  showSuccess(message) {
    this.showToast(message, 'success');
  }

  // Mostrar mensagem de erro
  showError(message) {
    this.showToast(message, 'error');
  }

  // Mostrar toast
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
        <span class="toast-message">${message}</span>
      </div>
    `;
    
    // Adicionar estilos se não existirem
    if (!document.getElementById('toast-styles')) {
      const styles = document.createElement('style');
      styles.id = 'toast-styles';
      styles.textContent = `
        .toast {
          position: fixed;
          top: 20px;
          right: 20px;
          background: rgba(26, 26, 46, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 12px 16px;
          color: #fff;
          z-index: 10000;
          backdrop-filter: blur(10px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          transform: translateX(100%);
          transition: transform 0.3s ease;
        }
        .toast.show {
          transform: translateX(0);
        }
        .toast-success {
          border-left: 4px solid #10b981;
        }
        .toast-error {
          border-left: 4px solid #ef4444;
        }
        .toast-info {
          border-left: 4px solid #3b82f6;
        }
        .toast-content {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .toast-icon {
          font-size: 16px;
        }
        .toast-message {
          font-size: 14px;
          font-weight: 500;
        }
      `;
      document.head.appendChild(styles);
    }
    
    document.body.appendChild(toast);
    
    // Animar entrada
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Remover após 4 segundos
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
}

// Instância global do gerenciador de modais
export const modalManager = new ModalManager();
