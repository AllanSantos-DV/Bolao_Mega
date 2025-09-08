import { fetchJsonWithTimeout, httpStatusHint } from './http.js';

export async function fetchCaixaResultado(loteria, concurso) {
    const url = `https://servicebus2.caixa.gov.br/portaldeloterias/api/${loteria}/${concurso}`;
    const result = await fetchJsonWithTimeout(url);
    if (result.ok && result.data) {
        return { ok: true, data: result.data };
    }
    console.warn('API Caixa falhou', { status: result.status, statusText: result.statusText, dica: httpStatusHint(result.status) });
    return { ok: false, status: result.status, statusText: result.statusText };
}


