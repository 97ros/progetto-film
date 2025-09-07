// Importiamo Express per usare il suo sistema di routing
const express = require('express');

// Creiamo un "mini-router" specifico per queste rotte
const router = express.Router();

// Importiamo il nostro controller dei post 
const postController = require('../controllers/postController');

// Importiamo il middleware di autenticazione
const authMiddleware = require('../middleware/authMiddleware');

// Rotta per la homepage
router.get('/', authMiddleware.protect, postController.getHomepagePosts); 

// Rotta per creare un nuovo post
router.post('/', authMiddleware.protect, postController.createPost);

// Rotta per modificare un post specifico
router.put('/:postId', authMiddleware.protect, postController.updatePost);

// Rotta per eliminare un post specifico
router.delete('/:postId', authMiddleware.protect, postController.deletePost);

// Rotta per mettere/togliere like a un post
router.post('/:postId/like', authMiddleware.protect, postController.likePost);

// Rotta per ottenere un singolo post
router.get('/:postId', authMiddleware.protect, postController.getPostById);

// Rotta pubblica per ottenere i post di un film specifico
router.get('/movie/:tmdbId', authMiddleware.protect, postController.getPostsForMovie);

module.exports = router;