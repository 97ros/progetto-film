// src/pages/SearchPage.jsx
import React, { useState, useEffect} from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api.js'; // Usiamo il nostro servizio API centralizzato
import './SearchPage.css';

function SearchPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [noResults, setNoResults] = useState(false); // Stato per gestire "nessun risultato"

    // useEffect per la ricerca con debounce
    useEffect(() => {
        // Pulisci i risultati se la query è troppo corta
        if (searchQuery.trim().length < 2) {
            setResults([]);
            setNoResults(false);
            return;
        }

        const debounceTimer = setTimeout(() => {
            const fetchMovies = async () => {
                setIsLoading(true);
                setError(null);
                setNoResults(false);
                try {
                    // La rotta è corretta come definita in movieRoutes.js
                    const response = await api.get(`/movies/search?query=${searchQuery}`);
                    
                    if (response.data && response.data.length > 0) {
                        setResults(response.data);
                    } else {
                        setResults([]);
                        setNoResults(true); // Imposta a true se l'API restituisce un array vuoto
                    }
                } catch (err) {
                    console.error("Errore durante la ricerca:", err);
                    setError("Impossibile caricare i risultati. Riprova più tardi.");
                    setResults([]);
                } finally {
                    setIsLoading(false);
                }
            };

            fetchMovies();
        }, 500); // 500ms di attesa prima di lanciare la ricerca

        return () => {
            clearTimeout(debounceTimer);
        };
    }, [searchQuery]);

    return (
        <div className="explore-container">
            <h1>Cosa vuoi cercare?</h1>
            <div className="search-bar-wrapper">
                <input
                    type="text"
                    className="search-input"
                    placeholder="Scrivi il titolo di un film..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus // Mette il focus sull'input al caricamento della pagina
                />
                {isLoading && <div className="loading-spinner"></div>}
            </div>

            {error && <p className="error-message">{error}</p>}

            {/* Mostra il menu a tendina solo se ci sono risultati */}
            {results.length > 0 && (
                <ul className="results-dropdown">
                    {results.map((movie) => (
                        <li key={movie.id} className="result-item">
                            <Link to={`/movie/${movie.id}`} className="result-link">
                                <img 
                                    src={movie.poster_path || 'https://via.placeholder.com/50x75.png?text=N/A'} 
                                    alt={`Locandina di ${movie.title}`} 
                                    className="result-poster"
                                />
                                <div className="result-info">
                                    <span className="result-title">{movie.title}</span>
                                    <span className="result-year">{movie.release_date ? movie.release_date.substring(0, 4) : 'N/D'}</span>
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
            
            {/* Mostra il messaggio "Nessun risultato" */}
            {noResults && <p className="no-results-message">Nessun film trovato per "{searchQuery}"</p>}
        </div>
    );
}

export default SearchPage;