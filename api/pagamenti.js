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
    if (req.method === 'POST') {
      const body = req.body || {};
      const { action, cognome, pagato, importo } = body;

      if (action === 'update-pagamento') {
        if (!cognome) return res.status(400).json({ error: 'Cognome mancante' });

        const updateRes = await fetch(`${supabaseUrl}/rest/v1/utenti?cognome=eq.${encodeURIComponent(cognome)}`, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ 
            pagato: pagato === true || pagato === 'true',
            importo_pagato: importo !== undefined ? parseFloat(importo) : 0
          })
        });

        if (!updateRes.ok) {
          const errData = await updateRes.json();
          throw new Error(JSON.stringify(errData));
        }

        return res.status(200).json({ success: true, message: `Stato pagamento aggiornato per ${cognome}` });
      }

      return res.status(400).json({ error: 'Azione pagamento non riconosciuta' });
    }

    return res.status(405).json({ error: 'Metodo non consentito' });

  } catch (err) {
    console.error('Errore modulo pagamenti:', err);
    return res.status(500).json({ error: err.message || 'Errore interno pagamenti' });
  }
}