// Importiamo il nostro modello per gli utenti
const User = require('../models/userModel'); 

// Importiamo il nostro modello per i token di refresh
const RefreshToken = require('../models/refreshTokenModel');

// Importiamo la libreria jsonwebtoken
const jwt = require('jsonwebtoken');

// Funzione helper per generare i token
const generateTokens = (userId) => {
    const accessToken = jwt.sign(
        { userId }, 
        process.env.ACCESS_TOKEN_SECRET, 
        { expiresIn: '15m' }
    );
    const refreshToken = jwt.sign(
        { userId }, 
        process.env.REFRESH_TOKEN_SECRET, 
        { expiresIn: '7d' }
    );
    return { accessToken, refreshToken };
};

// Funzione per la REGISTRAZIONE
exports.register = (req, res) => {
        //Prendiamo i dati inviati dal frontend (dal form di registrazione)
        const { username, email, password } = req.body;

        // Controlla se l'utente o l'email esistono già
        User.findOne({ $or: [{ email }, { username }] })
        .then( (user) => {
			if (user) {throw new Error('AlreadyUsed')};
            if (!user) {
                // Creiamo un nuovo utente usando il nostro modello
                const newUser = new User({
                username,
                email,
                password
                });
				return newUser;
            }
		})
        .then( (newUser) => {
            // Salviamo il nuovo utente nel database
            return newUser.save();
        })
        .then( (savedUser) => {
            console.log("Utente registrato con successo:", savedUser.username);
            res.status(201).json({ message: "Registrazione avvenuta con successo! Ora puoi effettuare il login." });
        })
		.catch( (error) => {
			if (error.message === 'AlreadyUsed') {
				console.error("Errore durante la verifica di username/email unici:", error);
            	res.status(409).json({ message: "Username o email già in uso." });
		}
			else {
                console.error("Errore durante la registrazione:", error);
		        if (error.name === 'ValidationError') {
		            const messages = Object.values(error.errors).map(val => val.message);
		            return res.status(400).json({ message: messages.join('. ') });
		        }
                res.status(500).json({ message: "Errore del server durante la registrazione." });
			}
		})
    };

// Funzione per il LOGIN
exports.login = async (req, res) => {
    try {
        // Prendiamo email e password dal form di login
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email e password sono obbligatori." });
        }
        // La ricerca dell'utente nel database viene fatta per email
        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: "Credenziali non valide." });
        }

        // Se le credenziali sono valide, allora creiamo i token
        const { accessToken, refreshToken } = generateTokens(user._id);
        
        // Salviamo il refresh token nel database
        console.log(`[LOGIN] Salvataggio refresh token nel DB: ${refreshToken} per utente ${user._id}`);
        await RefreshToken.create({ token: refreshToken, userId: user._id });

        res.cookie('jwt', refreshToken, {
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production', 
            sameSite: 'Strict', 
            maxAge: 7 * 24 * 60 * 60 * 1000 
        });

        res.json({
            message: "Login effettuato con successo!",
            accessToken,
            user: {
                id: user._id, 
                username: user.username,
                profilePicture: user.profilePicture }
        });


    } catch (error) {
        console.error("Errore login:", error);
        res.status(500).json({ message: "Errore del server durante il login." });
    }
};

// Funzione per il Refresh Access Token
exports.refresh = async (req, res) => {

    // Controlliamo se il cookie con il refresh token esiste
    const cookies = req.cookies;
    if (!cookies?.jwt) {
        return res.status(401).json({ message: "Non autorizzato: Refresh token mancante nel cookie." });
    }
    const refreshToken = cookies.jwt;

    try {
        // Cerchiamo il refresh token nel database
        console.log(`[REFRESH] Cerco il token nel DB: ...${refreshToken.slice(-10)}`); // Log per debug
        const foundToken = await RefreshToken.findOne({ token: refreshToken });

        // Se il token non è nel DB, non è valido -> accesso negato
        if (!foundToken) {
            console.log(`[REFRESH] Token non trovato nel DB. Accesso negato.`);
            return res.status(403).json({ message: "Proibito: Refresh token non valido o scaduto." });
        }
        console.log(`[REFRESH] Token trovato nel DB per l'utente ${foundToken.userId}. Procedo con la verifica JWT.`);

        // Se il token è nel DB, verifichiamo che la firma sia valida e che non sia scaduto
        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            (err, decoded) => {
                if (err || foundToken.userId.toString() !== decoded.userId) {
                    console.error("[REFRESH] Errore di verifica JWT o mismatch di userId.");
                    return res.status(403).json({ message: "Proibito: La verifica del token è fallita." });
                }

                // Se tutto è valido, generiamo un nuovo Access Token
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

// Funzione per il LOGOUT
exports.logout = async (req, res) => {

    // Controlliamo se il cookie con il refresh token esiste
    const cookies = req.cookies;
    if (!cookies?.jwt) {
        // Se non c'è cookie, non c'è nulla da fare. L'utente è già effettivamente "uscito"
        return res.sendStatus(204);
    }

    const refreshToken = cookies.jwt;

    try {
        // Rimuoviamo UNA SOLA VOLTA il refresh token dal database per invalidarlo
        console.log(`[LOGOUT] Tentativo di eliminare il refresh token dal DB: ...${refreshToken.slice(-10)}`);
        
        const result = await RefreshToken.deleteOne({ token: refreshToken });

        if (result.deletedCount === 0) {
            console.warn(`[LOGOUT] ATTENZIONE: Nessun refresh token trovato nel DB da eliminare.`);
        } else {
            console.log(`[LOGOUT] Refresh token eliminato con successo dal DB.`);
        }

        // Diciamo al browser di cancellare il cookie jwt
        res.clearCookie('jwt', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict'
        });

        return res.status(200).json({ message: "Logout effettuato con successo." });

    } catch (error) {
        // Se c'è un errore con il database, puliamo comunque il cookie dal browser
        // per non lasciare il client in uno stato inconsistente.
        console.error("Errore durante il logout:", error);
        res.clearCookie('jwt', { httpOnly: true, sameSite: 'Strict', secure: process.env.NODE_ENV === 'production' });
        res.status(500).json({ message: "Errore del server durante il logout." });
    }
};