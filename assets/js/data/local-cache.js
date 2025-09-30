// Simple local storage cache with TTL and versioning

const CACHE_VERSION = 'v1';
const PREFIX = `cache:${CACHE_VERSION}:`;

// Metrics & logging (in-memory; lifecycle = page session)
const cacheStats = {
  hits: 0,
  misses: 0,
  sets: 0,
  invalidations: 0
};

const cacheLog = [];
const MAX_LOG = 200;

function log(event, payload) {
  try {
    const entry = { t: new Date().toISOString(), event, ...payload };
    cacheLog.push(entry);
    if (cacheLog.length > MAX_LOG) cacheLog.shift();
  } catch (_) { /* noop */ }
}

function nowMs() {
  return Date.now();
}

function buildKey(key) {
  return `${PREFIX}${key}`;
}

export const cache = {
  set(key, value, ttlMs = 24 * 60 * 60 * 1000) {
    try {
      const entry = {
        v: CACHE_VERSION,
        t: nowMs(),
        e: ttlMs > 0 ? nowMs() + ttlMs : 0,
        d: value
      };
      localStorage.setItem(buildKey(key), JSON.stringify(entry));
      cacheStats.sets += 1;
      log('set', { key, ttlMs });
      return true;
    } catch (_) {
      return false;
    }
  },
  get(key) {
    try {
      const raw = localStorage.getItem(buildKey(key));
      if (!raw) return null;
      const entry = JSON.parse(raw);
      if (entry.e && entry.e > 0 && entry.e < nowMs()) {
        localStorage.removeItem(buildKey(key));
        cacheStats.misses += 1;
        log('expired', { key });
        return null;
      }
      cacheStats.hits += 1;
      log('hit', { key });
      return entry.d;
    } catch (_) {
      cacheStats.misses += 1;
      return null;
    }
  },
  hasFresh(key) {
    try {
      const raw = localStorage.getItem(buildKey(key));
      if (!raw) return false;
      const entry = JSON.parse(raw);
      if (entry.v !== CACHE_VERSION) return false;
      if (entry.e && entry.e > 0 && entry.e < nowMs()) return false;
      return true;
    } catch (_) {
      return false;
    }
  },
  invalidate(keyOrPrefix) {
    try {
      const prefix = buildKey(keyOrPrefix);
      for (let i = localStorage.length - 1; i >= 0; i -= 1) {
        const k = localStorage.key(i);
        if (k && k.startsWith(prefix)) {
          localStorage.removeItem(k);
        }
      }
      cacheStats.invalidations += 1;
      log('invalidate', { prefix: keyOrPrefix });
    } catch (_) {
      /* noop */
    }
  }
};

export const cacheKeys = {
  loterias: 'loterias',
  boloesByLoteria: (loteriaId) => `boloesByLoteria:${loteriaId}`,
  jogosByBolao: (bolaoId) => `jogos:${bolaoId}`,
  counts: 'counts',
  bolaoAgg: (bolaoId) => `bolaoAgg:${bolaoId}`
};

export const cacheMetrics = {
  getStats() { return { ...cacheStats }; },
  getLog() { return [...cacheLog]; },
  reset() { cacheStats.hits = 0; cacheStats.misses = 0; cacheStats.sets = 0; cacheStats.invalidations = 0; cacheLog.length = 0; }
};

// SWR helper: returns { staleData, refresh: Promise }
export async function swr(key, fetcher, ttlMs = 24 * 60 * 60 * 1000) {
  const staleData = cache.get(key);
  const refresh = (async () => {
    try {
      const fresh = await fetcher();
      cache.set(key, fresh, ttlMs);
      log('swr_refresh', { key });
      return fresh;
    } catch (e) {
      log('swr_error', { key, message: e?.message });
      return staleData;
    }
  })();
  return { staleData, refresh };
}

// Expose prefix for listeners that need to match keys
export const cachePrefix = PREFIX;


