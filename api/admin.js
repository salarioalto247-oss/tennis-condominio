// Esempio di codice per il file api/admin.js sul server Vercel
// (Adatta la logica di lettura/scrittura in base a come memorizzi gli utenti, es. file JSON o DB)

export default async function handler(req, res) {
  // Imposta le intestazioni CORS se necessario
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Esempio di elenco utenti in memoria o persistito (sostituisci con la tua logica di storage reale)
  // Nota: se usi un file JSON o un DB, carica qui i dati.
  let utenti = [
    { cognome: 'Admin', pin: '0000', isAdmin: true },
    { cognome: 'Rossi', pin: '1234', isAdmin: false },
    { cognome: 'Giliberti', pin: '1234', isAdmin: false },
    { cognome: 'Cataliotti', pin: '1234', isAdmin: false },
    { cognome: 'Bonini', pin: '4321', isAdmin: false },
    { cognome: 'Maccaroni', pin: '4321', isAdmin: false }
  ];

  if (req.method === 'GET') {
    // Restituisce la lista pubblica degli utenti (senza mostrare i PIN se preferisci, o con i PIN se richiesto)
    return res.status(200).json(utenti);
  }

  if (req.method === 'POST') {
    const { adminPin, action, cognome, newPin, vecchioCognome, nuovoCognome } = req.body;

    // Verifica che l'utente che compie l'azione sia l'Admin principale
    if (adminPin !== '0000') {
      return res.status(401).json({ error: 'Non autorizzato. Solo l Admin può eseguire questa azione.' });
    }

    if (action === 'get-users') {
      return res.status(200).json(utenti);
    }

    if (action === 'add') {
      if (!cognome) return res.status(400).json({ error: 'Cognome obbligatorio' });
      const pinDaAssegnare = newPin || Math.floor(1000 + Math.random() * 9000).toString();
      
      // Controlla se esiste già
      if (utenti.some(u => u.cognome.toLowerCase() === cognome.toLowerCase())) {
        return res.status(400).json({ error: 'Utente già esistente.' });
      }

      utenti.push({ cognome: cognome.trim(), pin: pinDaAssegnare, isAdmin: false });
      return res.status(200).json({ message: `Utente ${cognome} aggiunto con successo (PIN: ${pinDaAssegnare})` });
    }

    if (action === 'reset-pin') {
      const utente = utenti.find(u => u.cognome.toLowerCase() === cognome.toLowerCase());
      if (!utente) return res.status(404).json({ error: 'Utente non trovato.' });

      // Se viene passato newPin lo usa (Modifica manuale), altrimenti ne genera uno random (Reset)
      const pinFinale = newPin || Math.floor(1000 + Math.random() * 9000).toString();
      utente.pin = pinFinale;

      return res.status(200).json({ message: 'PIN aggiornato con successo', pin: pinFinale });
    }

    if (action === 'update-cognome') {
      if (!vecchioCognome || !nuovoCognome) {
        return res.status(400).json({ error: 'Vecchio e nuovo cognome sono obbligatori.' });
      }
      
      const utente = utenti.find(u => u.cognome.toLowerCase() === vecchioCognome.toLowerCase());
      if (!utente) return res.status(404).json({ error: 'Utente non trovato.' });

      utente.cognome = nuovoCognome.trim();
      return res.status(200).json({ message: 'Cognome aggiornato con successo' });
    }

    if (action === 'delete') {
      if (cognome.toLowerCase() === 'admin') {
        return res.status(400).json({ error: 'Non puoi eliminare l account Admin principale.' });
      }
      utenti = utenti.filter(u => u.cognome.toLowerCase() !== cognome.toLowerCase());
      return res.status(200).json({ message: 'Utente eliminato con successo' });
    }

    return res.status(400).json({ error: 'Azione non riconosciuta' });
  }

  return res.status(405).json({ error: 'Metodo non consentito' });
}