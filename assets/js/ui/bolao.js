import { initFirebase } from '../firebase/init.js';
import { fetchCaixaResultado } from '../api/caixa.js';
import { loadFromLocalCache, saveToLocalCache, checkAndInvalidateCacheIfNeeded, validateConfigAgainstOfficial, checkFirebaseHasData } from '../data/cache.js';
import { extractResultadoArray } from '../domain/loterias.js';

function getQueryParams() {
    const urlParams = new URLSearchParams(window.location.search);
    return { bolaoId: urlParams.get('bolao'), loteria: urlParams.get('loteria') };
}

async function fetchConfig(loteria) {
    try {
        const configUrl = `../loterias/${loteria}/config.json?v=${window.VERSION}`;
        console.log(`📋 Carregando config: ${configUrl}`);
        let response = await fetch(configUrl);
        if (response.ok) return await response.json();
    } catch (_) {}
    return null;
}

function setBasicInfo(config, bolaoConfig) {
    document.title = `${bolaoConfig.nome} - ${config.loteria.modalidade}`;
    const el = (id) => document.getElementById(id);
    el('bolao-nome').textContent = bolaoConfig.nome;
    el('modalidade').textContent = config.loteria.modalidade;
    el('concurso').textContent = bolaoConfig.concurso;
    el('info-modalidade').textContent = config.loteria.modalidade;
    el('info-concurso').textContent = bolaoConfig.concurso;
    el('total-cotas').textContent = bolaoConfig.cotas;
    el('download-planilha').href = `../loterias/${window.LOTERIA}/${encodeURIComponent(bolaoConfig.planilha)}?v=${window.VERSION}`;
    const comprovantesUrl = `../comprovantes/index.html?loteria=${window.LOTERIA}&bolao=${window.BOLAO_ID}&pasta=${bolaoConfig.comprovantes.pasta}`;
        console.log(`📄 Comprovantes: ${comprovantesUrl}`);
    el('download-comprovantes').href = comprovantesUrl;
}

function displayResultado(numeros, tipo = 'config') {
    const statusElement = document.getElementById('status-resultado');
    statusElement.textContent = tipo === 'oficial' ? 'Resultado oficial da Caixa!' : 'Resultado disponível!';
    statusElement.style.color = tipo === 'oficial' ? '#28a745' : '#856404';
    const container = document.getElementById('numeros-sorteados');
    container.innerHTML = '';
    numeros.forEach(n => {
        const div = document.createElement('div');
        div.className = 'numero-sorteado';
        div.textContent = n;
        container.appendChild(div);
    });
}

function displayJogos(jogos) {
    const container = document.getElementById('jogos-grid');
    container.innerHTML = '';
        // console.log(`🎮 Exibindo ${jogos.length} jogos`);
    jogos.forEach((jogo, index) => {
        const div = document.createElement('div');
        div.className = 'jogo-item';
        div.innerHTML = `
            <div class="jogo-header">
                <span class="jogo-numero">Jogo ${index + 1}</span>
                <span class="acertos">- acertos</span>
            </div>
            <div class="numeros">
                ${jogo.map(numero => `<div class=\"numero-jogo\">${numero}</div>`).join('')}
            </div>`;
        container.appendChild(div);
    });
    document.getElementById('loading-jogos').style.display = 'none';
    container.style.display = 'grid';
}

function calcularAcertos(jogos, numerosSorteados) {
    if (!numerosSorteados) return {};
    const acertosPorFaixa = { 15:0, 14:0, 13:0, 12:0, 11:0 };
    jogos.forEach(jogo => {
        const acertos = jogo.filter(n => numerosSorteados.includes(n)).length;
        if (acertos >= 11 && acertos <= 15) acertosPorFaixa[acertos] = (acertosPorFaixa[acertos] || 0) + 1;
    });
    displayAcertos(acertosPorFaixa);
    return acertosPorFaixa;
}

function displayAcertos(acertosPorFaixa) {
    const container = document.getElementById('acertos-grid');
    const section = document.getElementById('acertos-section');
    const title = section.querySelector('h3');
    
    container.innerHTML = '';
    
    // Filtrar apenas faixas com acertos válidos (11-15)
    const acertosValidos = Object.entries(acertosPorFaixa)
        .filter(([, count]) => count > 0)
        .sort((a, b) => parseInt(b[0]) - parseInt(a[0]));
    
    if (acertosValidos.length === 0) {
        // Não há acertos válidos - mostrar mensagem diferente
        title.textContent = '😔 Nenhum Cartão Premiado';
        container.innerHTML = '<div class="no-acertos-message">Nenhum cartão atingiu 11 ou mais acertos</div>';
        section.style.display = 'block';
        return;
    }
    
    // Há acertos válidos - mostrar contagem normal
    title.textContent = '🏆 Contagem de Acertos';
    acertosValidos.forEach(([faixa, count]) => {
        const div = document.createElement('div');
        div.className = 'acerto-item';
        div.dataset.faixa = faixa;
        div.innerHTML = `<div class=\"count\">${count}</div><div class=\"desc\">acertos (${faixa} números)</div>`;
        div.addEventListener('click', () => filtrarJogosPorAcertos(parseInt(faixa)));
        container.appendChild(div);
    });
    
    section.style.display = 'block';
}

