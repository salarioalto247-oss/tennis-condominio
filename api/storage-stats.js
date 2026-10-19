import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // CORS e controllo metodo
  if (req.method === 'GET') {
    try {
      // Interroghiamo Postgres per calcolare lo spazio reale occupato dalle tabelle in MB
      // Nota: Richiede permessi di lettura sulle viste di sistema di Postgres
      const { data, error } = await supabase.rpc('get_database_size_stats');
      
      // Se la funzione RPC non è ancora creata, restituiamo una stima basata sul conteggio record
      if (error) {
        // Fallback di stima basato sul numero di righe se la RPC non esiste
        const { count: prenotazioniCount } = await supabase.from('prenotazioni').select('*', { count: 'exact', head: true });
        const { count: invitiCount } = await supabase.from('inviti').select('*', { count: 'exact', head: true });
        
        // Stima approssimativa: es. 2 KB per record totale
        const estimatedBytes = ((prenotazioniCount || 0) + (invitiCount || 0)) * 2048;
        const totalMB = (estimatedBytes / (1024 * 1024)).toFixed(2);
        
        return res.status(200).json({
          usedMB: parseFloat(totalMB),
          limitMB: 500,
          percentage: ((totalMB / 500) * 100).toFixed(1),
          details: { prenotazioni: prenotazioniCount, inviti: invitiCount }
        });
      }

      return res.status(200).json(data);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  } 
  
  if (req.method === 'POST') {
    try {
      // Azione di Svecchiamento: elimina i dati storici (es. completati o vecchi di oltre 6 mesi)
      const seiMesiFa = new Date();
      seiMesiFa.setMonth(seiMesiFa.getMonth() - 6);

      // Esempio di pulizia su tabelle storiche
      const { error: cleanError, count } = await supabase
        .from('prenotazioni')
        .delete({ count: 'exact' })
        .lt('created_at', seiMesiFa.toISOString())
        .in('stato', ['completata', 'annullata']);

      if (cleanError) throw cleanError;

      return res.status(200).json({ 
        success: true, 
        message: `Svecchiamento completato con successo. Rimossi record obsoleti.` 
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Metodo non consentito' });
}
