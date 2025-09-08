import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

export async function loadFirebaseConfig() {
    try {
        const resp = await fetch('./firebase-config.js');
        if (resp.ok) {
            const script = await resp.text();
            // Executa em escopo global pois define window.FIREBASE_*
            eval(script);
            return {
                apiKey: window.FIREBASE_API_KEY,
                authDomain: window.FIREBASE_AUTH_DOMAIN,
                projectId: window.FIREBASE_PROJECT_ID,
                storageBucket: window.FIREBASE_STORAGE_BUCKET,
                messagingSenderId: window.FIREBASE_MESSAGING_SENDER_ID,
                appId: window.FIREBASE_APP_ID
            };
        }
    } catch (e) {
        console.warn('Erro ao carregar firebase-config.js', e);
    }
    // Fallback
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


