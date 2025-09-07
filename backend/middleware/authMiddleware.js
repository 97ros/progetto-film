// Importiamo la libreria per gestire i JSON Web Token
const jwt = require('jsonwebtoken');

// Esportiamo la funzione middleware chiamata 'protect'
exports.protect = (req, res, next) => {
    
    // ESTRAZIONE del token dall'header Authorization
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Non autorizzato: Token mancante o malformato' });
    }

    const token = authHeader.split(' ')[1];

    // VERIFICA del token
    jwt.verify(
        token,                          
        process.env.ACCESS_TOKEN_SECRET, 
        (err, decoded) => {
            if (err) {
                return res.status(403).json({ message: 'Proibito: Token non valido o scaduto' });
            }

            req.userId = decoded.userId;
            
            next();
        }
    );
};