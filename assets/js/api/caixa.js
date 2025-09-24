import { fetchJsonWithTimeout, httpStatusHint } from './http.js';
import { getStaticResult } from '../data/static-results.js';

export async function fetchCaixaResultado(loteria, concurso) {
    // Detectar se está rodando no GitHub Pages ou servidor local
    const isLocalServer = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    let url;
    if (isLocalServer && window.location.port === '3000') {
        // Servidor local com proxy
        url = `/api/caixa/${loteria}/${concurso}`;
    } else {
        // GitHub Pages - tentar API direta (pode falhar por CORS)
        url = `https://servicebus2.caixa.gov.br/portaldeloterias/api/${loteria}/${concurso}`;
    }
    
    console.log(`🌐 Tentando API: ${url}`);
    const result = await fetchJsonWithTimeout(url);
    
    if (result.ok && result.data) {
        return { ok: true, data: result.data };
    }
    
    console.warn('API Caixa falhou', { 
        status: result.status, 
        statusText: result.statusText, 
        dica: httpStatusHint(result.status),
        url: url
    });
    
    // Fallback: tentar dados estáticos (GitHub Pages)
    if (!isLocalServer || window.location.port !== '3000') {
        const staticData = getStaticResult(loteria, concurso);
        if (staticData) {
            console.log(`📄 Usando dados estáticos para ${loteria}/${concurso}`);
            return { ok: true, data: staticData };
        }
    }
    
    return { ok: false, status: result.status, statusText: result.statusText };
}


