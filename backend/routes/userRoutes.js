const express = require('express');
const router = express.Router();

// Importiamo il nuovo controller e il middleware di protezione
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');


// Rotta protetta per modificare il PROPRIO profilo. Deve stare prima di /:username
router.put('/profile', authMiddleware.protect, userController.updateProfile);

// Rotta pubblica per recuperare il profilo di un utente (più generica)
router.get('/:username', authMiddleware.protect, userController.getUserProfile);

// Rotte per la gestione della watchlist
router.post('/watchlist', authMiddleware.protect, userController.addToWatchlist);
router.delete('/watchlist/:tmdbId', authMiddleware.protect, userController.removeFromWatchlist);

// Esportiamo il router
module.exports = router;