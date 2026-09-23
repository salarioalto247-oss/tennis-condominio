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
        return res.status(500).json({ error: 'Variabili di ambiente Supabase non configurate' });
    }

    try {
        const ANNO_CORRENTE = new Date().getFullYear();

        if (req.method === 'GET') {
            const response = await fetch(`${supabaseUrl}/rest/v1/utenti?select=cognome,quota_pagata,anno_quota,data_pagamento,attivo&order=cognome.asc`, {
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`
                }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(JSON.stringify(data));
            return res.status(200).json({ success: true, data });
        }

        if (req.method === 'POST') {
            const { cognome, quota_pagata, anno_quota, data_pagamento } = req.body || {};

            if (!cognome) {
                return res.status(400).json({ error: 'Cognome non specificato' });
            }

            // Calcolo automatico di attivo nel backend (sicurezza extra)
            const attivoAuto = (quota_pagata === true) && (parseInt(anno_quota, 10) === ANNO_CORRENTE);

            const updatePayload = {
                quota_pagata: Boolean(quota_pagata),
                anno_quota: anno_quota !== undefined ? anno_quota : null,
                data_pagamento: data_pagamento || null,
                attivo: attivoAuto
            };

            const updateRes = await fetch(`${supabaseUrl}/rest/v1/utenti?cognome=eq.${encodeURIComponent(cognome)}`, {
                method: 'PATCH',
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify(updatePayload)
            });

            if (!updateRes.ok) {
                const errData = await updateRes.text();
                throw new Error('Errore aggiornamento quota: ' + errData);
            }

            return res.status(200).json({ success: true, message: 'Aggiornato con successo' });
        }

        return res.status(405).json({ error: 'Metodo non consentito' });

    } catch (err) {
        console.error('Errore pagamenti-api:', err);
        return res.status(500).json({ error: err.message || 'Errore interno' });
    }
}