function filtrarJogosPorAcertos(faixaAcertos) {
    const jogosItems = document.querySelectorAll('.jogo-item');
    const prev = document.querySelector('.acerto-item.selected');
    if (prev && parseInt(prev.dataset.faixa) === faixaAcertos) {
        prev.classList.remove('selected');
        jogosItems.forEach(item => item.style.display = 'block');
        return;
    }
    document.querySelectorAll('.acerto-item').forEach(i => i.classList.remove('selected'));
    const sel = document.querySelector(`[data-faixa="${faixaAcertos}"]`);
    if (sel) sel.classList.add('selected');
    jogosItems.forEach((item, index) => {
        const jogo = window.jogosAtuais?.[index];
        if (!jogo) return;
        const acertos = jogo.filter(n => window.numerosSorteados.includes(n)).length;
        item.style.display = acertos === faixaAcertos ? 'block' : 'none';
    });
}

function destacarAcertosNosJogos(jogos, numerosSorteados) {
    const jogosItems = document.querySelectorAll('.jogo-item');
    jogosItems.forEach((item, index) => {
        const jogo = jogos[index];
        const numerosDiv = item.querySelector('.numeros');
        const acertosDiv = item.querySelector('.acertos');
        numerosDiv.querySelectorAll('.numero-jogo').forEach(div => div.classList.remove('numero-acertado'));
        const acertos = jogo.filter(n => numerosSorteados.includes(n)).length;
        numerosDiv.querySelectorAll('.numero-jogo').forEach((numDiv, i) => {
            if (numerosSorteados.includes(jogo[i])) numDiv.classList.add('numero-acertado');
        });
        acertosDiv.textContent = `${acertos} acertos`;
        acertosDiv.style.color = acertos >= 11 ? '#28a745' : '#dc3545';
        item.onclick = () => selecionarJogo(index, jogo, numerosSorteados);
    });
}

function selecionarJogo(jogoIndex, jogo, numerosSorteados) {
    document.querySelectorAll('.jogo-item').forEach(i => i.classList.remove('selected'));
    const jogoItem = document.querySelectorAll('.jogo-item')[jogoIndex];
    jogoItem.classList.add('selected');
    const resultadoActions = document.getElementById('resultado-actions');
    resultadoActions.style.display = 'block';
    document.querySelectorAll('.numero-sorteado').forEach(numDiv => numDiv.classList.remove('hit','miss'));
    document.querySelectorAll('.numero-sorteado').forEach(numDiv => {
        const numero = parseInt(numDiv.textContent);
        if (jogo.includes(numero)) numDiv.classList.add('hit'); else numDiv.classList.add('miss');
    });
    const resultadoSection = document.querySelector('.resultado-section');
    resultadoSection.classList.add('fixed');
    document.body.classList.add('resultado-fixo');
}

function limparSelecao() {
    document.querySelectorAll('.jogo-item').forEach(i => i.classList.remove('selected'));
    document.getElementById('resultado-actions').style.display = 'none';
    document.querySelectorAll('.numero-sorteado').forEach(numDiv => numDiv.classList.remove('hit','miss'));
    const resultadoSection = document.querySelector('.resultado-section');
    resultadoSection.classList.remove('fixed');
    document.body.classList.remove('resultado-fixo');
}
window.limparSelecao = limparSelecao;

function extrairNumerosResultado(dadosCaixa) {
    if (!dadosCaixa || !dadosCaixa.listaDezenas) return null;
    return dadosCaixa.listaDezenas.map(n => parseInt(n));
}

