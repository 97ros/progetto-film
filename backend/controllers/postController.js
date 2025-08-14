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

// --- Funzione per MODIFICARE un post esistente ---
// Rotta protetta: l'utente deve essere loggato E deve essere l'autore del post.
exports.updatePost = async (req, res) => {
    try {
        // 1. Estraiamo i dati necessari
        const postId = req.params.postId; // L'ID del post da modificare, dall'URL
        const currentUserId = req.user._id; // L'ID dell'utente loggato, dal token
        const { caption } = req.body; // I nuovi dati da aggiornare (es. solo la didascalia)

        // 2. Troviamo il post nel database
        const post = await Post.findById(postId);

        // 3. Controlli di sicurezza e validità
        if (!post) {
            return res.status(404).json({ error: "Post non trovato." });
        }

        // --- 4. CONTROLLO DI AUTORIZZAZIONE ---
        // Confrontiamo l'ID dell'autore del post con l'ID dell'utente che ha fatto la richiesta.
        // .toString() è importante per confrontare correttamente gli ObjectId di Mongoose.
        if (post.authorId.toString() !== currentUserId.toString()) {
            return res.status(403).json({ error: "Non hai il permesso di modificare questo post." });
        }

        // 5. Se tutti i controlli sono superati, aggiorniamo il post
        // Qui aggiorniamo solo la didascalia, ma potresti aggiornare anche altre parti
        post.caption = caption;
        
        // Non dimenticare di salvare le modifiche!
        await post.save();

        // 6. Inviamo una risposta di successo
        res.status(200).json({ message: "Post aggiornato con successo!", post: post });

    } catch (error) {
        res.status(500).json({ error: "Errore durante l'aggiornamento del post: " + error.message });
    }
};

// --- Funzione per ELIMINARE un post esistente ---
// Rotta protetta: l'utente deve essere loggato E deve essere l'autore del post.
exports.deletePost = async (req, res) => {
    try {
        // 1. Estraiamo i dati necessari
        const postId = req.params.postId; // L'ID del post da eliminare, dall'URL
        const currentUserId = req.user._id; // L'ID dell'utente loggato, dal token

        // 2. Troviamo il post nel database
        const post = await Post.findById(postId);

        // 3. Controlli di sicurezza e validità
        if (!post) {
            return res.status(404).json({ error: "Post non trovato." });
        }

        // --- 4. CONTROLLO DI AUTORIZZAZIONE ---
        // Esattamente come nella modifica, verifichiamo che l'utente sia il proprietario
        if (post.authorId.toString() !== currentUserId.toString()) {
            return res.status(403).json({ error: "Non hai il permesso di eliminare questo post." });
        }

        // 5. Se tutti i controlli sono superati, eliminiamo il post
        await Post.findByIdAndDelete(postId);

        // 6. Inviamo una risposta di successo senza contenuto
        res.status(200).json({ message: "Post eliminato con successo!" });

    } catch (error) {
        res.status(500).json({ error: "Errore durante l'eliminazione del post: " + error.message });
    }
};