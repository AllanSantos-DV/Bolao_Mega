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

function updateStatusByResultado(config, bolaoId) {
    const bolao = config.boloes[bolaoId];
    const statusEl = document.getElementById('info-status');
    if (bolao && Array.isArray(bolao.resultado) && bolao.resultado.length > 0) {
        statusEl.textContent = 'Resultado disponível';
        statusEl.style.color = '#28a745';
        return true;
    }
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
    updateStatusByResultado(config, bolaoId);
    const arquivos = await detectPdfs(pasta);
    displayComprovantes(arquivos, pasta);
}


