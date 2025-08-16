// --- 1. IMPORTAZIONE DEI MODULI ---
require('dotenv').config(); // Carica le variabili d'ambiente dal file .env

const express = require('express'); // Framework per il server
const mongoose = require('mongoose'); // Libreria per interagire con MongoDB
const cookieParser = require('cookie-parser');
const cors = require('cors'); // Middleware per permettere richieste da altri "domini" (il nostro frontend)
const http = require('http');

// --- 2. IMPORTAZIONE DELLE ROUTE ---
// Importiamo i file delle route che abbiamo creato
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const watchedRoutes = require('./routes/watchedRoutes');
const userRoutes = require('./routes/userRoutes');
const movieRoutes = require('./routes/movieRoutes');

// --- 3. CREAZIONE DELL'APPLICAZIONE EXPRESS ---
const app = express();
const server = http.createServer(app); // Creiamo esplicitamente il server HTTP
const PORT = process.env.PORT || 5000; // Usa la porta definita nell'ambiente, o la 5000 di default

// --- 4. MIDDLEWARE ---
// Configurazione CORS per permettere al frontend (su porta 3000) di comunicare e inviare cookie
const corsOptions = {
    origin: 'http://localhost:3000', 
    credentials: true 
};
app.use(cors(corsOptions));

// Middleware per "leggere" il corpo delle richieste in formato JSON
app.use(express.json());

// Middleware per parsare i cookie dalle richieste in arrivo
app.use(cookieParser());

// --- 5. USO DELLE ROUTE ---
// Diciamo a Express di usare i nostri router per specifici percorsi base.
// Tutte le rotte definite in authRoutes saranno precedute da '/api/auth'
// Tutte le rotte definite in postRoutes saranno precedute da '/api/posts'
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/watched', watchedRoutes);
app.use('/api/users', userRoutes);
app.use('/api/movies', movieRoutes);

// --- 6. GESTIONE DEGLI ERRORI ---
// Middleware per gestire le rotte non trovate (404)
// Si attiva solo se nessuna delle route precedenti ha trovato una corrispondenza
app.use((req, res, next) => {
    res.status(404).json({ message: "Endpoint non trovato." });
});

// Middleware per la gestione centralizzata di tutti gli altri errori
app.use((err, req, res, next) => {
    console.error(err.stack); // Logga l'errore completo nel terminale per il debug
    res.status(500).json({ message: 'Qualcosa è andato storto sul server!' });
});

// --- 7. CONNESSIONE AL DATABASE E AVVIO DEL SERVER ---
console.log("Tentativo di connessione a MongoDB...");
// Recuperiamo la stringa di connessione dal nostro file .env
const MONGO_URI = process.env.MONGO_URI; 

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connessione a MongoDB Atlas riuscita!');
    // Avviamo il server solo se la connessione al database è andata a buon fine
    server.listen(PORT, () => console.log(`Server in ascolto sulla porta ${PORT}`));
  })
  .catch((error) => {
    console.error('Impossibile connettersi a MongoDB:', error);
    process.exit(1); // Termina l'applicazione se non può connettersi al DB
  });