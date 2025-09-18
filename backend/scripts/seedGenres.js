// Questo script popola la collezione "genres" nel database MongoDB

// Importiamo i moduli necessari
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const axios = require('axios');
const Genre = require('../models/genreModel'); // Importa il modello

// Funzione principale per il seeding dei generi
const seedGenres = async () => {
    try {
        // Connettiamoci al database
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connesso al DB per il seeding...");

        // Prima di aggiungere, puliamo la collezione per evitare duplicati
        await Genre.deleteMany({});
        console.log("Vecchi generi eliminati.");

        // Chiamiamo l'API di TMDB per ottenere la lista dei generi
        const tmdbApiKey = process.env.TMDB_API_KEY;
        const tmdbUrl = `https://api.themoviedb.org/3/genre/movie/list?api_key=${tmdbApiKey}&language=it-IT`;
        
        // Effettuiamo la richiesta
        const response = await axios.get(tmdbUrl);
        // Estraiamo i generi dalla risposta
        const genresFromApi = response.data.genres;

        // Formattiamo i dati per il nostro schema
        const genresToSave = genresFromApi.map(genre => ({
            tmdbId: genre.id,
            name: genre.name
        }));

        // Inseriamo tutti i generi nel nostro database
        await Genre.insertMany(genresToSave);
        console.log("Generi importati con successo da TMDB!");

    } catch (error) {
        console.error("Errore durante il seeding dei generi:", error.message);

    } finally {
        // Chiudiamo la connessione al database
        await mongoose.connection.close();
        console.log("Connessione al DB chiusa.");
    }
};

// Eseguiamo la funzione
seedGenres();