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
      return res.status(200).json(data);
    }

    // POST: Gestisce sia il caricamento utenti richiesto dal frontend sia le modifiche/aggiunte
    if (req.method === 'POST') {
      const body = req.body || {};
      const { action, cognome, pin, newPin, is_admin } = body;

      // Se il frontend chiede la lista utenti (es. in fase di login o pannello admin)
      if (action === 'get-users' || !cognome) {
        const response = await fetch(`${supabaseUrl}/rest/v1/utenti?select=*&order=cognome.asc`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(JSON.stringify(data));
        return res.status(200).json(data);
      }

      // Altrimenti gestisce l'aggiornamento del PIN o dei dati utente
      const updatePayload = {};
      if (pin !== undefined) updatePayload.pin = pin;
      if (newPin !== undefined) updatePayload.pin = newPin;
      if (is_admin !== undefined) updatePayload.is_admin = is_admin;

      const response = await fetch(`${supabaseUrl}/rest/v1/utenti?cognome=eq.${encodeURIComponent(cognome)}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(updatePayload)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(JSON.stringify(data));

      return res.status(200).json({ success: true, data, message: 'Operazione completata con successo' });
    }

    return res.status(405).json({ error: 'Metodo non consentito' });

  } catch (err) {
    console.error('Errore backend Supabase:', err);
    return res.status(500).json({ error: err.message || 'Errore interno del server' });
  }
}