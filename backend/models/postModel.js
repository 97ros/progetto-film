// 1. Importiamo Mongoose
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// 2. Definiamo la struttura e le regole per i nostri "Post"
const postSchema = new Schema({
    // Questo è il link all'autore del post. È fondamentale!
    authorId: {
        type: Schema.Types.ObjectId, // L'ID dell'utente che ha creato il post
        ref: 'User',                 // Riferimento al modello 'User'
        required: true               // Un post deve sempre avere un autore
    },

    // Informazioni sul film a cui il post si riferisce
    tmdbId: {
        type: Number, // L'ID del film preso da The Movie Database (TMDB)
        required: true
    },
    movieTitle: {
        type: String, // Salviamo il titolo per comodità, così non dobbiamo cercarlo ogni volta
        required: true
    },

    // Contenuto del post creato dall'utente
    postImage: {
        type: String, // L'URL dell'immagine della locandina
        required: true
    },

     review: {
        type: String 
    },

    rating: { // Campo per le stelline
        type: Number,
        min: 1,
        max: 5
    },

    likes: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],

    genres: [{ type: String }],

    isPrivate: {
        type: Boolean,
        default: false // Di default, un post è pubblico
    }

}, {
    // 3. Opzione Mongoose: aggiunge automaticamente due campi:
    // createdAt (quando il post è stato creato) e updatedAt (quando è stato modificato)
    timestamps: true 
});

// Aggiungiamo un indice per impedire a un utente di recensire lo stesso film più volte
postSchema.index({ authorId: 1, tmdbId: 1 }, { unique: true });

// 4. Creiamo ed esportiamo il modello, che Mongoose chiamerà "posts" nel database
module.exports = mongoose.model('Post', postSchema);