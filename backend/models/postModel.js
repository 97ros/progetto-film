// Importiamo la libreria Mongoose
const mongoose = require('mongoose');
// Creiamo uno schema per il modello Post
const Schema = mongoose.Schema;

// Definiamo la struttura e le regole per i nostri "Post"
const postSchema = new Schema({

    // Campo per l'autore del post
    authorId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Campo per l'ID del film su TMDB
    tmdbId: {
        type: Number,
        required: true
    },

    // Campo per il titolo del film
    movieTitle: {
        type: String,
        required: true
    },

    // Campo per l'immagine del post
    postImage: {
        type: String,
        required: true
    },

    // Campo per la recensione del film
    review: {
        type: String
    },

    // Campo per il rating del film
    rating: {
        type: Number,
        min: 1,
        max: 5
    },

    // Campo per i "mi piace" del post
    likes: [{
        type: Schema.Types.ObjectId,
        ref: 'User', // Utento a cui piace il post 
    }],

    // Campo per i generi del film
    genres: [{ type: String }],

    // Campo per la privacy del post
    isPrivate: {
        type: Boolean,
        default: false
    }

},

{
    // Aggiunge automaticamente i campi createdAt e updatedAt
    timestamps: true
});

// Aggiungiamo un indice per impedire a un utente di recensire lo stesso film più volte
postSchema.index({ authorId: 1, tmdbId: 1 }, { unique: true });

// Creiamo ed esportiamo il modello 'Post'
module.exports = mongoose.model('Post', postSchema);