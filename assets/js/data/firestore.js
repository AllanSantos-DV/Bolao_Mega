import { initFirebase, getFirebase } from '../firebase/init.js';

export async function listLoteriasFromDB(){
    await initFirebase();
    const { db } = getFirebase();
    const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js');
    const snap = await getDocs(collection(db, 'loterias'));
    return snap.docs.map(d=>({ id:d.id, ...d.data() }));
}

export async function getLoteriaConfigFromDB(loteriaId){
    await initFirebase();
    const { db } = getFirebase();
    const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js');
    const dref = doc(db, 'loterias', loteriaId);
    const dsnap = await getDoc(dref);
    if(!dsnap.exists()) return null;
    return { id: dsnap.id, ...dsnap.data() };
}


