// Importiamo il nostro modello per i generi
const Genre = require('../models/genreModel');

// Funzione per ottenere tutti i generi
exports.getAllGenres = (req, res) => {
        // Trova tutti i documenti nella collezione Genre e ordinali per nome
        Genre.find()
        .sort({ name: 1 })
        .then((genres) => {
            res.status(200).json(genres);
        })
        .catch(error => {
            console.error("Errore nel recuperare i generi:", error);
            res.status(500).json({ message: "Errore nel recuperare i generi." });
        });
};