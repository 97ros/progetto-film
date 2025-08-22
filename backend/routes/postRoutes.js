const express = require('express');
const router = express.Router();

// Importiamo il nostro controller dei post
const postController = require('../controllers/postController');

// Importiamo un middleware di autenticazione che creeremo tra poco
const authMiddleware = require('../middleware/authMiddleware');

// Rotta per la homepage
router.get('/', authMiddleware.protect, postController.getHomepagePosts); 

// Anche per creare un post è necessaria l'autenticazione
router.post('/', authMiddleware.protect, postController.createPost);

// Rotta per modificare un post specifico
router.put('/:postId', authMiddleware.protect, postController.updatePost);

// Rotta per eliminare un post specifico
router.delete('/:postId', authMiddleware.protect, postController.deletePost);

// Rotta per mettere/togliere like a un post
router.post('/:postId/like', authMiddleware.protect, postController.likePost);

// Rotta pubblica per ottenere un singolo post
router.get('/:postId', authMiddleware.protect, postController.getPostById);

router.get('/movie/:tmdbId', postController.getPostsForMovie);

module.exports = router;