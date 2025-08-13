const Post = require('../models/postModel');
const User = require('../models/userModel'); // Ci serve per trovare chi segue l'utente

// --- Funzione per CREARE un nuovo post ---
// Nota: questa funzione sarà "protetta", solo gli utenti loggati potranno usarla.
exports.createPost = async (req, res) => {
    try {
        // L'ID dell'utente non lo prendiamo dal body (sarebbe insicuro!),
        // ma dal token JWT che è stato verificato da un middleware.
        // Lo aggiungeremo a 'req' nel middleware di autenticazione.
        const authorId = req.user._id; 

        // Prendiamo i dati del post dal frontend
        const { tmdbId, movieTitle, postImage, caption } = req.body;

        const newPost = new Post({
            authorId,
            tmdbId,
            movieTitle,
            postImage,
            caption
        });

        await newPost.save();
        res.status(201).json({ message: "Post creato con successo!", post: newPost });

    } catch (error) {
        res.status(500).json({ error: "Errore nella creazione del post: " + error.message });
    }
};

// --- Funzione per recuperare il FEED dell'utente ---
exports.getFeed = async (req, res) => {
    try {
        // Troviamo l'utente attualmente loggato tramite l'ID nel token
        const currentUser = await User.findById(req.user._id);
        if (!currentUser) {
            return res.status(404).json({ error: "Utente non trovato." });
        }

        // Recuperiamo la lista degli utenti che segue
        const followingIds = currentUser.following;

        // Cerchiamo tutti i post il cui autore è nella lista 'followingIds'
        const feedPosts = await Post.find({
            'authorId': { $in: followingIds }
        }).sort({ createdAt: -1 }); // Ordiniamo i post dal più recente al più vecchio

        res.status(200).json(feedPosts);

    } catch (error) {
        res.status(500).json({ error: "Errore nel recuperare il feed: " + error.message });
    }
};