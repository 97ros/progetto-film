// Importiamo Express
const express = require('express');
// Creiamo un "mini-router" specifico per queste rotte
const router = express.Router();

// Importiamo il nuovo controller e il middleware di protezione
const userController = require('../controllers/userController');

// Rotta protetta per modificare il PROPRIO profilo. Deve stare prima di /:username
router.put('/me', userController.updateProfile);

// Rotta per recuperare il profilo di un utente (più generica)
router.get('/:username', userController.getUserProfile);

// Rotte per la gestione della watchlist
router.post('/me/watchlist', userController.addToWatchlist);
router.delete('/me/watchlist/:tmdbId', userController.removeFromWatchlist);

// Esportiamo il router in modo che possa essere usato in altri file
module.exports = router;