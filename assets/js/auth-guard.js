export async function ensureAuthenticatedAndGetAuth() {
  const v = window.VERSION || Date.now();
  const { ensureFirebaseConfigAvailable } = await import(`../js/firebase/config-loader.js?v=${v}`);
  await ensureFirebaseConfigAvailable();

  const appMod = await import('https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js');
  const authMod = await import('https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js');
  const app = appMod.initializeApp(window.firebaseConfig);
  const auth = authMod.getAuth(app);

  await new Promise((resolve) => {
    authMod.onAuthStateChanged(auth, (user) => {
      if (!user) {
        const loginPath = window.location.hostname === 'localhost' ? '/pages/login.html' : '/login';
        window.location.replace(loginPath);
      } else {
        resolve();
      }
    });
  });

  return { auth, authMod };
}


