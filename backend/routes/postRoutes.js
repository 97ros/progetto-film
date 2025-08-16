const express = require('express');
const router = express.Router();

// Importiamo il nostro controller dei post
const postController = require('../controllers/postController');

// Importiamo un middleware di autenticazione che creeremo tra poco
const authMiddleware = require('../middleware/authMiddleware');

// Definiamo le rotte per i post
// La logica si legge così:
// 1. Una richiesta GET arriva a '/feed'
// 2. Prima, passa attraverso il middleware 'protect' per verificare il token
// 3. Se il token è valido, il middleware chiama 'next()' e la richiesta prosegue verso 'postController.getFeed'
router.get('/feed', authMiddleware.protect, postController.getFeed);

// Anche per creare un post è necessaria l'autenticazione
router.post('/', authMiddleware.protect, postController.createPost);

// Rotta per modificare un post specifico
router.put('/:postId', authMiddleware.protect, postController.updatePost);

// Rotta per eliminare un post specifico
router.delete('/:postId', authMiddleware.protect, postController.deletePost);

// Rotta per mettere/togliere like a un post
router.post('/:postId/like', authMiddleware.protect, postController.likePost);

// Rotta pubblica per ottenere un singolo post
router.get('/:postId', postController.getPostById);

module.exports = router;