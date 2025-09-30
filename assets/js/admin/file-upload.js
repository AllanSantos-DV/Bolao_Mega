// Sistema de upload de arquivos para planilhas e comprovantes

export class FileUploadManager {
  constructor() {
    this.supportedFormats = {
      planilhas: ['.xlsx', '.xls', '.csv'],
      comprovantes: ['.pdf']
    };
  }

  // Validar tipo de arquivo
  validateFile(file, type) {
    const errors = [];
    
    if (!file) {
      errors.push('Nenhum arquivo selecionado');
      return { isValid: false, errors };
    }

    const allowedFormats = this.supportedFormats[type];
    if (!allowedFormats) {
      errors.push('Tipo de arquivo não suportado');
      return { isValid: false, errors };
    }

    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedFormats.includes(fileExtension)) {
      errors.push(`Formato não suportado. Use: ${allowedFormats.join(', ')}`);
    }

    // Limite de tamanho (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      errors.push('Arquivo muito grande. Máximo 10MB');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Ler planilha Excel/CSV com múltiplas abas
  async readSpreadsheet(file) {
    const validation = this.validateFile(file, 'planilhas');
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target.result;
          const extension = '.' + file.name.split('.').pop().toLowerCase();
          
          if (extension === '.csv') {
            const jogos = this.parseCSV(data);
            resolve(jogos);
          } else {
            // Para Excel, usar SheetJS (xlsx library) - múltiplas abas
            this.parseExcelMultiSheet(data).then(resolve).catch(reject);
          }
        } catch (error) {
          reject(new Error('Erro ao processar arquivo: ' + error.message));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Erro ao ler arquivo'));
      };
      
      if (file.name.toLowerCase().endsWith('.csv')) {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
  }

  // Parse CSV
  parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      throw new Error('Arquivo CSV vazio');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const bolaColumns = headers.filter(h => h.startsWith('bola'));
    
    if (bolaColumns.length === 0) {
      throw new Error('Nenhuma coluna de bola encontrada (bola 1, bola 2, etc.)');
    }

    const jogos = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const bolas = [];
      
      bolaColumns.forEach(header => {
        const index = headers.indexOf(header);
        if (index >= 0 && values[index]) {
          const numero = parseInt(values[index]);
          if (!isNaN(numero) && numero >= 1 && numero <= 25) {
            bolas.push(numero);
          }
        }
      });
      
