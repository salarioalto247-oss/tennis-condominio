export default async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: 'Configurazione Supabase mancante nelle variabili d\'ambiente.' });
  }

  const headers = {
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  try {
    if (req.method === 'GET') {
      // Recupera gli utenti e normalizza is_admin in isAdmin per il frontend
      const response = await fetch(`${SUPABASE_URL}/rest/v1/utenti?select=*`, { headers });
      if (!response.ok) throw new Error('Errore nel recupero degli utenti da Supabase');
      
      const data = await response.json();
      const utentiNormalizzati = data.map(u => ({
        ...u,
        isAdmin: u.is_admin ?? u.isAdmin ?? false
      }));

      return res.status(200).json(utentiNormalizzati);
    }

    if (req.method === 'POST') {
      const { action, cognome, pin, nuovoPin } = req.body;

      // Gestione modifica PIN
      if (action === 'change-pin') {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/utenti?cognome=eq.${encodeURIComponent(cognome)}`, { headers });
        const users = await response.json();

        if (!users || users.length === 0) {
          return res.status(404).json({ error: 'Utente non trovato' });
        }

        const user = users[0];
        if (user.pin !== pin) {
          return res.status(401).json({ error: 'PIN attuale non corretto' });
        }

        const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/utenti?cognome=eq.${encodeURIComponent(cognome)}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ pin: nuovoPin })
        });

        if (!updateRes.ok) throw new Error('Errore durante l\'aggiornamento del PIN');
        return res.status(200).json({ success: true, message: 'PIN aggiornato con successo' });
      }

      return res.status(400).json({ error: 'Azione non riconosciuta' });
    }

    return res.status(405).json({ error: 'Metodo non consentito' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}