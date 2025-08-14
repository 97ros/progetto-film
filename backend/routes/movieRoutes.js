const express = require('express');
const router = express.Router();

const movieController = require('../controllers/movieController');

// Rotta pubblica per la ricerca di film
// Esempio: GET /api/movies/search?query=matrix
router.get('/search', movieController.searchMovies);

module.exports = router;