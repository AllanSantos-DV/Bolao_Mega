// Módulo de validação aprimorado com sanitização
// Complementa as validações server-side do Firestore

export class ValidationUtils {

  // Sanitiza string removendo caracteres perigosos
  static sanitizeString(str, maxLength = 100) {
    if (typeof str !== 'string') return '';

    // Remove caracteres potencialmente perigosos
    let sanitized = str
      .replace(/[<>]/g, '') // Remove < e >
      .replace(/javascript:/gi, '') // Remove javascript:
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();

    // Limita tamanho
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength).trim();
    }

    return sanitized;
  }

  // Valida nome (mín 3, máx 100 caracteres)
  static validateNome(nome) {
    const sanitized = this.sanitizeString(nome, 100);

    if (sanitized.length < 3) {
      return { valid: false, error: 'Nome deve ter pelo menos 3 caracteres' };
    }

    if (sanitized.length > 100) {
      return { valid: false, error: 'Nome não pode ter mais de 100 caracteres' };
    }

    return { valid: true, value: sanitized };
  }

  // Valida telefone (formato brasileiro opcional)
  static validateTelefone(telefone) {
    if (!telefone) return { valid: true, value: '' };

    const sanitized = this.sanitizeString(telefone, 20);

    // Remove tudo que não for número
    const numbersOnly = sanitized.replace(/\D/g, '');

    // Valida tamanho (10 ou 11 dígitos para Brasil)
    if (numbersOnly.length < 10 || numbersOnly.length > 11) {
      return { valid: false, error: 'Telefone deve ter 10 ou 11 dígitos' };
    }

    return { valid: true, value: numbersOnly };
  }

  // Valida chave PIX (email, telefone ou CPF/CNPJ)
  static validateChavePix(chavePix) {
    if (!chavePix) return { valid: true, value: '' };

    const sanitized = this.sanitizeString(chavePix, 100);

    // Validações básicas
    if (sanitized.length < 3) {
      return { valid: false, error: 'Chave PIX deve ter pelo menos 3 caracteres' };
    }

    // Valida email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (sanitized.includes('@')) {
      if (!emailRegex.test(sanitized)) {
        return { valid: false, error: 'Formato de email inválido' };
      }
    }

    // Valida CPF/CNPJ (se for apenas números)
    const numbersOnly = sanitized.replace(/\D/g, '');
    if (numbersOnly.length === 11 || numbersOnly.length === 14) {
      if (!this.validateCpfCnpj(numbersOnly)) {
        return { valid: false, error: 'CPF ou CNPJ inválido' };
      }
    }

    // Valida telefone (se for apenas números)
    if (numbersOnly.length >= 10 && numbersOnly.length <= 11) {
      if (!this.validateTelefoneFormat(numbersOnly)) {
        return { valid: false, error: 'Formato de telefone inválido' };
      }
    }

    return { valid: true, value: sanitized };
  }

  // Valida CPF ou CNPJ
  static validateCpfCnpj(value) {
    const numbers = value.replace(/\D/g, '');

    if (numbers.length === 11) {
      return this.validateCpf(numbers);
    } else if (numbers.length === 14) {
      return this.validateCnpj(numbers);
    }

    return false;
  }

  // Valida CPF
  static validateCpf(cpf) {
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }

    let digit1 = 11 - (sum % 11);
    if (digit1 >= 10) digit1 = 0;

    if (parseInt(cpf.charAt(9)) !== digit1) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }

    let digit2 = 11 - (sum % 11);
    if (digit2 >= 10) digit2 = 0;

    return parseInt(cpf.charAt(10)) === digit2;
  }

  // Valida CNPJ
  static validateCnpj(cnpj) {
    if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;

    let sum = 0;
    let pos = 0;

    // Primeiro dígito
    for (let i = 0; i < 12; i++) {
      const multiplier = (i < 4) ? 5 - i : 13 - i;
      sum += parseInt(cnpj.charAt(i)) * multiplier;
    }

    let digit1 = 11 - (sum % 11);
    if (digit1 >= 10) digit1 = 0;

    if (parseInt(cnpj.charAt(12)) !== digit1) return false;

    // Segundo dígito
    sum = 0;
    for (let i = 0; i < 13; i++) {
      const multiplier = (i < 5) ? 6 - i : 14 - i;
      sum += parseInt(cnpj.charAt(i)) * multiplier;
    }

    let digit2 = 11 - (sum % 11);
    if (digit2 >= 10) digit2 = 0;

    return parseInt(cnpj.charAt(13)) === digit2;
  }

  // Valida formato de telefone
  static validateTelefoneFormat(telefone) {
    // Deve ter 10 ou 11 dígitos
    return telefone.length >= 10 && telefone.length <= 11;
  }

  // Valida dados completos de participante
  static validateParticipanteData(data) {
    const errors = [];

    // Valida nome
    const nomeResult = this.validateNome(data.nome);
    if (!nomeResult.valid) {
      errors.push(nomeResult.error);
    } else {
      data.nome = nomeResult.value;
    }

    // Valida telefone (se fornecido)
    if (data.telefone) {
      const telefoneResult = this.validateTelefone(data.telefone);
      if (!telefoneResult.valid) {
        errors.push(telefoneResult.error);
      } else {
        data.telefone = telefoneResult.value;
      }
    }

    // Valida chave PIX (se fornecida)
    if (data.chavepix) {
      const chavePixResult = this.validateChavePix(data.chavepix);
      if (!chavePixResult.valid) {
        errors.push(chavePixResult.error);
      } else {
        data.chavepix = chavePixResult.value;
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitizedData: data
    };
  }

  // Valida dados de loteria
  static validateLoteriaData(data) {
    const errors = [];

    // Valida nome
    const nomeResult = this.validateNome(data.nome);
    if (!nomeResult.valid) {
      errors.push(nomeResult.error);
    } else {
      data.nome = nomeResult.value;
    }

    // Valida modalidade
    if (!data.modalidade || data.modalidade.trim().length === 0) {
      errors.push('Modalidade é obrigatória');
    }

    // Valida números por jogo
    if (!data.numeros_por_jogo || data.numeros_por_jogo < 1) {
      errors.push('Número de números por jogo deve ser maior que zero');
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitizedData: data
    };
  }

  // Valida dados de bolão
  static validateBolaoData(data) {
    const errors = [];

    // Valida nome
    const nomeResult = this.validateNome(data.nome);
    if (!nomeResult.valid) {
      errors.push(nomeResult.error);
    } else {
      data.nome = nomeResult.value;
    }

    // Valida loteria_id
    if (!data.loteria_id || data.loteria_id.trim().length === 0) {
      errors.push('Loteria é obrigatória');
    }

    // Valida participantes (se fornecidos)
    if (data.participantes && !Array.isArray(data.participantes)) {
      errors.push('Participantes deve ser uma lista');
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitizedData: data
    };
  }
}
