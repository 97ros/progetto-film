// Importiamo la libreria per gestire i JSON Web Token
const jwt = require('jsonwebtoken');

// Esportiamo la funzione middleware chiamata 'protect'
exports.protect = (req, res, next) => {
    
    // Estrazione del token dall'header Authorization
    const authHeader = req.headers.authorization || req.headers.Authorization;

    // Controlliamo se il token è presente e ben formato
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Non autorizzato: Token mancante o malformato' });
    }

    // Estraiamo il token dall'header
    const token = authHeader.split(' ')[1];

    // Verifica del token
    jwt.verify(
        token,                          
        process.env.ACCESS_TOKEN_SECRET, 
        (err, decoded) => {
            if (err) {
                return res.status(403).json({ message: 'Proibito: Token non valido o scaduto' });
            }
            // Aggiungiamo l'ID dell'utente alla richiesta per usi futuri
            req.userId = decoded.userId;
            // Procediamo al prossimo middleware o alla route handler
            next();
        }
    );
};