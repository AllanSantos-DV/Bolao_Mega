// Bolões Management - ES6 Module

import { Bolao } from './models.js';
import { FirestoreAdmin } from './firestore-admin.js';
import { modalManager } from '../ui/modals.js';
import { FileUploadManager } from './file-upload.js';

export class BoloesManager {
  constructor(firestoreAdmin) {
    this.firestoreAdmin = firestoreAdmin;
    this.fileUploadManager = new FileUploadManager();
  }

  // Modal para criar bolão
  showBolaoModal() {
    const modal = modalManager.createModal('Criar Bolão', `
      <form id="bolao-form">
        <div class="form-group">
          <label for="loteria_id">Loteria *</label>
          <select id="loteria_id" name="loteria_id" required>
            <option value="">Selecione uma loteria...</option>
          </select>
        </div>
        <div class="form-group" id="valor-volante-group" style="display: none;">
          <label for="valor_volante">Valor do Volante *</label>
          <input type="number" id="valor_volante" name="valor_volante" step="0.01" min="0.01" placeholder="Ex: 2.50">
        </div>
        <div class="form-group">
          <label for="nome">Nome do Bolão *</label>
          <input type="text" id="nome" name="nome" required>
        </div>
        <div class="form-group">
          <label for="participantes_ids">Participantes do Bolão *</label>
          <select id="participantes_ids" name="participantes_ids" multiple required>
            <option value="">Selecione os participantes...</option>
          </select>
          <small class="form-help">Mantenha Ctrl pressionado para seleção múltipla</small>
        </div>
        <div class="form-group">
          <label for="planilha">Planilha de Jogos *</label>
          <input type="file" id="planilha" name="planilha" accept=".xlsx,.csv" required>
        </div>
        <div class="form-group">
          <label for="comprovante">Comprovante (PDF)</label>
          <input type="file" id="comprovante" name="comprovante" accept=".pdf">
        </div>
        <div class="form-group">
          <label for="concurso_inicial">Concurso Inicial *</label>
          <input type="number" id="concurso_inicial" name="concurso_inicial" min="1" required placeholder="Ex: 3000">
        </div>
        <div class="form-group">
          <label for="concurso_final">Concurso Final *</label>
          <input type="number" id="concurso_final" name="concurso_final" min="1" required placeholder="Ex: 3005">
          <small class="form-help">Deixe vazio para usar apenas o concurso inicial</small>
        </div>
        <div class="form-group">
          <label>Datas dos Sorteios *</label>
          <div id="calendar-container">
            <div id="calendar-picker"></div>
            <div id="selected-dates-summary"></div>
          </div>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="modalManager.closeModal()">Cancelar</button>
          <button type="submit" class="btn">Criar Bolão</button>
        </div>
      </form>
    `);
    
    // Carregar loterias e participantes para os selects
    this.loadLoteriasForSelect();
    this.loadParticipantesForBolao();
    
    // Configurar mudança de loteria
    document.getElementById('loteria_id').addEventListener('change', (e) => {
      this.handleLoteriaChange(e.target.value);
    });
    
    // Configurar mudança de concursos
    document.getElementById('concurso_inicial').addEventListener('change', () => {
      this.handleConcursoInicialChange();
      this.updateCalendarRange();
    });
    
    document.getElementById('concurso_final').addEventListener('change', () => {
      this.updateCalendarRange();
    });
    
    // Configurar submit
    document.getElementById('bolao-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.saveBolao();
    });
    