function exibirPremiacaoOficial(premiacao, dadosCaixa) {
    const premiacaoSection = document.getElementById('premiacao-oficial-section');
    const premiacaoGrid = document.getElementById('premiacao-grid');
    const premiacaoInfo = document.getElementById('premiacao-info');
    
    if (!premiacaoSection || !premiacaoGrid || !premiacaoInfo) {
        console.warn('Elementos da premiação não encontrados');
        return;
    }
    
    premiacaoSection.style.display = 'block';
    
    if (!Array.isArray(premiacao) || premiacao.length === 0) {
        premiacaoGrid.innerHTML = '<div class="premiacao-item"><div class="premiacao-acertos">Nenhuma premiação disponível</div></div>';
        return;
    }
    
    const premiacaoHTML = premiacao.map(item => {
        // Tratar valores nulos/undefined
        const ganhadores = item.numeroDeGanhadores ?? item.ganhadores ?? 0;
        const valorPremio = item.valorPremio ?? item.valor ?? 0;
        const descricaoFaixa = item.descricaoFaixa ?? item.acertos ?? 'N/A';
        
        // Texto para ganhadores
        let ganhadoresText;
        if (ganhadores === 0 || ganhadores === null || ganhadores === undefined) {
            ganhadoresText = 'Acumulado';
        } else {
            ganhadoresText = `${Number(ganhadores).toLocaleString('pt-BR')} ganhadores`;
        }
        
        // Formatar valor do prêmio
        const valorFormatado = Number(valorPremio).toLocaleString('pt-BR', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        });
        
        return `
        <div class="premiacao-item">
            <div class="premiacao-acertos">${descricaoFaixa}</div>
            <div class="premiacao-valor">R$ ${valorFormatado}</div>
            <div class="premiacao-ganhadores">${ganhadoresText}</div>
        </div>`;
    }).join('');
    
    premiacaoGrid.innerHTML = premiacaoHTML;
    
    // Informações adicionais
    if (dadosCaixa && dadosCaixa.numero) {
        const numero = dadosCaixa.numero;
        const data = dadosCaixa.dataApuracao || '-';
        const arrecadado = dadosCaixa.valorArrecadado ? 
            `R$ ${Number(dadosCaixa.valorArrecadado).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 
            '-';
            
        premiacaoInfo.innerHTML = `
            <strong>Concurso:</strong> ${numero} | 
            <strong>Data:</strong> ${data} | 
            <strong>Arrecadado:</strong> ${arrecadado}
        `;
    }
}

function premiacaoToMap(premiacao) {
    const map = {};
    if (!Array.isArray(premiacao)) return map;
    premiacao.forEach(item => {
        const desc = (item.descricaoFaixa || item.acertos || '').toString();
        const match = desc.match(/(\d{1,2})/);
        const faixa = match ? parseInt(match[1]) : (typeof item.acertos === 'number' ? item.acertos : null);
        if (!faixa) return;
        const valor = typeof item.valorPremio === 'number' ? item.valorPremio : (typeof item.valor === 'number' ? item.valor : null);
        if (valor != null) map[faixa] = valor;
    });
    return map;
}

function renderGanhos(acertosPorFaixa, premiacaoMap, totalCotas) {
    try {
        if (!acertosPorFaixa || !premiacaoMap) return;
        const sec = document.getElementById('ganhos-section');
        const grid = document.getElementById('ganhos-grid');
        const totalEl = document.getElementById('ganhos-total');
        if (!sec || !grid || !totalEl) return;
        let total = 0;
        const rows = [];
        [15,14,13,12,11].forEach(faixa => {
            const qtd = acertosPorFaixa[faixa] || 0;
            if (qtd === 0) return; // só mostra faixas com acertos
            const valorFaixa = premiacaoMap[faixa] || 0;
            const ganhoFaixa = qtd * valorFaixa;
            total += ganhoFaixa;
            rows.push(`<div class=\"ganho-item\"><div class=\"ganho-acertos\">${faixa} acertos</div><div class=\"ganho-valor\">${qtd} x R$ ${valorFaixa.toLocaleString('pt-BR',{minimumFractionDigits:2, maximumFractionDigits:2})} = R$ ${ganhoFaixa.toLocaleString('pt-BR',{minimumFractionDigits:2, maximumFractionDigits:2})}</div></div>`);
        });
        if (rows.length === 0) return; // não mostra seção se não há acertos
        grid.innerHTML = rows.join('');
        const porCota = totalCotas ? Math.floor(total / Number(totalCotas) * 100) / 100 : 0; // round para baixo
        totalEl.innerHTML = `<strong>Total:</strong> R$ ${total.toLocaleString('pt-BR',{minimumFractionDigits:2, maximumFractionDigits:2})} | <strong>Por cota:</strong> R$ ${porCota.toLocaleString('pt-BR',{minimumFractionDigits:2, maximumFractionDigits:2})}`;
        sec.style.display = 'block';
    } catch (_) {}
}

