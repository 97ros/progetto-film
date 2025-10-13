// Importiamo la libreria Mongoose
const mongoose = require('mongoose');

// Importiamo la libreria bcrypt
const bcrypt = require('bcryptjs');

// Creiamo una scorciatoia per la classe Schema di Mongoose
const Schema = mongoose.Schema;

// Definiamo la struttura e le regole per i nostri documenti "User"
const userSchema = new Schema({

    // Campo per il nome utente
    username: {
        type: String,
        required: [true, "L'username è obbligatorio."],
        unique: true,
        trim: true
    },

    // Campo per l'email
    email: {
        type: String,
        required: [true, "L'email è obbligatoria."],
        unique: true,
        trim: true,
        lowercase: true
    },

    // Campo per la password (salvata in formato criptato)
    password: {
        type: String,
        required: [true, "La password è obbligatoria"],
        minlength: [6, "La password deve essere di almeno 6 caratteri"]
    },

    // Campo per l'immagine del profilo (opzionale)
    profilePicture: {
        type: String,
        default: 'https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg'
    },
    
    // Campo per la biografia (opzionale)
    bio: {
        type: String,
        default: ''
    },

    // Campo per i generi preferiti (opzionale)
    preferredGenres: [{ type: String }],

    // Campo per la watchlist (opzionale)
    watchlist: [{
        tmdbId: { type: Number, required: true },
        title: { type: String, required: true },
        posterPath: { type: String },
        addedAt: { type: Date,
        default: Date.now
        }
    }]
});

// Middleware di Mongoose per eseguire l'hashing prima di salvare
userSchema.pre('save', async function (next) {
    // Se la password non è stata modificata, salta l'hashing
    if (!this.isModified('password')) return next();
    // Altrimenti, esegui l'hashing della password
    try {
        // Genera un sale e hash la password
        const salt = await bcrypt.genSalt(10);
        // Sostituisci la password in chiaro con quella hashata
        this.password = await bcrypt.hash(this.password, salt);
        // Procedi con il salvataggio
        next();
    } catch (error) {
        next(error);
    }
});

// Metodo di istanza per confrontare le password
userSchema.methods.comparePassword = function (inputPassword) {
    return bcrypt.compare(inputPassword, this.password);
};

// Esportiamo il modello e Mongoose creerà una collezione chiamata "users"
module.exports = mongoose.model('User', userSchema);