const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

exports.protect = async (req, res, next) => {
    let token;

    // Controlliamo se il token è nell'header della richiesta
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // 1. Estraiamo il token dall'header (es. "Bearer eyJhbGciOi...")
            token = req.headers.authorization.split(' ')[1];

            // 2. Verifichiamo il token usando la nostra chiave segreta
            const decoded = jwt.verify(token, process.env.JWT_SECRET);


            // --- AGGIUNGI QUESTA RIGA ---
            console.log("TOKEN DECODIFICATO:", decoded); 
            // ---------------------------


            // 3. Troviamo l'utente nel database usando l'ID dal token
            // e lo "attacchiamo" all'oggetto della richiesta (req)
            req.user = await User.findById(decoded.userId).select('-password');

            // 4. Se tutto va bene, passiamo al prossimo middleware o al controller
            next();

        } catch (error) {
            res.status(401).json({ error: 'Token non valido o scaduto.' });
        }
    }

    if (!token) {
        res.status(401).json({ error: 'Nessun token, autorizzazione negata.' });
    }
};