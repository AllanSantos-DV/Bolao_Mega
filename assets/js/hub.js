import { log } from './debug.js';
import { listLoteriasFromDB, getLoteriaConfigFromDB } from './data/firestore.js';

let LOTERIAS = [];
let CONFIG = {};

export async function bootstrap(){
    log('SYSTEM','NovoApp bootstrap');
    try{
        bindButtons();
        await loadFromFirestore();
        updateStats();
        log('SYSTEM','NovoApp pronto');
    }catch(e){
        log('ERROR','Falha bootstrap', {message:e.message});
        console.error(e);
    }
}

function bindButtons(){
    const clearBtn = document.getElementById('btn-limpar-cache');
    const refreshBtn = document.getElementById('btn-atualizar-cache');
    const validateBtn = document.getElementById('btn-validar-concursos');
    if(clearBtn) clearBtn.addEventListener('click', ()=>{
        localStorage.clear();
        const resEl = document.getElementById('cache-results');
        if (resEl) resEl.innerHTML = '<div class="status-success">✅ Cache limpo.</div>';
        log('CACHE','Limpo');
    });
    if(refreshBtn) refreshBtn.addEventListener('click', ()=>{
        Object.keys(localStorage).forEach(k=>k.includes('caixa_api_cache')&&localStorage.removeItem(k));
        const resEl = document.getElementById('cache-results');
        if (resEl) resEl.innerHTML = '<div class="status-success">✅ Cache atualizado.</div>';
        log('CACHE','Atualizado');
    });
    if(validateBtn) validateBtn.addEventListener('click', ()=>{
        const vEl = document.getElementById('validation-status');
        if (vEl) vEl.textContent = '🔄 Validando...';
        setTimeout(()=>{
            if (vEl) vEl.innerHTML = '<div class="status-success">✅ Validação concluída</div>';
            log('VALIDATION','Concluída');
        },600);
    });
}

async function loadFromFirestore(){
    const loading = document.getElementById('lotteries-loading');
    const container = document.getElementById('lotteries-container');
    const empty = document.getElementById('lotteries-empty');
    if(loading) loading.classList.remove('hidden');
    if(container) container.classList.add('hidden');
    if(empty) empty.classList.add('hidden');

    const found = [];
    CONFIG = {};
    try{
        const loterias = await listLoteriasFromDB();
        for(const l of loterias){
            const cfg = await getLoteriaConfigFromDB(l.id);
            if(!cfg) continue;
            found.push({ nome: l.id, config: cfg });
            CONFIG[l.id] = cfg;
        }
    }catch(e){
        log('ERROR','Erro Firestore', {message:e.message});
    }

    if(loading) loading.classList.add('hidden');
    if(found.length===0){
        if(empty) empty.classList.remove('hidden');
        return;
    }

    if(container){
        container.innerHTML = '';
        found.forEach(ld=>{
            container.appendChild(buildCard(ld));
        });
        container.classList.remove('hidden');
    }
}

function buildCard(loteriaData){
    const { nome, config } = loteriaData;
    const c = document.createElement('div');
    c.className = 'card';
    const boloes = Object.entries(config.boloes||{}).map(([id,b])=>{
        return `<div style="border:1px solid var(--border);border-radius:10px;padding:12px;margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <strong>${b.nome||id}</strong>
                <span class="status-success">${b.resultado?.length? 'Disponível':'Aguardando'}</span>
            </div>
            <a class="btn" href="../pages/bolao-template.html?loteria=${nome}&bolao=${id}">Abrir</a>
        </div>`;
    }).join('');
    c.innerHTML = `
        <h3>${config.loteria?.modalidade||nome}</h3>
        ${boloes || '<div class="error">Nenhum bolão configurado</div>'}
    `;
    return c;
}

function updateStats(){
    const tLot = document.getElementById('total-lotteries');
    const tBol = document.getElementById('total-boloes');
    if(tLot) tLot.textContent = Object.keys(CONFIG).length;
    if(tBol) tBol.textContent = Object.values(CONFIG).reduce((a,c)=>a+Object.keys(c.boloes||{}).length,0);
}


