import { validarDadosCache, extractResultadoArray } from '../domain/loterias.js';

export function loadConfigLoteriaFromWindowOrStorage(loteria) {
    try {
        const cachedConfig = localStorage.getItem(`config_${loteria}`);
        if (cachedConfig) return JSON.parse(cachedConfig);
        if (window.configLoterias && window.configLoterias[loteria]) {
            return window.configLoterias[loteria];
        }
        if (window.bolaoConfig && window.bolaoConfig.loteria) {
            return window.bolaoConfig;
        }
    } catch (_) {}
    return null;
}

export function getLocalCacheKey(loteria, concurso) {
    return `caixa_api_cache_${loteria}_${concurso}`;
}

export function isLocalCacheValid(cacheData, maxAgeMs) {
    if (!cacheData || !cacheData.timestamp) return false;
    const now = Date.now();
    const age = now - cacheData.timestamp;
    return age < maxAgeMs;
}

export function loadFromLocalCache(loteria, concurso, maxAgeMs) {
    try {
        const cached = localStorage.getItem(getLocalCacheKey(loteria, concurso));
        if (cached) {
            const cacheData = JSON.parse(cached);
            if (isLocalCacheValid(cacheData, maxAgeMs)) {
                return cacheData;
            }
        }
    } catch (_) {}
    return null;
}

export async function saveToLocalCache(data, loteria, concurso, origem = 'desconhecida') {
    try {
        const config = loadConfigLoteriaFromWindowOrStorage(loteria);
        const validacao = validarDadosCache(data, config);
        if (!validacao.valido) {
            // tentar fallback do config
            if (config && config.boloes && config.boloes[`bolao-${concurso}`]) {
                const bolaoCfg = config.boloes[`bolao-${concurso}`];
                const fallback = extractResultadoArray(bolaoCfg);
                if (fallback && fallback.length > 0) {
                    localStorage.setItem(
                        getLocalCacheKey(loteria, concurso),
                        JSON.stringify({ resultado: fallback, timestamp: Date.now(), loteria, concurso, origem: 'config-fallback', validacao: { valido: true, motivo: 'Fallback do config' } })
                    );
                    return true;
                }
            }
            return false;
        }
        const resultado = extractResultadoArray(data);
        const payload = { resultado, timestamp: Date.now(), loteria, concurso, origem, validacao };
        // anexar campos opcionais para telas ricas (premiação, metadados)
        if (data && typeof data === 'object') {
            if (data.numero) payload.numero = data.numero;
            if (data.dataApuracao) payload.dataApuracao = data.dataApuracao;
            if (data.valorArrecadado) payload.valorArrecadado = data.valorArrecadado;
            if (Array.isArray(data.premiacao)) payload.premiacao = data.premiacao;
            if (data.fonte) payload.fonte = data.fonte;
            if (data.pagosExtras) payload.pagosExtras = data.pagosExtras;
        }
        localStorage.setItem(
            getLocalCacheKey(loteria, concurso),
            JSON.stringify(payload)
        );
        return true;
    } catch (_) {
        return false;
    }
}


