// Loterias Management - ES6 Module

import { Loteria } from './models.js';
import { FirestoreAdmin } from './firestore-admin.js';
import { modalManager } from '../ui/modals.js';

export class LoteriasManager {
  constructor(firestoreAdmin) {
    this.firestoreAdmin = firestoreAdmin;
  }

  // Modal para criar/editar loteria
  showLoteriaModal(loteria = null) {
    const isEdit = loteria !== null;
    const title = isEdit ? 'Editar Loteria' : 'Criar Loteria';
    
    const modal = modalManager.createModal(title, `
      <form id="loteria-form">
        <div class="form-group">
          <label for="nome">Nome *</label>
          <input type="text" id="nome" name="nome" value="${loteria?.nome || ''}" required>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" id="valor_variavel" name="valor_variavel" ${loteria?.valor_variavel ? 'checked' : ''}>
            Valor Variável (definido na criação do bolão)
          </label>
        </div>
        <div class="form-group" id="valor-volante-group" style="${loteria?.valor_variavel ? 'display: none;' : ''}">
          <label for="valor_volante">Valor do Volante *</label>
          <input type="number" id="valor_volante" name="valor_volante" value="${loteria?.valor_volante || ''}" min="0" step="0.01">
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="modalManager.closeModal()">Cancelar</button>
          <button type="submit" class="btn">${isEdit ? 'Atualizar' : 'Criar'}</button>
        </div>
      </form>
    `);
    
    // Configurar checkbox de valor variável
    document.getElementById('valor_variavel').addEventListener('change', (e) => {
      this.handleValorVariavelChange(e.target.checked);
    });
    
    // Configurar submit
    document.getElementById('loteria-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.saveLoteria(loteria?.id);
    });
  }

  // Salvar loteria
  async saveLoteria(id = null) {
    try {
      const form = document.getElementById('loteria-form');
      const formData = new FormData(form);
      
      const loteriaData = {
        nome: formData.get('nome').trim(),
        valor_volante: parseFloat(formData.get('valor_volante')) || 0,
        valor_variavel: formData.has('valor_variavel')
      };
      
      const loteria = new Loteria(loteriaData);
      
      if (id) {
        await this.firestoreAdmin.updateLoteria(id, loteria);
        modalManager.showSuccess('Loteria atualizada com sucesso!');
      } else {
        await this.firestoreAdmin.createLoteria(loteria);
        modalManager.showSuccess('Loteria criada com sucesso!');
      }
      // Atualizar badge de loterias após salvar (serviço central)
      try {
        const { countersService } = await import('../data/counters.js');
        await countersService.updateLoteriasBadge({});
      } catch (_) { /* noop */ }

      modalManager.closeModal();
      
    } catch (error) {
      console.error('Erro ao salvar loteria:', error);
      modalManager.showError('Erro ao salvar loteria: ' + error.message);
    }
  }

  // Listar loterias
  async listLoterias() {
    try {
      const loterias = await this.firestoreAdmin.getAllLoterias();
      this.showLoteriasList(loterias);
    } catch (error) {
      console.error('Erro ao listar loterias:', error);
      modalManager.showError('Erro ao listar loterias: ' + error.message);
    }
  }

  // Mostrar lista de loterias
  showLoteriasList(loterias) {
    if (loterias.length === 0) {
      modalManager.showError('Nenhuma loteria encontrada');
      return;
    }
    
    const modal = modalManager.createModal('Lista de Loterias', `
      <div class="form-group">
        <label for="search-loteria">Buscar loteria:</label>
        <input type="text" id="search-loteria" placeholder="Digite o nome da loteria..." style="margin-bottom: 16px;">
      </div>
      <div class="loterias-list" id="loterias-list">
        ${loterias.map(l => `
          <div class="loteria-item" data-nome="${l.nome.toLowerCase()}" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.1);">
            <div>
              <div style="font-weight: 600; color: #fff;">${l.nome}</div>
              <div style="font-size: 14px; color: #bdbdbd;">
                ${l.valor_variavel ? 'Valor Variável' : `R$ ${l.valor_volante.toFixed(2)}`}
              </div>
            </div>
            <div>
              <button class="btn btn-secondary" onclick="loteriasManager.editLoteria('${l.id}')" style="padding: 6px 12px; font-size: 12px;">
                ✏️ Editar
              </button>
              <button class="btn btn-secondary" onclick="loteriasManager.deleteLoteria('${l.id}')" style="padding: 6px 12px; font-size: 12px; margin-left: 8px;">
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
    const searchInput = document.getElementById('search-loteria');
    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      const items = document.querySelectorAll('.loteria-item');
      
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

  // Editar loteria
  async editLoteria(loteriaId) {
    try {
      const loteria = await this.firestoreAdmin.getLoteria(loteriaId);
      if (loteria) {
        this.showLoteriaModal(loteria);
      } else {
        modalManager.showError('Loteria não encontrada');
      }
    } catch (error) {
      console.error('Erro ao carregar loteria:', error);
      modalManager.showError('Erro ao carregar loteria: ' + error.message);
    }
  }

  // Remover loteria
  async deleteLoteria(loteriaId) {
    try {
      await this.firestoreAdmin.deleteLoteria(loteriaId);
      modalManager.showSuccess('Loteria removida com sucesso!');
      // Atualizar badge de loterias (serviço central)
      try {
        const { countersService } = await import('../data/counters.js');
        await countersService.updateLoteriasBadge({});
      } catch (_) { /* noop */ }
      modalManager.closeModal();
      await this.listLoterias();
    } catch (error) {
      console.error('Erro ao remover loteria:', error);
      modalManager.showError('Erro ao remover loteria: ' + error.message);
    }
  }

  // Manipular mudança de valor variável
  handleValorVariavelChange(isValorVariavel) {
    const valorVolanteGroup = document.getElementById('valor-volante-group');
    const valorVolanteInput = document.getElementById('valor_volante');
    
    if (isValorVariavel) {
      valorVolanteGroup.style.display = 'none';
      valorVolanteInput.required = false;
      valorVolanteInput.value = '';
    } else {
      valorVolanteGroup.style.display = 'block';
      valorVolanteInput.required = true;
    }
  }

  // Carregar loterias para select
  async loadLoteriasForSelect() {
    try {
      const loterias = await this.firestoreAdmin.getAllLoterias();
      const select = document.getElementById('loteria_id');
      
      select.innerHTML = '<option value="">Selecione uma loteria...</option>';
      loterias.forEach(l => {
        const option = document.createElement('option');
        option.value = l.id;
        option.textContent = `${l.nome} - R$ ${l.valor_volante.toFixed(2)}`;
        select.appendChild(option);
      });
    } catch (error) {
      console.error('Erro ao carregar loterias:', error);
    }
  }
}
