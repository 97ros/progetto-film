// Importiamo Express per usare il suo sistema di routing
const express = require('express');

// Creiamo un "mini-router" specifico per queste rotte
const router = express.Router();

// Importiamo le funzioni che abbiamo scritto nel nostro controller di generi
const genreController = require('../controllers/genreController');

// Rotta pubblica per ottenere la lista di tutti i generi
router.get('/', genreController.getAllGenres);

module.exports = router;