import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  // Imposta gli header CORS per consentire le chiamate dal frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Variabili d\'ambiente di Supabase non configurate correttamente sul server.' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  if (req.method === 'GET') {
    try {
      // Eseguiamo il conteggio dei record per stimare lo spazio occupato in MB
      const { count: prenotazioniCount, error: err1 } = await supabase.from('prenotazioni').select('*', { count: 'exact', head: true });
      const { count: invitiCount, error: err2 } = await supabase.from('inviti').select('*', { count: 'exact', head: true });

      if (err1) console.warn("Avviso tabella prenotazioni:", err1.message);
      if (err2) console.warn("Avviso tabella inviti:", err2.message);

      // Stima prudenziale: 2 KB per record totale tra prenotazioni e inviti
      const totalRecords = (prenotazioniCount || 0) + (invitiCount || 0);
      const estimatedBytes = totalRecords * 2048;
      const totalMB = (estimatedBytes / (1024 * 1024)).toFixed(2);
      
      return res.status(200).json({
        usedMB: parseFloat(totalMB),
        limitMB: 500,
        percentage: ((totalMB / 500) * 100).toFixed(1),
        details: { 
          prenotazioni: prenotazioniCount || 0, 
          inviti: invitiCount || 0 
        }
      });
    } catch (err) {
      return res.status(500).json({ error: 'Errore interno nel calcolo dello storage: ' + err.message });
    }
  } 
  
  if (req.method === 'POST') {
    try {
      const seiMesiFa = new Date();
      seiMesiFa.setMonth(seiMesiFa.getMonth() - 6);

      // Eliminazione sicura dei dati storici obsoleti
      const { error: cleanError } = await supabase
        .from('prenotazioni')
        .delete()
        .lt('created_at', seiMesiFa.toISOString())
        .in('stato', ['completata', 'annullata']);

      if (cleanError) throw cleanError;

      return res.status(200).json({ 
        success: true, 
        message: 'Svecchiamento completato con successo. I dati storici obsoleti sono stati rimossi.' 
      });
    } catch (err) {
      return res.status(500).json({ error: 'Errore durante la pulizia: ' + err.message });
    }
  }

  return res.status(405).json({ error: 'Metodo non consentito' });
}