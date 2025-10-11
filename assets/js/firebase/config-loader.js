
export async function ensureFirebaseConfigAvailable() {
    if (window.firebaseConfig && typeof window.firebaseConfig === 'object') {
        return true;
    }

    // Tentar carregar configuração segura (não pública)
    try {
        await loadScript('/firebase-config.js?v=' + (window.VERSION || Date.now()));
        if (window.firebaseConfig && typeof window.firebaseConfig === 'object') {
            return true;
        }
    } catch (_) {
        console.warn('Configuração segura não encontrada, tentando configuração pública...');
    }

    // Fallback para configuração pública (menos seguro)
    const path = '/firebase-config.public.js';
    try {
        await loadScript(path + '?v=' + (window.VERSION || Date.now()));
        if (window.firebaseConfig && typeof window.firebaseConfig === 'object') {
            console.warn('Usando configuração pública - considere mover para configuração segura');
            return true;
        }
    } catch (_) {}

    console.error('Firebase config não encontrado. Configure firebase-config.js na raiz do projeto');
    return false;
}

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('Falha ao carregar script: ' + src));
        document.head.appendChild(s);
    });
}


