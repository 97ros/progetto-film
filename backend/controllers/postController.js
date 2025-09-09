// Importiamo il nostro modello per i post
const Post = require('../models/postModel');

// Importiamo il nostro modello per gli utenti
const User = require('../models/userModel');

// Importiamo la libreria jsonwebtoken
const jwt = require('jsonwebtoken');

// Funzione per CREARE un nuovo post
exports.createPost = async (req, res) => {
    try{
        // Prendiamo l'ID dell'utente dal token JWT che è stato verificato dal middleware
        const authorId = req.userId; 

        // Prendiamo i dati del post dal frontend
        const { tmdbId, movieTitle, postImage, genres, review, rating, isPrivate } = req.body;

        // Controlliamo che nell'input ci siano i dati minimi
                if (!postImage || !tmdbId || !movieTitle) {
                    return res.status(400).json({ message: "Immagine, ID del film e titolo del film sono obbligatori." });
                }
        
                const newPost = new Post({
                    authorId: authorId,
                    tmdbId,
                    movieTitle,
                    postImage,
                    review, 
                    rating,
                    genres: genres,
                    isPrivate: isPrivate || false
                });

        const savedDocument = await newPost.save();
        const populatedPost = await Post.findById(savedDocument._id).populate('authorId', 'username profilePicture');
        res.status(201).json({ message: "Post creato con successo!", post: populatedPost });

            } catch(error){
            console.error("Errore durante la creazione del post:", error);

            if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join('. ') });
        }

            res.status(500).json({ message: "Errore del server durante il salvataggio del post." });
        }
};

// Funzione per la HOMEPAGE: restituisce tutti i post pubblici e li filtra in base ai generi preferiti dell'utente
exports.getHomepagePosts = async (req, res) => {
    try{
        const userId = req.userId;
        const user = await User.findById(userId);

        let query = { isPrivate: false };

        // Se l'utente ha definito dei generi preferiti, li usiamo per filtrare
        if (user && user.preferredGenres && user.preferredGenres.length > 0) {
            query.genres = { $in: user.preferredGenres };
        }

        const posts = await Post.find(query)
            .populate('authorId', 'username profilePicture')
            .sort({ createdAt: -1 })
            .limit(50);

        res.status(200).json(posts);

    } catch(error) {
        console.error("Errore nel recuperare i post per la homepage:", error);
        res.status(500).json({ message: "Errore nel recuperare i post per la homepage." });
    }
};


// Funzione per MODIFICARE un post esistente
// Rotta protetta: l'utente deve essere loggato e deve essere l'autore del post
exports.updatePost = async (req, res) => {
    try{
        const postId = req.params.postId; // L'ID del post da modificare, dall'URL
        const { review, rating, isPrivate } = req.body; // Dati aggiornabili
        const currentUserId = req.userId; // L'ID dell'utente loggato, dal token

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ error: "Post non trovato." });
        }
        

        if (post.authorId.toString() !== currentUserId.toString()) {
            return res.status(403).json({ error: "Non hai il permesso di modificare questo post." });
        }

        // Aggiorna i campi del post solo se sono stati forniti
        if (review !== undefined) post.review = review;
        if (rating !== undefined) post.rating = rating;
        if (isPrivate !== undefined) {
            post.isPrivate = isPrivate;
        }

        const updatedPost = await post.save();
        const populatedPost = await Post.findById(updatedPost._id).populate('authorId', 'username profilePicture');
        res.status(200).json({ message: "Post aggiornato con successo!", post: populatedPost });
    } catch (error) {
        console.error("Errore durante l'aggiornamento del post:", error);
        res.status(500).json({ message: "Errore del server durante l'aggiornamento del post." });
    }
};

// Funzione per ELIMINARE un post esistente
// Rotta protetta: l'utente deve essere loggato e deve essere l'autore del post.
exports.deletePost = async (req, res) => {
        const postId = req.params.postId; // L'ID del post da eliminare, dall'URL
        const currentUserId = req.userId; // L'ID dell'utente loggato, dal token

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ error: "Post non trovato." });
        }

        // CONTROLLO DI AUTORIZZAZIONE
        if (post.authorId.toString() !== currentUserId.toString()) {
            return res.status(403).json({ error: "Non hai il permesso di eliminare questo post." });
        }

        // Se tutti i controlli sono superati, eliminiamo il post
        Post.findByIdAndDelete(postId)
        .then(() => {
            res.status(200).json({ message: "Post eliminato con successo!" });
        })
        .catch((error) => {
            console.error("Errore eliminazione post:", error);
            res.status(500).json({ message: "Errore del server durante l'eliminazione del post." });
        });
};

// Funzione per mettere/togliere "like" a un post
exports.likePost = async (req, res) => {
        const postId = req.params.postId;
        const userId = req.userId;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post non trovato." });
        }

        // Controlliamo se l'utente ha già messo like
        const index = post.likes.indexOf(userId);

        if (index === -1) {
            post.likes.push(userId);
        } else {
            post.likes.splice(index, 1);
        }

        post.save()
        .then((updatedPost) => { return Post.findById(updatedPost._id).populate('authorId', 'username profilePicture'); 
        })
        .then((populatedPost) => {
            res.json({
                message: "Operazione like/unlike completata.",
                post: populatedPost,
                likesCount: populatedPost.likes.length
            });
        })
        .catch((error) => {
            console.error("Errore nell'operazione like/unlike:", error);
            res.status(500).json({ message: "Errore del server." });
        });
};

// Funzione per OTTENERE un post specifico tramite il suo ID
exports.getPostById = async (req, res) => {
    try {
        const postId = req.params.postId;
        
        const post = await Post.findById(postId).populate('authorId', 'username profilePicture'); 

        if (!post) {
            return res.status(404).json({ message: "Post non trovato." });
        }

        // CONTROLLO PRIVACY
        if (post.isPrivate) {
            // Se il post è privato, solo l'autore può vederlo -> dobbiamo verificare l'identità del richiedente
            const authHeader = req.headers.authorization || req.headers.Authorization;
            let currentUserId = null;
            if (authHeader?.startsWith('Bearer ')) {
                const token = authHeader.split(' ')[1];
                try {
                    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
                    currentUserId = decoded.userId;
                } catch (err) { /* ignora token non valido */ }
            }

            if (post.authorId._id.toString() !== currentUserId) {
                return res.status(403).json({ message: "Questo post è privato." });
            }
        }
        res.status(200).json(post);

    } catch (error) {
        console.error("Errore recupero post per ID:", error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({ message: "ID del post non valido." });
        }
}
};

// Funzione per trovare i post di un film specifico tramite il suo TMDB ID
exports.getPostsForMovie = (req, res) => {
        const tmdbId = req.params.tmdbId;
        Post.find({ tmdbId: tmdbId, isPrivate: false })
            .populate('authorId', 'username profilePicture')
            .sort({ createdAt: -1 })
            .then((posts) => {
                res.status(200).json(posts);
            })
            .catch((error) => {
                console.error("Errore nel recuperare i post per il film:", error);
                res.status(500).json({ message: "Errore nel recuperare i post per il film." });
            });
};