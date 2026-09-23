import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'IP sconosciuto';

    if (req.method === 'GET') {
        const { action, data } = req.query;

        if (action === 'get-users') {
            const { data: utenti, error } = await supabase.from('utenti').select('*');
            if (error) return res.status(500).json({ success: false, error: error.message });
            return res.status(200).json({ success: true, utenti });
        }

        if (action === 'get-bookings') {
            const { data: prenotazione, error } = await supabase
                .from('prenotazioni')
                .select('*')
                .eq('data', data)
                .single();

            if (error && error.code !== 'PGRST116') {
                return res.status(500).json({ success: false, error: error.message });
            }

            return res.status(200).json({ 
                success: true, 
                prenotazioni: prenotazione ? prenotazione.dettagli : {} 
            });
        }

        if (action === 'get-logs') {
            const { data: logs, error } = await supabase
                .from('activity_logs')
                .select('*')
                .order('timestamp', { ascending: false })
                .limit(50);

            if (error) return res.status(500).json({ success: false, error: error.message });
            return res.status(200).json({ success: true, logs });
        }

        return res.status(400).json({ success: false, error: 'Azione GET non valida' });
    }

    if (req.method === 'POST') {
        const body = req.body;

        if (body.action === 'save-booking') {
            const { data, chiave, orario, campo, cognome, email } = body;

            // Leggi le prenotazioni esistenti per quella data
            let { data: recordEsistente, error: errRead } = await supabase
                .from('prenotazioni')
                .select('*')
                .eq('data', data)
                .single();

            let dettagli = recordEsistente ? recordEsistente.dettagli : {};
            dettagli[chiave] = { cognome, orario, campo };

            let queryError;
            if (recordEsistente) {
                const { error } = await supabase
                    .from('prenotazioni')
                    .update({ dettagli })
                    .eq('data', data);
                queryError = error;
            } else {
                const { error } = await supabase
                    .from('prenotazioni')
                    .insert([{ data, dettagli }]);
                queryError = error;
            }

            if (queryError) {
                return res.status(500).json({ success: false, error: queryError.message });
            }

            // Registra log di audit
            await supabase.from('activity_logs').insert([{
                user_email: email || cognome,
                action: `Prenotazione Campo ${campo} (${orario}) per il ${data}`,
                ip_address: clientIp,
                metadata: { data, chiave, cognome }
            }]);

            return res.status(200).json({ success: true });
        }

        return res.status(400).json({ success: false, error: 'Azione POST non valida' });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
}