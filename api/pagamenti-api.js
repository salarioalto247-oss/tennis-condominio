export default function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Restituisce un elenco mock o i dati di base puliti se richiesto direttamente via GET
    // (Nota: se preferisci richiamare direttamente /api/admin dal frontend, possiamo anche far puntare la tabella lì)
    const datiBase = [
        { utente: "Mario Rossi", importo: "50.00", stato: "Verifica", data: "-" },
        { utente: "Luigi Verdi", importo: "30.00", stato: "Verifica", data: "-" }
    ];

    return.status(200).json({
        success: true,
        data: datiBase
    });
}