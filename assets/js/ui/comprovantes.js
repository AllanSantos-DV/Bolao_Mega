function getQueryParams() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
        bolaoId: urlParams.get('bolao'),
        loteria: urlParams.get('loteria'),
        pasta: urlParams.get('pasta')
    };
}

async function fetchConfig(loteria) {
    try {
        const resp = await fetch(`../loterias/${loteria}/config.json?v=${window.VERSION}`);
        if (resp.ok) return await resp.json();
    } catch (_) {}
    return null;
}

function setBasicInfo(config, bolaoId) {
    const bolao = config.boloes[bolaoId];
    const el = (id) => document.getElementById(id);
    el('modalidade').textContent = config.loteria.modalidade;
    el('concurso').textContent = bolao.concurso;
    el('info-modalidade').textContent = config.loteria.modalidade;
    el('info-concurso').textContent = bolao.concurso;
    el('info-data').textContent = bolao.data_sorteio || 'A definir';
}

async function updateStatusByResultado(config, bolaoId) {
    const bolao = config.boloes[bolaoId];
    const statusEl = document.getElementById('info-status');
    const concurso = bolao.concurso;
    const loteria = config.loteria.modalidade.toLowerCase();
    
    console.log(`🔍 Verificando resultado para ${loteria}/${concurso}`);
    
    // 1. Verificar cache válido primeiro
    try {
        const { loadFromLocalCache } = await import('../data/cache.js');
        // Cache válido por 24 horas (86400000 ms)
        const cached = loadFromLocalCache(loteria, concurso, 86400000);
        if (cached && cached.validacao && cached.validacao.valido) {
            console.log(`✅ Cache válido encontrado para ${loteria}/${concurso}`);
            statusEl.textContent = 'Resultado disponível';
            statusEl.style.color = '#28a745';
            return true;
        }
    } catch (error) {
        console.log(`⚠️ Erro ao verificar cache: ${error.message}`);
    }
    
    // 2. Verificar Firebase
    try {
        const { initFirebase } = await import('../firebase/init.js');
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const { db } = await initFirebase();
        if (db) {
            const ref = doc(db, 'loterias', loteria, 'concursos', String(concurso));
            const snap = await getDoc(ref);
            if (snap.exists()) {
                const data = snap.data();
                if (data && Array.isArray(data.resultado) && data.resultado.length > 0) {
                    console.log(`✅ Dados Firebase encontrados para ${loteria}/${concurso}`);
                    statusEl.textContent = 'Resultado disponível';
                    statusEl.style.color = '#28a745';
                    return true;
                }
            }
        }
    } catch (error) {
        console.log(`⚠️ Erro ao verificar Firebase: ${error.message}`);
    }
    
    // 3. Verificar API da Caixa
    try {
        const { fetchCaixaResultado } = await import('../api/caixa.js');
        const resultado = await fetchCaixaResultado(loteria, concurso);
        if (resultado && Array.isArray(resultado.listaDezenas) && resultado.listaDezenas.length > 0) {
            console.log(`✅ Dados API Caixa encontrados para ${loteria}/${concurso}`);
            statusEl.textContent = 'Resultado disponível';
            statusEl.style.color = '#28a745';
            return true;
        }
    } catch (error) {
        console.log(`⚠️ Erro ao verificar API Caixa: ${error.message}`);
    }
    
    // 4. Última opção: Config.json
    if (bolao && Array.isArray(bolao.resultado) && bolao.resultado.length > 0) {
        console.log(`✅ Dados config.json encontrados para ${loteria}/${concurso}`);
        statusEl.textContent = 'Resultado disponível';
        statusEl.style.color = '#28a745';
        return true;
    }
    
    console.log(`❌ Nenhum resultado encontrado para ${loteria}/${concurso}`);
    statusEl.textContent = 'Aguardando resultado';
    statusEl.style.color = '#ffc107';
    return false;
}

async function detectPdfs(pasta) {
    const possibleFiles = Array.from({ length: 20 }).map((_, i) => `comprovante-${i + 1}.pdf`);
    const found = [];
    for (const file of possibleFiles) {
        try {
            const url = `../${pasta}/${file}?v=${window.VERSION}`;
            const resp = await fetch(url, { method: 'HEAD' });
            if (resp.ok) found.push(file);
        } catch (_) {}
    }
    return found;
}

function displayComprovantes(items, pasta) {
    const container = document.getElementById('comprovantes-grid');
    container.innerHTML = '';
    if (items.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>Nenhum comprovante encontrado</h3>
                <p>Os comprovantes serão disponibilizados após o sorteio.</p>
            </div>`;
    } else {
        items.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'comprovante-card';
            card.innerHTML = `
                <div class="comprovante-icon">📄</div>
                <div class="comprovante-title">Comprovante ${index + 1}</div>
                <div class="comprovante-actions">
                    <button class="btn btn-primary" data-arquivo="${item}">👁️ Visualizar</button>
                    <a href="../${pasta}/${item}?v=${window.VERSION}" class="btn btn-success" download>⬇️ Baixar</a>
                </div>`;
            card.querySelector('button').addEventListener('click', () => visualizarPDF(pasta, item));
            container.appendChild(card);
        });
    }
    document.getElementById('loading').style.display = 'none';
    container.style.display = 'grid';
}

function visualizarPDF(pasta, arquivo) {
    const url = `../${pasta}/${arquivo}?v=${window.VERSION}`;
    window.open(url, '_blank');
}
window.visualizarPDF = (arquivo) => { /* compat fallback if needed by legacy */ };

export async function bootstrapComprovantes() {
    const { bolaoId, loteria, pasta } = getQueryParams();
    if (!bolaoId || !loteria) {
        document.querySelector('.content').innerHTML = '<div class="error">Parâmetros inválidos. Use: ?loteria=nome&bolao=id&pasta=pasta</div>';
        return;
    }
    const config = await fetchConfig(loteria);
    if (!config || !config.boloes || !config.boloes[bolaoId]) {
        document.querySelector('.content').innerHTML = '<div class="error">Erro ao carregar informações do concurso</div>';
        return;
    }
    setBasicInfo(config, bolaoId);
    await updateStatusByResultado(config, bolaoId);
    const arquivos = await detectPdfs(pasta);
    displayComprovantes(arquivos, pasta);
}


