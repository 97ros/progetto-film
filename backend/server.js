// Carichiamo le variabili d'ambiente dal file .env
require('dotenv').config();

// Importiamo i moduli necessari
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const http = require('http');

// Importiamo le routes
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const userRoutes = require('./routes/userRoutes');
const movieRoutes = require('./routes/movieRoutes');
const genreRoutes = require('./routes/genreRoutes');

// Creiamo l'app Express
const app = express();
const server = http.createServer(app); // Creiamo esplicitamente il server HTTP
const PORT = process.env.PORT || 5000; // Usa la porta definita nell'ambiente, o la 5000 di default

// Middleware globali

// Configuriamo CORS per permettere richieste dal frontend
const corsOptions = {
    origin: 'http://localhost:3000', 
    credentials: true 
};
app.use(cors(corsOptions));

// Middleware per "leggere" il corpo delle richieste in formato JSON
app.use(express.json());

// Middleware per parsare i cookie dalle richieste in arrivo
app.use(cookieParser());

// Uso dei router
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/genres', genreRoutes);

// Gestione degli errori
// Middleware per gestire le rotte non trovate (404)
app.use((req, res, next) => {
    res.status(404).json({ message: "Endpoint non trovato." });
});

// Middleware per la gestione centralizzata di tutti gli altri errori
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Qualcosa è andato storto sul server!' });
});

// Connettiamoci a MongoDB e avviamo il server
console.log("Tentativo di connessione a MongoDB...");
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connessione a MongoDB Atlas riuscita!');
    // Avviamo il server solo se la connessione al database è andata a buon fine
    server.listen(PORT, () => console.log(`Server in ascolto sulla porta ${PORT}`));
  })
  .catch((error) => {
    console.error('Impossibile connettersi a MongoDB:', error);
    process.exit(1);
  });