export async function loadIncludes() {
    try {
        const nodes = document.querySelectorAll('[data-include]');
        const tasks = Array.from(nodes).map(async (el) => {
            const url = el.getAttribute('data-include');
            if (!url) return;
            const cacheBuster = (typeof window !== 'undefined' && window.VERSION) ? `?v=${window.VERSION}` : '';
            try {
                const resp = await fetch(url + cacheBuster);
                if (resp.ok) {
                    const html = await resp.text();
                    el.innerHTML = html;
                } else {
                    console.warn('Include falhou', { url, status: resp.status, statusText: resp.statusText });
                }
            } catch (err) {
                console.warn('Erro ao carregar include', { url, message: err?.message });
            }
        });
        await Promise.all(tasks);
    } catch (e) {
        console.warn('Erro no loader de includes', e);
    }
}


