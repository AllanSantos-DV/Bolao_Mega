export const API_TIMEOUT_MS = 10000;

export async function fetchJsonWithTimeout(url, options = {}, timeoutMs = API_TIMEOUT_MS) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const resp = await fetch(url, { ...options, signal: controller.signal });
        const text = await resp.text();
        let data = null;
        try {
            data = text ? JSON.parse(text) : null;
        } catch (_) {
            console.warn('Resposta não-JSON da API', { url, status: resp.status, statusText: resp.statusText, sample: text ? text.slice(0, 200) : '' });
        }
        if (!resp.ok) {
            console.error('Falha na requisição', { url, status: resp.status, statusText: resp.statusText, sample: text ? text.slice(0, 200) : '' });
            return { ok: false, status: resp.status, statusText: resp.statusText, data };
        }
        return { ok: true, status: resp.status, statusText: resp.statusText, data };
    } catch (err) {
        const isAbort = err && err.name === 'AbortError';
        console.error('Erro de rede/timeout', { url, timeoutMs, abort: isAbort, message: err?.message });
        return { ok: false, status: 0, statusText: isAbort ? 'Timeout' : 'NetworkError', data: null, error: err?.message };
    } finally {
        clearTimeout(id);
    }
}

export function httpStatusHint(status) {
    if (status === 404) return 'Recurso não encontrado (verifique loteria/concurso).';
    if (status >= 500) return 'Serviço da Caixa possivelmente indisponível.';
    if (status === 0) return 'Sem conexão ou bloqueio de CORS/Timeout.';
    return 'Falha na requisição.';
}


