// ==========================================
// GESTIONE INVITI DOPPIO (Client-Side)
// ==========================================

/**
 * 1. Y richiede di unirsi allo slot occupato da X
 */
async function inviaRichiestaDoppio(chiaveSlot, utenteY, utenteX) {
  try {
    const { data, error } = await supabaseClient
      .from('inviti_doppio')
      .insert([
        { 
          chiave_slot: chiaveSlot, 
          proponente: utenteY, 
          destinatario: utenteX, 
          stato: 'in_attesa'
        }
      ]);

    if (error) throw error;

    alert(`Richiesta inviata con successo a ${utenteX}! Ti avviseremo quando accetterà.`);
    
    if (typeof caricaTabellone === 'function') {
      caricaTabellone();
    }
  } catch (err) {
    console.error("Errore nell'invio della richiesta di doppio:", err);
    alert("Impossibile inviare la richiesta di doppio.");
  }
}

/**
 * 2. Controllo degli inviti in sospeso per l'utente loggato (X)
 */
async function controllaInvitiDoppioPerUtente(utenteX) {
  if (!supabaseClient || !utenteX) return;
  try {
    const { data: inviti, error } = await supabaseClient
      .from('inviti_doppio')
      .select('*')
      .eq('destinatario', utenteX)
      .eq('stato', 'in_attesa');

    if (error) throw error;
    if (!inviti || inviti.length === 0) return;

    for (let invito of inviti) {
      if (isSlotScaduto(invito.chiave_slot)) {
        await supabaseClient
          .from('inviti_doppio')
          .update({ stato: 'scaduto' })
          .eq('id', invito.id);
      } else {
        mostraPopupInvito(invito);
      }
    }
  } catch (err) {
    console.error("Errore nel controllo degli inviti doppio:", err);
  }
}

/**
 * 3. Mostra una notifica a X con i pulsanti Accetta / Rifiuta
 */
function mostraPopupInvito(invito) {
  // Evita di duplicare lo stesso popup se è già visibile a schermo
  if (document.getElementById(`popup-invito-${invito.id}`)) return;

  const div = document.createElement('div');
  div.id = `popup-invito-${invito.id}`;
  div.innerHTML = `
    <div style="position: fixed; bottom: 20px; right: 20px; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); z-index: 9999; border-left: 5px solid #007bff; font-family: inherit;">
      <h4 style="margin: 0 0 10px 0; color: #333;">Richiesta per Doppio</h4>
      <p style="margin: 0 0 15px 0; color: #555;"><strong>${invito.proponente}</strong> vuole unirsi al tuo slot (${invito.chiave_slot}).</p>
      <button onclick="rispondiInvitoDoppio(${invito.id}, 'accetta', '${invito.chiave_slot}', '${invito.proponente}', '${invito.destinatario}')" style="background: #28a745; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; margin-right: 10px; font-weight: bold;">Accetta</button>
      <button onclick="rispondiInvitoDoppio(${invito.id}, 'rifiuta', '${invito.chiave_slot}', '${invito.proponente}', '${invito.destinatario}')" style="background: #dc3545; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; font-weight: bold;">Rifiuta</button>
    </div>
  `;
  document.body.appendChild(div);
}

/**
 * 4. Gestione della risposta (Accetta o Rifiuta)
 */
async function rispondiInvitoDoppio(invitoId, azione, chiaveSlot, proponente, destinatario) {
  const nuovoStato = azione === 'accetta' ? 'accettato' : 'rifiutato';

  try {
    const { error } = await supabaseClient
      .from('inviti_doppio')
      .update({ stato: nuovoStato })
      .eq('id', invitoId);

    if (error) throw error;

    if (azione === 'accetta') {
      // Aggiorna lo slot ufficiale su Google Calendar aggiungendo il proponente
      if (typeof prenotazioniGlobali !== 'undefined' && prenotazioniGlobali[chiaveSlot]) {
        if (!prenotazioniGlobali[chiaveSlot].includes(proponente)) {
          prenotazioniGlobali[chiaveSlot].push(proponente);
          await salvaPrenotazioneGoogle(chiaveSlot, prenotazioniGlobali[chiaveSlot], 'UNIONE_DOPPIO');
        }
      } else {
        // Fallback se la variabile globale non è pronta
        await salvaPrenotazioneGoogle(chiaveSlot, [destinatario, proponente], 'UNIONE_DOPPIO');
      }
      alert("Hai accettato l'invito! Il doppio è confermato.");
    } else {
      alert("Hai rifiutato la richiesta.");
    }

    const elementoPopup = document.getElementById(`popup-invito-${invitoId}`);
    if (elementoPopup) elementoPopup.remove();

    if (typeof caricaTabellone === 'function') {
      caricaTabellone();
    }

  } catch (err) {
    console.error("Errore durante la risposta all'invito:", err);
    alert("Errore nell'elaborazione della risposta.");
  }
}

/**
 * 5. Funzione di supporto per verificare se lo slot è scaduto nel tempo
 */
function isSlotScaduto(chiaveSlot) {
  try {
    const [dataIso, ora] = chiaveSlot.split('_');
    if (!dataIso || !ora) return false;
    const [hNum] = ora.split(':');
    const dataSlot = new Date(`${dataIso}T${hNum}:00:00`);
    return !isNaN(dataSlot.getTime()) && dataSlot <= new Date();
  } catch (e) {
    return false;
  }
}

// ==========================================
// POLLING AUTOMATICO IN BACKGROUND
// ==========================================
// Controlla automaticamente ogni 10 secondi se l'utente loggato ha ricevuto nuove richieste
setInterval(() => {
  const savedUser = localStorage.getItem('tennis_user');
  if (savedUser && document.visibilityState === 'visible') {
    controllaInvitiDoppioPerUtente(savedUser);
  }
}, 10000);