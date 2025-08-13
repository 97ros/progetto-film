const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const watchedEntrySchema = new Schema({
    // L'utente a cui appartiene questa "voce" della libreria
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Informazioni sul film visto
    tmdbId: {
        type: Number,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    posterPath: {
        type: String // L'URL della locandina del film
    },

    // Dati specifici dell'utente relativi alla visione
    watchDate: {
        type: Date // Il tipo "Data" per salvare il giorno in cui è stato visto
    },
    rating: {
        type: Number,
        min: 1, // Il voto non può essere meno di 1
        max: 5  // e non più di 5
    },
    review: {
        type: String // Una breve recensione personale
    }
});

// Aggiungiamo un indice per migliorare le performance di ricerca.
// Vogliamo essere sicuri che un utente non possa aggiungere lo stesso film
// alla sua lista più di una volta.
watchedEntrySchema.index({ userId: 1, tmdbId: 1 }, { unique: true });

// Creiamo ed esportiamo il modello
module.exports = mongoose.model('WatchedEntry', watchedEntrySchema);