      if (bolas.length > 0) {
        jogos.push({ bolas });
      }
    }
    
    if (jogos.length === 0) {
      throw new Error('Nenhum jogo válido encontrado no arquivo');
    }
    
    return jogos;
  }

  // Parse Excel com múltiplas abas (requer biblioteca xlsx)
  async parseExcelMultiSheet(arrayBuffer) {
    // Verificar se a biblioteca xlsx está disponível
    if (typeof XLSX === 'undefined') {
      throw new Error('Biblioteca XLSX não carregada. Adicione: <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>');
    }
    
    try {
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const allJogos = [];
      
      // Processar cada aba da planilha
      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length === 0) {
          continue; // Pular abas vazias
        }
        
        const headers = jsonData[0].map(h => String(h).toLowerCase().trim());
        const bolaColumns = headers.filter(h => h.startsWith('bola'));
        
        if (bolaColumns.length === 0) {
          continue; // Pular abas sem colunas de bola
        }
        
        // Processar jogos desta aba
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          const bolas = [];
          
          bolaColumns.forEach(header => {
            const index = headers.indexOf(header);
            if (index >= 0 && row[index]) {
              const numero = parseInt(row[index]);
              if (!isNaN(numero) && numero >= 1 && numero <= 25) {
                bolas.push(numero);
              }
            }
          });
          
          if (bolas.length > 0) {
            allJogos.push({ 
              bolas,
              aba: sheetName,
              quantidade_numeros: bolas.length
            });
          }
        }
      }
      
      if (allJogos.length === 0) {
        throw new Error('Nenhum jogo válido encontrado na planilha');
      }
      
      return allJogos;
    } catch (error) {
      throw new Error('Erro ao processar planilha Excel: ' + error.message);
    }
  }

  // Upload de comprovante PDF
  async uploadComprovante(file) {
    const validation = this.validateFile(file, 'comprovantes');
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    // Aqui você implementaria o upload para Firebase Storage
    // Por enquanto, retornamos uma URL mock
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        // Simular upload - em produção, usar Firebase Storage
        const mockUrl = `https://storage.googleapis.com/mega-bolao-2025.appspot.com/comprovantes/${Date.now()}_${file.name}`;
        resolve(mockUrl);
      };
      reader.readAsDataURL(file);
    });
  }

  // Gerar template CSV para download
  generateCSVTemplate(numBolas = 15) {
    const headers = [];
    for (let i = 1; i <= numBolas; i++) {
      headers.push(`bola ${i}`);
    }
    
    const csvContent = headers.join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_jogos.csv';
    a.click();
    
    URL.revokeObjectURL(url);
  }

  // Validar jogos extraídos (sem validação de quantidade fixa)
  validateJogos(jogos) {
    const errors = [];
    
    if (!jogos || jogos.length === 0) {
      errors.push('Nenhum jogo encontrado');
      return { isValid: false, errors };
    }
    
    jogos.forEach((jogo, index) => {
      if (!jogo.bolas || jogo.bolas.length === 0) {
        errors.push(`Jogo ${index + 1}: sem bolas`);
        return;
      }
      
      // Verificar duplicatas
      const duplicatas = jogo.bolas.filter((bola, i) => jogo.bolas.indexOf(bola) !== i);
      if (duplicatas.length > 0) {
        errors.push(`Jogo ${index + 1}: números duplicados: ${duplicatas.join(', ')}`);
      }
      
      // Verificar range
      const invalidos = jogo.bolas.filter(bola => bola < 1 || bola > 25);
      if (invalidos.length > 0) {
        errors.push(`Jogo ${index + 1}: números inválidos: ${invalidos.join(', ')}`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Processar e estruturar jogos para o Firestore
  processJogosForFirestore(jogos) {
    const validation = this.validateJogos(jogos);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    // Estruturar jogos para o Firestore - apenas extrair dados da planilha
    const jogosEstruturados = jogos.map((jogo, index) => ({
      id: `jogo_${index + 1}`,
      numero: index + 1,
      bolas: jogo.bolas.sort((a, b) => a - b), // Apenas ordenar bolas
      quantidade_numeros: jogo.quantidade_numeros || jogo.bolas.length,
      aba: jogo.aba || 'principal'
    }));

    return {
      total_jogos: jogosEstruturados.length,
      jogos: jogosEstruturados
    };
  }

  // Calcular estatísticas dos jogos
  calcularEstatisticas(jogos) {
    const todasBolas = jogos.flatMap(jogo => jogo.bolas);
    const frequencia = {};
    
    // Contar frequência de cada número
    todasBolas.forEach(bola => {
      frequencia[bola] = (frequencia[bola] || 0) + 1;
    });

    // Encontrar números mais e menos sorteados
    const numerosOrdenados = Object.entries(frequencia)
      .sort(([,a], [,b]) => b - a);

    return {
      total_numeros: todasBolas.length,
      numeros_unicos: Object.keys(frequencia).length,
      frequencia_numeros: frequencia,
      mais_sorteados: numerosOrdenados.slice(0, 5).map(([numero, freq]) => ({ numero: parseInt(numero), frequencia: freq })),
      menos_sorteados: numerosOrdenados.slice(-5).map(([numero, freq]) => ({ numero: parseInt(numero), frequencia: freq }))
    };
  }

  // Gerar resumo dos jogos para exibição
  gerarResumoJogos(jogosEstruturados) {
    const total = jogosEstruturados.total_jogos;
    const estatisticas = jogosEstruturados.estatisticas;
    
    return {
      resumo: `Total de ${total} jogos processados`,
      detalhes: [
        `Números únicos: ${estatisticas.numeros_unicos}`,
        `Mais sorteados: ${estatisticas.mais_sorteados.map(n => n.numero).join(', ')}`,
        `Menos sorteados: ${estatisticas.menos_sorteados.map(n => n.numero).join(', ')}`
      ]
    };
  }
}
