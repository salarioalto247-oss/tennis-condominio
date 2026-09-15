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
    return res.status(500).json({ error: 'Variabili d ambiente Supabase non configurate correttamente su Vercel' });
  }

  try {
    // GESTIONE GET: Legge la lista degli utenti ordinati per cognome
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

    // GESTIONE POST: Aggiorna i dati dell'utente (es. PIN o permessi)
    if (req.method === 'POST') {
      const { cognome, pin, is_admin } = req.body;

      if (!cognome) {
        return res.status(400).json({ error: 'Il campo cognome è obbligatorio' });
      }

      const updatePayload = {};
      if (pin !== undefined) updatePayload.pin = pin;
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

      return res.status(200).json({ success: true, data });
    }

    return res.status(405).json({ error: 'Metodo non consentito' });

  } catch (err) {
    console.error('Errore backend Supabase:', err);
    return res.status(500).json({ error: err.message || 'Errore interno del server' });
  }
}