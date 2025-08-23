const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') }); // Specifica il percorso del file .env
const mongoose = require('mongoose');
const axios = require('axios');
const Genre = require('../models/genreModel'); // Importa il modello

const seedGenres = async () => {
    try {
        // 1. Connettiti al database
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connesso al DB per il seeding...");

        // 2. Prima di aggiungere, pulisci la collezione per evitare duplicati
        await Genre.deleteMany({});
        console.log("Vecchi generi eliminati.");

        // 3. Chiama l'API di TMDB per ottenere la lista dei generi
        const tmdbApiKey = process.env.TMDB_API_KEY;
        const tmdbUrl = `https://api.themoviedb.org/3/genre/movie/list?api_key=${tmdbApiKey}&language=it-IT`;
        
        const response = await axios.get(tmdbUrl);
        const genresFromApi = response.data.genres; // L'API restituisce un oggetto { genres: [...] }

        // 4. Formatta i dati per il nostro schema
        const genresToSave = genresFromApi.map(genre => ({
            tmdbId: genre.id,
            name: genre.name
        }));

        // 5. Inserisci tutti i generi nel nostro database
        await Genre.insertMany(genresToSave);
        console.log("Generi importati con successo da TMDB!");

    } catch (error) {
        console.error("Errore durante il seeding dei generi:", error.message);
    } finally {
        // 6. Chiudi la connessione al database, che lo script abbia successo o fallisca
        mongoose.connection.close();
        console.log("Connessione al DB chiusa.");
    }
};

// Esegui la funzione
seedGenres();