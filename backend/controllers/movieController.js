const axios = require("axios");

// Funzione per cercare film tramite il titolo
exports.searchMovies = async (req, res) => {
    const query = req.query.query;
    const tmdbApiKey = process.env.TMDB_API_KEY;

    try {
        const tmdbUrl = `https://api.themoviedb.org/3/search/movie?api_key=${tmdbApiKey}&query=${encodeURIComponent(query)}&language=it-IT`;
        const response = await axios.get(tmdbUrl);

        const movies = response.data.results.map(movie => ({
            id: movie.id,
            title: movie.title,
            overview: movie.overview,
            release_date: movie.release_date,
             // Costruiamo l'URL completo per la locandina
            poster_path: movie.poster_path 
                ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` 
                : null, // Se non c'è una locandina, inviamo null
            vote_average: movie.vote_average
        }));

        res.status(200).json(movies);
    } catch (error) {
        console.error("Errore nel recuperare i film:", error.message);
        res.status(500).json({ message: "Errore durante il recupero dei film." });
    }
};

// Funzione per ottenere i dettagli di un film
exports.getMovieDetails = async (req, res) => {
    const tmdbId = req.params.tmdbId;
    const tmdbApiKey = process.env.TMDB_API_KEY;

    try {
        // 1. Dettagli base del film
        const movieRes = await axios.get(
            `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${tmdbApiKey}&language=it-IT`
        );

        // 2. Cast e crew
        const creditsRes = await axios.get(
            `https://api.themoviedb.org/3/movie/${tmdbId}/credits?api_key=${tmdbApiKey}&language=it-IT`
        );

        const movie = movieRes.data;
        const credits = creditsRes.data;

        const directors = credits.crew
            .filter(member => member.job === "Director")
            .map(d => d.name);

        const cast = credits.cast.slice(0, 10).map(c => c.name); // primi 10 attori

        const cleanedMovie = {
            id: movie.id,
            title: movie.title,
            overview: movie.overview,
            release_date: movie.release_date,
            poster_path: movie.poster_path
                ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                : null,
            genres: movie.genres || [],
            directors,
            cast,
            languages: movie.spoken_languages.map(l => l.english_name),
            vote_average: movie.vote_average
        };

        res.status(200).json(cleanedMovie);
    } catch (error) {
        console.error("Errore nel recuperare i dettagli del film:", error.message);
        res.status(500).json({ message: "Errore durante il recupero dei dettagli del film." });
    }
};
