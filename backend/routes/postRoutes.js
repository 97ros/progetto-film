// Importiamo Express per usare il suo sistema di routing
const express = require('express');

// Creiamo un "mini-router" specifico per queste rotte
const router = express.Router();

// Importiamo il nostro controller dei post 
const postController = require('../controllers/postController');

// Rotta per la homepage
router.get('/', postController.getHomepagePosts); 

// Rotta per creare un nuovo post
router.post('/', postController.createPost);

// Rotta per modificare un post specifico
router.put('/:postId', postController.updatePost);

// Rotta per eliminare un post specifico
router.delete('/:postId', postController.deletePost);

// Rotta per mettere/togliere like a un post
router.post('/:postId/like', postController.likePost);

// Rotta pubblica per ottenere i post di un film specifico
router.get('/movie/:tmdbId', postController.getPostsForMovie);

// Esportiamo il router in modo che possa essere usato in altri file
module.exports = router;