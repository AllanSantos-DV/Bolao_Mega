// Operações CRUD para Firestore - Apenas para usuários admin

import { getFirestore, collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js';
import { Participante, Loteria, Bolao } from './models.js';
import { cache, cacheKeys } from '../data/local-cache.js';
import { invalidateFor, InvalidationOps } from '../data/invalidation.js';

export class FirestoreAdmin {
  constructor(db) {
    this.db = db;
  }

  // === Helpers ===
  computeBolaoAgg(bolaoLike) {
    try {
      const participantesCount = Array.isArray(bolaoLike.participantes) ? bolaoLike.participantes.length : 0;
      let totalCotas = 0;
      if (bolaoLike && bolaoLike.cotas && typeof bolaoLike.cotas === 'object') {
        totalCotas = Object.values(bolaoLike.cotas).reduce((acc, v) => acc + (typeof v === 'number' ? v : parseInt(v || 0)), 0);
      }
      if (!totalCotas) {
        totalCotas = participantesCount || 0; // default 1 cota por participante
      }
      return { totalCotas, participantesCount, updatedAt: new Date().toISOString() };
    } catch (_) {
      return { totalCotas: 0, participantesCount: 0, updatedAt: new Date().toISOString() };
    }
  }

  // Verificar se usuário é admin
  async checkAdminPermission() {
    // Importar getAuth para verificar usuário atual
    const { getAuth } = await import('https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js');
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('Usuário não autenticado');
    }
    
    // Verificar se o email está na lista de admins
    const adminEmails = ['allannascimentodossantos@gmail.com'];
    if (!adminEmails.includes(user.email)) {
      throw new Error('Acesso negado: usuário não é admin');
    }
    
    console.log('Permissões de admin verificadas para:', user.email);
    return true;
  }

  // ===== PARTICIPANTES =====
  
  async createParticipante(participante) {
    await this.checkAdminPermission();
    
    const validation = participante.validate();
    if (!validation.isValid) {
      throw new Error(`Dados inválidos: ${validation.errors.join(', ')}`);
    }

    // Verificar se nome já existe
    const existing = await this.getParticipanteByName(participante.nome);
    if (existing) {
      throw new Error('Já existe um participante com este nome');
    }

    const docRef = await addDoc(collection(this.db, 'participantes'), participante.toFirestore());
    invalidateFor({ collection: 'participantes', op: InvalidationOps.CREATE });
    return docRef.id;
  }

  async getParticipante(id) {
    const docRef = doc(this.db, 'participantes', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return Participante.fromFirestore(docSnap.id, docSnap.data());
    }
    return null;
  }

  async getParticipanteByName(nome) {
    const q = query(
      collection(this.db, 'participantes'),
      where('nome', '==', nome.trim())
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return Participante.fromFirestore(doc.id, doc.data());
    }
    return null;
  }

  async getAllParticipantes() {
    const q = query(collection(this.db, 'participantes'), orderBy('nome'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => 
      Participante.fromFirestore(doc.id, doc.data())
    );
  }

  async updateParticipante(id, participante) {
    await this.checkAdminPermission();
    
    const validation = participante.validate();
    if (!validation.isValid) {
      throw new Error(`Dados inválidos: ${validation.errors.join(', ')}`);
    }

    // Verificar se nome já existe (exceto para o próprio participante)
    const existing = await this.getParticipanteByName(participante.nome);
    if (existing && existing.id !== id) {
      throw new Error('Já existe um participante com este nome');
    }

    const docRef = doc(this.db, 'participantes', id);
    await updateDoc(docRef, {
      ...participante.toFirestore(),
      updated_at: new Date().toISOString()
    });
    invalidateFor({ collection: 'participantes', op: InvalidationOps.UPDATE });
  }

  async deleteParticipante(id) {
    await this.checkAdminPermission();
    
    const docRef = doc(this.db, 'participantes', id);
    await deleteDoc(docRef);
    invalidateFor({ collection: 'participantes', op: InvalidationOps.DELETE });
  }

  // ===== LOTERIAS =====
  
  async createLoteria(loteria) {
    await this.checkAdminPermission();
    
    const validation = loteria.validate();
    if (!validation.isValid) {
      throw new Error(`Dados inválidos: ${validation.errors.join(', ')}`);
    }

    const docRef = await addDoc(collection(this.db, 'loterias'), loteria.toFirestore());
    invalidateFor({ collection: 'loterias', op: InvalidationOps.CREATE });
    return docRef.id;
  }

  async getLoteria(id) {
    const docRef = doc(this.db, 'loterias', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return Loteria.fromFirestore(docSnap.id, docSnap.data());
    }
    return null;
  }

  async getAllLoterias() {
    const q = query(collection(this.db, 'loterias'), orderBy('nome'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => 
      Loteria.fromFirestore(doc.id, doc.data())
    );
  }

  async updateLoteria(id, loteria) {
    await this.checkAdminPermission();
    
    const validation = loteria.validate();
    if (!validation.isValid) {
      throw new Error(`Dados inválidos: ${validation.errors.join(', ')}`);
    }

    const docRef = doc(this.db, 'loterias', id);
    await updateDoc(docRef, {
      ...loteria.toFirestore(),
      updated_at: new Date().toISOString()
    });
    invalidateFor({ collection: 'loterias', op: InvalidationOps.UPDATE });
  }

  async deleteLoteria(id) {
    await this.checkAdminPermission();
    
    const docRef = doc(this.db, 'loterias', id);
    await deleteDoc(docRef);
    invalidateFor({ collection: 'loterias', op: InvalidationOps.DELETE, ids: { loteriaId: id } });
  }

  // ===== BOLÕES =====
  
  async createBolao(bolao) {
    await this.checkAdminPermission();
    
    const validation = bolao.validate();
    if (!validation.isValid) {
      throw new Error(`Dados inválidos: ${validation.errors.join(', ')}`);
    }

    const docRef = await addDoc(collection(this.db, 'boloes'), bolao.toFirestore());
    invalidateFor({ collection: 'boloes', op: InvalidationOps.CREATE, ids: { loteriaId: bolao.loteria_id } });
    // Atualizar agregados públicos do bolão criado
    const agg = this.computeBolaoAgg(bolao);
    try { await updateDoc(doc(this.db, 'boloes', docRef.id), { agg }); } catch (_) {}
    cache.set(cacheKeys.bolaoAgg(docRef.id), agg, 24*60*60*1000);
    return docRef.id;
  }

  // Método específico para processar planilha e criar bolão
  async createBolaoFromSpreadsheet(bolaoData, planilhaFile, fileUploadManager) {
    await this.checkAdminPermission();
    
    // Ler e processar planilha
    const jogosRaw = await fileUploadManager.readSpreadsheet(planilhaFile);
    
    // Obter dados da loteria para validação
    const loteria = await this.getLoteria(bolaoData.loteria_id);
    if (!loteria) {
      throw new Error('Loteria não encontrada');
    }
    
    // Processar jogos para estrutura do Firestore
    const jogosEstruturados = fileUploadManager.processJogosForFirestore(jogosRaw);
    
    // Criar bolão com jogos estruturados
    const bolao = new Bolao({
      ...bolaoData,
      jogos: jogosEstruturados
    });
    
    const validation = bolao.validate();
    if (!validation.isValid) {
      throw new Error(`Dados inválidos: ${validation.errors.join(', ')}`);
    }

    const docRef = await addDoc(collection(this.db, 'boloes'), bolao.toFirestore());
    try {
      const agg = this.computeBolaoAgg(bolao);
      await updateDoc(doc(this.db, 'boloes', docRef.id), { agg });
      cache.set(cacheKeys.bolaoAgg(docRef.id), agg, 24*60*60*1000);
    } catch (_) {}
    return {
      id: docRef.id,
      resumo: fileUploadManager.gerarResumoJogos(jogosEstruturados)
    };
  }

  async getBolao(id) {
    const docRef = doc(this.db, 'boloes', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return Bolao.fromFirestore(docSnap.id, docSnap.data());
    }
    return null;
  }

  async getBolaoAgg(id) {
    const ref = doc(this.db, 'boloes', id);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return (snap.data() || {}).agg || null;
    }
    return null;
  }

  async getAllBoloes() {
    const q = query(collection(this.db, 'boloes'), orderBy('created_at', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => 
      Bolao.fromFirestore(doc.id, doc.data())
    );
  }

  async getBoloesByLoteria(loteriaId) {
    const q = query(
      collection(this.db, 'boloes'),
      where('loteria_id', '==', loteriaId),
      orderBy('created_at', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => 
      Bolao.fromFirestore(doc.id, doc.data())
    );
  }

  async updateBolao(id, bolao) {
    await this.checkAdminPermission();
    
    const validation = bolao.validate();
    if (!validation.isValid) {
      throw new Error(`Dados inválidos: ${validation.errors.join(', ')}`);
    }

    const docRef = doc(this.db, 'boloes', id);
    await updateDoc(docRef, {
      ...bolao.toFirestore(),
      updated_at: new Date().toISOString()
    });
    invalidateFor({ collection: 'boloes', op: InvalidationOps.UPDATE, ids: { loteriaId: bolao.loteria_id, bolaoId: id } });
    const agg = this.computeBolaoAgg(bolao);
    try { await updateDoc(docRef, { agg }); } catch (_) {}
    cache.set(cacheKeys.bolaoAgg(id), agg, 24*60*60*1000);
  }

  async deleteBolao(id) {
    await this.checkAdminPermission();
    
    const docRef = doc(this.db, 'boloes', id);
    await deleteDoc(docRef);
    invalidateFor({ collection: 'boloes', op: InvalidationOps.DELETE, ids: { bolaoId: id } });
  }

  // ===== UTILITÁRIOS =====
  
  async getParticipantesComTelefone() {
    const q = query(
      collection(this.db, 'participantes'),
      where('telefone', '!=', ''),
      orderBy('telefone'),
      orderBy('nome')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => 
      Participante.fromFirestore(doc.id, doc.data())
    );
  }

  async searchParticipantes(termo) {
    const allParticipantes = await this.getAllParticipantes();
    const termoLower = termo.toLowerCase();
    
    return allParticipantes.filter(p => 
      p.nome.toLowerCase().includes(termoLower) ||
      p.telefone.includes(termo) ||
      (p.chavepix && p.chavepix.toLowerCase().includes(termoLower))
    );
  }
}
