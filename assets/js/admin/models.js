// Modelos de dados para o sistema administrativo

export class Participante {
  constructor(data = {}) {
    this.id = data.id || null;
    this.nome = data.nome || '';
    this.telefone = data.telefone || '';
    this.chavepix = data.chavepix || '';
    this.participante_responsavel = data.participante_responsavel || null;
    this.created_at = data.created_at || new Date().toISOString();
    this.updated_at = data.updated_at || new Date().toISOString();
  }

  validate() {
    const errors = [];

    // Nome obrigatório e mínimo 3 caracteres
    if (!this.nome || this.nome.trim().length < 3) {
      errors.push('Nome deve ter pelo menos 3 caracteres');
    }

    // Telefone obrigatório se não tiver responsável
    if (!this.participante_responsavel && (!this.telefone || this.telefone.trim().length === 0)) {
      errors.push('Telefone é obrigatório quando não há participante responsável');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  toFirestore() {
    return {
      nome: this.nome.trim(),
      telefone: this.telefone.trim(),
      chavepix: this.chavepix.trim(),
      participante_responsavel: this.participante_responsavel,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  static fromFirestore(id, data) {
    return new Participante({
      id,
      ...data
    });
  }
}

export class Loteria {
  constructor(data = {}) {
    this.id = data.id || null;
    this.nome = data.nome || '';
    this.valor_volante = data.valor_volante || 0;
    this.valor_variavel = data.valor_variavel || false;
    this.modalidade = data.modalidade || '';
    this.numeros_por_jogo = data.numeros_por_jogo || 0;
    this.range_acertos = data.range_acertos || { minimo: 0, maximo: 0 };
    this.acertos = data.acertos || {};
    this.created_at = data.created_at || new Date().toISOString();
    this.updated_at = data.updated_at || new Date().toISOString();
  }

  validate() {
    const errors = [];

    if (!this.nome || this.nome.trim().length === 0) {
      errors.push('Nome da loteria é obrigatório');
    }

    // Se não for valor variável, o valor_volante é obrigatório
    if (!this.valor_variavel && (!this.valor_volante || this.valor_volante <= 0)) {
      errors.push('Valor do volante deve ser maior que zero');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  toFirestore() {
    return {
      nome: this.nome.trim(),
      valor_volante: parseFloat(this.valor_volante),
      valor_variavel: Boolean(this.valor_variavel),
      modalidade: this.modalidade,
      numeros_por_jogo: parseInt(this.numeros_por_jogo),
      range_acertos: this.range_acertos,
      acertos: this.acertos,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  static fromFirestore(id, data) {
    return new Loteria({
      id,
      ...data
    });
  }
}

export class Bolao {
  constructor(data = {}) {
    this.id = data.id || null;
    this.loteria_id = data.loteria_id || '';
    this.nome = data.nome || '';
    this.participantes = data.participantes || [];
    this.cotas = data.cotas || {};
    this.jogos = data.jogos || {
      total_jogos: 0,
      jogos: []
    };
    this.concursos_alvo = data.concursos_alvo || [];
    this.comprovante_url = data.comprovante_url || '';
    this.data_sorteio = data.data_sorteio || '';
    this.status = data.status || 'ativo';
    this.created_at = data.created_at || new Date().toISOString();
    this.updated_at = data.updated_at || new Date().toISOString();
  }

  validate() {
    const errors = [];

    if (!this.loteria_id) {
      errors.push('Loteria é obrigatória');
    }

    if (!this.nome || this.nome.trim().length === 0) {
      errors.push('Nome do bolão é obrigatório');
    }

    if (!this.participantes || this.participantes.length === 0) {
      errors.push('Pelo menos um participante é obrigatório');
    }

    if (!this.jogos || !this.jogos.jogos || this.jogos.jogos.length === 0) {
      errors.push('Pelo menos um jogo é obrigatório');
    }

    if (!this.concursos_alvo || this.concursos_alvo.length === 0) {
      errors.push('Pelo menos um concurso alvo é obrigatório');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  toFirestore() {
    return {
      loteria_id: this.loteria_id,
      nome: this.nome.trim(),
      participantes: this.participantes,
      cotas: this.cotas,
      jogos: this.jogos,
      concursos_alvo: this.concursos_alvo,
      comprovante_url: this.comprovante_url,
      data_sorteio: this.data_sorteio,
      status: this.status,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  static fromFirestore(id, data) {
    return new Bolao({
      id,
      ...data
    });
  }
}

export class Jogo {
  constructor(data = {}) {
    this.bolas = data.bolas || [];
  }

  validate(loteria) {
    const errors = [];

    if (!this.bolas || this.bolas.length === 0) {
      errors.push('Jogo deve ter pelo menos uma bola');
    }

    if (loteria && this.bolas.length !== loteria.numeros_por_jogo) {
      errors.push(`Jogo deve ter exatamente ${loteria.numeros_por_jogo} bolas`);
    }

    // Verificar se todas as bolas são números válidos
    const numerosInvalidos = this.bolas.filter(bola => 
      isNaN(bola) || bola < 1 || bola > 25
    );

    if (numerosInvalidos.length > 0) {
      errors.push('Todas as bolas devem ser números entre 1 e 25');
    }

    // Verificar duplicatas
    const duplicatas = this.bolas.filter((bola, index) => 
      this.bolas.indexOf(bola) !== index
    );

    if (duplicatas.length > 0) {
      errors.push('Não pode haver números duplicados no mesmo jogo');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  toFirestore() {
    return {
      bolas: this.bolas.map(bola => parseInt(bola))
    };
  }

  static fromFirestore(data) {
    return new Jogo(data);
  }
}
