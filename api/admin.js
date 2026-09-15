// api/admin.js (Serverless Function per Vercel)

// Lista utenti di default[cite: 1]
let usersJson = [
  { cognome: 'Admin', pin: '0000', isAdmin: true },
  { cognome: 'Rossi', pin: '1234', isAdmin: false },
  { cognome: 'Giliberti', pin: '1234', isAdmin: false },
  { cognome: 'Cataliotti', pin: '1234', isAdmin: false },
  { cognome: 'Bonini', pin: '4321', isAdmin: false },
  { cognome: 'Maccaroni', pin: '4321', isAdmin: false }
];

// Archivio globale condiviso per le prenotazioni (chiave: "YYYY-MM-DD_HH:00", valore: array di cognomi)
let prenotazioniServer = {};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    if (req.method === 'GET') {
      return res.status(200).json(usersJson);
    }

    if (req.method === 'POST') {
      const { adminPin, action, cognome, newCognome, newPin, bookings } = req.body;

      // Gestione lettura prenotazioni (consentita anche agli utenti autenticati)
      if (action === 'get-bookings') {
        return res.status(200).json(prenotazioniServer);
      }

      // Gestione salvataggio prenotazioni
      if (action === 'save-bookings') {
        if (bookings && typeof bookings === 'object') {
          prenotazioniServer = bookings;
          return res.status(200).json({ success: true, message: 'Prenotazioni salvate con successo sul server' });
        }
        return res.status(400).json({ error: 'Dati prenotazioni non validi' });
      }

      const adminUser = usersJson.find(u => u.isAdmin && u.pin === adminPin);
      const isMasterAdmin = (adminPin === '0000');

      if (action !== 'get-users' && !adminUser && !isMasterAdmin) {
        return res.status(401).json({ error: 'PIN Amministratore non valido' });
      }

      if (action === 'get-users') {
        return res.status(200).json(usersJson);
      }

      if (action === 'add') {
        if (!cognome) return res.status(400).json({ error: 'Cognome obbligatorio' });
        const generatedPin = newPin || Math.floor(1000 + Math.random() * 9000).toString();
        
        if (usersJson.some(u => u.cognome.toLowerCase() === cognome.toLowerCase())) {
          return res.status(400).json({ error: 'Utente già esistente' });
        }

        usersJson.push({ cognome, pin: generatedPin, isAdmin: false });
        return res.status(200).json({ success: true, message: `Utente ${cognome} aggiunto con PIN: ${generatedPin}` });
      }

      if (action === 'edit') {
        const user = usersJson.find(u => u.cognome.toLowerCase() === cognome.toLowerCase());
        if (!user) return res.status(404).json({ error: 'Utente non trovato' });

        if (newCognome) user.cognome = newCognome;
        if (newPin) user.pin = newPin;

        return res.status(200).json({ success: true, message: 'Utente aggiornato con successo' });
      }

      if (action === 'reset-pin') {
        const user = usersJson.find(u => u.cognome.toLowerCase() === cognome.toLowerCase());
        if (!user) return res.status(404).json({ error: 'Utente non trovato' });

        const generatedPin = newPin || Math.floor(1000 + Math.random() * 9000).toString();
        user.pin = generatedPin;
        return res.status(200).json({ success: true, message: `PIN aggiornato per ${cognome}: ${generatedPin}` });
      }

      if (action === 'delete') {
        if (cognome.toLowerCase() === 'admin') {
          return res.status(400).json({ error: 'Impossibile eliminare l account Admin principale' });
        }
        usersJson = usersJson.filter(u => u.cognome.toLowerCase() !== cognome.toLowerCase());
        return res.status(200).json({ success: true, message: `Utente ${cognome} rimosso` });
      }

      return res.status(400).json({ error: 'Azione non riconosciuta' });
    }

    return res.status(405).json({ error: 'Metodo non consentito' });
  } catch (err) {
    console.error('Errore serverless:', err);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
}