// Firebase Firestore SDK
// Este arquivo contém apenas as funções necessárias do Firestore

export function getFirestore(app) {
    console.log('🔥 Firestore inicializado para app:', app.options.projectId);
    return {
        app: app,
        _deleted: false,
        type: 'firestore'
    };
}

export function doc(db, collectionPath, ...pathSegments) {
    const path = [collectionPath, ...pathSegments].join('/');
    return {
        id: pathSegments[pathSegments.length - 1],
        path: path,
        parent: {
            id: collectionPath,
            path: collectionPath
        },
        firestore: db
    };
}

export function collection(db, collectionPath, ...pathSegments) {
    const path = [collectionPath, ...pathSegments].join('/');
    return {
        id: collectionPath,
        path: path,
        firestore: db
    };
}

export async function getDoc(docRef) {
    try {
        if (!docRef.firestore || !docRef.firestore.app) {
            throw new Error('Firestore não inicializado corretamente');
        }
        
        const response = await fetch(`https://firestore.googleapis.com/v1/projects/${docRef.firestore.app.options.projectId}/databases/(default)/documents/${docRef.path}`);
        
        if (response.ok) {
            const data = await response.json();
            
            // Verificar se realmente existem documentos
            if (data.documents && data.documents.length > 0) {
                const documentData = data.documents[0];
                const convertedData = documentData.fields ? convertFirestoreData(documentData.fields) : {};
                return {
                    exists: () => true,
                    data: () => convertedData,
                    id: docRef.id,
                    ref: docRef
                };
            } else {
                // Não há documentos, retornar como não existente
                return {
                    exists: () => false,
                    data: () => null,
                    id: docRef.id,
                    ref: docRef
                };
            }
        } else {
            return {
                exists: () => false,
                data: () => null,
                id: docRef.id,
                ref: docRef
            };
        }
    } catch (error) {
        console.error('❌ Erro ao consultar documento:', error.message);
        return {
            exists: () => false,
            data: () => null,
            id: docRef.id,
            ref: docRef
        };
    }
}

export async function setDoc(docRef, data) {
    try {
        const firestoreData = convertToFirestoreData(data);
        const response = await fetch(`https://firestore.googleapis.com/v1/projects/${docRef.firestore.app.options.projectId}/databases/(default)/documents/${docRef.path}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                fields: firestoreData
            })
        });
        
        if (response.ok) {
            return true;
        } else {
            const errorText = await response.text();
            console.error('❌ Erro ao salvar documento:', errorText);
            return false;
        }
    } catch (error) {
        console.error('❌ Erro ao salvar documento:', error.message);
        return false;
    }
}

export async function getDocs(collectionRef) {
    try {
        const response = await fetch(`https://firestore.googleapis.com/v1/projects/${collectionRef.firestore.app.options.projectId}/databases/(default)/documents/${collectionRef.path}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Coleção consultada:', data);
            
            const docs = data.documents ? data.documents.map(doc => ({
                id: doc.name.split('/').pop(),
                data: () => doc.fields ? convertFirestoreData(doc.fields) : {},
                ref: {
                    id: doc.name.split('/').pop(),
                    path: doc.name,
                    firestore: collectionRef.firestore
                }
            })) : [];
            
            return {
                forEach: (callback) => docs.forEach(callback),
                size: docs.length,
                empty: docs.length === 0
            };
        } else {
            console.log('❌ Coleção não encontrada ou vazia');
            return {
                forEach: () => {},
                size: 0,
                empty: true
            };
        }
    } catch (error) {
        console.error('❌ Erro ao consultar coleção:', error);
        return {
            forEach: () => {},
            size: 0,
            empty: true
        };
    }
}

export function serverTimestamp() {
    return {
        _methodName: 'serverTimestamp',
        _timestamp: new Date().toISOString()
    };
}

// Função para converter dados do Firestore para JavaScript
function convertFirestoreData(fields) {
    const result = {};
    for (const [key, value] of Object.entries(fields)) {
        if (value.stringValue !== undefined) {
            result[key] = value.stringValue;
        } else if (value.integerValue !== undefined) {
            result[key] = parseInt(value.integerValue);
        } else if (value.doubleValue !== undefined) {
            result[key] = parseFloat(value.doubleValue);
        } else if (value.booleanValue !== undefined) {
            result[key] = value.booleanValue;
        } else if (value.arrayValue !== undefined) {
            result[key] = value.arrayValue.values.map(v => {
                if (v.integerValue !== undefined) {
                    return parseInt(v.integerValue);
                } else if (v.doubleValue !== undefined) {
                    return parseFloat(v.doubleValue);
                } else if (v.stringValue !== undefined) {
                    return v.stringValue;
                }
                return v;
            });
        } else if (value.timestampValue !== undefined) {
            result[key] = new Date(value.timestampValue);
        }
    }
    return result;
}

// Função para converter dados JavaScript para Firestore
function convertToFirestoreData(data) {
    const result = {};
    for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'string') {
            result[key] = { stringValue: value };
        } else if (typeof value === 'number') {
            result[key] = { doubleValue: value };
        } else if (typeof value === 'boolean') {
            result[key] = { booleanValue: value };
        } else if (Array.isArray(value)) {
            result[key] = { arrayValue: { values: value.map(v => convertToFirestoreData({item: v}).item) } };
        } else if (value instanceof Date) {
            result[key] = { timestampValue: value.toISOString() };
        } else if (value && value._methodName === 'serverTimestamp') {
            result[key] = { timestampValue: new Date().toISOString() };
        }
    }
    return result;
}
