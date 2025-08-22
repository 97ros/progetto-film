const axios = require('axios');

// --- Funzione per CERCARE film tramite l'API di TMDB ---
exports.searchMovies = async (req, res) => {
    // 1. Prendiamo il testo della ricerca dalla query string dell'URL
    // Esempio: /api/movies/search?query=inception
    const searchQuery = req.query.query;

    // Se non viene fornita una query, restituiamo un errore
    if (!searchQuery) {
        return res.status(400).json({ error: "Per favore, fornisci un termine di ricerca." });
    }

    // 2. Prepariamo l'URL per la chiamata all'API di TMDB
    const tmdbApiKey = process.env.TMDB_API_KEY;
    const tmdbUrl = `https://api.themoviedb.org/3/search/movie?api_key=${tmdbApiKey}&query=${searchQuery}&language=it-IT`;

    try {
        // 3. Eseguiamo la chiamata all'API esterna usando axios
        const response = await axios.get(tmdbUrl);

        // 4. "Puliamo" i risultati per inviare al frontend solo i dati che ci servono
        const cleanedResults = response.data.results.map(movie => ({
            id: movie.id,
            title: movie.title,
            overview: movie.overview,
            release_date: movie.release_date,
            // Il poster_path da solo non è un URL completo. Dobbiamo costruirlo.
            poster_path: movie.poster_path 
                ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` 
                : null // Se non c'è un poster, restituiamo null
        }));

        // 5. Inviamo i risultati puliti al nostro frontend
        res.status(200).json(cleanedResults);

    } catch (error) {
        console.error("Errore nella chiamata a TMDB:", error.message);
        res.status(500).json({ error: "Errore durante la ricerca dei film." });
    }
};

// Funzione per ottenere i dettagli di un film.
exports.getMovieDetails = async (req, res) => {
    const tmdbId = req.params.tmdbId;
    const tmdbApiKey = process.env.TMDB_API_KEY;
    const tmdbUrl = `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${tmdbApiKey}&language=it-IT`;
    try {
        const response = await axios.get(tmdbUrl);
        res.status(200).json(response.data);
    } catch (error) {
        res.status(500).json({ message: "Errore nel recuperare i dettagli del film." });
    }
};