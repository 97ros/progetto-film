// Importiamo Express per usare il suo sistema di routing
const express = require('express');

// Creiamo un "mini-router" specifico per queste rotte
const router = express.Router();

// Importiamo le funzioni che abbiamo scritto nel nostro controller di autenticazione
const authController = require('../controllers/authController');

// Definiamo le nostre rotte
// Quando arriva una richiesta POST a '/register'...
router.post('/register', authController.register);

// Quando arriva una richiesta POST a '/login'...
router.post('/login', authController.login);

// Quando arriva una richiesta POST a '/logout'...
router.post('/logout', authController.logout);

// Quando arriva una richiesta GET a '/refresh'...
router.get('/refresh', authController.refresh); 

module.exports = router;