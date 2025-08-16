const Post = require('../models/postModel');
const User = require('../models/userModel'); // Ci serve per trovare chi segue l'utente

// --- Funzione per CREARE un nuovo post ---
// Nota: questa funzione sarà "protetta", solo gli utenti loggati potranno usarla.
exports.createPost = async (req, res) => {
    try {
        // L'ID dell'utente non lo prendiamo dal body (sarebbe insicuro!),
        // ma dal token JWT che è stato verificato da un middleware.
        // Lo aggiungeremo a 'req' nel middleware di autenticazione.
        const authorId = req.userId; 

        // Prendiamo i dati del post dal frontend
        const { tmdbId, movieTitle, postImage, caption } = req.body;

        // Validazione dell'input: controlliamo che ci siano i dati minimi
                if (!postImage || !tmdbId || !movieTitle) {
                    return res.status(400).json({ message: "Immagine, ID del film e titolo del film sono obbligatori." });
                }
        
                const newPost = new Post({
                    authorId: authorId, // Corretto da 'author'
                    tmdbId,
                    movieTitle,
                    postImage, // Corretto da 'imageUrl' per coerenza con il modello
                    caption
                });

        await newPost.save();

        // Popoliamo i dati dell'autore prima di restituire la risposta
        const populatedPost = await Post.findById(newPost._id).populate('authorId', 'username profilePicture'); // Corretto da 'author'        

        res.status(201).json({ message: "Post creato con successo!", post: newPost });

    } catch (error) {
        console.error("Errore creazione post:", error);
        // Gestione avanzata degli errori di validazione
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join('. ') });
        }
        res.status(500).json({ message: "Errore del server durante la creazione del post." });
    }
};

// --- Funzione per recuperare il FEED dell'utente ---
exports.getFeed = async (req, res) => {
    try {
        // Prendiamo l'ID dal middleware
        const currentUserId = req.userId;
        
        // Usiamo l'ID per trovare l'utente nel DB
        const currentUser = await User.findById(currentUserId);
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
        const currentUserId = req.userId; // L'ID dell'utente loggato, dal token
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
        if (caption !== undefined) {
            post.caption = caption;
        }
        
        // Non dimenticare di salvare le modifiche!
        const updatedPost = await post.save();
        const populatedPost = await Post.findById(updatedPost._id).populate('authorId', 'username profilePicture');

        // 6. Inviamo una risposta di successo
        res.status(200).json({ message: "Post aggiornato con successo!", post: post });

    } catch (error) {
        console.error("Errore aggiornamento post:", error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: "ID del post non è valido." });
        }
        res.status(500).json({ message: "Errore del server durante l'aggiornamento del post." });
    }
};

// --- Funzione per ELIMINARE un post esistente ---
// Rotta protetta: l'utente deve essere loggato E deve essere l'autore del post.
exports.deletePost = async (req, res) => {
    try {
        // 1. Estraiamo i dati necessari
        const postId = req.params.postId; // L'ID del post da eliminare, dall'URL
        const currentUserId = req.userId; // L'ID dell'utente loggato, dal token

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
        console.error("Errore eliminazione post:", error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: "ID del post non è valido." });
        }
        res.status(500).json({ message: "Errore del server durante l'eliminazione del post." });
    }
};

// --- Funzione per mettere/togliere "like" a un post ---
exports.likePost = async (req, res) => {
    try {
        const postId = req.params.postId;
        const userId = req.userId; // <-- Modifica per coerenza con il nostro authMiddleware

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post non trovato." });
        }

        // Controlla se l'utente ha già messo like
        const index = post.likes.indexOf(userId);

        if (index === -1) {
            // Like: aggiungi l'ID utente all'array dei likes
            post.likes.push(userId);
        } else {
            // Unlike: rimuovi l'ID utente dall'array dei likes
            post.likes.splice(index, 1);
        }

        const updatedPost = await post.save();
        
        // Popoliamo i dati prima di inviarli per dare più info al frontend
        const populatedPost = await Post.findById(updatedPost._id)
            .populate('authorId', 'username profilePicture'); // Popola l'autore

        res.json({ 
            message: "Operazione like/unlike completata.", 
            post: populatedPost,
            likesCount: populatedPost.likes.length // Invia anche il conteggio dei like
        });

    } catch (error) {
        console.error("Errore like/unlike post:", error);
        res.status(500).json({ message: "Errore del server." });
    }
};

// --- Funzione per OTTENERE un post specifico tramite il suo ID ---
exports.getPostById = async (req, res) => {
    try {
        const postId = req.params.postId;
        
        const post = await Post.findById(postId)
            .populate('authorId', 'username profilePicture'); // Corretto da 'author' a 'authorId'

        if (!post) {
            return res.status(404).json({ message: "Post non trovato." });
        }

        res.status(200).json({ message: "Post recuperato con successo.", post });

    } catch (error) {
        console.error("Errore recupero post per ID:", error);
        
        // Se l'ID fornito non ha un formato valido per MongoDB, Mongoose lancia un CastError
        if (error.name === 'CastError') {
            return res.status(400).json({ message: "ID del post non valido." });
        }
        
        res.status(500).json({ message: "Errore del server." });
    }
};