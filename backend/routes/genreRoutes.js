// in backend/routes/genreRoutes.js
const express = require('express');
const router = express.Router();
const genreController = require('../controllers/genreController');

// Rotta pubblica per ottenere la lista di tutti i generi
router.get('/', genreController.getAllGenres);

module.exports = router;