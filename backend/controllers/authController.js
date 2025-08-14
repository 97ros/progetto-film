// 1. Importiamo gli strumenti necessari
const User = require('../models/userModel'); // Il nostro modello per gli utenti
const bcrypt = require('bcryptjs');         // Per criptare e confrontare le password
const jwt = require('jsonwebtoken');        // Per creare i token di accesso

// --- Funzione per la REGISTRAZIONE ---
exports.register = async (req, res) => {
    try {
        // 2. Prendiamo i dati inviati dal frontend (dal form di registrazione)
        const { username, email, password } = req.body;

        // 3. Criptiamo la password prima di salvarla
        const salt = await bcrypt.genSalt(10); // Genera una "chiave" di criptazione
        const hashedPassword = await bcrypt.hash(password, salt); // Cripta la password

        // 4. Creiamo un nuovo utente usando il nostro modello
        const newUser = new User({
            username, // è come scrivere username: username
            email,
            password: hashedPassword // Salviamo la password criptata!
        });

        // 5. Salviamo il nuovo utente nel database
        await newUser.save();

        // 6. Inviamo una risposta positiva al frontend
        res.status(201).json({ message: "Utente registrato con successo!" });

    } catch (error) {
    // 7. Se qualcosa va storto, controlliamo se è un errore di duplicazione
    if (error.code === 11000) {
        // Il codice 11000 è il codice di MongoDB per la violazione di un indice univoco
        return res.status(409).json({ error: "Username o email già esistente." });
    }
    // Per tutti gli altri errori, inviamo un errore generico
    res.status(500).json({ error: "Errore durante la registrazione: " + error.message });
    }
};

// --- Funzione per il LOGIN ---
exports.login = async (req, res) => {
    try {
        // 8. Prendiamo email e password dal form di login
        const { email, password } = req.body;

        // 9. Cerchiamo un utente nel database con quella email
        const user = await User.findOne({ email: email });
        if (!user) {
            // Se non troviamo l'utente, inviamo un errore
            return res.status(401).json({ error: "Credenziali non valide." });
        }

        // 10. Confrontiamo la password inviata con quella criptata nel database
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            // Se le password non coincidono, inviamo un errore
            return res.status(401).json({ error: "Credenziali non valide." });
        }

        // 11. Se tutto è corretto, creiamo il token JWT
        const payload = { userId: user._id }; // Le informazioni che vogliamo mettere nel token
        const token = jwt.sign(
            payload,
           process.env.JWT_SECRET, // Usa una stringa complessa!
            { expiresIn: '1h' } // Il token scadrà tra 1 ora
        );

        // 12. Inviamo il token al frontend
        res.status(200).json({
            message: "Login effettuato con successo!",
            token: token,
            username: user.username
        });

    } catch (error) {
        res.status(500).json({ error: "Errore durante il login: " + error.message });
    }
};