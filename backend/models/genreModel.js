// Importiamo mongoose per definire lo schema del modello
const mongoose = require('mongoose');
// Creiamo uno schema per il modello Genre
const Schema = mongoose.Schema;

// Definizione dello schema per il genere
const genreSchema = new Schema({

    // Campo per l'ID del genere su TMDB
    tmdbId: { 
        type: Number, 
        required: true, 
        unique: true 
    },

    // Campo per il nome del genere
    name: { 
        type: String, 
        required: true, 
        unique: true 
    }
});

// Esportiamo il modello Genre basato sullo schema definito
module.exports = mongoose.model('Genre', genreSchema);