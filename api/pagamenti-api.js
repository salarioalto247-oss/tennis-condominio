import { createClient } from '@supabase/supabase-js';

// Inizializzazione client Supabase (utilizza le variabili d'ambiente configurate su Vercel)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        if (!supabase) {
            // Fallback se Supabase non è configurato nell'ambiente locale di test
            return.status(200).json({
                success: true,
                data: [
                    { utente: "Mario Rossi", importo: "50.00", stato: "Pagato", data: "2026-06-01" },
                    { utente: "Luigi Verdi", importo: "30.00", stato: "In attesa", data: "2026-06-05" }
                ]
            });
        }

        // Interroga la tabella 'utenti' su Supabase
        const { data: utenti, error } = await supabase
            .from('utenti')
            .select('*');

        if (error) {
            throw error;
        }

        // Mappa i dati filtrandoli: prendiamo solo nome/cognome e informazioni di pagamento, omettendo PIN e is_admin
        const pagamentiSanitizzati = (utenti || []).map(u => {
            return {
                utente: u.cognome || u.nome || 'Socio',
                // Se nella tabella hai colonne specifiche per i pagamenti (es. importo, stato), le mappiamo qui, altrimenti impostiamo valori di default o basati sui campi esistenti
                importo: u.importo || '50.00', 
                stato: u.stato_pagamento || u.stato || 'Verifica',
                data: u.updated_at ? u.updated_at.split('T')[0] : '-'
            };
        });

        return.status(200).json({
            success: true,
            data: pagamentiSanitizzati
        });

    } catch (err) {
        console.error("Errore recupero dati da Supabase:", err);
        return.status(500).json({ success: false, error: err.message });
    }
}