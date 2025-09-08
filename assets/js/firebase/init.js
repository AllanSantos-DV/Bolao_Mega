import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

export async function loadFirebaseConfig() {
    const version = (typeof window !== 'undefined' && window.VERSION) ? `?v=${window.VERSION}` : '';
    // 1) arquivo local gerado pelo servidor de dev (ignorado no git)
    try {
        const resp = await fetch(`./firebase-config.js${version}`);
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
    } catch (_) { /* continua */ }
    // 2) fallback público para GitHub Pages (arquivo commitado sem segredos sensíveis)
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
    } catch (_) { /* continua */ }
    // 3) Fallback padrão
    return {
        apiKey: 'CONFIG_PADRAO_API_KEY',
        authDomain: 'mega-bolao-2025.firebaseapp.com',
        projectId: 'mega-bolao-2025',
        storageBucket: 'mega-bolao-2025.appspot.com',
        messagingSenderId: 'CONFIG_PADRAO_SENDER_ID',
        appId: 'CONFIG_PADRAO_APP_ID'
    };
}

export async function initFirebase() {
    const config = await loadFirebaseConfig();
    const app = initializeApp(config);
    const db = getFirestore(app);
    return { app, db };
}


