const User = require('../models/userModel');
const WatchedEntry = require('../models/watchedEntryModel');


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

        // Controlliamo se chi fa la richiesta è il proprietario del profilo
        const isOwner = req.userId === user._id.toString();

        // --- RECUPERA LE LISTE ---
        // Recupera la lista dei film visti dell'utente
        const watchedList = await WatchedEntry.find({ userId: user._id }).sort({ createdAt: -1 });

        // Mostra i post privati solo se il richiedente è il proprietario
        const postQuery = { authorId: user._id };
        if (!isOwner) {
            postQuery.isPrivate = false;
        }
        const userPosts = await Post.find(postQuery).sort({ createdAt: -1 });

        // Combiniamo tutto in un unico oggetto di risposta
        res.status(200).json({
            userProfile: user,
            watchedList: watchedList,
            userPosts: userPosts,
            // Aggiungiamo un campo per dire al frontend se mostrare le parti private
            isOwner: isOwner 
        });

    } catch (error) {
        res.status(500).json({ error: "Errore nel recuperare il profilo utente: " + error.message });
    }
};




// --- Funzione per MODIFICARE il profilo dell'utente loggato ---
exports.updateProfile = async (req, res) => {
    try {
        // 1. Prendiamo l'ID dell'utente dal token (messo lì dal middleware 'protect')
        const currentUserId = req.userId;
        const { username, bio, profilePicture, preferredGenres } = req.body;

        // Troviamo l'utente da aggiornare
        const userToUpdate = await User.findById(currentUserId);
        if (!userToUpdate) return res.status(404).json({ message: "Utente non trovato." });

        // Controlla se il nuovo username è già stato preso da un altro utente
        if (username && username !== userToUpdate.username) {
            const existingUser = await User.findOne({ username: username });
            if (existingUser) {
                return res.status(409).json({ message: "Username già in uso." });
            }
            userToUpdate.username = username;
        }

        // Aggiorniamo i campi solo se sono stati forniti
        if (bio !== undefined) userToUpdate.bio = bio;
        if (profilePicture !== undefined) userToUpdate.profilePicture = profilePicture;
        if (preferredGenres !== undefined) userToUpdate.preferredGenres = preferredGenres;

        const updatedUser = await userToUpdate.save();

        // Rimuoviamo la password dalla risposta
        updatedUser.password = undefined;

        res.status(200).json({ message: "Profilo aggiornato con successo!", user: updatedUser });

    } catch (error) {
        res.status(500).json({ message: "Errore durante l'aggiornamento del profilo." });
    }
};


// --- Funzione per AGGIUNGERE un film alla watchlist ---
exports.addToWatchlist = async (req, res) => {
    try {
        const currentUserId = req.userId;
        // I dati del film da aggiungere (tmdbId, title, posterPath) li prendiamo dal body
        const movieData = req.body;

        if (!movieData.tmdbId || !movieData.title) {
            return res.status(400).json({ message: "ID e titolo del film sono obbligatori." });
        }
        
        // Usiamo $addToSet invece di $push per evitare di aggiungere film duplicati
        const updatedUser = await User.findByIdAndUpdate(
            currentUserId,
            { $addToSet: { watchlist: movieData } },
            { new: true } // Opzione per restituire il documento aggiornato
        );

        if (!updatedUser) return res.status(404).json({ message: "Utente non trovato." });
        
        res.status(200).json({ message: "Film aggiunto alla watchlist!", watchlist: updatedUser.watchlist });

    } catch (error) {
        res.status(500).json({ message: "Errore nell'aggiungere il film alla watchlist." });
    }
};

// --- Funzione per RIMUOVERE un film dalla watchlist ---
exports.removeFromWatchlist = async (req, res) => {
    try {
        const currentUserId = req.userId;
        // L'ID del film da rimuovere lo prendiamo dai parametri dell'URL
        const tmdbIdToRemove = req.params.tmdbId;

        // Usiamo $pull per rimuovere l'oggetto dall'array che ha un tmdbId corrispondente
        const updatedUser = await User.findByIdAndUpdate(
            currentUserId,
            { $pull: { watchlist: { tmdbId: tmdbIdToRemove } } },
            { new: true }
        );

        if (!updatedUser) return res.status(404).json({ message: "Utente non trovato." });

        res.status(200).json({ message: "Film rimosso dalla watchlist!", watchlist: updatedUser.watchlist });
    } catch (error) {
        res.status(500).json({ message: "Errore nel rimuovere il film dalla watchlist." });
    }
};