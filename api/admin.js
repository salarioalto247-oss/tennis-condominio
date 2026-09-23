export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Variabili d ambiente Supabase non configurate' });
  }

  try {
    // GET: Restituisce la lista di tutti gli utenti registrati
    if (req.method === 'GET') {
      const response = await fetch(`${supabaseUrl}/rest/v1/utenti?select=*`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      const data = await response.json();
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      const { adminPin, action } = body;

      // 1. Azione di Toggle Attivo / Disattivo Account
      if (action === 'toggle-attivo') {
        const { cognome, attivo } = body;
        if (!cognome) return res.status(400).json({ error: 'Cognome mancante' });

        const updateRes = await fetch(`${supabaseUrl}/rest/v1/utenti?cognome=eq.${encodeURIComponent(cognome)}`, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ attivo: attivo === true || attivo === 'true' })
        });

        if (!updateRes.ok) {
          const errData = await updateRes.json();
          throw new Error(JSON.stringify(errData));
        }

        return res.status(200).json({ success: true, message: `Stato attivo aggiornato per ${cognome}` });
      }

      // 2. Controllo accesso o recupero utenti protetto da PIN admin
      if (action === 'get-users') {
        const response = await fetch(`${supabaseUrl}/rest/v1/utenti?select=*`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        });
        const users = await response.json();
        
        // Verifica se l'adminPin corrisponde a un admin o al master '0000'
        const isMaster = (adminPin === '0000');
        const adminFound = users.find(u => u.pin === adminPin && u.is_admin === true);

        if (!isMaster && !adminFound) {
          return res.status(403).json({ error: 'Non autorizzato' });
        }

        return res.status(200).json(users);
      }

      // 3. Aggiunta nuovo utente
      if (action === 'add') {
        const { cognome, newPin } = body;
        if (!cognome) return res.status(400).json({ error: 'Cognome obbligatorio' });

        const pinDaUsare = newPin || Math.floor(1000 + Math.random() * 9000).toString();

        const insertRes = await fetch(`${supabaseUrl}/rest/v1/utenti`, {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            cognome: cognome.trim(),
            pin: pinDaUsare,
            is_admin: false,
            attivo: true,
            quota_pagata: false,
            anno_quota: new Date().getFullYear().toString()
          })
        });

        if (!insertRes.ok) {
          const err = await insertRes.json();
          return res.status(400).json({ error: err.message || 'Errore inserimento utente' });
        }

        return res.status(200).json({ success: true, pin: pinDaUsare });
      }

      // 4. Eliminazione utente
      if (action === 'delete') {
        const { cognome } = body;
        if (!cognome || cognome.toLowerCase() === 'admin') {
          return res.status(400).json({ error: 'Impossibile eliminare questo utente' });
        }

        const delRes = await fetch(`${supabaseUrl}/rest/v1/utenti?cognome=eq.${encodeURIComponent(cognome)}`, {
          method: 'DELETE',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        });

        if (!delRes.ok) return res.status(400).json({ error: 'Errore durante l eliminazione' });
        return res.status(200).json({ success: true });
      }

      // 5. Reset PIN o Modifica PIN
      if (action === 'reset-pin') {
        const { cognome, newPin } = body;
        if (!cognome || !newPin) return res.status(400).json({ error: 'Dati incompleti' });

        const patchRes = await fetch(`${supabaseUrl}/rest/v1/utenti?cognome=eq.${encodeURIComponent(cognome)}`, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ pin: newPin })
        });

        if (!patchRes.ok) return res.status(400).json({ error: 'Errore aggiornamento PIN' });
        return res.status(200).json({ success: true });
      }

      // Altre azioni gestite (es. prenotazioni / log se presenti nel tuo progetto)
      return res.status(400).json({ error: 'Azione non riconosciuta' });
    }

    return res.status(405).json({ error: 'Metodo non consentito' });

  } catch (err) {
    console.error('Errore API Admin:', err);
    return res.status(500).json({ error: err.message || 'Errore interno server' });
  }
}