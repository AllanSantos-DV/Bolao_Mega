// Firebase App SDK
// Este arquivo contém apenas as funções necessárias do Firebase App

export function initializeApp(config) {
    // Simulação básica para desenvolvimento
    console.log('🔥 Firebase App inicializado:', config.projectId);
    return {
        name: '[DEFAULT]',
        options: config,
        _deleted: false
    };
}

export function getApps() {
    return [];
}

export function getApp(name) {
    return null;
}
