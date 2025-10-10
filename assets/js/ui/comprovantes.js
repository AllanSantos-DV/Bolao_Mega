function getQueryParams() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
        bolaoId: urlParams.get('bolao'),
        loteria: urlParams.get('loteria'),
        pasta: urlParams.get('pasta')
    };
}

async function fetchConfig(loteria) {
    try {
        const resp = await fetch(`../loterias/${loteria}/config.json?v=${window.VERSION}`);
        if (resp.ok) return await resp.json();
    } catch (_) {}
    return null;
}

function setBasicInfo(config, bolaoId) {
    const bolao = config.boloes[bolaoId];
    const el = (id) => document.getElementById(id);
    el('modalidade').textContent = config.loteria.modalidade;
    el('concurso').textContent = bolao.concurso;
    el('info-modalidade').textContent = config.loteria.modalidade;
    el('info-concurso').textContent = bolao.concurso;
    el('info-data').textContent = bolao.data_sorteio || 'A definir';
}

async function updateStatusByResultado(config, bolaoId) {
    const bolao = config.boloes[bolaoId];
    const statusEl = document.getElementById('info-status');
    const concurso = bolao.concurso;
    const loteria = config.loteria.modalidade.toLowerCase();
    
    console.log(`🔍 Verificando resultado para ${loteria}/${concurso}`);
    
    // 1. Verificar cache válido primeiro
    try {
        const { loadFromLocalCache } = await import('../data/cache.js');
        // Cache válido por 24 horas (86400000 ms)
        const cached = loadFromLocalCache(loteria, concurso, 86400000);
        if (cached && cached.validacao && cached.validacao.valido) {
            console.log(`✅ Cache válido encontrado para ${loteria}/${concurso}`);
            statusEl.textContent = 'Resultado disponível';
            statusEl.style.color = '#28a745';
            return true;
        }
    } catch (error) {
        console.log(`⚠️ Erro ao verificar cache: ${error.message}`);
    }
    
    // 2. Verificar Firebase
    try {
        const { initFirebase } = await import('../firebase/init.js');
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const { db } = await initFirebase();
        if (db) {
            const ref = doc(db, 'loterias', loteria, 'concursos', String(concurso));
            const snap = await getDoc(ref);
            if (snap.exists()) {
                const data = snap.data();
                if (data && Array.isArray(data.resultado) && data.resultado.length > 0) {
                    console.log(`✅ Dados Firebase encontrados para ${loteria}/${concurso}`);
                    statusEl.textContent = 'Resultado disponível';
                    statusEl.style.color = '#28a745';
                    return true;
                }
            }
        }
    } catch (error) {
        console.log(`⚠️ Erro ao verificar Firebase: ${error.message}`);
    }
    
    // 3. Verificar API da Caixa
    try {
        const { fetchCaixaResultado } = await import('../api/caixa.js');
        const resultado = await fetchCaixaResultado(loteria, concurso);
        if (resultado && Array.isArray(resultado.listaDezenas) && resultado.listaDezenas.length > 0) {
            console.log(`✅ Dados API Caixa encontrados para ${loteria}/${concurso}`);
            statusEl.textContent = 'Resultado disponível';
            statusEl.style.color = '#28a745';
            return true;
        }
    } catch (error) {
        console.log(`⚠️ Erro ao verificar API Caixa: ${error.message}`);
    }
    
    // 4. Última opção: Config.json
    if (bolao && Array.isArray(bolao.resultado) && bolao.resultado.length > 0) {
        console.log(`✅ Dados config.json encontrados para ${loteria}/${concurso}`);
        statusEl.textContent = 'Resultado disponível';
        statusEl.style.color = '#28a745';
        return true;
    }
    
    console.log(`❌ Nenhum resultado encontrado para ${loteria}/${concurso}`);
    statusEl.textContent = 'Aguardando resultado';
    statusEl.style.color = '#ffc107';
    return false;
}

async function detectPdfs(pasta) {
    const possibleFiles = Array.from({ length: 20 }).map((_, i) => `comprovante-${i + 1}.pdf`);
    const found = [];
    for (const file of possibleFiles) {
        try {
            const url = `../${pasta}/${file}?v=${window.VERSION}`;
            const resp = await fetch(url, { method: 'HEAD' });
            if (resp.ok) found.push(file);
        } catch (_) {}
    }
    return found;
}

async function detectJpegs(pasta) {
    const possibleFiles = Array.from({ length: 50 }).map((_, i) => [
        `comprovante-${i + 1}.jpg`,
        `comprovante-${i + 1}.jpeg`
    ]).flat();
    const found = [];
    for (const file of possibleFiles) {
        try {
            const url = `../${pasta}/${file}?v=${window.VERSION}`;
            const resp = await fetch(url, { method: 'HEAD' });
            if (resp.ok) found.push(file);
        } catch (_) {}
    }
    return found;
}

