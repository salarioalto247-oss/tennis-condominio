// api/pagamenti-api.js (Backend / Serverless Function)
export default async function handler(req, res) {
    // Abilita CORS se necessario o gestisci i metodi HTTP
    const { method } = req;

    try {
        if (method === 'GET') {
            // Esempio: logica per restituire la lista dei pagamenti
            return res.status(200).json({ 
                success: true, 
                message: "Lista pagamenti recuperata con successo",
                data: [] 
            });
        } 
        
        if (method === 'POST') {
            // Esempio: logica per salvare un pagamento
            const nuovoPagamento = req.body;
            return res.status(201).json({ 
                success: true, 
                message: "Pagamento registrato con successo",
                data: nuovoPagamento 
            });
        }

        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Metodo ${method} non consentito`);
        
    } catch (error) {
        console.error("Errore API pagamenti:", error);
        return res.status(500).json({ success: false, error: "Errore interno del server" });
    }
}