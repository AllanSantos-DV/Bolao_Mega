
export async function ensureFirebaseConfigAvailable() {
    if (window.firebaseConfig && typeof window.firebaseConfig === 'object') {
        return true;
    }
    const path = '/firebase-config.public.js';
    try {
        await loadScript(path + '?v=' + (window.VERSION || Date.now()));
        if (window.firebaseConfig && typeof window.firebaseConfig === 'object') {
            return true;
        }
    } catch (_) {}
    console.error('Firebase config não encontrado. Coloque firebase-config.public.js na raiz do projeto');
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


