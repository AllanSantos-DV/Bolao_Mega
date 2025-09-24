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
            // tentar fallback do config APENAS se Firebase não tiver dados
            if (origem === 'config-fallback') {
                const firebaseHasData = await checkFirebaseHasData(loteria, concurso);
                if (firebaseHasData) {
                    console.log(`⚠️ Firebase já tem dados para ${loteria}/${concurso} - ignorando config`);
                    return false;
                }
            }
            
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

// Função para detectar mudanças no config e invalidar cache automaticamente
export async function checkAndInvalidateCacheIfNeeded(loteria, concurso) {
    try {
        // Primeiro verificar se Firebase tem dados - se tiver, não usar config
        const firebaseHasData = await checkFirebaseHasData(loteria, concurso);
        if (firebaseHasData) {
            console.log(`ℹ️ Firebase tem dados para ${loteria}/${concurso} - não verificando config`);
            return false;
        }
        
        // Buscar config atual do servidor
        const response = await fetch(`./loterias/${loteria}/config.json?v=${Date.now()}`);
        if (!response.ok) return false;
        
        const currentConfig = await response.json();
        const bolaoKey = Object.keys(currentConfig.boloes || {}).find(key => 
            String(currentConfig.boloes[key].concurso) === String(concurso)
        );
        
        if (!bolaoKey) return false;
        
        const bolaoConfig = currentConfig.boloes[bolaoKey];
        const hasResultado = bolaoConfig.resultado && Array.isArray(bolaoConfig.resultado) && bolaoConfig.resultado.length > 0;
        
        // Verificar se o cache atual indica "aguardando" mas o config agora tem resultado
        const cached = loadFromLocalCache(loteria, concurso, 24*60*60*1000);
        if (cached && hasResultado) {
            // Verificar se o resultado no cache é diferente do config
            const cachedResultado = cached.resultado;
            const configResultado = bolaoConfig.resultado;
            
            if (!cachedResultado || !Array.isArray(cachedResultado) || cachedResultado.length === 0) {
                // Cache indica "aguardando" mas config tem resultado - invalidar cache
                console.log(`🔄 Resultado disponível para ${loteria}/${concurso} - invalidando cache`);
                localStorage.removeItem(getLocalCacheKey(loteria, concurso));
                return true;
            }
            
            // Verificar se os resultados são diferentes
            if (JSON.stringify(cachedResultado.sort()) !== JSON.stringify(configResultado.sort())) {
                console.log(`🔄 Resultado atualizado para ${loteria}/${concurso} - invalidando cache`);
                localStorage.removeItem(getLocalCacheKey(loteria, concurso));
                return true;
            }
        }
        
        return false;
    } catch (_) {
        return false;
    }
}

// Função para verificar se Firebase tem dados para um concurso
export async function checkFirebaseHasData(loteria, concurso) {
    try {
        // Importar dinamicamente para evitar dependência circular
        const { initFirebase } = await import('../firebase/init.js');
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const { db } = await initFirebase();
        if (!db) return false;
        
        const ref = doc(db, 'loterias', loteria, 'concursos', String(concurso));
        const snap = await getDoc(ref);
        
        if (snap.exists()) {
            const data = snap.data();
            const numeros = extractResultadoArray(data);
            return Array.isArray(numeros) && numeros.length > 0;
        }
        
        return false;
    } catch (_) {
        return false;
    }
}

// Função para validar resultado do config contra resultado oficial da Caixa
export async function validateConfigAgainstOfficial(loteria, concurso, configResultado) {
    try {
        // Importar dinamicamente para evitar dependência circular
        const { fetchCaixaResultado } = await import('../api/caixa.js');
        
        console.log(`🔍 Validando resultado do config contra oficial para ${loteria}/${concurso}`);
        
        const res = await fetchCaixaResultado(loteria, concurso);
        if (res.ok && res.data) {
            const oficialResultado = extractResultadoArray(res.data);
            
            if (Array.isArray(oficialResultado) && oficialResultado.length > 0) {
                const configSorted = [...configResultado].sort((a, b) => a - b);
                const oficialSorted = [...oficialResultado].sort((a, b) => a - b);
                
                const isEqual = JSON.stringify(configSorted) === JSON.stringify(oficialSorted);
                
                if (isEqual) {
                    console.log(`✅ Resultado do config confere com o oficial para ${loteria}/${concurso}`);
                    return { valid: true, oficial: oficialResultado, config: configResultado };
                } else {
                    console.warn(`⚠️ Resultado do config NÃO confere com o oficial para ${loteria}/${concurso}`);
                    console.log(`Config: [${configSorted.join(',')}]`);
                    console.log(`Oficial: [${oficialSorted.join(',')}]`);
                    return { valid: false, oficial: oficialResultado, config: configResultado };
                }
            }
        }
        
        console.log(`ℹ️ Não foi possível obter resultado oficial para ${loteria}/${concurso}`);
        return { valid: null, oficial: null, config: configResultado };
    } catch (error) {
        console.log(`❌ Erro ao validar resultado oficial para ${loteria}/${concurso}:`, error.message);
        return { valid: null, oficial: null, config: configResultado };
    }
}

// Função para limpar cache de um concurso específico
export function clearCacheForConcurso(loteria, concurso) {
    try {
        localStorage.removeItem(getLocalCacheKey(loteria, concurso));
        console.log(`🗑️ Cache limpo para ${loteria}/${concurso}`);
        return true;
    } catch (_) {
        return false;
    }
}

// Função para limpar TODOS os caches de resultados
export function clearAllResultCaches() {
    try {
        const keysToRemove = [];
        
        // Percorrer todas as chaves do localStorage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('caixa_api_cache_')) {
                keysToRemove.push(key);
            }
        }
        
        // Remover todas as chaves encontradas
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
        });
        
        console.log(`🗑️ Limpeza completa: ${keysToRemove.length} caches removidos`);
        return keysToRemove.length;
    } catch (error) {
        console.error('❌ Erro ao limpar todos os caches:', error);
        return 0;
    }
}


