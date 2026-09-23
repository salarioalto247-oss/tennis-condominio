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
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;
  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Variabili d ambiente Supabase non configurate' });
  }

  try {
    if (req.method === 'GET') {
      const response = await fetch(`${supabaseUrl}/rest/v1/utenti?select=*`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      const data = await response.json();
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      const { action } = body;

      if (action === 'get-prenotazioni') {
        if (!calendarId || !clientEmail || !privateKey) {
          return res.status(200).json({});
        }

        try {
          const jwtToken = await getGoogleJWT(clientEmail, privateKey);
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          const timeMin = now.toISOString();
          
          const calRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${timeMin}&singleEvents=true&maxResults=250`, {
            headers: { 'Authorization': `Bearer ${jwtToken}` }
          });
          const calData = await calRes.json();
          
          const mappaPrenotazioni = {};
          if (calData && calData.items) {
            calData.items.forEach(item => {
              const summary = item.summary || '';
              const description = item.description || '';
              const startIso = item.start.dateTime || item.start.date;
              
              if (startIso) {
                const datePart = startIso.split('T')[0];
                const timePart = startIso.split('T')[1] ? startIso.split('T')[1].substring(0, 5) : '08:00';
                const chiave = `${datePart}_${timePart}`;
                
                let utentiArray = [];
                if (description) {
                  utentiArray = description.split(',').map(u => u.trim()).filter(Boolean);
                } else if (summary.includes(':')) {
                  const parts = summary.split(':');
                  if (parts[1]) utentiArray = parts[1].split('&').map(u => u.trim()).filter(Boolean);
                }
                
                if (utentiArray.length > 0) {
                  mappaPrenotazioni[chiave] = utentiArray;
                }
              }
            });
          }
          return res.status(200).json(mappaPrenotazioni);
        } catch (calErr) {
          console.error('Errore lettura Google Calendar:', calErr);
          return res.status(200).json({});
        }
      }

      if (action === 'save-prenotazione') {
        const { chiave, utenti } = body;
        if (!chiave) return res.status(400).json({ error: 'Chiave slot mancante' });

        if (!calendarId || !clientEmail || !privateKey) {
          return res.status(500).json({ error: 'Google Calendar non configurato' });
        }

        const [dateIso, oraInizio] = chiave.split('_');
        const [ore] = oraInizio.split(':');
        const oraFineNum = parseInt(ore) + 1;
        const oraFine = (oraFineNum < 10 ? `0${oraFineNum}` : `${oraFineNum}`) + ':00';

        const startDateTime = `${dateIso}T${oraInizio}:00Z`;
        const endDateTime = `${dateIso}T${oraFine}:00Z`;
        const jwtToken = await getGoogleJWT(clientEmail, privateKey);

        const searchRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${dateIso}T00:00:00Z&timeMax=${dateIso}T23:59:59Z&singleEvents=true`, {
          headers: { 'Authorization': `Bearer ${jwtToken}` }
        });
        const searchData = await searchRes.json();
        
        let existingEventId = null;
        if (searchData && searchData.items) {
          const found = searchData.items.find(ev => {
            const evStart = ev.start.dateTime || ev.start.date;
            return evStart && evStart.includes(`${dateIso}T${oraInizio}`);
          });
          if (found) existingEventId = found.id;
        }

        if (!utenti || utenti.length === 0) {
          if (existingEventId) {
            await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${existingEventId}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${jwtToken}` }
            });
          }
        } else {
          const eventSummary = `Tennis: ${utenti.join(' & ')}`;
          const eventDescription = utenti.join(', ');
          const eventBody = {
            summary: eventSummary,
            description: eventDescription,
            start: { dateTime: startDateTime },
            end: { dateTime: endDateTime }
          };

          if (existingEventId) {
            await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${existingEventId}`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${jwtToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(eventBody)
            });
          } else {
            await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${jwtToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(eventBody)
            });
          }
        }

        return res.status(200).json({ success: true });
      }

      if (action === 'get-users') {
        const response = await fetch(`${supabaseUrl}/rest/v1/utenti?select=*`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        });
        const users = await response.json();
        
        const { adminPin } = body;
        const isMaster = (adminPin === '0000');
        const adminFound = users.find(u => u.pin === adminPin && u.is_admin === true);

        if (!isMaster && !adminFound) {
          return res.status(403).json({ error: 'Non autorizzato' });
        }

        return res.status(200).json(users);
      }

      if (action === 'add') {
        const { cognome, newPin } = body;
        if (!cognome) return res.status(400).json({ error: 'Cognome obbligatorio' });

        const pinDaUsare = newPin || Math.floor(1000 + Math.random() * 9000).toString();

        const insertRes = await fetch(`${supabaseUrl}/rest/v1/utenti`, {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            cognome: cognome.trim(),
            pin: pinDaUsare,
            is_admin: false,
            quota_pagata: false,
            anno_quota: new Date().getFullYear().toString()
          })
        });

        if (!insertRes.ok) {
          const err = await insertRes.json();
          return res.status(400).json({ error: err.message || 'Errore inserimento utente' });
        }

        return res.status(200).json({ success: true, pin: pinDaUsare });
      }

      if (action === 'delete') {
        const { cognome } = body;
        if (!cognome || cognome.toLowerCase() === 'admin') {
          return res.status(400).json({ error: 'Impossibile eliminare questo utente' });
        }

        const delRes = await fetch(`${supabaseUrl}/rest/v1/utenti?cognome=eq.${encodeURIComponent(cognome)}`, {
          method: 'DELETE',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        });

        if (!delRes.ok) return res.status(400).json({ error: 'Errore durante l eliminazione' });
        return res.status(200).json({ success: true });
      }

      if (action === 'reset-pin') {
        const { cognome, newPin } = body;
        if (!cognome || !newPin) return res.status(400).json({ error: 'Dati incompleti' });

        const patchRes = await fetch(`${supabaseUrl}/rest/v1/utenti?cognome=eq.${encodeURIComponent(cognome)}`, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ pin: newPin })
        });

        if (!patchRes.ok) return res.status(400).json({ error: 'Errore aggiornamento PIN' });
        return res.status(200).json({ success: true });
      }

      if (action === 'get-logs') {
        return res.status(200).json([]);
      }

      return res.status(400).json({ error: 'Azione non riconosciuta' });
    }

    return res.status(405).json({ error: 'Metodo non consentito' });

  } catch (err) {
    console.error('Errore API Admin:', err);
    return res.status(500).json({ error: err.message || 'Errore interno server' });
  }
}

async function getGoogleJWT(clientEmail, privateKey) {
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/calendar',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  const base64UrlEncode = (str) => Buffer.from(str).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const unsignedToken = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(payload))}`;

  const crypto = await import('crypto');
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(unsignedToken);
  const signature = sign.sign(privateKey, 'base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const jwt = `${unsignedToken}.${signature}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=authorization_assertion&assertion=${jwt}`
  });
  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}