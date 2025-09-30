import { ensureFirebaseConfigAvailable } from './firebase/config-loader.js';

async function getFirebase() {
    await ensureFirebaseConfigAvailable();
    const appMod = await import('https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js');
    const authMod = await import('https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js');
    const app = appMod.initializeApp(window.firebaseConfig);
    const auth = authMod.getAuth(app);
    try { await authMod.setPersistence(auth, authMod.browserLocalPersistence); } catch(_){}
    try { auth.useDeviceLanguage && auth.useDeviceLanguage(); } catch(_){}
    return { auth, authMod };
}

function status(msg, ok=false) {
    const el = document.getElementById('auth-status');
    if (!el) return;
    el.innerHTML = ok
      ? `<div class="status-success">✅ ${msg}</div>`
      : `<div class="error">❌ ${msg}</div>`;
}

document.getElementById('btn-google')?.addEventListener('click', async () => {
    try {
        const { auth, authMod } = await getFirebase();
        const provider = new authMod.GoogleAuthProvider();
        await authMod.signInWithRedirect(auth, provider);
        return;
    } catch (e) {
        status(e.message || 'Erro ao autenticar com Google');
        console.error('[Auth][Google]', e);
    }
});

document.getElementById('btn-email')?.addEventListener('click', async () => {
    try {
        const email = document.getElementById('email')?.value?.trim();
        const password = document.getElementById('password')?.value;
        if (!email || !password) return status('Informe email e senha');
        const { auth, authMod } = await getFirebase();
        await authMod.signInWithEmailAndPassword(auth, email, password);
        status('Login realizado com sucesso!', true);
        location.href = './index.html';
    } catch (e) {
        status(e.message || 'Erro ao autenticar com email/senha');
    }
});

(async () => {
    const { auth, authMod } = await getFirebase();
    try {
        const result = await authMod.getRedirectResult(auth);
        if (result && result.user) {
            status('Login realizado com sucesso!', true);
            return location.replace('./index.html');
        }
    } catch (e) {
        console.warn('[Auth][RedirectResult]', e?.message || e);
    }

    authMod.onAuthStateChanged(auth, (user) => {
        if (user) {
            location.replace('./index.html');
        }
    });
})();


