// src/components/CreatePostForm.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';

// Import componenti UI
import { Autocomplete, TextField, Rating, FormControlLabel, Switch, Button, Box, CircularProgress, Typography } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { Form, Row, Col } from 'react-bootstrap';

/**
 * Un form riutilizzabile per creare un post.
 * @param {function} onPostCreated - Callback eseguita dopo la creazione del post.
 * @param {object|null} movieData - Se fornito, pre-compila il form con i dati del film e disabilita la ricerca.
 */
function CreatePostForm({ onPostCreated, movieData = null }) {
    const [selectedMovie, setSelectedMovie] = useState(null); 
    const [review, setReview] = useState(''); 
    const [rating, setRating] = useState(0); 
    const [isPrivate, setIsPrivate] = useState(false);
    const [genres, setGenres] = useState([]);
    const [searchQuery, setSearchQuery] = useState(''); 
    const [searchResults, setSearchResults] = useState([]); 
    const [isSearching, setIsSearching] = useState(false); 

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

    useEffect(() => {
        if (movieData || searchQuery.trim().length < 3) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        const debounceTimer = setTimeout(async () => {
            try {
                const response = await api.get(`/movies/search?query=${searchQuery}`);
                setSearchResults(response.data || []);
            } catch (error) {
                console.error("Errore nella ricerca del film:", error);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 500);

        return () => clearTimeout(debounceTimer);
    }, [searchQuery, movieData]);


    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!selectedMovie) {
            alert("Per favore, seleziona un film prima di pubblicare.");
            return;
        }
        
        const postData = {
            tmdbId: selectedMovie.id,
            movieTitle: selectedMovie.title,
            postImage: selectedMovie.poster_path,
            review: review,
            isPrivate: isPrivate,
            genres: genres
        };

        if (rating > 0) {
            postData.rating = rating;
        }

        try {
            const response = await api.post('/posts', postData);
            onPostCreated(response.data.post); 
            
            if (!movieData) {
                setSelectedMovie(null);
                setSearchQuery('');
                setSearchResults([]);
            }
            setReview('');
            setRating(0);
            setIsPrivate(false);

        } catch (error) {
            console.error("Errore nella creazione del post:", error);
            alert((error.response && error.response.data && error.response.data.message) || "Non è stato possibile creare il post.");
        }
    };

    const posterUrl = selectedMovie 
        ? (selectedMovie.poster_path || 'https://via.placeholder.com/300x450.png?text=N/A')
        : 'https://via.placeholder.com/300x450.png?text=Seleziona+un+film';

    return (
        <Form onSubmit={handleSubmit}>
            <Row className="align-items-start">
                <Col md={4} className="text-center">
                    <Box sx={{ width: '100%', paddingTop: '150%', backgroundColor: '#e0e0e0', borderRadius: 2, position: 'relative', overflow: 'hidden', mb: 2 }}>
                        <img src={posterUrl} alt={selectedMovie ? `Locandina di ${selectedMovie.title}` : 'Locandina'} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
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
                                    <img loading="lazy" width="40" src={option.poster_path || 'https://via.placeholder.com/40x60.png?text=N/A'} alt="" />
                                    {option.title} ({option.release_date ? option.release_date.substring(0, 4) : 'N/D'})
                                </Box>
                            )}
                            renderInput={(params) => (
                                // --- CORREZIONE 1: Sostituito <> con React.Fragment ---
                                <TextField {...params} label="Cerca e seleziona un film..." variant="outlined" InputProps={{ ...params.InputProps, endAdornment: (<React.Fragment>{isSearching ? <CircularProgress color="inherit" size={20} /> : null}{params.InputProps.endAdornment}</React.Fragment>)}} />
                            )}
                            // --- CORREZIONE 2: Sostituito className con sx ---
                            sx={{ mb: 3 }}
                        />
                    )}
                    
                    <TextField label="Inserisci la tua recensione..." multiline rows={4} fullWidth variant="outlined" value={review} onChange={(e) => setReview(e.target.value)} sx={{ mb: 3 }} />
                    
                    <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <Form.Label className="mb-1" as="legend">Il tuo voto:</Form.Label>
                        <Rating name="movie-rating" value={rating} onChange={(event, newValue) => setRating(newValue || 0)} size="large" />
                    </Box>
                    
                    <FormControlLabel control={<Switch checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />} label="Post privato (visibile solo a te)" sx={{ mb: 3 }} />
                    
                    <Button type="submit" variant="contained" endIcon={<SendIcon />} size="large" disabled={!selectedMovie}>
                        Pubblica
                    </Button>
                </Col>
            </Row>
        </Form>
    );
}

export default CreatePostForm;