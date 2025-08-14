const User = require('../models/userModel');

// --- Funzione per SEGUIRE un altro utente ---
// Logica:
// 1. Aggiungiamo l'ID del target all'array "following" dell'utente corrente.
// 2. Aggiungiamo l'ID dell'utente corrente all'array "followers" dell'utente target.
exports.followUser = async (req, res) => {
    try {
        // L'utente che sta per essere seguito (il suo username è nell'URL)
        const targetUsername = req.params.username;
        
        // L'utente che sta compiendo l'azione (il suo ID è nel token)
        const currentUserId = req.user._id;

        // Troviamo entrambi gli utenti nel database
        const targetUser = await User.findOne({ username: targetUsername });
        const currentUser = await User.findById(currentUserId);

        // Controlli di sicurezza e validità
        if (!targetUser) {
            return res.status(404).json({ error: "L'utente che cerchi di seguire non esiste." });
        }

        if (targetUser._id.toString() === currentUserId.toString()) {
            return res.status(400).json({ error: "Non puoi seguire te stesso." });
        }

        // Usiamo l'operatore $addToSet di MongoDB per aggiungere l'ID solo se non è già presente.
        // Questo previene i duplicati (non puoi seguire la stessa persona due volte).
        
        // Aggiungi l'utente corrente ai follower del target
        await User.updateOne(
            { _id: targetUser._id },
            { $addToSet: { followers: currentUserId } }
        );

        // Aggiungi il target ai "following" dell'utente corrente
        await User.updateOne(
            { _id: currentUserId },
            { $addToSet: { following: targetUser._id } }
        );

        res.status(200).json({ message: `Ora segui ${targetUsername}` });

    } catch (error) {
        res.status(500).json({ error: "Qualcosa è andato storto: " + error.message });
    }
};

// --- Funzione per RECUPERARE il profilo di un utente ---
// Rotta pubblica
exports.getUserProfile = async (req, res) => {
    try {
        // Prendiamo lo username dal parametro dell'URL (es. /api/users/mario.rossi)
        const username = req.params.username;

        // Cerchiamo l'utente nel database usando il suo username.
        // Usiamo .select('-password') per escludere esplicitamente il campo della password
        // dalla risposta, per motivi di sicurezza.
        const user = await User.findOne({ username: username }).select('-password');

        // Se l'utente non viene trovato, inviamo un errore 404
        if (!user) {
            return res.status(404).json({ error: "Utente non trovato." });
        }

        // Se l'utente viene trovato, inviamo i suoi dati
        res.status(200).json(user);

    } catch (error) {
        res.status(500).json({ error: "Errore nel recuperare il profilo utente: " + error.message });
    }
};

// --- Funzione per SMETTERE DI SEGUIRE un altro utente ---
// Logica:
// 1. Rimuoviamo l'ID del target dall'array "following" dell'utente corrente.
// 2. Rimuoviamo l'ID dell'utente corrente dall'array "followers" dell'utente target.
exports.unfollowUser = async (req, res) => {
    try {
        // L'utente che sta per essere "unfollowed" (il suo username è nell'URL)
        const targetUsername = req.params.username;

        // L'utente che sta compiendo l'azione (il suo ID è nel token)
        const currentUserId = req.user._id;

        // Troviamo entrambi gli utenti nel database
        const targetUser = await User.findOne({ username: targetUsername });
        const currentUser = await User.findById(currentUserId);

        // Controlli di validità
        if (!targetUser) {
            return res.status(404).json({ error: "L'utente che cerchi di non seguire più non esiste." });
        }

        // Usiamo l'operatore $pull di MongoDB per rimuovere un elemento da un array.
        
        // Rimuovi l'utente corrente dai follower del target
        await User.updateOne(
            { _id: targetUser._id },
            { $pull: { followers: currentUserId } }
        );

        // Rimuovi il target dai "following" dell'utente corrente
        await User.updateOne(
            { _id: currentUserId },
            { $pull: { following: targetUser._id } }
        );

        res.status(200).json({ message: `Non segui più ${targetUsername}` });

    } catch (error) {
        res.status(500).json({ error: "Qualcosa è andato storto: " + error.message });
    }
};


// --- Funzione per MODIFICARE il profilo dell'utente loggato ---
exports.updateProfile = async (req, res) => {
    try {
        // 1. Prendiamo l'ID dell'utente dal token (messo lì dal middleware 'protect')
        const currentUserId = req.user._id;

        // 2. Prendiamo i dati che l'utente vuole aggiornare dal corpo della richiesta
        // In questo modo, l'utente può inviare solo la bio, solo l'immagine, o entrambe
        const { bio, profilePicture } = req.body;

        // 3. Troviamo l'utente nel database
        const userToUpdate = await User.findById(currentUserId);

        // Controllo di sicurezza (anche se improbabile se il token è valido)
        if (!userToUpdate) {
            return res.status(404).json({ error: "Utente non trovato." });
        }

        // 4. Aggiorniamo i campi del documento utente solo se sono stati forniti nella richiesta
        if (bio !== undefined) {
            userToUpdate.bio = bio;
        }
        if (profilePicture !== undefined) {
            userToUpdate.profilePicture = profilePicture;
        }

        // 5. Salviamo il documento utente aggiornato
        const updatedUser = await userToUpdate.save();

        // 6. Rimuoviamo la password dalla risposta prima di inviarla
        updatedUser.password = undefined;

        res.status(200).json({ 
            message: "Profilo aggiornato con successo!", 
            user: updatedUser 
        });

    } catch (error) {
        res.status(500).json({ error: "Errore durante l'aggiornamento del profilo: " + error.message });
    }
};