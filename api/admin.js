import { createClient } from '@supabase/supabase-js';

// Inizializza il client di Supabase usando le variabili d'ambiente di Vercel
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  // Abilita CORS se necessario
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GESTIONE RICHIESTA GET: Legge la lista degli utenti da Supabase
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('utenti')
        .select('*')
        .order('cognome', { ascending: true });

      if (error) throw error;
      return res.status(200).json(data);
    }

    // GESTIONE RICHIESTA POST: Aggiorna o modifica i dati (es. PIN o utenti)
    if (req.method === 'POST') {
      const { cognome, pin, is_admin } = req.body;

      if (!cognome) {
        return res.status(400).json({ error: 'Il campo cognome è obbligatorio' });
      }

      // Esegue l'aggiornamento dell'utente nel database Supabase
      const { data, error } = await supabase
        .from('utenti')
        .update({ pin, is_admin })
        .eq('cognome', cognome)
        .select();

      if (error) throw error;

      return res.status(200).json({ success: true, data });
    }

    return res.status(405).json({ error: 'Metodo non consentito' });

  } catch (err) {
    console.error('Errore backend Supabase:', err.message);
    return res.status(500).json({ error: err.message });
  }
}