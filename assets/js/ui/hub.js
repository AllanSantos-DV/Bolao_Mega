import { fetchCaixaResultado } from '../api/caixa.js';
import { loadFromLocalCache, saveToLocalCache } from '../data/cache.js';
import { extractResultadoArray } from '../domain/loterias.js';
import { initFirebase } from '../firebase/init.js';
let LOTERIAS = [];
const CACHE_DURATION = 24 * 60 * 60 * 1000;
export async function bootstrapHub() {
    await carregarManifesto();
    await carregarLoterias();
    renderCacheCard();
    renderValidationCard();
    if (verificarPermissaoAdmin()) {
        mostrarControleCache();
        // Eventos agora são ligados dentro dos próprios cards renderizados
    }
}

async function carregarManifesto() {
    try {
        const res = await fetch(`./loterias/index.json?v=${window.VERSION}`);
        if (res.ok) { LOTERIAS = await res.json(); }
        else { LOTERIAS = []; }
    } catch (_) { LOTERIAS = []; }
}

async function verificarLoteria(loteria) {
    try {
        const response = await fetch(`./loterias/${loteria}/config.json?v=${window.VERSION}`);
        if (response.ok) {
            const config = await response.json();
            return { nome: loteria, config };
        }
        return null;
    } catch (_) { return null; }
}

async function verificarResultado(loteria) {
    try {
        const response = await fetch(`./loterias/${loteria}/config.json?v=${window.VERSION}`);
        if (response.ok) {
            const config = await response.json();
            const statusBoloes = {};
            for (const bolaoId in config.boloes) {
                const bolao = config.boloes[bolaoId];
                statusBoloes[bolaoId] = bolao.resultado && bolao.resultado.length > 0 ? 'disponivel' : 'aguardando';
            }
            return statusBoloes;
        }
        return {};
    } catch (_) { return {}; }
}

function atualizarStatusBolao(loteriaNome, concurso, disponivel) {
    try {
        const entries = Object.entries(window.configLoterias?.[loteriaNome]?.boloes || {});
        for (const [id, bolao] of entries) {
            if (String(bolao.concurso) !== String(concurso)) continue;
            const el = document.getElementById(`status-${loteriaNome}-${id}`);
            if (!el) continue;
            if (disponivel) {
                el.textContent = 'Resultado disponível';
                el.className = 'bolao-status status-disponivel';
            } else {
                el.textContent = 'Aguardando resultado';
                el.className = 'bolao-status status-aguardando';
            }
        }
    } catch (_) { }
}

function criarCardLoteria(loteriaData, statusBoloes = {}) {
    const { nome, config } = loteriaData;
    const loteria = config.loteria;
    const card = document.createElement('div');
    card.className = 'loteria-card';
    const boloesHTML = Object.entries(config.boloes).map(([id, bolao]) => {
        const status = statusBoloes[id] || 'aguardando';
        const statusText = status === 'disponivel' ? 'Resultado disponível' : 'Aguardando resultado';
        const statusClass = status === 'disponivel' ? 'status-disponivel' : 'status-aguardando';
        return `
                <div class="bolao-item">
                    <div class="bolao-header">
                        <div class="bolao-nome">${bolao.nome}</div>
                        <div class="bolao-status ${statusClass}" id="status-${nome}-${id}">
                            ${statusText}
                        </div>
                    </div>
                    <div class="bolao-info">
                        <div class="bolao-info-item"><strong>Cotas:</strong> ${bolao.cotas}</div>
                        <div class="bolao-info-item"><strong>Modalidade:</strong> ${loteria.modalidade}</div>
                        <div class="bolao-info-item"><strong>Concurso:</strong> ${bolao.concurso}</div>
                        <div class="bolao-info-item"><strong>Data:</strong> ${bolao.data_sorteio}</div>
                        <div class="bolao-info-item"><strong>Números:</strong> ${loteria.numeros_por_jogo}</div>
                    </div>
                    <a href="./bolao-template.html?loteria=${nome}&bolao=${id}" class="bolao-link" target="_blank">Acessar Bolão</a>
                </div>
            `;
    }).join('');
    card.innerHTML = `
                <h3>${loteria.modalidade}</h3>
                <div class="loteria-info">
                    <div class="info-item"><span class="info-label">Números por jogo:</span><span class="info-value">${loteria.numeros_por_jogo}</span></div>
                    <div class="info-item"><span class="info-label">Range de acertos:</span><span class="info-value">${loteria.range_acertos.minimo}-${loteria.range_acertos.maximo}</span></div>
                    <div class="info-item"><span class="info-label">Total de bolões:</span><span class="info-value">${Object.keys(config.boloes).length}</span></div>
                </div>
                <div class="boloes-list"><h4>Bolões Disponíveis</h4>${boloesHTML}</div>
            `;
    return card;
}

