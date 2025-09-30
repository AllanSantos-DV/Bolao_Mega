export async function retry(fn, {
  attempts = 3,
  baseDelayMs = 300,
  factor = 2,
  jitter = 0.3,
  timeoutMs = 7000,
  signal
} = {}) {
  let lastError;
  for (let i = 0; i < attempts; i += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const result = await fn({ signal: signal || controller.signal });
      clearTimeout(timer);
      return result;
    } catch (e) {
      clearTimeout(timer);
      lastError = e;
      // Non-retriable errors: auth/permission (auth/..., permission, 403)
      const msg = String(e?.message || e);
      if (/auth\//i.test(msg) || /permission/i.test(msg) || /403/.test(msg) || /invalid-argument/i.test(msg)) {
        break;
      }
      if (i < attempts - 1) {
        const jitterMs = baseDelayMs * (jitter * Math.random());
        const delay = baseDelayMs * Math.pow(factor, i) + jitterMs;
        await new Promise(res => setTimeout(res, delay));
        continue;
      }
    }
  }
  throw lastError;
}


