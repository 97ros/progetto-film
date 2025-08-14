const express = require('express');
const router = express.Router();

// Importiamo il nostro nuovo controller
const watchedController = require('../controllers/watchedController');
// Importiamo il nostro middleware "buttafuori"
const authMiddleware = require('../middleware/authMiddleware');

// Definiamo le rotte

// Rotta per recuperare la lista di film visti di un utente specifico
// Esempio: GET /api/watched/mario.rossi
// Questa è una rotta pubblica, non necessita di autenticazione.
router.get('/:username', watchedController.getWatchedEntries);

// Rotta per aggiungere un film alla propria lista
// Esempio: POST /api/watched
// Questa rotta è protetta. L'utente deve essere loggato.
router.post('/', authMiddleware.protect, watchedController.addWatchedEntry);

// Rotta protetta per modificare una voce specifica
router.put('/:entryId', authMiddleware.protect, watchedController.updateWatchedEntry);

// Rotta protetta per eliminare una voce specifica
router.delete('/:entryId', authMiddleware.protect, watchedController.deleteWatchedEntry);

// Esportiamo il router
module.exports = router;