    // Inicializar calendar picker
    this.initializeCalendarPicker();
  }

  // Salvar bolão
  async saveBolao() {
    try {
      const form = document.getElementById('bolao-form');
      const formData = new FormData(form);
      
      // Validar datas dos sorteios
      const concursoInicial = parseInt(formData.get('concurso_inicial'));
      const concursoFinal = parseInt(formData.get('concurso_final'));
      const selectedDates = this.getSelectedDates();
      
      const totalConcursos = concursoFinal - concursoInicial + 1;
      const totalDatas = selectedDates.length;
      
      if (totalDatas < totalConcursos) {
        const missingDates = totalConcursos - totalDatas;
        const confirmMessage = `⚠️ Atenção!\n\nVocê tem ${totalConcursos} concursos (${concursoInicial} a ${concursoFinal}) mas selecionou apenas ${totalDatas} datas.\n\n${missingDates} concurso(s) ficará(ão) sem data definida.\n\nDeseja continuar mesmo assim?`;
        
        if (!confirm(confirmMessage)) {
          return;
        }
      }
      
      // Obter participantes selecionados
      const participantesSelecionados = Array.from(document.getElementById('participantes_ids').selectedOptions)
        .map(option => option.value)
        .filter(value => value !== '');

      const bolaoData = {
        loteria_id: formData.get('loteria_id'),
        nome: formData.get('nome').trim(),
        participantes: participantesSelecionados,
        cotas: {},
        concursos_alvo: this.generateConcursosAlvo(concursoInicial, concursoFinal, selectedDates),
        comprovante_url: ''
      };
      
      const planilhaFile = formData.get('planilha');
      const comprovanteFile = formData.get('comprovante');
      
      // Processar planilha de jogos
      if (planilhaFile && planilhaFile.size > 0) {
        try {
          console.log('📊 Processando planilha:', planilhaFile.name);
          const jogosRaw = await this.fileUploadManager.readSpreadsheet(planilhaFile);
          const jogosProcessados = this.fileUploadManager.processJogosForFirestore(jogosRaw);
          bolaoData.jogos = jogosProcessados;
          console.log('✅ Jogos processados:', jogosProcessados);
        } catch (error) {
          console.error('❌ Erro ao processar planilha:', error);
          throw new Error(`Erro ao processar planilha: ${error.message}`);
        }
      } else {
        throw new Error('Planilha de jogos é obrigatória');
      }
      
      const bolao = new Bolao(bolaoData);
      const bolaoId = await this.firestoreAdmin.createBolao(bolao);
      
      modalManager.showSuccess('Bolão criado com sucesso!');
      modalManager.closeModal();
      
      // Recarregar lista de bolões para mostrar o novo bolão
      if (typeof window.loadLoteriasWithBoloes === 'function') {
        await window.loadLoteriasWithBoloes();
      }
      
    } catch (error) {
      console.error('Erro ao salvar bolão:', error);
      modalManager.showError('Erro ao salvar bolão: ' + error.message);
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
        const valorText = l.valor_variavel ? 'Valor Variável' : `R$ ${l.valor_volante.toFixed(2)}`;
        option.textContent = `${l.nome} - ${valorText}`;
        option.dataset.valorVariavel = l.valor_variavel;
        select.appendChild(option);
      });
    } catch (error) {
      console.error('Erro ao carregar loterias:', error);
    }
  }

  // Carregar participantes para select múltiplo
  async loadParticipantesForBolao() {
    try {
      const participantes = await this.firestoreAdmin.getAllParticipantes();
      const select = document.getElementById('participantes_ids');
      
      select.innerHTML = '<option value="">Selecione os participantes...</option>';
      participantes.forEach(p => {
        const option = document.createElement('option');
        option.value = p.id;
        option.textContent = p.nome;
        select.appendChild(option);
      });
    } catch (error) {
      console.error('Erro ao carregar participantes:', error);
    }
  }

  // Manipular mudança de loteria
  handleLoteriaChange(loteriaId) {
    const select = document.getElementById('loteria_id');
    const valorVolanteGroup = document.getElementById('valor-volante-group');
    const valorVolanteInput = document.getElementById('valor_volante');
    
    if (loteriaId) {
      const selectedOption = select.querySelector(`option[value="${loteriaId}"]`);
      const isValorVariavel = selectedOption?.dataset.valorVariavel === 'true';
      
      if (isValorVariavel) {
        valorVolanteGroup.style.display = 'block';
        valorVolanteInput.required = true;
      } else {
        valorVolanteGroup.style.display = 'none';
        valorVolanteInput.required = false;
        valorVolanteInput.value = '';
      }
    } else {
      valorVolanteGroup.style.display = 'none';
      valorVolanteInput.required = false;
      valorVolanteInput.value = '';
    }
  }

  // Manipular mudança de concurso inicial (spinner)
  handleConcursoInicialChange() {
    const concursoInicial = document.getElementById('concurso_inicial');
    const concursoFinal = document.getElementById('concurso_final');
    
    if (concursoInicial.value && !concursoFinal.value) {
      // Auto-preenchimento: se só tem inicial, final = inicial
      concursoFinal.value = concursoInicial.value;
    }
  }

  // Inicializar calendar picker
  initializeCalendarPicker() {
    const today = new Date();
    this.selectedDates = [this.formatDateLocal(today)]; // Data de hoje pré-selecionada
    this.currentMonth = today.getMonth();
    this.currentYear = today.getFullYear();
    this.renderCalendar();
    this.updateSelectedDatesSummary();
  }

  // Renderizar calendário
  renderCalendar() {
    const container = document.getElementById('calendar-picker');
    
    let html = `
      <div class="calendar-navigation">
        <button type="button" class="calendar-nav-btn" id="prev-month">‹</button>
        <h4 id="calendar-title">${this.getMonthName(this.currentMonth)} ${this.currentYear}</h4>
        <button type="button" class="calendar-nav-btn" id="next-month">›</button>
      </div>
      <div class="calendar-month">
        <div class="calendar-header">
          <div class="day-header">Dom</div>
          <div class="day-header">Seg</div>
          <div class="day-header">Ter</div>
          <div class="day-header">Qua</div>
          <div class="day-header">Qui</div>
          <div class="day-header">Sex</div>
          <div class="day-header">Sáb</div>
        </div>
        <div class="calendar-days">
    `;
    
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const currentDate = new Date(startDate);
    for (let week = 0; week < 6; week++) {
      for (let day = 0; day < 7; day++) {
        const dateStr = this.formatDateLocal(currentDate);
        const isCurrentMonthDay = currentDate.getMonth() === this.currentMonth;
        const isToday = dateStr === this.formatDateLocal(new Date());
        const isSelected = this.selectedDates.includes(dateStr);
        
        let classes = 'calendar-day';
        if (!isCurrentMonthDay) classes += ' other-month';
        if (isToday) classes += ' today';
        if (isSelected) classes += ' selected';
        
        html += `<div class="${classes}" data-date="${dateStr}">${currentDate.getDate()}</div>`;
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    
    html += '</div></div>';
    container.innerHTML = html;
    
    // Adicionar event listeners
    this.attachCalendarListeners();
  }

  // Obter nome do mês
  getMonthName(month) {
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return monthNames[month];
  }

  // Formatar data no fuso horário local (sem conversão UTC)
  formatDateLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Anexar event listeners ao calendário
  attachCalendarListeners() {
    // Navegação de meses
    document.getElementById('prev-month').addEventListener('click', () => {
      this.currentMonth--;
      if (this.currentMonth < 0) {
        this.currentMonth = 11;
        this.currentYear--;
      }
      this.renderCalendar();
    });
    
    document.getElementById('next-month').addEventListener('click', () => {
      this.currentMonth++;
      if (this.currentMonth > 11) {
        this.currentMonth = 0;
        this.currentYear++;
      }
      this.renderCalendar();
    });
    
    // Seleção de datas
    document.querySelectorAll('.calendar-day').forEach(day => {
      day.addEventListener('click', (e) => {
        const date = e.target.dataset.date;
        
        if (this.selectedDates.includes(date)) {
          this.selectedDates = this.selectedDates.filter(d => d !== date);
        } else {
          this.selectedDates.push(date);
        }
        
        this.updateCalendarSelection();
        this.updateSelectedDatesSummary();
      });
    });
  }

  // Atualizar seleção visual do calendário
  updateCalendarSelection() {
    document.querySelectorAll('.calendar-day').forEach(day => {
      const date = day.dataset.date;
      if (this.selectedDates.includes(date)) {
        day.classList.add('selected');
      } else {
        day.classList.remove('selected');
      }
    });
  }

  // Atualizar resumo das datas selecionadas
  updateSelectedDatesSummary() {
    const summary = document.getElementById('selected-dates-summary');
    if (this.selectedDates.length === 0) {
      summary.innerHTML = '<p class="no-dates">Nenhuma data selecionada</p>';
      return;
    }
    
    const sortedDates = this.selectedDates.sort();
    const dateList = sortedDates.map(date => {
      const d = new Date(date + 'T00:00:00'); // Adicionar horário para evitar conversão UTC
      return d.toLocaleDateString('pt-BR', { 
        weekday: 'short', 
        day: '2-digit', 
        month: '2-digit' 
      });
    }).join(', ');
    
    summary.innerHTML = `
      <div class="selected-dates-info">
        <strong>${this.selectedDates.length} data(s) selecionada(s):</strong>
        <div class="dates-list">${dateList}</div>
      </div>
    `;
  }

  // Obter datas selecionadas
  getSelectedDates() {
    return this.selectedDates || [];
  }

  // Atualizar range do calendário baseado nos concursos
  updateCalendarRange() {
    const concursoInicial = parseInt(document.getElementById('concurso_inicial').value);
    const concursoFinal = parseInt(document.getElementById('concurso_final').value);
    
    if (concursoInicial && concursoFinal && concursoFinal >= concursoInicial) {
      const totalConcursos = concursoFinal - concursoInicial + 1;
      const summary = document.getElementById('selected-dates-summary');
      
      if (this.selectedDates.length < totalConcursos) {
        summary.innerHTML += `
          <div class="warning-info">
            <small>⚠️ Você precisa selecionar ${totalConcursos} datas para ${totalConcursos} concursos</small>
          </div>
        `;
      }
    }
  }

  // Gerar concursos alvo com datas
  generateConcursosAlvo(concursoInicial, concursoFinal, selectedDates) {
    const concursos = [];
    const sortedDates = selectedDates.sort();
    
    for (let i = 0; i <= concursoFinal - concursoInicial; i++) {
      const concurso = concursoInicial + i;
      const data = sortedDates[i] || null;
      
      concursos.push({
        numero: concurso,
        data_sorteio: data,
        status: 'pendente'
      });
    }
    
    return concursos;
  }
}
