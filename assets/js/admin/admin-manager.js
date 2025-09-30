// Admin Manager - ES6 Module

import { ParticipantesManager } from './participantes.js';
import { LoteriasManager } from './loterias.js';
import { BoloesManager } from './boloes.js';
import { FirestoreAdmin } from './firestore-admin.js';

export class AdminManager {
  constructor(firestoreAdmin) {
    this.firestoreAdmin = firestoreAdmin;
    this.participantesManager = new ParticipantesManager(firestoreAdmin);
    this.loteriasManager = new LoteriasManager(firestoreAdmin);
    this.boloesManager = new BoloesManager(firestoreAdmin);
  }

  // Modal administrativo
  openAdminModal(type) {
    console.log(`Abrindo modal para ${type}`);
    
    switch(type) {
      case 'participantes':
        this.participantesManager.showParticipanteModal();
        break;
      case 'loterias':
        this.loteriasManager.showLoteriaModal();
        break;
      case 'boloes':
        this.boloesManager.showBolaoModal();
        break;
      default:
        this.participantesManager.showToast(`Modal para ${type} não implementado`, 'error');
    }
  }

  // Listar participantes
  async listParticipantes() {
    await this.participantesManager.listParticipantes();
  }

  // Listar loterias
  async listLoterias() {
    await this.loteriasManager.listLoterias();
  }
}
