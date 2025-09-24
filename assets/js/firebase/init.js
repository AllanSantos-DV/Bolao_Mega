import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

export async function loadFirebaseConfig() {
    const version = (typeof window !== 'undefined' && window.VERSION) ? `?v=${window.VERSION}` : '';
    
    // Carregar configuração do GitHub Pages
    try {
        const resp = await fetch(`./firebase-config.public.js${version}`);
        if (resp.ok) {
            const script = await resp.text();
            eval(script);
            if (window.FIREBASE_API_KEY && window.FIREBASE_PROJECT_ID) {
                return {
                    apiKey: window.FIREBASE_API_KEY,
                    authDomain: window.FIREBASE_AUTH_DOMAIN,
                    projectId: window.FIREBASE_PROJECT_ID,
                    storageBucket: window.FIREBASE_STORAGE_BUCKET,
                    messagingSenderId: window.FIREBASE_MESSAGING_SENDER_ID,
                    appId: window.FIREBASE_APP_ID
                };
            }
        }
    } catch (error) {
        console.warn('Erro ao carregar configuração Firebase:', error);
    }
    
    // Fallback padrão (não deve ser usado em produção)
    console.warn('⚠️ Usando configuração Firebase padrão - verifique os secrets do GitHub');
    return {
        apiKey: 'AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        authDomain: 'mega-bolao-2025.firebaseapp.com',
        projectId: 'mega-bolao-2025',
        storageBucket: 'mega-bolao-2025.appspot.com',
        messagingSenderId: '123456789012',
        appId: '1:123456789012:web:abcdef1234567890abcdef'
    };
}

export async function initFirebase() {
    const config = await loadFirebaseConfig();
    const app = initializeApp(config);
    const db = getFirestore(app);
    return { app, db };
}


