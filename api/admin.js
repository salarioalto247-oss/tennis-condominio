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
    // Funzione di supporto per mappare is_admin in isAdmin per il frontend
    const formatUsers = (users) => {
      if (!Array.isArray(users)) return [];
      return users.map(u => ({
        ...u,
        isAdmin: u.is_admin === true || u.is_admin === 'TRUE' || u.is_admin === 'true'
      }));
    };

    // GET: Legge la lista degli utenti
    if (req.method === 'GET') {
      const response = await fetch(`${supabaseUrl}/rest/v1/utenti?select=*&order=cognome.asc`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(JSON.stringify(data));
      return res.status(200).json(formatUsers(data));
    }

    // POST: Gestisce le azioni (get-users, add, delete, reset-pin, update-cognome)
    if (req.method === 'POST') {
      const body = req.body || {};
      const { action, cognome, pin, newPin, nuovoCognome, vecchioCognome, is_admin } = body;

      // Azione: Ottieni lista utenti
      if (action === 'get-users' || !action) {
        const response = await fetch(`${supabaseUrl}/rest/v1/utenti?select=*&order=cognome.asc`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(JSON.stringify(data));
        return res.status(200).json(formatUsers(data));
      }

      // Azione: Aggiungi utente
      if (action === 'add') {
        const generatedPin = newPin || Math.floor(1000 + Math.random() * 9000).toString();
        const response = await fetch(`${supabaseUrl}/rest/v1/utenti`, {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({ cognome, pin: generatedPin, is_admin: is_admin || false })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(JSON.stringify(data));
        return res.status(200).json({ success: true, message: `Utente ${cognome} aggiunto con successo (PIN: ${generatedPin})` });
      }

      // Azione: Reset PIN o Modifica PIN
      if (action === 'reset-pin') {
        const pinToSet = newPin || Math.floor(1000 + Math.random() * 9000).toString();
        const response = await fetch(`${supabaseUrl}/rest/v1/utenti?cognome=eq.${encodeURIComponent(cognome)}`, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({ pin: pinToSet })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(JSON.stringify(data));
        return res.status(200).json({ success: true, message: 'PIN aggiornato con successo' });
      }

      // Azione: Modifica Cognome
      if (action === 'update-cognome') {
        const response = await fetch(`${supabaseUrl}/rest/v1/utenti?cognome=eq.${encodeURIComponent(vecchioCognome)}`, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({ cognome: nuovoCognome })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(JSON.stringify(data));
        return res.status(200).json({ success: true, message: 'Cognome aggiornato con successo' });
      }

      // Azione: Elimina utente
      if (action === 'delete') {
        const response = await fetch(`${supabaseUrl}/rest/v1/utenti?cognome=eq.${encodeURIComponent(cognome)}`, {
          method: 'DELETE',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(JSON.stringify(data));
        }
        return res.status(200).json({ success: true, message: 'Utente eliminato con successo' });
      }

      return res.status(400).json({ error: 'Azione non riconosciuta' });
    }

    return res.status(405).json({ error: 'Metodo non consentito' });

  } catch (err) {
    console.error('Errore backend Supabase:', err);
    return res.status(500).json({ error: err.message || 'Errore interno del server' });
  }
}