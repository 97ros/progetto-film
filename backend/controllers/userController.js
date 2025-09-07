// Importiamo il nostro modello per gli utenti
const User = require('../models/userModel');

// Importiamo il nostro modello per i post
const Post = require('../models/postModel');

// Funzione per RECUPERARE il profilo di un utente
exports.getUserProfile = async (req, res) => {
        const username = req.params.username;

        User.findOne({ username: username }).select('-password')
        .then((user) => {
            return user;
        })
        .catch((error) => {
            console.error("Errore nel trovare l'utente: " + error.message);
            res.status(500).json({ error: "Errore del server nel trovare l'utente." });
        });

        // Controlliamo se chi fa la richiesta è il proprietario del profilo
        const isOwner = req.userId === user._id.toString();

        // Mostriamo i post privati solo se il richiedente è il proprietario
        const postQuery = { authorId: user._id };
        if (!isOwner) {
            postQuery.isPrivate = false;
        }
        Post.find(postQuery).sort({ createdAt: -1 })
        .then((userPosts) => {
            res.status(200).json({
            userProfile: user,
            userPosts: userPosts,
            isOwner: isOwner 
        });
        })
        .catch((error) => {
            console.error("Errore nel recuperare il profilo utente: " + error.message);
            res.status(500).json({ error: "Errore del server nel recuperare il profilo utente." });
        });
};

// Funzione per MODIFICARE il profilo dell'utente loggato
exports.updateProfile = async (req, res) => {
        const currentUserId = req.userId;
        const { username, bio, profilePicture, preferredGenres } = req.body;

        // Troviamo l'utente da aggiornare
        User.findById(currentUserId)
        .then((userToUpdate) => {
            return userToUpdate;
        })
        .catch((error) => {
            console.error("Errore nel trovare l'utente: " + error.message);
            res.status(404).json({ error: "Errore del server nel trovare l'utente." });
        });

        // Controlliamo se il nuovo username è già stato preso da un altro utente
        if (username && username !== userToUpdate.username) {
            User.findOne({ username: username })
            .then((existingUser) => {
                if (existingUser) {
                    return res.status(409).json({ message: "Username già in uso." });
                }
                userToUpdate.username = username;
            })
            .catch((error) => {
                console.error("Errore nel controllare l'username: " + error.message);
                res.status(500).json({ error: "Errore del server nel controllare l'username." });
            });
        }

        // Aggiorniamo i campi solo se sono stati forniti
        if (bio !== undefined) userToUpdate.bio = bio;
        if (profilePicture !== undefined) userToUpdate.profilePicture = profilePicture;
        if (preferredGenres !== undefined) userToUpdate.preferredGenres = preferredGenres;

        userToUpdate.save()
        .then((updatedUser) => {
            res.status(200).json({ message: "Profilo aggiornato con successo!", user: updatedUser });
            updatedUser.password = undefined;
        })
        .catch((error) => {
            console.error("Errore durante l'aggiornamento del profilo:", error);
            res.status(500).json({ message: "Errore durante l'aggiornamento del profilo." });
        });
};


// --- Funzione per AGGIUNGERE un film alla watchlist ---
exports.addToWatchlist = async (req, res) => {
        const currentUserId = req.userId;

        const movieData = req.body;

        if (!movieData.tmdbId || !movieData.title) {
            return res.status(400).json({ message: "ID e titolo del film sono obbligatori." });
        }

        // Troviamo prima l'utente per controllare se il film è già presente
        User.findById(currentUserId)
        .then((user) => {
            if (user.watchlist.some(movie => movie.tmdbId === movieData.tmdbId)) {
                return res.status(409).json({ message: "Questo film è già nella tua watchlist." });
            } else {
                return user;
            }
        })
        .catch((error) => {
            console.error("Errore nel trovare l'utente: " + error.message);
            res.status(404).json({ error: "Errore del server nel trovare l'utente." });
        });

       // Se l'utente esiste e il film non è già nella watchlist, procediamo ad aggiungerlo
       const movieToAdd = {
           ...movieData,
           addedAt: new Date()
       };

        // Se non è presente, lo aggiungiamo usando $push
        User.findByIdAndUpdate(currentUserId,
            { $push: { watchlist: movieToAdd } },
            { new: true }
        )
        .then((updatedUser) => {
            res.status(200).json({ message: "Film aggiunto alla watchlist!", watchlist: updatedUser.watchlist });
        })
        .catch((error) => {
            console.error("Errore nell'aggiungere il film alla watchlist:", error);
            res.status(500).json({ message: "Errore nell'aggiungere il film alla watchlist." });
        });
};


// Funzione per RIMUOVERE un film dalla watchlist
exports.removeFromWatchlist = async (req, res) => {
        const currentUserId = req.userId;
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