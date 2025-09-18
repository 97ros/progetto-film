// Importiamo Express per usare il suo sistema di routing
const express = require('express');

// Creiamo un "mini-router" specifico per queste rotte
const router = express.Router();

// Importiamo le funzioni che abbiamo scritto nel nostro controller di film
const movieController = require('../controllers/movieController');

// Rotta per la ricerca di film (es: GET /api/movies/search?query=matrix)
router.get('/search', movieController.searchMovies);

// Rotta per ottenere i dettagli di un film specifico (es: GET /api/movies/:tmdbId)
router.get('/:tmdbId', movieController.getMovieDetails);

// Esportiamo il router in modo che possa essere usato in altri file
module.exports = router;