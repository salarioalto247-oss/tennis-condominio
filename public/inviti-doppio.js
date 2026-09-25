// ==========================================
// GESTIONE INVITI DOPPIO (Client-Side con Polling e Realtime)
// ==========================================

let supabaseRealtimeChannel = null;

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

    alert(`Richiesta inviata con successo a ${utenteX}! Ti avviseremo quando accetterà o rifiuterà.`);
    
    if (typeof caricaTabellone === 'function') {
      caricaTabellone();
    }
  } catch (err) {
    console.error("Errore nell'invio della richiesta di doppio:", err);
    alert("Impossibile inviare la richiesta di doppio.");
  }
}

/**
 * 2. Inizializzazione dell'ascolto (Realtime + Polling di sicurezza)
 */
function avviaAscoltoInvitiRealtime(utenteCorrente) {
  if (!supabaseClient || !utenteCorrente) return;

  // Chiudi eventuali canali precedenti per evitare duplicazioni
  if (supabaseRealtimeChannel) {
    supabaseClient.removeChannel(supabaseRealtimeChannel);
  }

  // Ascolta i cambiamenti sulla tabella inviti_doppio via Realtime
  supabaseRealtimeChannel = supabaseClient
    .channel('public:inviti_doppio')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'inviti_doppio' },
      (payload) => {
        const nuovoInvito = payload.new;
        const vecchioInvito = payload.old;

        // CASO A: Arriva una nuova richiesta per me (sono il destinatario)
        if (payload.eventType === 'INSERT' && nuovoInvito.destinatario && utenteCorrente && nuovoInvito.destinatario.toLowerCase() === utenteCorrente.toLowerCase() && nuovoInvito.stato === 'in_attesa') {
          if (!isSlotScaduto(nuovoInvito.chiave_slot)) {
            mostraPopupInvito(nuovoInvito);
          }
        }

        // CASO B: La mia richiesta inviata a qualcun altro è stata aggiornata (sono il proponente)
        if (payload.eventType === 'UPDATE' && vecchioInvito && proponenteCoincide(vecchioInvito, utenteCorrente)) {
          const [dataIso, ora] = nuovoInvito.chiave_slot.split('_');
          
          if (nuovoInvito.stato === 'accettato') {
            alert(`🎾 Ottime notizie! La tua richiesta di doppio per il giorno ${dataIso} alle ore ${ora} è stata ACCETTATA da ${nuovoInvito.destinatario}!`);
            if (typeof caricaTabellone === 'function') caricaTabellone();
          } else if (nuovoInvito.stato === 'rifiutato') {
            alert(`❌ Spiacente, la tua richiesta di doppio per il giorno ${dataIso} alle ore ${ora} è stata RIFIUTATA da ${nuovoInvito.destinatario}.`);
            if (typeof caricaTabellone === 'function') caricaTabellone();
          }
        }
      }
    )
    .subscribe();

  // Esegui anche un controllo iniziale all'avvio
  controllaInvitiInSospesoIniziali(utenteCorrente);
}

/**
 * Controlla inviti pendenti al login
 */
async function controllaInvitiInSospesoIniziali(utenteX) {
  try {
    const { data: inviti, error } = await supabaseClient
      .from('inviti_doppio')
      .select('*')
      .ilike('destinatario', utenteX)
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
    console.error("Errore nel controllo iniziale degli inviti:", err);
  }
}

function proponenteCoincide(invito, utente) {
  return invito.proponente && invito.proponente.toLowerCase() === utente.toLowerCase();
}

/**
 * 3. Mostra una notifica a X con i pulsanti Accetta / Rifiuta
 */
function mostraPopupInvito(invito) {
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
      if (typeof prenotazioniGlobali !== 'undefined' && prenotazioniGlobali[chiaveSlot]) {
        if (!prenotazioniGlobali[chiaveSlot].includes(proponente)) {
          prenotazioniGlobali[chiaveSlot].push(proponente);
          await salvaPrenotazioneGoogle(chiaveSlot, prenotazioniGlobali[chiaveSlot], 'UNIONE_DOPPIO');
        }
      } else {
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
// POLLING DI SICUREZZA (Ogni 5 secondi)
// ==========================================
setInterval(async () => {
  const savedUser = localStorage.getItem('tennis_user');
  if (!savedUser || typeof supabaseClient === 'undefined' || !supabaseClient) return;

  try {
    // 1. Controlla nuove richieste in arrivo (Destinatario)
    const { data: invitiRicevuti, error: errRicevuti } = await supabaseClient
      .from('inviti_doppio')
      .select('*')
      .ilike('destinatario', savedUser)
      .eq('stato', 'in_attesa');

    if (!errRicevuti && invitiRicevuti && invitiRicevuti.length > 0) {
      invitiRicevuti.forEach(invito => {
        if (!isSlotScaduto(invito.chiave_slot)) {
          mostraPopupInvito(invito);
        }
      });
    }

    // 2. Controlla lo stato delle richieste inviate (Proponente) negli ultimi 30 secondi
    const trentaSecondiFa = new Date(Date.now() - 30000).toISOString();

    const { data: mieiInviti, error: errMiei } = await supabaseClient
      .from('inviti_doppio')
      .select('*')
      .ilike('proponente', savedUser)
      .in('stato', ['accettato', 'rifiutato'])
      .gte('updated_at', trentaSecondiFa);

    if (!errMiei && mieiInviti && mieiInviti.length > 0) {
      mieiInviti.forEach(invito => {
        const flagKey = `notificato_esito_${invito.id}_${invito.stato}`;
        if (!sessionStorage.getItem(flagKey)) {
          sessionStorage.setItem(flagKey, 'true');
          const [dataIso, ora] = invito.chiave_slot.split('_');
          
          if (invito.stato === 'accettato') {
            alert(`🎾 Ottime notizie! La tua richiesta di doppio per il giorno ${dataIso} alle ore ${ora} è stata ACCETTATA da ${invito.destinatario}!`);
          } else if (invito.stato === 'rifiutato') {
            alert(`❌ Spiacente, la tua richiesta di doppio per il giorno ${dataIso} alle ore ${ora} è stata RIFIUTATA da ${invito.destinatario}.`);
          }
          if (typeof caricaTabellone === 'function') {
            caricaTabellone();
          }
        }
      });
    }
  } catch (e) {
    // Silenzioso per evitare log superflui in console
  }
}, 5000);

// Avvia automaticamente l'ascolto appena l'utente effettua il login ed è disponibile Supabase
window.addEventListener('DOMContentLoaded', () => {
  const checkSupabaseReady = setInterval(() => {
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
      clearInterval(checkSupabaseReady);
      const savedUser = localStorage.getItem('tennis_user');
      if (savedUser) {
        avviaAscoltoInvitiRealtime(savedUser);
      }
    }
  }, 500);
});