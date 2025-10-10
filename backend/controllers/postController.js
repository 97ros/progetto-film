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
        
                // Creiamo un nuovo post
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

        // Salviamo il post nel database
        const savedDocument = await newPost.save();
        // Popoliamo i dati dell'autore per la risposta
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

// Funzione per la HOMEPAGE: restituisce tutti i post pubblici filtrati in base ai generi preferiti dell'utente
exports.getHomepagePosts = async (req, res) => {
    try{
        // Prendiamo l'ID dell'utente dal token JWT che è stato verificato dal middleware
        const userId = req.userId;
        // Recuperiamo i generi preferiti dell'utente
        const user = await User.findById(userId);

        // Creiamo la query di base per trovare solo i post pubblici 
        let query = { isPrivate: false };

        // Se l'utente ha definito dei generi preferiti, li usiamo per filtrare
        if (user && user.preferredGenres && user.preferredGenres.length > 0) {
            query.genres = { $in: user.preferredGenres };
        }

        // Recuperiamo i post dal database, popolando i dati dell'autore
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
        // Prendiamo l'ID del post dall'URL e i dati aggiornati dal corpo della richiesta
        const postId = req.params.postId;
        // Dati aggiornabili
        const { review, rating, isPrivate } = req.body;
        // L'ID dell'utente loggato, dal token
        const currentUserId = req.userId;

        // Troviamo il post nel database
        const post = await Post.findById(postId);

        // Controlliamo se il post esiste
        if (!post) {
            return res.status(404).json({ error: "Post non trovato." });
        }
        
        // Controllo di autorizzazione: solo l'autore può modificare il post
        if (post.authorId.toString() !== currentUserId.toString()) {
            return res.status(403).json({ error: "Non hai il permesso di modificare questo post." });
        }

        // Aggiorniamo i campi del post solo se sono stati forniti
        if (review !== undefined) post.review = review;
        if (rating !== undefined) post.rating = rating;
        if (isPrivate !== undefined) {
            post.isPrivate = isPrivate;
        }

        // Salviamo le modifiche al database
        const updatedPost = await post.save();
        // Popoliamo i dati dell'autore per la risposta
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
        // Prendiamo l'ID del post dall'URL
        const postId = req.params.postId;
        // L'ID dell'utente loggato, dal token
        const currentUserId = req.userId;

        // Troviamo il post nel database
        const post = await Post.findById(postId);

        // Controlliamo se il post esiste
        if (!post) {
            return res.status(404).json({ error: "Post non trovato." });
        }

        // Controllo di autorizzazione: solo l'autore può eliminare il post
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

// Funzione per METTERE/TOGLIERE "like" a un post
exports.likePost = async (req, res) => {
        // Prendiamo l'ID del post dall'URL
        const postId = req.params.postId;
        // L'ID dell'utente loggato, dal token
        const userId = req.userId;

        // Troviamo il post nel database
        const post = await Post.findById(postId);

        // Controlliamo se il post esiste
        if (!post) {
            return res.status(404).json({ message: "Post non trovato." });
        }

        // Controlliamo se l'utente ha già messo like
        const index = post.likes.indexOf(userId);

        // Se l'utente non ha ancora messo like, lo aggiungiamo; altrimenti, lo rimuoviamo
        if (index === -1) {
            post.likes.push(userId);
        } else {
            post.likes.splice(index, 1);
        }

        // Salviamo il post aggiornato
        post.save()
        .then((updatedPost) => { return Post.findById(updatedPost._id).populate('authorId', 'username profilePicture'); 
        })
        // Popoliamo i dati dell'autore per la risposta
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
        // Prendiamo l'ID del post dall'URL
        const postId = req.params.postId;
        // Troviamo il post nel database e popoliamo i dati dell'autore
        const post = await Post.findById(postId).populate('authorId', 'username profilePicture'); 

        // Controlliamo se il post esiste
        if (!post) {
            return res.status(404).json({ message: "Post non trovato." });
        }

        // Controllo della privacy del post
        if (post.isPrivate) {
            // Se il post è privato, solo l'autore può vederlo -> dobbiamo verificare l'identità del richiedente
            const authHeader = req.headers.authorization || req.headers.Authorization;
            let currentUserId = null;
            // Estraiamo l'ID dell'utente dal token JWT
            if (authHeader?.startsWith('Bearer ')) {
                const token = authHeader.split(' ')[1];
                try {
                    // Verifichiamo il token e otteniamo il payload
                    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
                    // Estraiamo l'ID dell'utente dal payload
                    currentUserId = decoded.userId;
                } catch (err) { /* ignora token non valido */ }
            }

            // Se l'utente non è l'autore del post, neghiamo l'accesso
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
        // Prendiamo il TMDB ID del film dall'URL
        const tmdbId = req.params.tmdbId;
        // Troviamo i post nel database che corrispondono al TMDB ID e che sono pubblici
        Post.find({ tmdbId: tmdbId, isPrivate: false })
            // Popoliamo i dati dell'autore per la risposta
            .populate('authorId', 'username profilePicture')
            // Ordiniamo i post dal più recente al più vecchio
            .sort({ createdAt: -1 })
            .then((posts) => {
                res.status(200).json(posts);
            })
            .catch((error) => {
                console.error("Errore nel recuperare i post per il film:", error);
                res.status(500).json({ message: "Errore nel recuperare i post per il film." });
            });
};