async function loadJogos(bolaoConfig) {
    try {
        const planilhaUrl = `../loterias/${window.LOTERIA}/${encodeURIComponent(bolaoConfig.planilha)}?v=${window.VERSION}`;
        console.log(`📊 Carregando planilha: ${planilhaUrl}`);
        const response = await fetch(planilhaUrl);
        if (!response.ok) throw new Error(`Planilha não encontrada: ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        const workbook = window.XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = window.XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        const jogos = [];
        for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (row && row.length >= 15) {
                const numeros = row.filter(cell => typeof cell === 'number' && cell >= 1 && cell <= 25);
                if (numeros.length === 15) {
                    jogos.push(numeros);
                    // console.log(`✅ Jogo ${jogos.length} adicionado:`, numeros);
                }
            }
        }
        if (jogos.length === 0) throw new Error('Nenhum jogo válido encontrado na planilha');
        // console.log(`🎯 Total de jogos carregados: ${jogos.length}`);
        displayJogos(jogos);
        document.getElementById('total-jogos').textContent = jogos.length;
        window.jogosAtuais = jogos;
    } catch (error) {
        console.error('Erro ao carregar jogos:', error);
        
        // Mostrar erro na interface
        const container = document.getElementById('jogos-grid');
        container.innerHTML = `
            <div class="error-message">
                <h4>❌ Erro ao carregar planilha</h4>
                <p><strong>Arquivo:</strong> ${bolaoConfig.planilha}</p>
                <p><strong>Erro:</strong> ${error.message}</p>
                <p><strong>Solução:</strong> Verifique se o arquivo existe e está acessível</p>
            </div>
        `;
        
        document.getElementById('loading-jogos').style.display = 'none';
        container.style.display = 'grid';
        document.getElementById('total-jogos').textContent = '0';
        window.jogosAtuais = [];
    }
}

async function obterResultado(loteria, concurso) {
    // Verificar se precisa invalidar cache devido a mudanças no config
    await checkAndInvalidateCacheIfNeeded(loteria, concurso);
    
    // SEMPRE tentar buscar resultado oficial primeiro (prioridade máxima)
    try {
        console.log(`🎯 Buscando resultado oficial para ${loteria}/${concurso}`);
        const resOficial = await fetchCaixaResultado(loteria, concurso);
        if (resOficial.ok && resOficial.data) {
            const oficialResultado = extractResultadoArray(resOficial.data);
            if (Array.isArray(oficialResultado) && oficialResultado.length > 0) {
                console.log(`✅ Resultado oficial encontrado para ${loteria}/${concurso}`);
                await saveToLocalCache(resOficial.data, loteria, concurso, 'caixa-api');
                return resOficial.data;
            }
        } else {
            console.log(`⚠️ API falhou para ${loteria}/${concurso} - status: ${resOficial?.status || 'erro'}`);
        }
    } catch (error) {
        console.log(`❌ Erro na API para ${loteria}/${concurso}:`, error.message);
    }
    
    // Se não conseguiu resultado oficial, usar cache
    const cache = loadFromLocalCache(loteria, concurso, 24*60*60*1000);
    if (cache) {
        // Verificar se o cache é do Firebase ou da API (prioridade alta)
        if (cache.origem === 'firebase' || cache.origem === 'caixa-api') {
            console.log(`📦 Usando cache ${cache.origem} para ${loteria}/${concurso}`);
            return cache;
        }
        
        // Sem fallback - apenas dados reais
        return null;
    }
    
    console.log(`❌ Nenhum resultado disponível para ${loteria}/${concurso}`);
    return null;
}

export async function bootstrapBolao() {
    window.BOLAO_ID = null; window.LOTERIA = null;
    const { bolaoId, loteria } = getQueryParams();
    window.BOLAO_ID = bolaoId; window.LOTERIA = loteria;
    if (!bolaoId || !loteria) {
        document.querySelector('.content').innerHTML = '<div class=\"error\">Parâmetros inválidos. Use: ?loteria=nome&bolao=id</div>';
        return;
    }
    // Remover chamada desnecessária ao Firebase
    // await initFirebase().catch(()=>{});
    const config = await fetchConfig(loteria);
    if (!config) { document.querySelector('.content').innerHTML = '<div class=\"error\">Erro ao carregar configuração do bolão</div>'; return; }
    const bolaoConfig = config.boloes[bolaoId];
    if (!bolaoConfig) { document.querySelector('.content').innerHTML = '<div class=\"error\">Bolão não encontrado no config</div>'; return; }
    window.configAtual = config; window.bolaoConfigAtual = bolaoConfig;
    setBasicInfo(config, bolaoConfig);
    await loadJogos(bolaoConfig);
    const cacheObj = loadFromLocalCache(loteria, bolaoConfig.concurso, 24*60*60*1000);
    let numeros = null;
    let premiacaoAtual = null;
    
    // Se há resultado no config, validar contra o oficial APENAS se Firebase não tiver dados
    if (bolaoConfig.resultado && Array.isArray(bolaoConfig.resultado) && bolaoConfig.resultado.length > 0) {
        const firebaseHasData = await checkFirebaseHasData(loteria, bolaoConfig.concurso);
        if (!firebaseHasData) {
            console.log(`🔍 Validando resultado do config contra oficial para ${loteria}/${bolaoConfig.concurso}`);
            const validacao = await validateConfigAgainstOfficial(loteria, bolaoConfig.concurso, bolaoConfig.resultado);
            
            if (validacao.valid === false) {
                console.warn(`⚠️ ATENÇÃO: Resultado do config não confere com o oficial!`);
                console.log(`Config: [${validacao.config.join(',')}]`);
                console.log(`Oficial: [${validacao.oficial.join(',')}]`);
            }
        } else {
            console.log(`ℹ️ Firebase tem dados para ${loteria}/${bolaoConfig.concurso} - pulando validação do config`);
        }
    }
    
    if (cacheObj && Array.isArray(cacheObj.resultado) && cacheObj.resultado.length > 0) {
        numeros = cacheObj.resultado;
        displayResultado(numeros, cacheObj.fonte === 'firebase' || cacheObj.fonte === 'caixa-api' ? 'oficial' : 'config');
        if (Array.isArray(cacheObj.premiacao) && cacheObj.premiacao.length > 0) {
            premiacaoAtual = cacheObj.premiacao;
            exibirPremiacaoOficial(premiacaoAtual, {
                numero: cacheObj.numero || bolaoConfig.concurso,
                dataApuracao: cacheObj.dataApuracao,
                valorArrecadado: cacheObj.valorArrecadado
            });
        }
    } else {
        const dadosCaixa = await obterResultado(loteria, bolaoConfig.concurso);
        if (dadosCaixa) {
            const nums = extrairNumerosResultado(dadosCaixa);
            if (nums && nums.length > 0) {
                numeros = nums;
                displayResultado(numeros, 'oficial');
                const prem = dadosCaixa.listaRateioPremio || [];
                if (prem.length > 0) { premiacaoAtual = prem; exibirPremiacaoOficial(prem, dadosCaixa); }
            }
        }
    }
    
    // Usar config APENAS se não conseguiu resultado de outras fontes E Firebase não tem dados
    if (!numeros) {
        const firebaseHasData = await checkFirebaseHasData(loteria, bolaoConfig.concurso);
        if (!firebaseHasData && bolaoConfig.resultado && bolaoConfig.resultado.length > 0) {
            console.log(`📄 Usando resultado do config para ${loteria}/${bolaoConfig.concurso} (Firebase não tem dados)`);
            numeros = bolaoConfig.resultado;
            displayResultado(numeros, 'config');
        } else if (firebaseHasData) {
            console.log(`ℹ️ Firebase tem dados para ${loteria}/${bolaoConfig.concurso} - ignorando config`);
        }
    }
    if (numeros && window.jogosAtuais) {
        window.numerosSorteados = numeros;
        const acertos = calcularAcertos(window.jogosAtuais, numeros);
        destacarAcertosNosJogos(window.jogosAtuais, numeros);
        if (!premiacaoAtual && cacheObj && Array.isArray(cacheObj.premiacao)) premiacaoAtual = cacheObj.premiacao;
        // Merge de premiação: valores fixos do config (11-13) + API + pagosExtras (14/15) do cache
        const fixed = (config && config.loteria && config.loteria.acertos) ? config.loteria.acertos : {};
        const fixedMap = {};
        ['11','12','13'].forEach(k => {
            const v = Number(fixed[k]);
            if (!Number.isNaN(v)) fixedMap[Number(k)] = v;
        });
        const apiMap = premiacaoToMap(premiacaoAtual || []);
        const mergedMap = { ...fixedMap, ...apiMap };
        if (cacheObj && cacheObj.pagosExtras) {
            const extras = cacheObj.pagosExtras;
            if (extras[14] != null && !Number.isNaN(Number(extras[14]))) mergedMap[14] = Number(extras[14]);
            if (extras[15] != null && !Number.isNaN(Number(extras[15]))) mergedMap[15] = Number(extras[15]);
        }
        renderGanhos(acertos, mergedMap, bolaoConfig.cotas);
    }
}


