// 1. Importiamo gli strumenti necessari
const User = require('../models/userModel');  // Il nostro modello per gli utenti
const RefreshToken = require('../models/refreshTokenModel'); // Importiamo il nuovo modello
const jwt = require('jsonwebtoken'); // Per creare i token di accesso

// Funzione helper per generare i token
const generateTokens = (userId) => {
    const accessToken = jwt.sign(
        { userId }, // Payload
        process.env.ACCESS_TOKEN_SECRET, 
        { expiresIn: '15m' } // Access token a breve scadenza
    );
    const refreshToken = jwt.sign(
        { userId }, // Payload
        process.env.REFRESH_TOKEN_SECRET, 
        { expiresIn: '7d' } // Refresh token a lunga scadenza
    );
    return { accessToken, refreshToken };
};

// --- Funzione per la REGISTRAZIONE ---
exports.register = async (req, res) => {
    try {
        //Prendiamo i dati inviati dal frontend (dal form di registrazione), accettando anche i campi facoltativi
        const { username, email, password, bio, profilePicture, preferredGenres } = req.body;

        // Controlla se l'utente o l'email esistono già
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(409).json({ message: "Username o email già in uso." });
        }

        // Creiamo un nuovo utente usando il nostro modello
        const newUser = new User({
            username,
            email,
            password,
            bio, // Sarà undefined se non fornito, ma il modello ha un default
            profilePicture, // Stessa cosa
            preferredGenres // Sarà un array di stringhe o undefined
        });

        // Salviamo il nuovo utente nel database
        await newUser.save(); // La password viene hashata dal middleware pre-save in userModel

        // Inviamo una risposta positiva al frontend
        res.status(201).json({ message: "Utente registrato con successo!" });

    } catch (error) {
        console.error("Errore registrazione:", error); // Utile per te per debuggare
        // Gestione degli errori di validazione di Mongoose
        // Controlla se l'errore è SPECIFICAMENTE un errore di validazione
        if (error.name === 'ValidationError') {
            // Estrae tutti i messaggi di errore specifici
            const messages = Object.values(error.errors).map(val => val.message);
            // Invia una risposta CHIARA al frontend
            return res.status(400).json({ message: messages.join('. ') });
        }
        
        // Se è un altro tipo di errore (es. il database è offline), allora è un errore del server
        res.status(500).json({ message: "Errore del server durante la registrazione." });
    }
};

// --- Funzione per il LOGIN ---
exports.login = async (req, res) => {
    try {
        // Prendiamo email e password dal form di login
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email e password sono obbligatori." });
        }
        // la ricerca dell'utente nel database viene fatta per email
        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: "Credenziali non valide." });
        }
        // Se le credenziali sono valide, allora creiamo i token
        const { accessToken, refreshToken } = generateTokens(user._id);

        // Salva il refresh token nel database + Log per debug
        console.log(`[LOGIN] Salvataggio refresh token nel DB: ${refreshToken} per utente ${user._id}`);
        await RefreshToken.create({ token: refreshToken, userId: user._id });

        // Imposta il refresh token in un cookie HTTPOnly
        res.cookie('jwt', refreshToken, {
            httpOnly: true, // Accessibile solo dal server web
            secure: process.env.NODE_ENV === 'production', // Solo su HTTPS in produzione
            sameSite: 'Strict', // Aiuta a prevenire CSRF
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 giorni (come la scadenza del token)
        });

        // Invia l'access token nel corpo della risposta
        res.json({
            message: "Login effettuato con successo!",
            accessToken,
            user: { // Invia alcune info utente non sensibili
                id: user._id, 
                username: user.username,
                profilePicture: user.profilePicture }
        });


    } catch (error) {
        console.error("Errore login:", error);
        res.status(500).json({ message: "Errore del server durante il login." });
    }
};

// Refresh Access Token
exports.refresh = async (req, res) => {
    // 1. Controlla se il cookie con il refresh token esiste
    const cookies = req.cookies;
    if (!cookies?.jwt) {
        return res.status(401).json({ message: "Non autorizzato: Refresh token mancante nel cookie." });
    }
    const refreshToken = cookies.jwt;

    try {
        // 2. Cerca il refresh token nel database
        console.log(`[REFRESH] Cerco il token nel DB: ...${refreshToken.slice(-10)}`); // Log per debug
        const foundToken = await RefreshToken.findOne({ token: refreshToken });

        // 3. Se il token non è nel DB, non è valido. Accesso negato.
        if (!foundToken) {
            console.log(`[REFRESH] Token non trovato nel DB. Accesso negato.`);
            return res.status(403).json({ message: "Proibito: Refresh token non valido o scaduto." });
        }
        console.log(`[REFRESH] Token trovato nel DB per l'utente ${foundToken.userId}. Procedo con la verifica JWT.`);

        // 4. Se il token è nel DB, verifica che la firma sia valida e che non sia scaduto.
        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            (err, decoded) => {
                // Se la verifica fallisce O l'ID utente nel token non corrisponde a quello associato nel DB
                if (err || foundToken.userId.toString() !== decoded.userId) {
                    console.error("[REFRESH] Errore di verifica JWT o mismatch di userId.");
                    return res.status(403).json({ message: "Proibito: La verifica del token è fallita." });
                }

                // 5. Se tutto è valido, genera un nuovo Access Token
                const accessToken = jwt.sign(
                    { userId: decoded.userId },
                    process.env.ACCESS_TOKEN_SECRET,
                    { expiresIn: '15m' }
                );

                console.log(`[REFRESH] Nuovo Access Token generato con successo per l'utente ${decoded.userId}`);
                res.json({ accessToken });
            }
        );
    } catch (error) {
        console.error("Errore generico nel refresh token:", error);
        res.status(500).json({ message: "Errore del server durante il refresh del token." });
    }
};

// --- Funzione per il LOGOUT ---


exports.logout = async (req, res) => {
    // 1. Controlla se il cookie jwt esiste nella richiesta
    const cookies = req.cookies;
    if (!cookies?.jwt) {
        // Se non c'è cookie, non c'è nulla da fare. L'utente è già effettivamente "loggato fuori".
        return res.sendStatus(204); // No Content
    }

    const refreshToken = cookies.jwt;

    try {
        // 2. Rimuovi il refresh token dal database per invalidarlo
        console.log(`[LOGOUT] Tentativo di eliminare il refresh token dal DB: ...${refreshToken.slice(-10)}`);
        
        // Eseguiamo l'eliminazione una sola volta
        const result = await RefreshToken.deleteOne({ token: refreshToken });

        if (result.deletedCount === 0) {
            // Questo non è un errore critico, ma è un'informazione utile da loggare.
            // Significa che il client aveva un cookie per un token che non era più nel nostro DB (magari scaduto e già pulito).
            console.warn(`[LOGOUT] ATTENZIONE: Nessun refresh token trovato nel DB da eliminare.`);
        } else {
            console.log(`[LOGOUT] Refresh token eliminato con successo dal DB.`);
        }

        // 3. Diciamo al browser di cancellare il cookie jwt
        res.clearCookie('jwt', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict'
        });

        // 4. Invia una risposta di successo
        return res.status(200).json({ message: "Logout effettuato con successo." });

    } catch (error) {
        // Se c'è un errore con il database, puliamo comunque il cookie dal browser
        // per non lasciare il client in uno stato inconsistente.
        console.error("Errore durante il logout:", error);
        res.clearCookie('jwt', { httpOnly: true, sameSite: 'Strict', secure: process.env.NODE_ENV === 'production' });
        res.status(500).json({ message: "Errore del server durante il logout." });
    }
};