function getJsPDF() {
    // Tentar diferentes formas de acessar jsPDF
    if (window.jsPDF) {
        return window.jsPDF;
    }
    if (window.jspdf && window.jspdf.jsPDF) {
        return window.jspdf.jsPDF;
    }
    if (window.jspdf && window.jspdf.default) {
        return window.jspdf.default;
    }
    return null;
}

async function waitForJsPDF() {
    return new Promise((resolve, reject) => {
        // Se já está carregado, resolver imediatamente
        const jsPDF = getJsPDF();
        if (jsPDF) {
            console.log('jsPDF já está carregado:', typeof jsPDF);
            resolve();
            return;
        }
        
        // Tentar carregar dinamicamente se não estiver disponível
        const loadJsPDF = () => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script.onload = () => {
                const jsPDF = getJsPDF();
                console.log('jsPDF carregado dinamicamente:', typeof jsPDF);
                if (jsPDF) {
                    resolve();
                } else {
                    reject(new Error('jsPDF carregado mas não acessível'));
                }
            };
            script.onerror = () => {
                reject(new Error('Falha ao carregar jsPDF'));
            };
            document.head.appendChild(script);
        };
        
        // Aguardar até 3 segundos pelo carregamento inicial
        let attempts = 0;
        const maxAttempts = 30; // 3 segundos com intervalos de 100ms
        
        const checkJsPDF = () => {
            attempts++;
            
            const jsPDF = getJsPDF();
            if (jsPDF) {
                console.log('jsPDF carregado após', attempts * 100, 'ms:', typeof jsPDF);
                resolve();
            } else if (attempts >= maxAttempts) {
                console.log('jsPDF não encontrado, tentando carregar dinamicamente');
                loadJsPDF();
            } else {
                setTimeout(checkJsPDF, 100);
            }
        };
        
        checkJsPDF();
    });
}

async function generatePdfFromJpegs(jpegFiles, pasta) {
    try {
        // Aguardar o carregamento do jsPDF
        await waitForJsPDF();
        
        const jsPDF = getJsPDF();
        if (!jsPDF) {
            throw new Error('jsPDF não está disponível');
        }
        
        const pdf = new jsPDF();
        
        // Processar cada JPEG
        for (let i = 0; i < jpegFiles.length; i++) {
            const jpegFile = jpegFiles[i];
            const url = `../${pasta}/${jpegFile}?v=${window.VERSION}`;
            
            try {
                // Carregar imagem
                const response = await fetch(url);
                const blob = await response.blob();
                const imageData = await blobToBase64(blob);
                
                // Adicionar nova página se não for a primeira
                if (i > 0) {
                    pdf.addPage();
                }
                
                // Obter dimensões da imagem
                const img = new Image();
                img.src = imageData;
                
                await new Promise((resolve) => {
                    img.onload = () => {
                        // Calcular dimensões para caber na página
                        const pageWidth = pdf.internal.pageSize.getWidth();
                        const pageHeight = pdf.internal.pageSize.getHeight();
                        const margin = 10;
                        const maxWidth = pageWidth - (margin * 2);
                        const maxHeight = pageHeight - (margin * 2);
                        
                        let imgWidth = img.width;
                        let imgHeight = img.height;
                        
                        // Redimensionar se necessário
                        if (imgWidth > maxWidth) {
                            imgHeight = (imgHeight * maxWidth) / imgWidth;
                            imgWidth = maxWidth;
                        }
                        if (imgHeight > maxHeight) {
                            imgWidth = (imgWidth * maxHeight) / imgHeight;
                            imgHeight = maxHeight;
                        }
                        
                        // Centralizar na página
                        const x = (pageWidth - imgWidth) / 2;
                        const y = (pageHeight - imgHeight) / 2;
                        
                        pdf.addImage(imageData, 'JPEG', x, y, imgWidth, imgHeight);
                        resolve();
                    };
                });
            } catch (error) {
                console.warn(`Erro ao processar ${jpegFile}:`, error);
            }
        }
        
        return pdf;
    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        return null;
    }
}

function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

