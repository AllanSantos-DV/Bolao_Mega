import { cache, cacheKeys } from './local-cache.js';

function setBadgeText(elementId, count) {
  const el = document.getElementById(elementId);
  if (el) el.textContent = `(${count})`;
}

export const countersService = {
  async updateLoteriasBadge(options) {
    try {
      const { loterias } = options || {};
      let count = Array.isArray(loterias) ? loterias.length : null;
      if (count === null) {
        if (cache.hasFresh(cacheKeys.loterias)) {
          const cached = cache.get(cacheKeys.loterias) || [];
          count = cached.length;
        }
      }
      if (typeof count === 'number') setBadgeText('count-loterias', count);
    } catch (_) { /* noop */ }
  },

  async updateParticipantesBadge(getParticipantesFn, isAdmin) {
    try {
      if (!isAdmin) return;
      const participantes = await getParticipantesFn();
      const count = Array.isArray(participantes) ? participantes.length : 0;
      setBadgeText('count-participantes', count);
    } catch (_) { /* noop */ }
  },

  async refreshAll(firestoreAdmin, isAdmin) {
    await this.updateLoteriasBadge({});
    await this.updateParticipantesBadge(() => firestoreAdmin.getAllParticipantes(), isAdmin);
  }
};


