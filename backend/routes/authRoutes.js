// 1. Importiamo Express per usare il suo sistema di routing
const express = require('express');

// 2. Creiamo un "mini-router" specifico per queste rotte
const router = express.Router();

// 3. Importiamo le funzioni che abbiamo scritto nel nostro controller di autenticazione
const authController = require('../controllers/authController');


// 4. Definiamo le nostre rotte
// Quando arriva una richiesta POST a '/register'...
router.post('/register', authController.register);

// Quando arriva una richiesta POST a '/login'...
router.post('/login', authController.login);

// Logout ora è POST
router.post('/logout', authController.logout); 

// Nuova rotta per il refresh
router.get('/refresh', authController.refresh); 


// 5. Esportiamo il router così che il nostro server principale possa usarlo
module.exports = router;