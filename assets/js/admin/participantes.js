// Participantes Management - ES6 Module

import { Participante } from './models.js';
import { FirestoreAdmin } from './firestore-admin.js';
import { modalManager } from '../ui/modals.js';

export class ParticipantesManager {
  constructor(firestoreAdmin) {
    this.firestoreAdmin = firestoreAdmin;
  }

  // Modal para criar/editar participante
  showParticipanteModal(participante = null) {
    const isEdit = participante !== null;
    const title = isEdit ? 'Editar Participante' : 'Criar Participante';
    
    const modal = modalManager.createModal(title, `
      <form id="participante-form">
        <div class="form-group">
          <label for="nome">Nome *</label>
          <input type="text" id="nome" name="nome" value="${participante?.nome || ''}" required minlength="3">
        </div>
        <div class="form-group">
          <label for="telefone">Telefone</label>
          <input type="tel" id="telefone" name="telefone" value="${participante?.telefone || ''}">
        </div>
        <div class="form-group">
          <label for="chavepix">Chave PIX</label>
          <input type="text" id="chavepix" name="chavepix" value="${participante?.chavepix || ''}">
        </div>
        <div class="form-group">
          <label for="participante_responsavel">Participante Responsável</label>
          <select id="participante_responsavel" name="participante_responsavel">
            <option value="">Selecione...</option>
          </select>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="modalManager.closeModal()">Cancelar</button>
          <button type="submit" class="btn">${isEdit ? 'Atualizar' : 'Criar'}</button>
        </div>
      </form>
    `);
    
    // Carregar participantes com telefone para o select
    this.loadParticipantesComTelefone();
    
    // Configurar submit
    document.getElementById('participante-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.saveParticipante(participante?.id);
    });
  }

  // Salvar participante
  async saveParticipante(id = null) {
    try {
      const form = document.getElementById('participante-form');
      const formData = new FormData(form);
      
      const participanteData = {
        nome: formData.get('nome').trim(),
        telefone: formData.get('telefone').trim(),
        chavepix: formData.get('chavepix').trim(),
        participante_responsavel: formData.get('participante_responsavel') || null
      };
      
      const participante = new Participante(participanteData);
      
      if (id) {
        await this.firestoreAdmin.updateParticipante(id, participante);
        this.showToast('Participante atualizado com sucesso!', 'success');
      } else {
        await this.firestoreAdmin.createParticipante(participante);
        this.showToast('Participante criado com sucesso!', 'success');
      }
      // Atualizar badge de participantes após salvar (serviço central)
      try {
        const { countersService } = await import('../data/counters.js');
        await countersService.updateParticipantesBadge(() => this.firestoreAdmin.getAllParticipantes(), true);
      } catch (_) { /* noop */ }

      modalManager.closeModal();
      
    } catch (error) {
      console.error('Erro ao salvar participante:', error);
      this.showToast('Erro ao salvar participante: ' + error.message, 'error');
    }
  }

  // Carregar participantes com telefone para select
  async loadParticipantesComTelefone() {
    try {
      const participantes = await this.firestoreAdmin.getAllParticipantes();
      const select = document.getElementById('participante_responsavel');
      
      select.innerHTML = '<option value="">Selecione...</option>';
      participantes.forEach(p => {
        if (p.telefone) {
          const option = document.createElement('option');
          option.value = p.id;
          option.textContent = `${p.nome} (${p.telefone})`;
          select.appendChild(option);
        }
      });
    } catch (error) {
      console.error('Erro ao carregar participantes:', error);
    }
  }

  // Listar participantes
  async listParticipantes() {
    try {
      const participantes = await this.firestoreAdmin.getAllParticipantes();
      this.showParticipantesList(participantes);
    } catch (error) {
      console.error('Erro ao listar participantes:', error);
      this.showToast('Erro ao listar participantes: ' + error.message, 'error');
    }
  }

  // Mostrar lista de participantes
  showParticipantesList(participantes) {
    if (participantes.length === 0) {
      this.showToast('Nenhum participante encontrado', 'warning');
      return;
    }
    
    // Criar modal para listar participantes
    const modal = modalManager.createModal('Lista de Participantes', `
      <div class="form-group">
        <label for="search-participante">Buscar participante:</label>
        <input type="text" id="search-participante" placeholder="Digite o nome do participante..." style="margin-bottom: 16px;">
      </div>
      <div class="participantes-list" id="participantes-list">
        ${participantes.map(p => `
          <div class="participante-item" data-nome="${p.nome.toLowerCase()}" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.1);">
            <div>
              <div style="font-weight: 600; color: #fff;">${p.nome}</div>
              <div style="font-size: 14px; color: #bdbdbd;">
                ${p.telefone || 'Sem telefone'} 
                ${p.chavepix ? `• PIX: ${p.chavepix}` : ''}
              </div>
            </div>
            <div>
              <button class="btn btn-secondary" onclick="participantesManager.editParticipante('${p.id}')" style="padding: 6px 12px; font-size: 12px;">
                ✏️ Editar
              </button>
              <button class="btn btn-secondary" onclick="participantesManager.deleteParticipante('${p.id}')" style="padding: 6px 12px; font-size: 12px; margin-left: 8px;">
                🗑️ Remover
              </button>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-secondary" onclick="modalManager.closeModal()">Fechar</button>
      </div>
    `);
    
    // Configurar busca
    const searchInput = document.getElementById('search-participante');
    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      const items = document.querySelectorAll('.participante-item');
      
      items.forEach(item => {
        const nome = item.dataset.nome;
        if (nome.includes(searchTerm)) {
          item.style.display = 'flex';
        } else {
          item.style.display = 'none';
        }
      });
    });
  }

  // Editar participante
  async editParticipante(participanteId) {
    try {
      const participante = await this.firestoreAdmin.getParticipante(participanteId);
      if (participante) {
        this.showParticipanteModal(participante);
      } else {
        this.showToast('Participante não encontrado', 'error');
      }
    } catch (error) {
      console.error('Erro ao carregar participante:', error);
      this.showToast('Erro ao carregar participante: ' + error.message, 'error');
    }
  }

  // Remover participante
  async deleteParticipante(participanteId) {
    try {
      await this.firestoreAdmin.deleteParticipante(participanteId);
      this.showToast('Participante removido com sucesso!', 'success');
      // Atualizar badge (serviço central)
      try {
        const { countersService } = await import('../data/counters.js');
        await countersService.updateParticipantesBadge(() => this.firestoreAdmin.getAllParticipicipantes?.() || this.firestoreAdmin.getAllParticipantes(), true);
      } catch (_) { /* noop */ }
      modalManager.closeModal();
      await this.listParticipantes();
    } catch (error) {
      console.error('Erro ao remover participante:', error);
      this.showToast('Erro ao remover participante: ' + error.message, 'error');
    }
  }

  // Mostrar toast
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // Estilos do toast
    Object.assign(toast.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '12px 20px',
      borderRadius: '8px',
      color: '#fff',
      fontWeight: '600',
      zIndex: '10000',
      maxWidth: '300px',
      wordWrap: 'break-word'
    });

    // Cores por tipo
    const colors = {
      success: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
      error: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
      warning: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
      info: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)'
    };
    
    toast.style.background = colors[type] || colors.info;
    
    document.body.appendChild(toast);
    
    // Remover após 4 segundos
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 4000);
  }
}
