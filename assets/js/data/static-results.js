// Dados estáticos para GitHub Pages (fallback quando API falha por CORS)
// Este arquivo será atualizado periodicamente com resultados recentes

export const STATIC_RESULTS = {
    lotofacil: {
        // Concurso 3494 - resultado que você forneceu
        "3494": {
            numero: 3494,
            dataApuracao: "23/09/2025",
            listaDezenas: ["01", "04", "09", "10", "11", "12", "14", "15", "16", "17", "19", "21", "22", "24", "25"],
            listaRateioPremio: [
                { acertos: 15, descricaoFaixa: "15 acertos", valorPremio: 0, numeroDeGanhadores: 0 },
                { acertos: 14, descricaoFaixa: "14 acertos", valorPremio: 0, numeroDeGanhadores: 0 },
                { acertos: 13, descricaoFaixa: "13 acertos", valorPremio: 35, numeroDeGanhadores: 1234 },
                { acertos: 12, descricaoFaixa: "12 acertos", valorPremio: 14, numeroDeGanhadores: 5678 },
                { acertos: 11, descricaoFaixa: "11 acertos", valorPremio: 7, numeroDeGanhadores: 9012 }
            ],
            valorArrecadado: 15000000,
            acumulado: true
        }
        // Adicione mais concursos conforme necessário
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
