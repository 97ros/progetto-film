// Importiamo React e gli hook fondamentali
import React, { useState, useEffect} from 'react';

// Importiamo il componente Link
import { Link } from 'react-router-dom';

// Importiamo l'istanza di axios preconfigurata
import api from '../../services/api.js';

// Importiamo il CSS specifico per questa pagina
import './SearchPage.css';

// Creiamo il componente SearchPage
function SearchPage() {
    // Stato per memorizzare il testo digitato
    const [searchQuery, setSearchQuery] = useState('');

    // Stato per la lista dei film trovati
    const [results, setResults] = useState([]);

    // Stato per gestire il caricamento e gli errori
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Stato per gestire "nessun risultato"
    const [noResults, setNoResults] = useState(false);

    // Logica di ricerca
    useEffect(() => {
        // Puliamo i risultati se la query è troppo corta
        if (searchQuery.trim().length < 2) {
            setResults([]);
            setNoResults(false);
            return;
        }

        // Funzione che restituisce risultati solo dopo mezzo secondo dall'ultima digitazione
        // viene eseguita solo quando cambia searchQuery
        const debounceTimer = setTimeout(async () => {
            setIsLoading(true);
            setError(null);
            setNoResults(false);
            try {
            // Chiamata api all'endpoint /movies/search
            const response = await api.get(`/movies/search?query=${searchQuery}`);
            // Se la risposta contiene dati e l'array dei risultati non è vuoto:
                            if (response.data && response.data.length > 0) {
                                // Aggiorniamo lo stato di results con i dati della risposta
                                setResults(response.data);
                            } else {
                                setResults([]);
                                setNoResults(true);
                            }
                        } catch (err) {
                            console.error("Errore durante la ricerca:", err);
                            setError("Impossibile caricare i risultati. Riprova più tardi.");
                            setResults([]);
                        } finally {
                            setIsLoading(false);
                        }
                    // 500ms di attesa prima di lanciare la ricerca
                }, 500);

                // Funzione che cancella il timer precedente
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
                    // Mettiamo il focus sull'input al caricamento della pagina
                    autoFocus
                />
                {isLoading && <div className="loading-spinner"></div>}
            </div>

            {error && <p className="error-message">{error}</p>}

            {/* Mostriamo il menu a tendina solo se ci sono risultati */}
            {results.length > 0 && (
                <ul className="results-dropdown">
                    {/* Mappiamo i risultati in singoli elementi della lista */ }
                    {results.map((movie) => (
                        <li key={movie.id} className="result-item">
                            <Link to={`/movie/${movie.id}`} className="result-link">
                                <img 
                                    src={movie.poster_path || 'https://www.ninodangelo.com/wp-content/uploads/no-locandina.jpg'} 
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

// Esportiamo il componente SearchPage
export default SearchPage;