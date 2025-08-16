const jwt = require('jsonwebtoken'); // Importiamo la libreria per gestire i JSON Web Token

// Esportiamo la funzione middleware chiamata 'protect'.
// Un middleware è una funzione che si mette in mezzo tra la richiesta e la risposta.
// Ha accesso a tre parametri: req (la richiesta), res (la risposta), e next (una funzione per passare al prossimo middleware).
exports.protect = (req, res, next) => {
    
    // 1. ESTRAZIONE DEL TOKEN DALL'HEADER
    // Cerchiamo l'header 'Authorization' nella richiesta in arrivo.
    // Alcuni client lo inviano come 'authorization' (minuscolo), altri come 'Authorization' (maiuscolo).
    // Controlliamo entrambi per robustezza.
    const authHeader = req.headers.authorization || req.headers.Authorization;

    // Controlliamo se l'header esiste e se inizia con "Bearer ".
    // Il formato standard è "Authorization: Bearer <token>".
    // L'operatore '?.' (optional chaining) previene un errore se authHeader fosse nullo o undefined.
    if (!authHeader?.startsWith('Bearer ')) {
        // Se l'header manca o non ha il formato corretto, l'utente non è autorizzato.
        // Restituiamo un errore 401 (Unauthorized) e fermiamo l'esecuzione.
        return res.status(401).json({ message: 'Non autorizzato: Token mancante o malformato' });
    }

    // Se il formato è corretto, estraiamo solo la stringa del token.
    // "Bearer eyJhbGci..." -> .split(' ') -> ["Bearer", "eyJhbGci..."] -> [1] -> "eyJhbGci..."
    const token = authHeader.split(' ')[1];

    // 2. VERIFICA DEL TOKEN
    // Usiamo la funzione verify di jwt per controllare il token.
    // Questa funzione fa tre cose:
    //   a) Controlla che il token non sia stato manomesso (verifica la firma).
    //   b) Controlla che il token non sia scaduto.
    //   c) Se tutto è ok, decodifica il payload (i dati che abbiamo inserito al login).
    jwt.verify(
        token,                          // Il token da verificare
        process.env.ACCESS_TOKEN_SECRET, // La stessa chiave segreta usata per firmarlo
        (err, decoded) => {            // Una funzione "callback" che viene eseguita al termine della verifica
            // 3. GESTIONE DEL RISULTATO DELLA VERIFICA
            if (err) {
                // Se la verifica fallisce (es. firma non valida, token scaduto), 'err' conterrà i dettagli.
                // In questo caso, l'utente non ha il permesso di accedere.
                // Restituiamo un errore 403 (Forbidden - Accesso Vietato).
                return res.status(403).json({ message: 'Proibito: Token non valido o scaduto' });
            }
            
            // Se la verifica ha successo, 'decoded' conterrà il nostro payload.
            // Il nostro payload contiene l'ID dell'utente: { userId: '...', iat: ..., exp: ... }

            // 4. AGGIUNTA DEI DATI ALLA RICHIESTA
            // "Attacchiamo" l'ID dell'utente all'oggetto 'req'.
            // In questo modo, qualsiasi controller o middleware successivo nella catena
            // potrà accedere a req.userId e sapere chi sta facendo la richiesta.
            req.userId = decoded.userId;
            
            // 5. PASSAGGIO AL PROSSIMO STEP
            // Chiamiamo la funzione next() per dire a Express: "Controllo superato,
            // puoi passare alla prossima funzione nella catena (che di solito è il nostro controller)".
            next();
        }
    );
};