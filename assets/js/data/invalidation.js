import { cache, cacheKeys } from './local-cache.js';

export const InvalidationOps = Object.freeze({
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete'
});

export function invalidateFor({ collection, op, ids = {}, extra = {} }) {
  try {
    switch (collection) {
      case 'participantes': {
        // Público não guarda PII; apenas contagens gerais
        cache.invalidate(cacheKeys.counts);
        break;
      }
      case 'loterias': {
        cache.invalidate(cacheKeys.loterias);
        cache.invalidate(cacheKeys.counts);
        // Em DELETE, também limpar listas de bolões da loteria removida
        if (op === InvalidationOps.DELETE && ids.loteriaId) {
          cache.invalidate(cacheKeys.boloesByLoteria(ids.loteriaId));
        }
        break;
      }
      case 'boloes': {
        if (ids.loteriaId) cache.invalidate(cacheKeys.boloesByLoteria(ids.loteriaId));
        if (ids.bolaoId) cache.invalidate(cacheKeys.bolaoAgg(ids.bolaoId));
        cache.invalidate(cacheKeys.counts);
        break;
      }
      case 'jogos': {
        if (ids.bolaoId) cache.invalidate(cacheKeys.jogosByBolao(ids.bolaoId));
        break;
      }
      default: {
        // No-op for unknown collections
        break;
      }
    }
  } catch (_) { /* noop */ }
}


