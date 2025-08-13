// 1. Importiamo la libreria Mongoose che ci serve per interagire con MongoDB
const mongoose = require('mongoose');

// 2. Creiamo una scorciatoia per la classe Schema di Mongoose
const Schema = mongoose.Schema;

// 3. Definiamo la struttura e le regole per i nostri documenti "User"
const userSchema = new Schema({
    // Campo per il nome utente
    username: {
        type: String,       // Deve essere una stringa di testo
        required: true,     // È un campo obbligatorio
        unique: true,       // Ogni utente deve avere un username unico
        trim: true          // Rimuove spazi bianchi inutili all'inizio e alla fine
    },

    // Campo per l'email
    email: {
        type: String,
        required: true,
        unique: true
    },

    // Campo per la password (verrà salvata in formato criptato)
    password: {
        type: String,
        required: true
    },

    // Campo per l'immagine del profilo (opzionale)
    profilePicture: {
        type: String,
        default: 'url_di_un_avatar_default.jpg' // Se non viene fornita, usa questa
    },
    
    // Campo per la biografia (opzionale)
    bio: {
        type: String
    },

    // Campo per la lista degli utenti che seguono questo utente
    followers: [{
        type: Schema.Types.ObjectId, // Tipo speciale per salvare l'ID di un altro documento
        ref: 'User'                  // Specifica che l'ID si riferisce a un documento nella collezione 'User'
    }],

    // Campo per la lista degli utenti seguiti da questo utente
    following: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }]
});

// 4. Creiamo il "Modello" partendo dallo schema e lo esportiamo
// Mongoose creerà una collezione chiamata "users" (in minuscolo e al plurale)
module.exports = mongoose.model('User', userSchema);