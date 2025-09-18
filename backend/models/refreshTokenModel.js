// Importiamo mongoose per definire lo schema del modello
const mongoose = require('mongoose');
// Creiamo uno schema per il modello RefreshToken
const Schema = mongoose.Schema;

// Definizione dello schema per il token di refresh
const refreshTokenSchema = new Schema({

    // Campo per il token di refresh
    token: {
        type: String,
        required: true,
        unique: true
    },

    // Campo per l'ID dell'utente associato al token
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Campo per la data di creazione del token
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '7d'
    }
});

// Esportiamo il modello RefreshToken basato sullo schema definito
module.exports = mongoose.model('RefreshToken', refreshTokenSchema);