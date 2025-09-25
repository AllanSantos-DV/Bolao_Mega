import { fetchJsonWithTimeout, httpStatusHint } from './http.js';
import { getStaticResult } from '../data/static-results.js';

export async function fetchCaixaResultado(loteria, concurso) {
    // GitHub Pages - usar API direta da Caixa
    const url = `https://servicebus2.caixa.gov.br/portaldeloterias/api/${loteria}/${concurso}`;
    
    console.log(`🌐 Tentando API Caixa: ${url}`);
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
    
    // Fallback: usar dados estáticos (GitHub Pages)
    const staticData = getStaticResult(loteria, concurso);
    if (staticData) {
        console.log(`📄 Usando dados estáticos para ${loteria}/${concurso}`);
        return { ok: true, data: staticData };
    }
    
    return { ok: false, status: result.status, statusText: result.statusText };
}


