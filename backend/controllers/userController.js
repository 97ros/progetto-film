// Importiamo il nostro modello per gli utenti
const User = require('../models/userModel');

// Importiamo il nostro modello per i post
const Post = require('../models/postModel');

// Funzione per RECUPERARE il profilo di un utente
exports.getUserProfile = async (req, res) => {
    try {
        // Troviamo l'utente in base allo username passato come parametro
        const username = req.params.username;
        // Escludiamo la password dalla risposta
        const user = await User.findOne({ username: username }).select('-password');
        // Se l'utente non esiste, ritorniamo un errore 404
        if (!user) {
            return res.status(404).json({ error: "Utente non trovato." });
        }

        // Controlliamo se chi fa la richiesta è il proprietario del profilo
        const isOwner = req.userId === user._id.toString();

        // Mostriamo i post privati solo se il richiedente è il proprietario
        const postQuery = { authorId: user._id };
        // Se non è il proprietario, filtriamo i post privati
        if (!isOwner) {
            postQuery.isPrivate = false;
        }
        // Recuperiamo i post dell'utente
        Post.find(postQuery).sort({ createdAt: -1 })
        .then((userPosts) => {
            res.status(200).json({
            userProfile: user,
            userPosts: userPosts,
            isOwner: isOwner
        });
    });
    } catch (error) {
        console.error("Errore nel trovare l'utente: " + error.message);
        res.status(500).json({ error: "Errore del server nel trovare l'utente." });
    }
};

// Funzione per MODIFICARE il profilo dell'utente loggato
exports.updateProfile = async (req, res) => {
    try {
        // Troviamo l'ID dell'utente loggato dalla richiesta (impostato dal middleware di autenticazione)
        const currentUserId = req.userId;
        // Estraiamo i campi che possono essere aggiornati dal corpo della richiesta
        const { username, bio, profilePicture, preferredGenres } = req.body;

        // Troviamo l'utente da aggiornare
        const userToUpdate = await User.findById(currentUserId);

        if (!userToUpdate) return res.status(404).json({ message: "Utente non trovato." });

        // Controlliamo se il nuovo username è già stato preso da un altro utente
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

        // Salviamo le modifiche al database
        const updatedUser = await userToUpdate.save();

        // Rimuoviamo la password dalla risposta
        updatedUser.password = undefined;

        res.status(200).json({ message: "Profilo aggiornato con successo!", user: updatedUser });

   } catch (error) {
       res.status(500).json({ message: "Errore durante l'aggiornamento del profilo." });
   }
};


// Funzione per AGGIUNGERE un film alla watchlist dell'utente loggato
exports.addToWatchlist = (req, res) => {
    // Troviamo l'ID dell'utente loggato dalla richiesta
    const currentUserId = req.userId;
    // Dati del film da aggiungere alla watchlist
    const movieData = req.body;

    // Validiamo che i dati essenziali del film siano presenti
    if (!movieData.tmdbId || !movieData.title) {
        return res.status(400).json({ message: "ID e titolo del film sono obbligatori." });
    }

    // Troviamo prima l'utente per controllare se il film è già presente
    User.findById(currentUserId)
    // Controlliamo se l'utente esiste e se il film è già nella watchlist
    .then((user) => {
        if (!user) {
            throw new Error('UserNotFound');
        }
        if (user.watchlist.some(movie => movie.tmdbId === movieData.tmdbId)) {
            throw new Error('MovieAlreadyExists');
        }
        return user;
    })
    // Se il film non è presente, lo aggiungiamo alla watchlist
    .then((user) => {
        const movieToAdd = {
           ...movieData,
           addedAt: new Date()
        };
        return User.findByIdAndUpdate(
            user._id,
            { $push: { watchlist: movieToAdd } },
            { new: true }
        );
    })
    .then((updatedUser) => {
        res.status(200).json({ message: "Film aggiunto alla watchlist!", watchlist: updatedUser.watchlist });
    })
    .catch((error) => {
        if (error.message === 'MovieAlreadyExists') {
            return res.status(409).json({ message: "Questo film è già nella tua watchlist." });
        }
        if (error.message === 'UserNotFound') {
            return res.status(404).json({ message: "Utente non trovato." });
        }
        // Per tutti gli altri errori:
        console.error("Errore nell'aggiungere il film alla watchlist:", error);
        res.status(500).json({ message: "Errore del server." });
    });
};

// Funzione per RIMUOVERE un film dalla watchlist
exports.removeFromWatchlist = (req, res) => {
        // Troviamo l'ID dell'utente loggato dalla richiesta
        const currentUserId = req.userId;
        // Otteniamo l'ID del film da rimuovere dai parametri della richiesta
        const tmdbIdToRemove = req.params.tmdbId;

        // Usiamo $pull per rimuovere l'oggetto dall'array che ha un tmdbId corrispondente
        User.findByIdAndUpdate(
            currentUserId,
            { $pull: { watchlist: { tmdbId: tmdbIdToRemove } } },
            { new: true }
        )
        .then((updatedUser) => {
            if (!updatedUser) {
                return res.status(404).json({ message: "Utente non trovato." });
            } else {
                    res.status(200).json({ message: "Film rimosso dalla watchlist!", watchlist: updatedUser.watchlist });
                }
        })
        .catch((error) => {
            console.error("Errore nel rimuovere il film dalla watchlist:", error);
            res.status(500).json({ message: "Errore nel rimuovere il film dalla watchlist." });
        });
};