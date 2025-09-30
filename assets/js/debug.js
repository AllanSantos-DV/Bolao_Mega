window.NOVOAPP_DEBUG = true;
window.NOVOAPP_LOGS = [];

export function log(cat, msg, data=null){
    const t = new Date().toLocaleTimeString();
    let sanitizedData = data;
    
    if (data && typeof data === 'object') {
        sanitizedData = { ...data };
        if (sanitizedData.uid) sanitizedData.uid = sanitizedData.uid.substring(0, 8) + '...';
        if (sanitizedData.email) sanitizedData.email = sanitizedData.email.replace(/(.{3}).*(@.*)/, '$1***$2');
    }
    
    const line = `[${t}] [${cat}] ${msg}${sanitizedData?': '+JSON.stringify(sanitizedData):''}`;
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


