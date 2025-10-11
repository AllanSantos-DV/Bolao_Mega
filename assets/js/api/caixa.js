import { fetchJsonWithTimeout, httpStatusHint } from './http.js';
import { getStaticResult } from '../data/static-results.js';

export async function fetchCaixaResultado(loteria, concurso) {
    // Mapear loterias especiais para suas loterias padrão
    const loteriaMap = {
        'lotinha': 'lotofacil',
        'quininha': 'quina', 
        'mania': 'lotomania'
    };
    
    // Se for loteria especial, usar a loteria padrão correspondente
    const loteriaParaBuscar = loteriaMap[loteria] || loteria;
    
    // GitHub Pages - usar API direta da Caixa
    const url = `https://servicebus2.caixa.gov.br/portaldeloterias/api/${loteriaParaBuscar}/${concurso}`;
    
    console.log(`🌐 Tentando API Caixa: ${url}${loteriaParaBuscar !== loteria ? ` (${loteria} → ${loteriaParaBuscar})` : ''}`);
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
    const staticData = getStaticResult(loteriaParaBuscar, concurso);
    if (staticData) {
        console.log(`📄 Usando dados estáticos para ${loteriaParaBuscar}/${concurso}${loteriaParaBuscar !== loteria ? ` (${loteria})` : ''}`);
        return { ok: true, data: staticData };
    }
    
    return { ok: false, status: result.status, statusText: result.statusText };
}


