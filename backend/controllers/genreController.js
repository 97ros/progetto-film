// Importiamo il nostro modello per i generi
const Genre = require('../models/genreModel');

// Funzione per ottenere tutti i generi
exports.getAllGenres = async (req, res) => {
    try {
        // Trova tutti i documenti nella collezione Genre e ordinali per nome
        const genres = await Genre.find().sort({ name: 1 });
        res.status(200).json(genres);
    } catch (error) {
        res.status(500).json({ message: "Errore nel recuperare i generi." });
    }
};