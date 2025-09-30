import { ensureFirebaseConfigAvailable } from './config-loader.js';

let app = null;
let auth = null;
let db = null;

export async function initFirebase() {
    const ok = await ensureFirebaseConfigAvailable();
    if (!ok) throw new Error('Config Firebase ausente');

    if (app) return { app, auth, db };

    const firebase = await import('https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js');
    const authMod = await import('https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js');
    const fsMod = await import('https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js');

    app = firebase.initializeApp(window.firebaseConfig);
    auth = authMod.getAuth(app);
    db = fsMod.getFirestore(app);

    return { app, auth, db };
}

export function getFirebase() {
    if (!app) throw new Error('Firebase não inicializado');
    return { app, auth, db };
}


