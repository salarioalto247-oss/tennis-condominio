<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Intercondominio Salario Alto - Prenotazione Campo Tennis</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f9f9f9;
      color: #333;
    }
    header {
      background-color: #fff;
      padding: 15px 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .container {
      max-width: 900px;
      margin: 20px auto;
      padding: 0 20px;
    }
    /* Modale Login */
    #login-modal {
      position: fixed;
      top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
    .modal-content {
      background: white;
      padding: 30px;
      border-radius: 8px;
      width: 300px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .modal-content input, .admin-panel-input {
      width: 100%;
      padding: 10px;
      margin-top: 5px;
      margin-bottom: 10px;
      border: 1px solid #ccc;
      border-radius: 4px;
      box-sizing: border-box;
    }
    .modal-content button, .admin-btn {
      padding: 8px 12px;
      background: #0070f3;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    .modal-content button:hover, .admin-btn:hover {
      background: #0051a2;
    }
    #suggerimenti-list {
      list-style: none;
      padding: 0;
      margin: 0;
      background: white;
      border: 1px solid #ccc;
      position: absolute;
      width: calc(100% - 60px);
      max-height: 150px;
      overflow-y: auto;
      display: none;
      z-index: 1001;
    }
    .btn-red {
      background-color: #e53e3e !important;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
    }
    .btn-red:hover {
      background-color: #c53030 !important;
    }
    .btn-yellow {
      background-color: #d69e2e !important;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
    }
    .btn-yellow:hover {
      background-color: #b7791f !important;
    }
    .btn-blue {
      background-color: #3182ce !important;
      color: white;
      border: none;
      padding: 5px 8px;
      border-radius: 4px;
      cursor: pointer;
    }
    .btn-blue:hover {
      background-color: #2b6cb0 !important;
    }
  </style>
</head>
<body>

  <!-- Header con info utente in alto a destra -->
  <header>
    <h2 style="margin: 0;">🎾 Intercondominio Salario Alto - Prenotazione Campo Tennis</h2>
    <div>
      <span id="logged-user-display" style="margin-right: 15px; font-weight: bold;"></span>
      <button id="admin-panel-btn" onclick="toggleAdminPanel()" style="display: none; margin-right: 10px; padding: 8px 12px; background: #3182ce; color: white; border: none; border-radius: 4px; cursor: pointer;">Pannello Admin</button>
      <button id="logout-btn" class="btn-red" onclick="logoutUser()" style="display: none;">Cambia Utente</button>
    </div>
  </header>

  <!-- Modale Pop-Up Login -->
  <div id="login-modal" style="display: none;">
    <div class="modal-content" style="position: relative;">
      <h3>Accesso Utente</h3>
      <p style="font-size: 13px; color: #666;">Digita il tuo cognome e il PIN.</p>
      
      <label style="font-size: 14px; font-weight: bold;">Cognome:</label>
      <input type="text" id="login-cognome" placeholder="Es. Rossi, Admin..." oninput="filtraSuggerimenti(this.value)" autocomplete="off">
      <ul id="suggerimenti-list"></ul>

      <label style="font-size: 14px; font-weight: bold;">PIN:</label>
      <input type="password" id="login-pin" placeholder="PIN" onkeydown="if(event.key === 'Enter') handleLogin()">

      <p id="login-error" style="color: red; font-size: 12px; margin: 0 0 10px 0;"></p>
      <button onclick="handleLogin()">Accedi</button>
    </div>
  </div>

  <!-- Container Principale -->
  <div class="container">
    <!-- Pannello Admin -->
    <div id="admin-gestion-panel" style="display: none; background: #fff; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <h3 style="margin-top: 0; color: #2b6cb0;">⚙️ Console di Amministrazione</h3>
      <p style="font-size: 13px; color: #666;">Gestisci gli utenti registrati, i PIN di accesso e monitora l'anagrafica del condominio.</p>
      
      <hr style="border: 0; border-top: 1px solid #eee; margin: 15px 0;">

      <h4 style="margin-bottom: 10px;">Aggiungi Nuovo Utente</h4>
      <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: flex-end;">
        <div style="flex: 1; min-width: 200px;">
          <label style="font-size: 12px; font-weight: bold;">Cognome:</label>
          <input type="text" id="admin-new-cognome" class="admin-panel-input" placeholder="Es. Bianchi">
        </div>
        <div style="flex: 1; min-width: 150px;">
          <label style="font-size: 12px; font-weight: bold;">PIN (opzionale):</label>
          <input type="text" id="admin-new-pin" class="admin-panel-input" placeholder="Lascia vuoto per generarlo">
        </div>
        <div>
          <button class="admin-btn" onclick="aggiungiUtenteAdmin()" style="margin-bottom: 10px; height: 38px;">Aggiungi</button>
        </div>
      </div>
      <p id="admin-action-msg" style="font-size: 12px; margin-top: 5px; font-weight: bold;"></p>

      <h4 style="margin-top: 20px; margin-bottom: 10px;">Elenco Utenti Registrati</h4>
      <div id="admin-users-list" style="max-height: 250px; overflow-y: auto; border: 1px solid #eee; border-radius: 4px; padding: 10px;">
        Caricamento utenti...
      </div>

      <h4 style="margin-top: 30px; margin-bottom: 10px;">📋 Registro Attività e Modifiche (Audit Log)</h4>
      <button class="btn-blue" onclick="caricaLogAdmin()" style="margin-bottom: 10px; font-size: 11px;">Aggiorna Log</button>
      <div id="admin-logs-list" style="max-height: 250px; overflow-y: auto; border: 1px solid #eee; border-radius: 4px; padding: 10px; background: #fafafa; font-size: 12px; font-family: monospace;">
        Clicca su "Aggiorna Log" per caricare la cronologia.
      </div>
    </div>

    <div id="tabellone-container">
      <!-- Il tabellone verrà iniettato qui via JavaScript -->
    </div>
  </div>

  <!-- Script Principale -->
  <script>
    let currentUser = null; 
    let listaUtentiCache = [];
    let prenotazioniGlobali = {}; 

    window.addEventListener('DOMContentLoaded', async () => {
      await scaricaListaUtentiPerAutocheck();
      await caricaPrenotazioniLocali();

      const savedUser = localStorage.getItem('tennis_user');
      const savedPin = localStorage.getItem('tennis_pin');

      if (savedUser && savedPin) {
        validaEImpostaSessione(savedUser, savedPin);
      } else {
        mostraModaleLogin();
      }
    });

    async function caricaPrenotazioniLocali() {
      try {
        const res = await fetch('/api/admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get-prenotazioni' })
        });
        const data = await res.json();
        if (res.ok && data) {
          prenotazioniGlobali = data;
        } else {
          prenotazioniGlobali = {};
        }
      } catch (e) {
        console.error('Errore caricamento prenotazioni da Google Calendar:', e);
        prenotazioniGlobali = {};
      }
    }

    async function salvaPrenotazioniLocali(chiaveSlot, utentiSlot) {
      try {
        await fetch('/api/admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'save-prenotazione',
            cognome: currentUser ? currentUser.cognome : 'Admin',
            chiave: chiaveSlot,
            utenti: utentiSlot
          })
        });
      } catch (e) {
        console.error('Errore salvataggio prenotazione su Google Calendar:', e);
      }
    }

    async function scaricaListaUtentiPerAutocheck() {
      try {
        const response = await fetch('/api/admin', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        if (response.ok && Array.isArray(data)) {
          listaUtentiCache = data;
        }
      } catch (err) {
        console.error('Errore caricamento cache utenti:', err);
      }
    }

    function filtraSuggerimenti(testoDigitato) {
      const listaEl = document.getElementById('suggerimenti-list');
      if (!listaEl) return;
      listaEl.innerHTML = '';
      
      if (!testoDigitato || testoDigitato.trim() === '') {
        listaEl.style.display = 'none';
        return;
      }

      const query = testoDigitato.toLowerCase();
      const filtrati = listaUtentiCache.filter(u => u.cognome.toLowerCase().startsWith(query));

      if (filtrati.length > 0) {
        listaEl.style.display = 'block';
        filtrati.forEach(u => {
          const li = document.createElement('li');
          li.textContent = u.cognome;
          li.style.padding = '8px 12px';
          li.style.cursor = 'pointer';
          li.style.borderBottom = '1px solid #eee';
          
          li.onmouseover = () => li.style.background = '#f0f0f0';
          li.onmouseout = () => li.style.background = 'white';
          
          li.onclick = () => {
            document.getElementById('login-cognome').value = u.cognome;
            listaEl.style.display = 'none';
            document.getElementById('login-pin').focus();
          };
          
          listaEl.appendChild(li);
        });
      } else {
        listaEl.style.display = 'none';
      }
    }

    function mostraModaleLogin() {
      const modal = document.getElementById('login-modal');
      if (modal) modal.style.display = 'flex';
    }

    function nascondiModaleLogin() {
      const modal = document.getElementById('login-modal');
      const sugg = document.getElementById('suggerimenti-list');
      if (modal) modal.style.display = 'none';
      if (sugg) sugg.style.display = 'none';
    }

    async function handleLogin() {
      const cognomeInput = document.getElementById('login-cognome').value.trim();
      const pinInput = document.getElementById('login-pin').value.trim();
      const errorEl = document.getElementById('login-error');

      if (!cognomeInput || !pinInput) {
        if (errorEl) errorEl.textContent = 'Compila tutti i campi';
        return;
      }

      await validaEImpostaSessione(cognomeInput, pinInput, true);
    }

    async function validaEImpostaSessione(cognome, pin, mostraErroriUI = false) {
      const errorEl = document.getElementById('login-error');
      try {
        const response = await fetch('/api/admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminPin: pin, action: 'get-users' })
        });
        const data = await response.json();

        if (response.ok && Array.isArray(data)) {
          listaUtentiCache = data;
          const userFound = data.find(u => u.cognome.toLowerCase() === cognome.toLowerCase() && u.pin === pin);
          const isMaster = (cognome.toLowerCase() === 'admin' && pin === '0000');

          if (userFound || isMaster) {
            currentUser = userFound 
              ? { ...userFound, isAdmin: userFound.is_admin } 
              : { cognome: 'Admin', pin: '0000', isAdmin: true, is_admin: true };
            
            localStorage.setItem('tennis_user', currentUser.cognome);
            localStorage.setItem('tennis_pin', currentUser.pin);

            nascondiModaleLogin();
            aggiornaInterfacciaUtente();
            await caricaTabellone();
            return;
          }
        }
        
        if (mostraErroriUI) {
          if (errorEl) errorEl.textContent = 'Cognome o PIN errati';
        } else {
          logoutUser();
        }
      } catch (err) {
        console.error('Errore connessione:', err);
        if (mostraErroriUI && errorEl) errorEl.textContent = 'Errore di connessione al server';
        else logoutUser();
      }
    }

    function aggiornaInterfacciaUtente() {
      if (!currentUser) return;
      
      const loggedDisplay = document.getElementById('logged-user-display');
      const logoutBtn = document.getElementById('logout-btn');
      const adminBtn = document.getElementById('admin-panel-btn');

      if (loggedDisplay) loggedDisplay.textContent = `Utente: ${currentUser.cognome} ${currentUser.isAdmin ? '(Admin)' : ''}`;
      if (logoutBtn) logoutBtn.style.display = 'inline-block';
      
      if (adminBtn) {
        if (currentUser.isAdmin) {
          adminBtn.style.display = 'inline-block';
        } else {
          adminBtn.style.display = 'none';
        }
      }
    }

    function logoutUser() {
      localStorage.removeItem('tennis_user');
      localStorage.removeItem('tennis_pin');
      currentUser = null;
      const adminPanel = document.getElementById('admin-gestion-panel');
      if (adminPanel) adminPanel.style.display = 'none';
      mostraModaleLogin();
    }

    function toggleAdminPanel() {
      if (!currentUser || !currentUser.isAdmin) return;
      const panel = document.getElementById('admin-gestion-panel');
      if (!panel) return;
      panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
      if (panel.style.display === 'block') {
        caricaListaUtentiAdmin();
        caricaLogAdmin();
      }
    }

    async function caricaListaUtentiAdmin() {
      try {
        const res = await fetch('/api/admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminPin: currentUser.pin, action: 'get-users' })
        });
        const users = await res.json();
        if (res.ok && Array.isArray(users)) {
          listaUtentiCache = users;
          let html = '<table style="width: 100%; border-collapse: collapse; font-size: 13px;">';
          html += '<tr style="background: #f4f4f4; text-align: left;"><th style="padding: 6px; border: 1px solid #ddd;">Cognome</th><th style="padding: 6px; border: 1px solid #ddd;">PIN</th><th style="padding: 6px; border: 1px solid #ddd; text-align: center;">Azioni</th></tr>';
          
          users.forEach(u => {
            const isMasterAdmin = u.cognome.toLowerCase() === 'admin';
            html += `
              <tr>
                <td style="padding: 6px; border: 1px solid #ddd;">
                  <b>${u.cognome}</b> ${u.is_admin ? '<span style="color:green;">(Admin)</span>' : ''}
                  ${!isMasterAdmin ? `<div style="margin-top: 4px;"><button class="btn-blue" onclick="modificaCognomeAdmin('${u.cognome}')" style="font-size: 10px; padding: 3px 6px;">Modifica Nome</button></div>` : ''}
                </td>
                <td style="padding: 6px; border: 1px solid #ddd;">
                  ${u.pin}
                  ${!isMasterAdmin ? `
                  <div style="margin-top: 4px; white-space: nowrap;">
                    <button class="btn-blue" onclick="modificaPinAdmin('${u.cognome}', '${u.pin}')" style="font-size: 10px; padding: 3px 6px; margin-right: 3px;">Modifica PIN</button>
                    <button class="btn-yellow" onclick="resettaPinAdmin('${u.cognome}')" style="font-size: 10px; padding: 3px 6px;">Reset (Random)</button>
                  </div>` : ''}
                </td>
                <td style="padding: 6px; border: 1px solid #ddd; text-align: center; white-space: nowrap;">
                  ${!isMasterAdmin ? `<button class="btn-red" onclick="eliminaUtenteAdmin('${u.cognome}')" style="font-size: 11px; padding: 5px 10px;">Elimina</button>` : '<span style="color: #888; font-size: 11px;">Protetto</span>'}
                </td>
              </tr>
            `;
          });
          html += '</table>';
          const usersListEl = document.getElementById('admin-users-list');
          if (usersListEl) usersListEl.innerHTML = html;
        }
      } catch (e) {
        console.error('Errore caricamento lista utenti admin', e);
      }
    }

    async function caricaLogAdmin() {
      const logsListEl = document.getElementById('admin-logs-list');
      if (!logsListEl) return;
      
      logsListEl.innerHTML = 'Caricamento log in corso...';

      try {
        const res = await fetch('/api/admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminPin: currentUser.pin, action: 'get-logs' })
        });
        
        const logs = await res.json();
        if (res.ok && Array.isArray(logs)) {
          if (logs.length === 0) {
            logsListEl.innerHTML = 'Nessuna attività registrata finora.';
            return;
          }

          let html = '<table style="width: 100%; border-collapse: collapse; font-size: 11px;">';
          html += '<tr style="background: #eee; text-align: left;"><th style="padding: 4px; border: 1px solid #ddd;">Data/Ora</th><th style="padding: 4px; border: 1px solid #ddd;">Utente</th><th style="padding: 4px; border: 1px solid #ddd;">Azione</th><th style="padding: 4px; border: 1px solid #ddd;">Dettagli</th></tr>';
          
          logs.forEach(l => {
            const dataFormattata = new Date(l.timestamp).toLocaleString('it-IT');
            html += `
              <tr>
                <td style="padding: 4px; border: 1px solid #ddd; white-space: nowrap;">${dataFormattata}</td>
                <td style="padding: 4px; border: 1px solid #ddd;"><b>${l.user_email || 'N.D.'}</b></td>
                <td style="padding: 4px; border: 1px solid #ddd; color: #2b6cb0;">${l.action}</td>
                <td style="padding: 4px; border: 1px solid #ddd;">${JSON.stringify(l.metadata || {})}</td>
              </tr>
            `;
          });
          html += '</table>';
          logsListEl.innerHTML = html;
        } else {
          logsListEl.innerHTML = '<span style="color: red;">Errore nel caricamento dei log.</span>';
        }
      } catch (e) {
        console.error(e);
        logsListEl.innerHTML = '<span style="color: red;">Errore di connessione al server.</span>';
      }
    }

    async function aggiungiUtenteAdmin() {
      const cognome = document.getElementById('admin-new-cognome').value.trim();
      const pin = document.getElementById('admin-new-pin').value.trim();
      const msgEl = document.getElementById('admin-action-msg');

      if (!cognome) {
        msgEl.style.color = 'red';
        msgEl.textContent = 'Inserisci un cognome valido.';
        return;
      }

      try {
        const res = await fetch('/api/admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            adminPin: currentUser.pin,
            action: 'add',
            cognome: cognome,
            newPin: pin || undefined
          })
        });
        const data = await res.json();
        if (res.ok) {
          msgEl.style.color = 'green';
          msgEl.textContent = data.message;
          document.getElementById('admin-new-cognome').value = '';
          document.getElementById('admin-new-pin').value = '';
          caricaListaUtentiAdmin();
          caricaLogAdmin();
          scaricaListaUtentiPerAutocheck();
        } else {
          msgEl.style.color = 'red';
          msgEl.textContent = data.error || 'Errore durante l aggiunta.';
        }
      } catch (e) {
        console.error(e);
        msgEl.style.color = 'red';
        msgEl.textContent = 'Errore di connessione al server.';
      }
    }

    async function modificaCognomeAdmin(vecchioCognome) {
      const nuovoCognome = prompt(`Correggi il cognome per l'utente: ${vecchioCognome}\n\nInserisci il nuovo cognome corretto:`, vecchioCognome);
      if (nuovoCognome === null) return;
      const cognomeFinale = nuovoCognome.trim();
      if (!cognomeFinale) {
        alert("Il cognome non può essere vuoto.");
        return;
      }

      try {
        const res = await fetch('/api/admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            adminPin: currentUser.pin,
            action: 'update-cognome',
            vecchioCognome: vecchioCognome,
            nuovoCognome: cognomeFinale
          })
        });
        const data = await res.json();
        if (res.ok) {
          alert(`Cognome aggiornato con successo a: ${cognomeFinale}`);
          caricaListaUtentiAdmin();
          caricaLogAdmin();
          scaricaListaUtentiPerAutocheck();
        } else {
          alert(data.error || 'Errore durante la modifica del cognome.');
        }
      } catch (e) {
        console.error(e);
        alert('Errore di connessione al server.');
      }
    }

    async function resettaPinAdmin(cognome) {
      if (!confirm(`Sei sicuro di voler generare un nuovo PIN randomico per ${cognome}?`)) return;

      try {
        const res = await fetch('/api/admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            adminPin: currentUser.pin,
            action: 'reset-pin',
            cognome: cognome
          })
        });
        const data = await res.json();
        if (res.ok) {
          alert(`PIN resettato con successo per ${cognome}!`);
          caricaListaUtentiAdmin();
          caricaLogAdmin();
        } else {
          alert(data.error || 'Errore durante il reset del PIN.');
        }
      } catch (e) {
        console.error(e);
        alert('Errore di connessione al server.');
      }
    }

    async function modificaPinAdmin(cognome, pinAttuale) {
      const nuovoPin = prompt(`Modifica PIN per l'utente: ${cognome}\n\nInserisci il nuovo PIN desiderato:`, pinAttuale);
      if (nuovoPin === null) return;
      const pinFinale = nuovoPin.trim();
      if (!pinFinale) {
        alert("Il PIN non può essere vuoto.");
        return;
      }

      try {
        const res = await fetch('/api/admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            adminPin: currentUser.pin,
            action: 'reset-pin',
            cognome: cognome,
            newPin: pinFinale
          })
        });
        const data = await res.json();
        if (res.ok) {
          alert(`PIN modificato con successo per ${cognome} (Nuovo PIN: ${pinFinale})`);
          caricaListaUtentiAdmin();
          caricaLogAdmin();
        } else {
          alert(data.error || 'Errore durante la modifica del PIN.');
        }
      } catch (e) {
        console.error(e);
        alert('Errore di connessione al server.');
      }
    }

    async function eliminaUtenteAdmin(cognome) {
      if (!confirm(`Sei sicuro di voler eliminare l'utente ${cognome}?`)) return;

      try {
        const res = await fetch('/api/admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            adminPin: currentUser.pin,
            action: 'delete',
            cognome: cognome
          })
        });
        const data = await res.json();
        if (res.ok) {
          caricaListaUtentiAdmin();
          caricaLogAdmin();
          scaricaListaUtentiPerAutocheck();
        } else {
          alert(data.error || 'Errore durante l eliminazione.');
        }
      } catch (e) {
        console.error(e);
        alert('Errore di connessione al server.');
      }
    }

    async function caricaTabellone() {
      await caricaPrenotazioniLocali();

      const container = document.getElementById('tabellone-container') || document.querySelector('.container');
      if (!container) return;
      
      let tabelloneDiv = document.getElementById('tabellone-orari-griglia');
      if (!tabelloneDiv) {
        tabelloneDiv = document.createElement('div');
        tabelloneDiv.id = 'tabellone-orari-griglia';
        tabelloneDiv.style.marginTop = '20px';
        container.appendChild(tabelloneDiv);
      }

      try {
        const oggi = new Date();
        const giorniArray = [];
        
        for (let i = 0; i < 3; i++) {
          const d = new Date(oggi);
          d.setDate(oggi.getDate() + i);
          
          const options = { weekday: 'short', day: 'numeric', month: 'short' };
          const dataFormattata = d.toLocaleDateString('it-IT', options);
          const dataIso = d.toISOString().split('T')[0];
          
          giorniArray.push({ titolo: dataFormattata, iso: dataIso });
        }

        let html = `
          <div style="background: #fff3cd; border: 1px solid #ffeeba; color: #856404; padding: 12px 15px; border-radius: 6px; margin-bottom: 20px; font-size: 13px; font-weight: bold; line-height: 1.4; text-transform: uppercase;">
            N.B. SI PUO' PRENOTARE AL MASSIMO FINO A DUE GIORNI SUCCESSIVI<br>
            LE PRENOTAZIONI EFFETTUATE IN ANTICIPO SARANNO CANCELLATE
          </div>

          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3>Intercondominio Salario Alto - Tabellone Orari - Campo da Tennis Via Suvereto 247</h3>
            <p style="color: #666; font-size: 14px;">Benvenuto, <b>${currentUser.cognome}</b> ${currentUser.isAdmin ? '<span style="color: #2b6cb0; font-weight: bold;">[Modalità Admin: Gestione Totale]</span>' : ''}. Orario continuato dalle 08:00 alle 21:00.</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
              <thead>
                <tr style="background: #f4f4f4; text-align: left;">
                  <th style="padding: 10px; border: 1px solid #ddd; width: 20%;">Orario</th>
        `;

        giorniArray.forEach(g => {
          html += `<th style="padding: 10px; border: 1px solid #ddd; text-align: center;">${g.titolo}</th>`;
        });

        html += `
                </tr>
              </thead>
              <tbody>
        `;

        const ore = [];
        for (let h = 8; h <= 21; h++) {
          const oraStringa = h < 10 ? `0${h}:00` : `${h}:00`;
          ore.push(oraStringa);
        }
        
        ore.forEach(ora => {
          html += `
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; background: #fafafa;">${ora}</td>
          `;

          giorniArray.forEach(g => {
            const chiaveSlot = `${g.iso}_${ora}`;
            const utentiSlot = prenotazioniGlobali[chiaveSlot] || [];

            if (utentiSlot.length > 0) {
              const eMio = utentiSlot.some(u => u.toLowerCase() === currentUser.cognome.toLowerCase());
              const testoNomi = utentiSlot.join(' & ');
              const pieno = utentiSlot.length >= 2;

              let bgStyle = eMio ? '#1976d2' : '#d32f2f'; 
              if (pieno) bgStyle = '#f57f17'; 
              if (currentUser.isAdmin) bgStyle = '#475569'; 

              html += `
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center; background: ${bgStyle}; cursor: pointer;" onclick="gestisciSlot('${g.iso}', '${ora}')">
                  <span style="color: #ffffff; font-weight: bold; font-size: 12px;">${testoNomi} ${pieno ? '(Doppio)' : ''}</span>
                </td>
              `;
            } else {
              html += `
                <td style="padding: 10px; border: 1px solid #ddd; cursor: pointer; text-align: center; background: #2e7d32;" onclick="gestisciSlot('${g.iso}', '${ora}')">
                  <span style="color: #ffffff; font-weight: bold; font-size: 12px;">Disponibile</span>
                </td>
              `;
            }
          });

          html += `</tr>`;
        });

        html += `
              </tbody>
            </table>
          </div>
        `;

        tabelloneDiv.innerHTML = html;

      } catch (err) {
        console.error('Errore nel caricamento del tabellone:', err);
        tabelloneDiv.innerHTML = '<p style="color: red;">Impossibile caricare il tabellone delle prenotazioni.</p>';
      }
    }

    async function gestisciSlot(dataIso, ora) {
      await caricaPrenotazioniLocali();

      const chiaveSlot = `${dataIso}_${ora}`;
      if (!prenotazioniGlobali[chiaveSlot]) {
        prenotazioniGlobali[chiaveSlot] = [];
      }
      const utentiSlot = prenotazioniGlobali[chiaveSlot];

      const [oreSlot] = ora.split(':');
      const dataOraSlot = new Date(`${dataIso}T${oreSlot}:00:00`);
      const adesso = new Date();

      if (dataOraSlot < adesso && !currentUser.isAdmin) {
        alert("Non è possibile prenotare uno slot con data o orario già trascorsi!");
        return;
      }

      if (currentUser.isAdmin) {
        if (utentiSlot.length === 0) {
          const cognomeCondomino = prompt("[ADMIN] Inserisci il cognome del condomino per cui effettuare la prenotazione:");
          if (cognomeCondomino && cognomeCondomino.trim() !== '') {
            utentiSlot.push(cognomeCondomino.trim());
            await salvaPrenotazioniLocali(chiaveSlot, utentiSlot);
            await caricaTabellone();
          }
        } else {
          const scelta = prompt(`[ADMIN] Slot occupato da: [ ${utentiSlot.join(' - ')} ]\nScegli un'opzione:\n1. Rimuovi un utente\n2. Libera tutto lo slot\n3. Aggiungi un secondo utente (Doppio)\n\nDigita 1, 2 o 3:`);
          
          if (scelta === '1') {
            const utenteDaRimuovere = prompt(`Digita esattamente il cognome dell'utente da rimuovere (${utentiSlot.join(', ')}):`);
            if (utenteDaRimuovere) {
              prenotazioniGlobali[chiaveSlot] = utentiSlot.filter(u => u.toLowerCase() !== utenteDaRimuovere.trim().toLowerCase());
              if (prenotazioniGlobali[chiaveSlot].length === 0) delete prenotazioniGlobali[chiaveSlot];
              await salvaPrenotazioniLocali(chiaveSlot, prenotazioniGlobali[chiaveSlot] || []);
              await caricaTabellone();
            }
          } else if (scelta === '2') {
            delete prenotazioniGlobali[chiaveSlot];
            await salvaPrenotazioniLocali(chiaveSlot, []);
            await caricaTabellone();
          } else if (scelta === '3') {
            if (utentiSlot.length >= 2) {
              alert("Lo slot ha già 2 giocatori.");
            } else {
              const nuovoUtente = prompt("Inserisci il cognome del secondo condomino:");
              if (nuovoUtente && nuovoUtente.trim() !== '') {
                utentiSlot.push(nuovoUtente.trim());
                await salvaPrenotazioniLocali(chiaveSlot, utentiSlot);
                await caricaTabellone();
              }
            }
          }
        }
        return;
      }

      const occorrenzeMioNome = utentiSlot.filter(u => u.toLowerCase() === currentUser.cognome.toLowerCase()).length;

      if (occorrenzeMioNome > 0) {
        if (occorrenzeMioNome === 1 && utentiSlot.length === 1) {
          const sceltaDoppio = confirm(
            "Risulti già prenotato in questo slot.\n\n" +
            "• Premi OK per aggiungere una seconda volta il tuo cognome (Doppio)\n" +
            "• Premi Annulla per cancellare la prenotazione"
          );

          if (sceltaDoppio) {
            let slotPrenotatiOggi = 0;
            for (let chiave in prenotazioniGlobali) {
              if (chiave.startsWith(dataIso)) {
                prenotazioniGlobali[chiave].forEach(u => {
                  if (u.toLowerCase() === currentUser.cognome.toLowerCase()) {
                    slotPrenotatiOggi++;
                  }
                });
              }
            }

            if (slotPrenotatiOggi > 1) {
              alert("Hai già effettuato prenotazioni in altri orari oggi. Puoi raddoppiare solo sullo stesso slot.");
              return;
            }

            utentiSlot.push(currentUser.cognome);
            await salvaPrenotazioniLocali(chiaveSlot, utentiSlot);
            await caricaTabellone();
          } else {
            prenotazioniGlobali[chiaveSlot] = utentiSlot.filter(u => u.toLowerCase() !== currentUser.cognome.toLowerCase());
            if (prenotazioniGlobali[chiaveSlot].length === 0) {
              delete prenotazioniGlobali[chiaveSlot];
            }
            await salvaPrenotazioniLocali(chiaveSlot, prenotazioniGlobali[chiaveSlot] || []);
            await caricaTabellone();
          }
        } else {
          if (confirm(`Vuoi rimuovere la tua prenotazione del giorno ${dataIso} alle ore ${ora}?`)) {
            let rimosso = false;
            prenotazioniGlobali[chiaveSlot] = utentiSlot.filter(u => {
              if (!rimosso && u.toLowerCase() === currentUser.cognome.toLowerCase()) {
                rimosso = true;
                return false;
              }
              return true;
            });
            if (prenotazioniGlobali[chiaveSlot].length === 0) {
              delete prenotazioniGlobali[chiaveSlot];
            }
            await salvaPrenotazioniLocali(chiaveSlot, prenotazioniGlobali[chiaveSlot] || []);
            await caricaTabellone();
          }
        }
      } else {
        if (utentiSlot.length >= 2) {
          alert("Questo slot ha già raggiunto il massimo di 2 giocatori.");
          return;
        }

        let slotPrenotatiOggi = 0;
        for (let chiave in prenotazioniGlobali) {
          if (chiave.startsWith(dataIso)) {
            prenotazioniGlobali[chiave].forEach(u => {
              if (u.toLowerCase() === currentUser.cognome.toLowerCase()) {
                slotPrenotatiOggi++;
              }
            });
          }
        }

        if (slotPrenotatiOggi >= 1) {
          alert("Hai già effettuato una prenotazione in questo giorno. Puoi prenotare un secondo slot solo per raddoppiare sullo stesso orario.");
          return;
        }

        const msg = utentiSlot.length === 1 
          ? `C'è già ${utentiSlot[0]} in questo slot. Vuoi unirti per fare il doppio il giorno ${dataIso} alle ore ${ora}?`
          : `Confermi la prenotazione del campo per il giorno ${dataIso} alle ore ${ora}?`;

        if (confirm(msg)) {
          utentiSlot.push(currentUser.cognome);
          await salvaPrenotazioniLocali(chiaveSlot, utentiSlot);
          await caricaTabellone();
        }
      }
    }
  </script>
</body>
</html>