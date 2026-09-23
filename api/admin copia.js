import crypto from 'crypto';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Variabili d ambiente Supabase non configurate' });
  }

  async function getGoogleAccessToken() {
    if (!serviceAccountJson) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON mancante');
    const sa = JSON.parse(serviceAccountJson);

    const header = JSON.stringify({ alg: 'RS256', typ: 'JWT' });
    const now = Math.floor(Date.now() / 1000);
    const claim = JSON.stringify({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/calendar',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    });

    const base64UrlEncode = (str) => Buffer.from(str).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const unsignedJwt = base64UrlEncode(header) + '.' + base64UrlEncode(claim);

    const sign = crypto.createSign('RSA-SHA256');
    sign.update(unsignedJwt);
    const signature = sign.sign(sa.private_key, 'base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const jwt = unsignedJwt + '.' + signature;

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) throw new Error('Errore autenticazione Google: ' + JSON.stringify(tokenData));
    return tokenData.access_token;
  }

  const scriviLog = async (userEmail, actionType, details) => {
    try {
      const clientIp = req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : 'N.D.';
      
      const metadataConIp = {
        ...details,
        ip_dispositivo: clientIp
      };

      await fetch(`${supabaseUrl}/rest/v1/activity_logs`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          user_email: userEmail || 'Amministratore',
          action: actionType,
          ip_address: clientIp,
          metadata: metadataConIp
        })
      });
    } catch (e) {
      console.error('Errore scrittura log:', e);
    }
  };

  try {
    const formatUsers = (users) => {
      if (!Array.isArray(users)) return [];
      return users.map(u => ({
        ...u,
        isAdmin: u.is_admin === true || u.is_admin === 'TRUE' || u.is_admin === 'true'
      }));
    };

    if (req.method === 'GET') {
      const response = await fetch(`${supabaseUrl}/rest/v1/utenti?select=*&order=cognome.asc`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(JSON.stringify(data));
      return res.status(200).json(formatUsers(data));
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      const { action, cognome, newPin, vecchioCognome, nuovoCognome, is_admin, chiave, utenti, tipoAzione } = body;

      // Azione di lettura prenotazioni (consentita a tutti gli utenti autenticati)
      if (action === 'get-prenotazioni') {
        if (!calendarId) return res.status(500).json({ error: 'GOOGLE_CALENDAR_ID non configurato' });
        const accessToken = await getGoogleAccessToken();

        const calRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?singleEvents=true`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        const calData = await calRes.json();
        if (!calRes.ok) throw new Error(JSON.stringify(calData));

        const prenotazioniGlobali = {};
        if (calData.items) {
          calData.items.forEach(item => {
            if (item.description) {
              const match = item.description.match(/chiave:\s*([^\n]+)/);
              if (match && match[1]) {
                const chiaveSlot = match[1].trim();
                const utentiMatch = item.summary.replace('Tennis: ', '').split('&').map(s => s.trim()).filter(Boolean);
                prenotazioniGlobali[chiaveSlot] = utentiMatch;
              }
            }
          });
        }
        return res.status(200).json(prenotazioniGlobali);
      }

      if (action === 'save-prenotazione') {
        if (!calendarId) return res.status(500).json({ error: 'GOOGLE_CALENDAR_ID non configurato' });
        if (!chiave) return res.status(400).json({ error: 'Chiave slot mancante' });

        const accessToken = await getGoogleAccessToken();
        const [dataIso, oraStr] = chiave.split('_');
        const [ore] = oraStr.split(':');
        
        const startDateTime = `${dataIso}T${ore.padStart(2, '0')}:00:00+02:00`;
        const endHour = parseInt(ore, 10) + 1;
        const endDateTime = `${dataIso}T${String(endHour).padStart(2, '0')}:00:00+02:00`;

        const searchRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?singleEvents=true`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        const searchData = await searchRes.json();
        let existingEventId = null;

        if (searchData.items) {
          const found = searchData.items.find(item => item.description && item.description.includes(`chiave: ${chiave}`));
          if (found) existingEventId = found.id;
        }

        let logActionType = tipoAzione;
        if (!logActionType) {
          if (!utenti || utenti.length === 0) {
            logActionType = 'CANCELLAZIONE';
          } else if (utenti.length === 2) {
            logActionType = 'UNIONE_DOPPIO';
          } else {
            logActionType = 'NUOVA_PRENOTAZIONE';
          }
        }

        if (!utenti || utenti.length === 0) {
          if (existingEventId) {
            await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${existingEventId}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${accessToken}` }
            });
          }
        } else {
          const summary = `Tennis: ${utenti.join(' & ')}`;
          const description = `Prenotazione campo da tennis.\nchiave: ${chiave}`;

          const eventBody = {
            summary,
            description,
            start: { dateTime: startDateTime },
            end: { dateTime: endDateTime }
          };

          if (existingEventId) {
            await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${existingEventId}`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(eventBody)
            });
          } else {
            await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(eventBody)
            });
          }
        }

        await scriviLog(cognome || 'Utente', logActionType, { slot: chiave, utenti });
        return res.status(200).json({ success: true });
      }

      if (action === 'get-logs') {
        const response = await fetch(`${supabaseUrl}/rest/v1/activity_logs?select=*&order=timestamp.desc&limit=100`, {
          headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
        });
        const data = await response.json();
        return res.status(200).json(data);
      }

      if (action === 'get-users' || !action) {
        const response = await fetch(`${supabaseUrl}/rest/v1/utenti?select=*&order=cognome.asc`, {
          headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
        });
        const data = await response.json();
        return res.status(200).json(formatUsers(data));
      }

      if (action === 'add') {
        const generatedPin = newPin || Math.floor(1000 + Math.random() * 9000).toString();
        const response = await fetch(`${supabaseUrl}/rest/v1/utenti`, {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({ cognome, pin: generatedPin, is_admin: is_admin || false })
        });
        await response.json();
        await scriviLog('Admin', 'ADD_USER', { target: cognome });
        return res.status(200).json({ success: true, message: `Utente ${cognome} aggiunto` });
      }

      if (action === 'reset-pin') {
        const pinToSet = newPin || Math.floor(1000 + Math.random() * 9000).toString();
        await fetch(`${supabaseUrl}/rest/v1/utenti?cognome=eq.${encodeURIComponent(cognome)}`, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ pin: pinToSet })
        });
        await scriviLog('Admin', 'RESET_OR_UPDATE_PIN', { target: cognome });
        return res.status(200).json({ success: true });
      }

      if (action === 'update-cognome') {
        await fetch(`${supabaseUrl}/rest/v1/utenti?cognome=eq.${encodeURIComponent(vecchioCognome)}`, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ cognome: nuovoCognome })
        });
        await scriviLog('Admin', 'UPDATE_COGNOME', { vecchio: vecchioCognome, nuovo: nuovoCognome });
        return res.status(200).json({ success: true });
      }

      if (action === 'delete') {
        await fetch(`${supabaseUrl}/rest/v1/utenti?cognome=eq.${encodeURIComponent(cognome)}`, {
          method: 'DELETE',
          headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
        });
        await scriviLog('Admin', 'DELETE_USER', { target: cognome });
        return res.status(200).json({ success: true });
      }

      return res.status(400).json({ error: 'Azione non riconosciuta' });
    }

    return res.status(405).json({ error: 'Metodo non consentito' });

  } catch (err) {
    console.error('Errore backend:', err);
    return res.status(500).json({ error: err.message || 'Errore interno' });
  }
}