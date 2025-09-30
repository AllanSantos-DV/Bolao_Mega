import { ensureFirebaseConfigAvailable } from './firebase/config-loader.js';

async function main() {
  await ensureFirebaseConfigAvailable();
  const appMod = await import('https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js');
  const authMod = await import('https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js');
  const app = appMod.initializeApp(window.firebaseConfig);
  const auth = authMod.getAuth(app);
  authMod.useDeviceLanguage(auth);
  await authMod.setPersistence(auth, authMod.browserLocalPersistence);

  const $ = (id) => document.getElementById(id);
  const showErr = (m) => { const e = $('msg-err'); e.textContent = m; e.style.display = 'block'; $('msg-ok').style.display = 'none'; };
  const showOk = (m) => { const o = $('msg-ok'); o.textContent = m; o.style.display = 'block'; $('msg-err').style.display = 'none'; };
  const clearMsgs = () => { $('msg-err').style.display='none'; $('msg-ok').style.display='none'; };

  const provider = new authMod.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  $('btn-google').addEventListener('click', async () => {
    try {
      clearMsgs();
      console.log('[LOGIN] Iniciando login Google...');
      await authMod.signInWithPopup(auth, provider);
      console.log('[LOGIN] Login Google sucesso, redirecionando...');
      window.location.replace('/app');
    } catch (err) {
      console.error('[LOGIN] google popup erro:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        showErr('Login cancelado pelo usuário.');
      } else if (err.code === 'auth/popup-blocked') {
        showErr('Popup bloqueado. Permita popups para este site.');
      } else {
        showErr(err?.message || 'Erro ao entrar com Google.');
      }
    }
  });

  $('form-email').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    clearMsgs();
    const email = $('email').value.trim();
    const password = $('password').value;
    if (!email || !password) { showErr('Informe e-mail e senha'); return; }
    try {
      await authMod.signInWithEmailAndPassword(auth, email, password);
      window.location.replace('/app');
    } catch (err) {
      console.error('[LOGIN] email', err);
      if (err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential') showErr('Credenciais inválidas.');
      else if (err?.code === 'auth/user-not-found') showErr('Usuário não encontrado.');
      else if (err?.code === 'auth/too-many-requests') showErr('Muitas tentativas. Tente mais tarde.');
      else showErr('Erro ao autenticar.');
    }
  });

  $('link-reset').addEventListener('click', async (ev) => {
    ev.preventDefault();
    clearMsgs();
    const email = $('email').value.trim();
    if (!email) { showErr('Informe seu e-mail para redefinir a senha.'); return; }
    try {
      await authMod.sendPasswordResetEmail(auth, email);
      showOk('E-mail de redefinição enviado. Verifique sua caixa de entrada.');
    } catch (err) {
      console.error('[LOGIN] reset', err);
      if (err?.code === 'auth/user-not-found') showErr('E-mail não encontrado.');
      else showErr('Não foi possível enviar o e-mail agora.');
    }
  });
}

main();