async function carregarLoterias() {
    const container = document.getElementById('loterias-container');
    const loading = document.getElementById('loading');
    try {
        const loteriasEncontradas = [];
        for (const loteria of LOTERIAS) {
            const loteriaData = await verificarLoteria(loteria);
            if (loteriaData) loteriasEncontradas.push(loteriaData);
        }
        window.configLoterias = {};
        for (const loteriaData of loteriasEncontradas) {
            window.configLoterias[loteriaData.nome] = loteriaData.config;
        }
        if (loteriasEncontradas.length === 0) {
            container.innerHTML = `<div class="empty-state"><h3>Nenhuma loteria encontrada</h3><p>Adicione arquivos de configuração nas pastas das loterias para visualizá-las aqui.</p></div>`;
        } else {
            container.innerHTML = '';
            for (const loteriaData of loteriasEncontradas) {
                const statusBoloes = await verificarResultado(loteriaData.nome);
                const card = criarCardLoteria(loteriaData, statusBoloes);
                container.appendChild(card);
            }
        }
        loading.style.display = 'none';
        container.style.display = 'block';
    } catch (e) {
        console.error('Erro ao carregar loterias:', e);
        loading.innerHTML = `<div class="error">Erro ao carregar loterias. Verifique se os arquivos de configuração estão corretos.</div>`;
    }
}

function mostrarControleCache() {
    // Mantém o partial oculto; os controles são renderizados dentro do card de cache
    const cacheControl = document.getElementById('cache-control');
    if (cacheControl) cacheControl.style.display = 'none';
    atualizarStatusCacheHub();
}

function atualizarStatusCacheHub() {
    const cacheStatus = document.getElementById('cache-status-hub');
    if (!cacheStatus) return;
    const cacheKeys = Object.keys(localStorage).filter(key => key.includes('caixa_api_cache'));
    if (cacheKeys.length > 0) {
        cacheStatus.innerHTML = `📦 Cache ativo para ${cacheKeys.length} loteria(s)`;
        cacheStatus.className = 'cache-status';
    } else {
        cacheStatus.innerHTML = '❌ Nenhum cache encontrado';
        cacheStatus.className = 'cache-status';
    }
}

function verificarPermissaoAdmin() { return true; }

function obterLoteriasDisponiveis() {
    const entries = Object.entries(window.configLoterias || {});
    return entries.map(([nome, config]) => ({ nome, config }));
}

async function obterConcursosDaLoteria(loteriaNome) {
    const config = window.configLoterias?.[loteriaNome];
    if (!config || !config.boloes) return [];
    return Object.values(config.boloes)
        .map(b => b.concurso)
        .filter(Boolean);
}

function limparCacheCompleto() {
    if (!confirm('⚠️ Tem certeza que deseja limpar TODO o cache?')) return;
    Object.keys(localStorage).forEach(key => { if (key.includes('caixa_api_cache')) localStorage.removeItem(key); });
    alert('✅ Cache limpo com sucesso!');
    renderCacheCard();
    location.reload();
}

function atualizarCacheLoterias() {
    if (!confirm('🔄 Atualizar cache de todas as loterias?')) return;
    Object.keys(localStorage).forEach(key => { if (key.includes('caixa_api_cache')) localStorage.removeItem(key); });
    alert('✅ Cache atualizado!');
    renderCacheCard();
    location.reload();
}

