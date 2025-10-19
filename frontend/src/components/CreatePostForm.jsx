// Importiamo gli strumenti base di React
import React, { useState, useEffect } from 'react';

// Importiamo il nostro api per parlare con il server
import api from '../services/api';

// Importiamo componenti UI
import { Autocomplete, TextField, Rating, FormControlLabel, Switch, Button, Box, CircularProgress, Typography } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { Form, Row, Col } from 'react-bootstrap';
import { theme } from './theme';

// Creiamo il componente CreatePostForm 
function CreatePostForm({ onPostCreated, movieData = null }) {
    // Stato per gestire i campi del form
    const [selectedMovie, setSelectedMovie] = useState(null); 
    const [review, setReview] = useState('');
    const [rating, setRating] = useState(0); 
    const [isPrivate, setIsPrivate] = useState(false);

    // Stato per memorizzare i generi dei film selezionati
    const [genres, setGenres] = useState([]);

    // Stato per memorizzare il testo nel campo di ricerca
    const [searchQuery, setSearchQuery] = useState(''); 

    // Stato per mostrare la lista dei risultati
    const [searchResults, setSearchResults] = useState([]);

    // Stato per mostrare lo spinner di caricamento
    const [isSearching, setIsSearching] = useState(false); 

    // Funzione per compilare automaticamente il form
    useEffect(() => {
        if (movieData) {
            setSelectedMovie({
                id: movieData.tmdbId,
                title: movieData.movieTitle,
                poster_path: movieData.postImage
            });
            setGenres(movieData.genres || []);
        }
    }, [movieData]);

    // Funzione per permettere all'utente di creare un nuovo post su un film
    // Eseguita ogni volta che l'utente digita o quando cambia la modalità del form
    useEffect(() => {
        // Se il form è già compilato o le lettere digitate sono meno di 2: non fa nulla
        if (movieData || searchQuery.trim().length < 2) {
            setSearchResults([]);
            return;
        }

        // Altrimenti mostra lo spinner e cerca i film
        setIsSearching(true);
        const debounceTimer = setTimeout(async () => {
            try {
                // Chiamata API all'endpoint /movies/search
                const response = await api.get(`/movies/search?query=${searchQuery}`);
                // Estraiamo i risultati dalla risposta
                setSearchResults(response.data || []);
            } catch (error) {
                console.error("Errore nella ricerca del film:", error);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 500);
        // Funzione di pulizia per cancellare il timer se l'utente digita ancora
        return () => clearTimeout(debounceTimer);
    }, [searchQuery, movieData]);

    // Funzione che viene eseguita quando si clicca "Pubblica"
    const handleSubmit = async (event) => {
        // Preveniamo il comportamento di default del pulsante (cioè il ricaricamento della pagina)
        event.preventDefault();

        // Ci assicuriamo che sia selezionato un film
        if (!selectedMovie) {
            alert("Per favore, seleziona un film prima di pubblicare.");
            return;
        }
        
        // Creiamo l'oggetto postData con la struttura richiesta dal backend
        const postData = {
            tmdbId: selectedMovie.id,
            movieTitle: selectedMovie.title,
            postImage: selectedMovie.poster_path,
            review: review,
            isPrivate: isPrivate,
            genres: genres
        };

        // Aggiungiamo il rating solo se è maggiore di 0
        if (rating > 0) {
            postData.rating = rating;
        }

        try {
            // Eseguiamo una richiesta POST a /posts con i dati del nuovo post
            const response = await api.post('/posts', postData);
            onPostCreated(response.data.post); 
            
            // Controlliamo se il form NON è stato pre-compilato con dati di un film specifico
            if (!movieData) {
                // Se è vero (l'utente ha cercato il film manualmente), allora:
                setSelectedMovie(null);
                setSearchQuery('');
                setSearchResults([]);
            }
            // In ogni caso (sia che 'movieData' esista o meno):
            setReview('');
            setRating(0);
            setIsPrivate(false);

        } catch (error) {
            console.error("Errore nella creazione del post:", error);
            alert((error.response && error.response.data && error.response.data.message) || "Non è stato possibile creare il post.");
        }
    };

    // Se c’è un film usiamo la sua locandina o un’immagine di default locale
    // Se non c’è mostriamo un’immagine placeholder
    const posterUrl = selectedMovie 
            ? (selectedMovie.poster_path || 'https://www.ninodangelo.com/wp-content/uploads/no-locandina.jpg')
            : 'https://via.placeholder.com/300x450.png?text=Seleziona+un+film';

    return (
        <Form onSubmit={handleSubmit}>
            <Row className="align-items-start">
                <Col md={4} className="text-center">
                    <Box sx={{ width: '100%', paddingTop: '150%', backgroundColor: '#e0e0e0', borderRadius: 2, position: 'relative', overflow: 'hidden', mb: 2 }}>
                        <img src={posterUrl} alt={selectedMovie ? `Locandina di ${selectedMovie.title}` : 'Locandina'} style={{
                            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover'
                            }} />
                    </Box>
                </Col>

                <Col md={8}>
                    {movieData ? (
                        <Typography variant="h5" component="h2" gutterBottom>
                            {movieData.movieTitle}
                        </Typography>
                    ) : (
                        <Autocomplete
                            fullWidth
                            options={searchResults}
                            getOptionLabel={(option) => option.title}
                            loading={isSearching}
                            value={selectedMovie}
                            onChange={(event, newValue) => setSelectedMovie(newValue)}
                            onInputChange={(event, newInputValue) => setSearchQuery(newInputValue)}
                            renderOption={(props, option) => (
                                <Box component="li" sx={{ '& > img': { mr: 2, flexShrink: 0 } }} {...props}>
                                    <img loading="lazy" width="40" src={option.poster_path || 'https://www.ninodangelo.com/wp-content/uploads/no-locandina.jpg'} alt="" />
                                    {option.title} ({option.release_date ? option.release_date.substring(0, 4) : 'N/D'})
                                </Box>
                            )}
                            renderInput={(params) => (
                                <TextField {...params} label="Cerca e seleziona un film..." variant="outlined" InputProps={{ ...params.InputProps, endAdornment: (<React.Fragment>{isSearching ? <CircularProgress color="inherit" size={20} /> : null}{params.InputProps.endAdornment}</React.Fragment>)}} />
                            )}
                            sx={{ mb: 3 }}
                        />
                    )}
                    
                    <TextField label="Inserisci la tua recensione..." multiline rows={4} fullWidth variant="outlined" value={review} onChange={(e) => setReview(e.target.value)} sx={{ mb: 3 }} />
                    
                    <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <Form.Label className="mb-1" as="legend">Il tuo voto:</Form.Label>
                        <Rating name="movie-rating" value={rating} onChange={(event, newValue) => setRating(newValue || 0)} size="large" />
                    </Box>

                    <FormControlLabel control={<Switch checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} color="secondary"
                        sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                                color: theme.palette.secondary.light,
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                backgroundColor: theme.palette.secondary.light,
                            },
                            '& .MuiSwitch-thumb': {
                                color: theme.palette.secondary.light,
                            },
                            top: 0,
                            }} />} label="Post privato (visibile solo a te)" sx={{ mb: 3 }} />

                    <Button type="submit" variant="contained" endIcon={<SendIcon />} size="large" disabled={!selectedMovie} color="secondary"
                        sx={{
                            backgroundColor: theme.palette.secondary.light,
                            '&:hover': {
                            backgroundColor: theme.palette.secondary.main,
                            },
                            textTransform: 'uppercase',
                            fontWeight: 'bold',
                            fontSize: '1rem',
                            top: -13,
                            right: -30,
                            }}>
                        Pubblica
                    </Button>
                </Col>
            </Row>
        </Form>
    );
}

// Esportiamo il componente CreatePostForm
export default CreatePostForm;