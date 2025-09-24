// Dados estáticos para GitHub Pages (fallback quando API falha por CORS)
// Este arquivo será atualizado periodicamente com resultados recentes

export const STATIC_RESULTS = {
    lotofacil: {
        // Dados estáticos serão adicionados conforme necessário
        // Sem dados simulados ou mock
    }
};

export function getStaticResult(loteria, concurso) {
    try {
        const loteriaData = STATIC_RESULTS[loteria];
        if (loteriaData && loteriaData[concurso]) {
            console.log(`📄 Usando resultado estático para ${loteria}/${concurso}`);
            return loteriaData[concurso];
        }
    } catch (_) {}
    return null;
}