async function validarTodosConcursos() {
    const statusDiv = document.getElementById('validation-status');
    const btn = document.getElementById('validation-btn-validar');
    if (!statusDiv) return;
    // manter área estável para evitar "pulo" na UI
    statusDiv.style.minHeight = '120px';
    if (btn) { btn.disabled = true; btn.style.opacity = '0.7'; btn.style.pointerEvents = 'none'; }
    statusDiv.innerHTML = `<div class=\"result\">🔄 Iniciando validação de todos os concursos...</div>`;
    try {
        const loterias = await obterLoteriasDisponiveis();
        const firebase = await initFirebase().catch(() => null);
        const db = firebase?.db || null;
        const { doc, getDoc, setDoc, serverTimestamp } = db ? await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js') : { };
        let totalValidados = 0, totalErros = 0, totalSemDados = 0;
        let viaCache = 0, viaFirebase = 0, viaApi = 0, viaConfig = 0;

        for (const lot of loterias) {
            const concursos = await obterConcursosDaLoteria(lot.nome);
            for (const concurso of concursos) {
                try {
                    // 1) Cache
                    const cached = loadFromLocalCache(lot.nome, concurso, CACHE_DURATION);
                    if (cached) { atualizarStatusBolao(lot.nome, concurso, true); totalValidados++; viaCache++; continue; }

                    // 2) Firebase
                    let dadosFirebase = null;
                    if (db && doc && getDoc) {
                        try {
                            const ref = doc(db, 'loterias', lot.nome, 'concursos', String(concurso));
                            const snap = await getDoc(ref);
                            if (snap.exists()) {
                                const data = snap.data();
                                const numeros = extractResultadoArray(data);
                                if (Array.isArray(numeros) && numeros.length > 0) {
                                    await saveToLocalCache({ ...data, fonte: 'firebase' }, lot.nome, concurso, 'firebase');
                                    atualizarStatusBolao(lot.nome, concurso, true);
                                    totalValidados++; viaFirebase++;
                                    continue;
                                }
                            }
                        } catch (_) { /* ignora erro de leitura */ }
                    }

                    // 3) API da Caixa
                    let dadosApi = null;
                    try {
                        const res = await fetchCaixaResultado(lot.nome, concurso);
                        if (res?.ok && res.data) {
                            dadosApi = res.data;
                            await saveToLocalCache(dadosApi, lot.nome, concurso, 'api');
                            if (db && doc && setDoc) {
                                try {
                                    const ref = doc(db, 'loterias', lot.nome, 'concursos', String(concurso));
                                    const numeros = extractResultadoArray(dadosApi);
                                    const payload = {
                                        numero: dadosApi.numero || Number(concurso),
                                        resultado: numeros,
                                        dataApuracao: dadosApi.dataApuracao || null,
                                        valorArrecadado: dadosApi.valorArrecadado || null,
                                        premiacao: Array.isArray(dadosApi.listaRateioPremio) ? dadosApi.listaRateioPremio.map(p => ({
                                            descricaoFaixa: p.descricaoFaixa ?? p.acertos,
                                            valorPremio: p.valorPremio ?? p.valor,
                                            numeroDeGanhadores: p.numeroDeGanhadores ?? p.ganhadores
                                        })) : [],
                                        // enriquecimento adicional: valores pagos práticos 14/15 se vierem da API (Lotofácil)
                                        pagosExtras: {
                                            15: Array.isArray(dadosApi.listaRateioPremio) ? (dadosApi.listaRateioPremio.find(x => (x.descricaoFaixa||'').includes('15') || x.acertos === 15)?.valorPremio ?? null) : null,
                                            14: Array.isArray(dadosApi.listaRateioPremio) ? (dadosApi.listaRateioPremio.find(x => (x.descricaoFaixa||'').includes('14') || x.acertos === 14)?.valorPremio ?? null) : null
                                        },
                                        fonte: 'caixa-api',
                                        updatedAt: Date.now()
                                    };
                                    await setDoc(ref, payload, { merge: true });
                                } catch (_) { /* pode falhar por regras de escrita */ }
                            }
                            atualizarStatusBolao(lot.nome, concurso, true);
                            totalValidados++; viaApi++;
                            continue;
                        }
                    } catch (_) { /* segue para fallback */ }

                    // 4) Fallback do config
                    const bolaoId = Object.keys(lot.config?.boloes || {}).find(id => String(lot.config.boloes[id]?.concurso) === String(concurso));
                    const cfg = bolaoId ? lot.config.boloes[bolaoId] : null;
                    const numerosCfg = cfg ? extractResultadoArray(cfg) : null;
                    if (Array.isArray(numerosCfg) && numerosCfg.length > 0) {
                        await saveToLocalCache({ resultado: numerosCfg }, lot.nome, concurso, 'config-fallback');
                        atualizarStatusBolao(lot.nome, concurso, true);
                        totalValidados++; viaConfig++;
                    } else {
                        atualizarStatusBolao(lot.nome, concurso, false);
                        totalSemDados++;
                    }
                } catch (_) {
                    totalErros++;
                }
            }
        }
        statusDiv.innerHTML = `<div class=\"result\"><strong>✅ Validação concluída!</strong><br/>✅ Validados: ${totalValidados}<br/>❌ Erros: ${totalErros}<br/>📭 Sem dados: ${totalSemDados}<br/><br/><strong>Origens:</strong><br/>• Cache: ${viaCache}<br/>• Firebase: ${viaFirebase}<br/>• API: ${viaApi}<br/>• Config: ${viaConfig}</div>`;
        renderCacheCard();
    } catch (_) {
        statusDiv.innerHTML = `<div class=\"result\">❌ Erro na validação.</div>`;
    } finally {
        if (btn) { btn.disabled = false; btn.style.opacity = ''; btn.style.pointerEvents = ''; }
    }
}

