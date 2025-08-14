const express = require('express');
const router = express.Router();

// Importiamo il nuovo controller e il middleware di protezione
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');


// Rotta protetta per modificare il PROPRIO profilo. Deve stare prima di /:username
router.put('/profile', authMiddleware.protect, userController.updateProfile);

// Definiamo la rotta per seguire un utente.
// È una rotta POST perché modifica i dati del server (crea una relazione).
// È protetta perché solo un utente loggato può seguire qualcuno.
// L'endpoint sarà /api/users/NOME_UTENTE_DA_SEGUIRE/follow
router.post('/:username/follow', authMiddleware.protect, userController.followUser);

// Rotta per smettere di seguire un utente
router.post('/:username/unfollow', authMiddleware.protect, userController.unfollowUser);

// Rotta pubblica per recuperare il profilo di un utente (più generica)
router.get('/:username', userController.getUserProfile);


// Esportiamo il router
module.exports = router;