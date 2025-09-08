export function extractResultadoArray(data) {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.listaDezenas)) {
        return data.listaDezenas.map(n => parseInt(n));
    }
    if (Array.isArray(data.resultado)) {
        return data.resultado.map(n => parseInt(n));
    }
    return [];
}

export function validateResultadoArray(numeros, numerosPorJogo) {
    if (!Array.isArray(numeros)) {
        return { valido: false, motivo: 'Resultado não é array' };
    }
    if (numeros.length !== numerosPorJogo) {
        return { valido: false, motivo: `Quantidade incorreta: ${numeros.length} (esperado: ${numerosPorJogo})` };
    }
    const todosValidos = numeros.every(num => {
        const numero = parseInt(num);
        return !isNaN(numero) && numero > 0;
    });
    if (!todosValidos) {
        return { valido: false, motivo: 'Números inválidos encontrados' };
    }
    const unicos = new Set(numeros);
    if (unicos.size !== numeros.length) {
        return { valido: false, motivo: 'Números duplicados encontrados' };
    }
    return { valido: true, motivo: 'Dados válidos' };
}

export function validarDadosCache(data, configLoteria) {
    try {
        if (!configLoteria || !configLoteria.loteria) {
            return { valido: false, motivo: 'Config não encontrada', resultado: [] };
        }
        const numerosPorJogo = configLoteria.loteria.numeros_por_jogo;
        const resultado = extractResultadoArray(data);
        const base = validateResultadoArray(resultado, numerosPorJogo);
        return { ...base, resultado };
    } catch (e) {
        return { valido: false, motivo: `Erro na validação: ${e.message}`, resultado: [] };
    }
}

export function compararResultados(resultadoConfig, resultadoAPI) {
    if (!resultadoConfig || !resultadoAPI) {
        return { temDivergencia: false };
    }
    const a = [...resultadoConfig].map(n => parseInt(n)).sort((x, y) => x - y);
    const b = [...resultadoAPI].map(n => parseInt(n)).sort((x, y) => x - y);
    const temDivergencia = JSON.stringify(a) !== JSON.stringify(b);
    return { temDivergencia, resultadoConfig: a, resultadoAPI: b };
}