function formatMsAge(ms) {
    const sec = Math.floor(ms / 1000);
    if (sec < 60) return `${sec}s`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h`;
    const d = Math.floor(hr / 24);
    return `${d}d`;
}

function renderCacheCard() {
    try {
        const content = document.querySelector('.content');
        if (!content) return;
        // sempre recriar o card para evitar cache do DOM
        const existingCard = document.getElementById('cache-card');
        if (existingCard) existingCard.remove();
        const card = document.createElement('div');
        card.id = 'cache-card';
        card.className = 'loteria-card';
        // posicionar SEM mover o card de validação
        const validationCard = document.getElementById('validation-card');
        if (validationCard && validationCard.parentNode === content) {
            validationCard.insertAdjacentElement('afterend', card);
        } else {
            content.insertBefore(card, content.firstChild);
        }
        const keys = Object.keys(localStorage).filter(k => k.startsWith('caixa_api_cache_'));
        const hasItems = keys.length > 0;
        const rows = [];
        const now = Date.now();
        for (const key of keys) {
            try {
                const item = JSON.parse(localStorage.getItem(key));
                const loteria = item?.loteria || '-';
                const concurso = item?.concurso || '-';
                const origem = item?.origem || 'desconhecida';
                const ts = item?.timestamp ? new Date(item.timestamp) : null;
                const age = ts ? formatMsAge(now - item.timestamp) : '-';
                const numeros = Array.isArray(item?.resultado) ? item.resultado.map(n => String(n).padStart(2, '0')).join(', ') : '-';
                rows.push(`<div class="info-item"><span class="info-label">${loteria} #${concurso}</span><span class="info-value">${origem} • ${age} atrás</span></div>`);
                rows.push(`<div class="info-item"><span class="info-label">Números</span><span class="info-value">${numeros}</span></div>`);
            } catch (_) {}
        }
        card.innerHTML = `
            <h3>🧠 Cache de Resultados</h3>
            <div class="loteria-info">
                <div class="info-item"><span class="info-label">Itens em cache:</span><span class="info-value">${keys.length}</span></div>
                <div class="cache-status" id="cache-status-hub"></div>
            </div>
            <div class="cache-actions" style="margin:8px 0; display:flex; gap:8px; flex-wrap:wrap; justify-content:center;">
                <button id="cache-btn-limpar" class="btn-cache">🗑️ Limpar Cache Completo</button>
                <button id="cache-btn-atualizar" class="btn-cache">🔄 Atualizar Cache das Loterias</button>
            </div>
            ${hasItems ? `<div class=\"boloes-list\"><h4>Entradas</h4>${rows.join('')}</div>` : `<div class=\"empty-state\"><p>Nenhum resultado em cache.</p></div>`}
        `;
        // garantir wire dos botões quando card é re-renderizado
        const btnLimpar = card.querySelector('#cache-btn-limpar');
        const btnAtualizar = card.querySelector('#cache-btn-atualizar');
        if (btnLimpar) btnLimpar.addEventListener('click', limparCacheCompleto);
        if (btnAtualizar) btnAtualizar.addEventListener('click', atualizarCacheLoterias);
        // atualizar status de cache diretamente aqui
        const statusEl = document.getElementById('cache-status-hub');
        if (statusEl) {
            if (keys.length > 0) {
                statusEl.innerHTML = `📦 Cache ativo para ${keys.length} loteria(s)`;
                statusEl.className = 'cache-status';
            } else {
                statusEl.innerHTML = '❌ Nenhum cache encontrado';
                statusEl.className = 'cache-status';
            }
        }
    } catch (e) {
        // silencioso
    }
}

function renderValidationCard() {
    try {
        const content = document.querySelector('.content');
        if (!content) return;
        // sempre recriar o card para evitar cache do DOM
        const existingCard = document.getElementById('validation-card');
        if (existingCard) existingCard.remove();
        const card = document.createElement('div');
        card.id = 'validation-card';
        card.className = 'loteria-card';
        content.insertBefore(card, content.firstChild);
        card.innerHTML = `
            <h3>✅ Validação de Concursos</h3>
            <div class="cache-actions" style="margin:8px 0; display:flex; gap:8px; flex-wrap:wrap; justify-content:center;">
                <button id="validation-btn-validar" class="btn-cache">✅ Validar Todos os Concursos</button>
            </div>
            <div class="cache-status" id="validation-status"></div>
        `;
        const btnValidar = card.querySelector('#validation-btn-validar');
        if (btnValidar) btnValidar.addEventListener('click', validarTodosConcursos);
    } catch (_) {}
}