function displayComprovantes(items, pasta, jpegFiles = [], config = null) {
    const container = document.getElementById('comprovantes-grid');
    container.innerHTML = '';
    
    // Verificar se é loteria especial (Lotinha, Quininha, Mania)
    const isSpecialLottery = config && config.loteria && 
        ['Lotinha', 'Quininha', 'Mania'].includes(config.loteria.modalidade);
    
    if (items.length === 0 && jpegFiles.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>Nenhum comprovante encontrado</h3>
                <p>Os comprovantes serão disponibilizados após o sorteio.</p>
            </div>`;
    } else {
        // Mostrar PDFs individuais (se existirem)
        items.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'comprovante-card';
            card.innerHTML = `
                <div class="comprovante-icon">📄</div>
                <div class="comprovante-title">Comprovante ${index + 1}</div>
                <div class="comprovante-actions">
                    <button class="btn btn-primary" data-arquivo="${item}">👁️ Visualizar</button>
                    <a href="../${pasta}/${item}?v=${window.VERSION}" class="btn btn-success" download>⬇️ Baixar</a>
                </div>`;
            card.querySelector('button').addEventListener('click', () => visualizarPDF(pasta, item));
            container.appendChild(card);
        });
        
        // Para loterias especiais com JPEGs, mostrar opção de PDF unificado
        if (isSpecialLottery && jpegFiles.length > 0) {
            const pdfCard = document.createElement('div');
            pdfCard.className = 'comprovante-card pdf-unified';
            pdfCard.innerHTML = `
                <div class="comprovante-icon">📚</div>
                <div class="comprovante-title">PDF Unificado</div>
                <div class="comprovante-subtitle">${jpegFiles.length} comprovantes em um único arquivo</div>
                <div class="comprovante-actions">
                    <button class="btn btn-primary" id="generate-pdf-btn">📄 Gerar PDF</button>
                    <button class="btn btn-success" id="download-pdf-btn" style="display: none;">⬇️ Baixar PDF</button>
                </div>`;
            
            // Event listeners para geração de PDF
            pdfCard.querySelector('#generate-pdf-btn').addEventListener('click', async () => {
                const btn = pdfCard.querySelector('#generate-pdf-btn');
                const downloadBtn = pdfCard.querySelector('#download-pdf-btn');
                
                btn.textContent = '⏳ Gerando PDF...';
                btn.disabled = true;
                
                try {
                    const pdf = await generatePdfFromJpegs(jpegFiles, pasta);
                    if (pdf) {
                        // Salvar PDF no localStorage para download
                        const pdfBlob = pdf.output('blob');
                        const pdfUrl = URL.createObjectURL(pdfBlob);
                        
                        // Atualizar botão de download
                        downloadBtn.href = pdfUrl;
                        downloadBtn.download = `comprovantes_${config.loteria.modalidade.toLowerCase()}_unificado.pdf`;
                        downloadBtn.style.display = 'inline-block';
                        
                        btn.textContent = '✅ PDF Gerado';
                        btn.style.backgroundColor = '#28a745';
                        
                        // Também abrir em nova aba
                        window.open(pdfUrl, '_blank');
                    } else {
                        btn.textContent = '❌ Erro ao gerar';
                        btn.style.backgroundColor = '#dc3545';
                    }
                } catch (error) {
                    console.error('Erro ao gerar PDF:', error);
                    btn.textContent = '❌ Erro ao gerar';
                    btn.style.backgroundColor = '#dc3545';
                }
                
                btn.disabled = false;
            });
            
            container.appendChild(pdfCard);
        }
        
        // Mostrar JPEGs individuais (se não for loteria especial ou se não há PDF unificado)
        if (!isSpecialLottery && jpegFiles.length > 0) {
            jpegFiles.forEach((item, index) => {
                const card = document.createElement('div');
                card.className = 'comprovante-card';
                card.innerHTML = `
                    <div class="comprovante-icon">🖼️</div>
                    <div class="comprovante-title">Comprovante ${index + 1}</div>
                    <div class="comprovante-actions">
                        <button class="btn btn-primary" data-arquivo="${item}">👁️ Visualizar</button>
                        <a href="../${pasta}/${item}?v=${window.VERSION}" class="btn btn-success" download>⬇️ Baixar</a>
                    </div>`;
                card.querySelector('button').addEventListener('click', () => visualizarJPEG(pasta, item));
                container.appendChild(card);
            });
        }
    }
    document.getElementById('loading').style.display = 'none';
    container.style.display = 'grid';
}

function visualizarPDF(pasta, arquivo) {
    const url = `../${pasta}/${arquivo}?v=${window.VERSION}`;
    window.open(url, '_blank');
}

function visualizarJPEG(pasta, arquivo) {
    const url = `../${pasta}/${arquivo}?v=${window.VERSION}`;
    window.open(url, '_blank');
}

window.visualizarPDF = (arquivo) => { /* compat fallback if needed by legacy */ };

export async function bootstrapComprovantes() {
    const { bolaoId, loteria, pasta } = getQueryParams();
    if (!bolaoId || !loteria) {
        document.querySelector('.content').innerHTML = '<div class="error">Parâmetros inválidos. Use: ?loteria=nome&bolao=id&pasta=pasta</div>';
        return;
    }
    const config = await fetchConfig(loteria);
    if (!config || !config.boloes || !config.boloes[bolaoId]) {
        document.querySelector('.content').innerHTML = '<div class="error">Erro ao carregar informações do concurso</div>';
        return;
    }
    setBasicInfo(config, bolaoId);
    await updateStatusByResultado(config, bolaoId);
    
    // Detectar PDFs e JPEGs
    const arquivosPdf = await detectPdfs(pasta);
    const arquivosJpeg = await detectJpegs(pasta);
    
    console.log(`📄 PDFs encontrados: ${arquivosPdf.length}`);
    console.log(`🖼️ JPEGs encontrados: ${arquivosJpeg.length}`);
    
    displayComprovantes(arquivosPdf, pasta, arquivosJpeg, config);
}


