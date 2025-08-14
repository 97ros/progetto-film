// --- 1. IMPORTAZIONE DEI MODULI ---
// Carica le variabili d'ambiente dal file .env
require('dotenv').config(); 

const express = require('express'); // Framework per il server
const mongoose = require('mongoose'); // Libreria per interagire con MongoDB
const cors = require('cors'); // Middleware per permettere richieste da altri "domini" (il nostro frontend)

// --- 2. IMPORTAZIONE DELLE ROUTE ---
// Importiamo i file delle route che abbiamo creato
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const watchedRoutes = require('./routes/watchedRoutes');
const userRoutes = require('./routes/userRoutes');
const movieRoutes = require('./routes/movieRoutes');

// --- 3. CREAZIONE DELL'APPLICAZIONE EXPRESS ---
const app = express();
const PORT = process.env.PORT || 5000; // Usa la porta definita nell'ambiente, o la 5000 di default

// --- 4. CONNESSIONE AL DATABASE MONGODB ---
// Recuperiamo la stringa di connessione dal nostro file .env
const MONGO_URI = process.env.MONGO_URI; 

mongoose.connect(MONGO_URI)
  .then(() => console.log('Connessione a MongoDB Atlas riuscita!'))
  .catch((error) => console.error('Errore di connessione a MongoDB:', error));

// --- 5. MIDDLEWARE ---
// Abilita CORS per permettere al nostro frontend (che gira su un'altra porta) di comunicare con il backend
app.use(cors()); 

// Middleware per "leggere" il corpo delle richieste in formato JSON
app.use(express.json());

// --- 6. USO DELLE ROUTE ---
// Diciamo a Express di usare i nostri router per specifici percorsi base.
// Tutte le rotte definite in authRoutes saranno precedute da '/api/auth'
app.use('/api/auth', authRoutes);

// Tutte le rotte definite in postRoutes saranno precedute da '/api/posts'
app.use('/api/posts', postRoutes);

//Altre route:
app.use('/api/watched', watchedRoutes);
app.use('/api/users', userRoutes);
app.use('/api/movies', movieRoutes);

// --- 7. AVVIO DEL SERVER ---
app.listen(PORT, () => {
    console.log(`Server in ascolto sulla porta ${PORT}`);
});