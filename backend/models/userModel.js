// 1. Importiamo la libreria Mongoose che ci serve per interagire con MongoDB
const mongoose = require('mongoose');

const bcrypt = require('bcryptjs');

// 2. Creiamo una scorciatoia per la classe Schema di Mongoose
const Schema = mongoose.Schema;

// 3. Definiamo la struttura e le regole per i nostri documenti "User"
const userSchema = new Schema({
    // Campo per il nome utente
    username: {
        type: String,       // Deve essere una stringa di testo
        required: [true, "L'username è obbligatorio."],     // È un campo obbligatorio
        unique: true,       // Ogni utente deve avere un username unico
        trim: true          // Rimuove spazi bianchi inutili all'inizio e alla fine
    },

    // Campo per l'email
    email: {
        type: String,
        required: [true, "L'email è obbligatoria."],
        unique: true,
        trim: true,
        lowercase: true // Salva sempre l'email in minuscolo per consistenza 
    },

    // Campo per la password (verrà salvata in formato criptato)
    password: {
        type: String,
        required: [true, "La password è obbligatoria"],
        minlength: [6, "La password deve essere di almeno 6 caratteri"],
    },

    // Campo per l'immagine del profilo (opzionale)
    profilePicture: {
        type: String,
        default: 'url_di_un_avatar_default.jpg' // Se non viene fornita, usa questa
    },
    
    // Campo per la biografia (opzionale)
    bio: {
        type: String,
        default: ''
    },

    profilePicture: {
        type: String, // URL dell'immagine del profilo
        default: 'url_placeholder_immagine_profilo_default.jpg',
    },

    preferredGenres: [{ type: String }], // Array di stringhe per i generi
    
    watchlist: [{ // Array di oggetti per i film da vedere
        tmdbId: { type: Number, required: true },
        title: { type: String, required: true },
        posterPath: { type: String },
        addedAt: { type: Date,
        default: Date.now // Si popola automaticamente con la data corrente
        }
    }]
});


// 4. Middleware di Mongoose per eseguire l'hashing prima di salvare ('pre-save')
userSchema.pre('save', async function (next) {
    // Esegui l'hashing solo se la password è stata modificata (o è nuova)
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// 5. Metodo di istanza per confrontare le password
userSchema.methods.comparePassword = function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// 6. Creiamo il "Modello" partendo dallo schema e lo esportiamo
// Mongoose creerà una collezione chiamata "users" (in minuscolo e al plurale)
module.exports = mongoose.model('User', userSchema);