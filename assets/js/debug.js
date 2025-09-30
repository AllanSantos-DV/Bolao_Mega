window.NOVOAPP_DEBUG = true;
window.NOVOAPP_LOGS = [];

export function log(cat, msg, data=null){
    const t = new Date().toLocaleTimeString();
    const line = `[${t}] [${cat}] ${msg}${data?': '+JSON.stringify(data):''}`;
    window.NOVOAPP_LOGS.push(line);
    if(window.NOVOAPP_DEBUG) console.log('🔍', line);
}

export function mountPanel(){
    const panel = document.getElementById('debug-panel');
    const logs = document.getElementById('debug-logs');
    if(!panel||!logs) return;
    logs.innerHTML = window.NOVOAPP_LOGS.slice(-100).join('<br>');
}

export function toggle(){
    const panel = document.getElementById('debug-panel');
    if(!panel) return;
    panel.style.display = panel.style.display==='none'?'block':'none';
    mountPanel();
}


