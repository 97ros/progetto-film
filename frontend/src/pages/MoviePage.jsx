// src/pages/MoviePage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './custom.scss';

// Componenti UI
import { Container, Row, Col, Card, Image, Spinner, Alert, Button, Modal, Badge } from 'react-bootstrap';
import IconButton from '@mui/material/IconButton';
import Rating from '@mui/material/Rating';
import CreatePostForm from '../components/CreatePostForm';
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';
import BookmarkRemoveIcon from '@mui/icons-material/BookmarkRemove';
import PostAddIcon from '@mui/icons-material/PostAdd';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';

const linkStyle = { textDecoration: 'none', color: 'inherit' };

function MoviePage() {
    const { movieId } = useParams();
    const { currentUser, setCurrentUser } = useAuth(); // Prendiamo l'utente corrente dal contesto

    const [movieDetails, setMovieDetails] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false); // Stato per il modal

    // --- NUOVO: Stato per tracciare se il film è nella watchlist ---
    const [isInWatchlist, setIsInWatchlist] = useState(false);

    useEffect(() => {
        const fetchMovieData = async () => {
            setLoading(true);
            try {
                const [movieRes, postsRes] = await Promise.all([
                    api.get(`/movies/${movieId}`),
                    api.get(`/posts/movie/${movieId}`) // Questa rotta è corretta
                ]);

                setMovieDetails(movieRes.data);
                setPosts(postsRes.data || []); // Il backend restituisce direttamente l'array di post

            } catch (err) {
                console.error("Errore nel caricare i dati del film:", err);
                setError("Impossibile trovare i dati per questo film.");
            } finally {
                setLoading(false);
            }
        };

        fetchMovieData();
    }, [movieId]);

     // useEffect per controllare lo stato della watchlist 
    // CORREZIONE CHIAVE: Aggiunto un controllo di sicurezza su currentUser.watchlist 
    useEffect(() => {
        // Controlla se l'utente è loggato, se i dettagli del film sono caricati,
        // e, soprattutto, se currentUser.watchlist esiste ed è un array.
        if (currentUser && movieDetails && Array.isArray(currentUser.watchlist)) {
            const movieIsOnList = currentUser.watchlist.some(
                movie => movie.tmdbId.toString() === movieId
            );
            setIsInWatchlist(movieIsOnList);
        } else {
            // Se una delle condizioni non è vera, assicurati che il film non sia segnato come "nella watchlist"
            setIsInWatchlist(false);
        }
    }, [currentUser, movieDetails, movieId]);


    // Logica per aggiungere alla watchlist
    const handleAddToWatchlist = async () => {
        if (!currentUser) return alert("Devi effettuare il login per aggiungere film alla watchlist.");
        try {
            const posterUrl = movieDetails.poster_path ? `https://image.tmdb.org/t/p/w500${movieDetails.poster_path}` : null;
            const watchlistData = {
                tmdbId: movieDetails.id,
                title: movieDetails.title,
                posterPath: posterUrl,
            };

            const response = await api.post('/users/me/watchlist', watchlistData);

            // Aggiorna il contesto dell'utente con la nuova watchlist
            setCurrentUser(prevUser => ({
                ...prevUser,
                watchlist: response.data.watchlist
            }));

            // Aggiorna lo stato locale per cambiare il pulsante
            setIsInWatchlist(true); 
            alert(`"${movieDetails.title}" è stato aggiunto alla tua watchlist!`);


        } catch(err) {
            alert((err.response && err.response.data && err.response.data.message) || "Questo film è già nella tua watchlist o si è verificato un errore.");
        }
    };

    // Funzione per rimuovere dalla watchlist 
    const handleRemoveFromWatchlist = async () => {
        if (!currentUser) return alert("Devi essere loggato per rimuovere film.");
        try {
            const response = await api.delete(`/users/me/watchlist/${movieId}`);
            
            // Aggiorna il contesto dell'utente con la watchlist modificata
            setCurrentUser(prevUser => ({
                ...prevUser,
                watchlist: response.data.watchlist
            }));
            
            // Aggiorna lo stato locale per cambiare il pulsante
            setIsInWatchlist(false);
            alert(`"${movieDetails.title}" è stato rimosso dalla tua watchlist.`);

        } catch (err) {
            alert((err.response?.data?.message) || "Errore durante la rimozione del film.");
        }
    };

    // Logica per il like al post nella scheda film
    const handleLikePost = async (postId) => {
        try {
            const response = await api.post(`/posts/${postId}/like`);
            const updatedPost = response.data.post;
            // Aggiorna lo stato dei post per riflettere il like/unlike
            setPosts(currentPosts => 
                currentPosts.map(p => p._id === postId ? updatedPost : p)
            );
        } catch(err) {
            console.error("Errore durante il like:", err);
            alert((err.response && err.response.data && err.response.data.message) || "Non è stato possibile aggiornare il like.");
        }
    };
    
    // Funzione per quando un post viene creato con successo dal modal
    const handlePostCreated = (newPost) => {
        setPosts(currentPosts => [newPost, ...currentPosts]); // Aggiunge il nuovo post in cima alla lista
        setShowCreateModal(false); // Chiude il modal
    };
    
    if (loading) return <div className="text-center mt-5"><Spinner animation="border" /></div>;
    if (error) return <Container className="mt-5"><Alert variant="danger">{error}</Alert></Container>;
    if (!movieDetails) return null;

    // Costruiamo l'URL completo della locandina
    const posterUrl = movieDetails.poster_path 
        ? `https://image.tmdb.org/t/p/w500${movieDetails.poster_path}` 
        : 'https://via.placeholder.com/400x600.png?text=N/A';
        
    return (
        <Container className="mt-4">
            <Row>
                <Col md={4}>
                    <Image src={posterUrl} fluid rounded />
                </Col>
                <Col md={8}>
                    <h1>{movieDetails.title} <span className="text-muted">({movieDetails.release_date.substring(0, 4)})</span></h1>
                    <div>
                        {movieDetails.genres.map(genre => (
                            <Badge pill bg="secondary" className="me-1" key={genre._id}>{genre.name}</Badge>
                        ))}
                    </div>

                    <p><strong>Registi:</strong> {movieDetails.directors && movieDetails.directors.length > 0 ? movieDetails.directors.join(', ') : 'Non disponibile'}</p>

                    <h6>Cast Principale</h6>
                    <p>
                        {movieDetails.cast && movieDetails.cast.length > 0
                        ? movieDetails.cast.slice(0, 10).join(', ')
                        : 'Non disponibile'}
                        </p>
                    <h6>Lingue</h6>
                    <p>{movieDetails.languages && movieDetails.languages.length > 0 ? movieDetails.languages.join(', ') : 'Non disponibile'}</p>

                    <h6>Valutazione TMDB</h6>
                    <p>{movieDetails.vote_average ? `${movieDetails.vote_average.toFixed(1)} / 10` : 'Non disponibile'}</p>

                    <h5 className="mt-3">Trama</h5>
                    <p>{movieDetails.overview}</p>
                    
                    {/* I pulsanti di azione sono mostrati solo se l'utente è loggato */}
                    {currentUser && (
                         <div className="d-flex align-items-center mt-4">
                            {/* MODIFICA: Rendering condizionale del pulsante watchlist */}
                            {isInWatchlist ? (
                                <Button variant="outline-movie" onClick={handleRemoveFromWatchlist} className="me-2">
                                    <BookmarkRemoveIcon fontSize="small" className="me-1" />
                                    Rimuovi dalla Watchlist
                                </Button>
                            ) : (
                                <Button variant="outline-movie" onClick={handleAddToWatchlist} className="me-2">
                                    <BookmarkAddIcon fontSize="small" className="me-1" />
                                    Aggiungi alla Watchlist
                                </Button>
                            )}
                            
                            <Button variant="movie" onClick={() => setShowCreateModal(true)}>
                                <PostAddIcon fontSize="small" className="me-1" />
                                Scrivi un post
                            </Button>
                        </div>
                    )}
                </Col>
            </Row>

            <hr className="my-5" />

            <h3>Post su "{movieDetails.title}"</h3>
            {posts.length > 0 ? (
                posts.map(post => {
                    const isLiked = currentUser && post.likes.includes(currentUser.id);
                    return (
                    <Card key={post._id} className="mb-3">
                        <Card.Body>
                            <div className="d-flex align-items-start">
                                <Link to={`/user/${post.authorId.username}`}>
                                    <Image src={post.authorId.profilePicture || 'https://via.placeholder.com/50'}
                                    roundedCircle
                                    style={{ objectFit: 'cover' }}
                                    width="50"
                                    height="50" />
                                </Link>
                                <div className="ms-3 w-100">
                                    <Link to={`/user/${post.authorId.username}`} style={linkStyle}>
                                        <strong>{post.authorId.username}</strong>
                                    </Link>
                                    {post.rating > 0 && (
                                        <Rating name="read-only" value={post.rating} readOnly size="small" />
                                    )}
                                    <p className="mt-1 mb-0">{post.review}</p>
                                </div>
                            </div>
                        </Card.Body>
                         <Card.Footer className="bg-white d-flex align-items-center">
                                <IconButton onClick={() => handleLikePost(post._id)} color="error" disabled={!currentUser}>
                                    {isLiked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                                </IconButton>
                                <span>{post.likes.length} Mi piace</span>
                            </Card.Footer>
                    </Card>
                );
                })
            ) : (
                <p>Nessuno ha ancora scritto un post su questo film. Sii il primo!</p>
            )}

            {/* Modal per la creazione del post */}
            <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>Crea un post per "{movieDetails.title}"</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <CreatePostForm
                        onPostCreated={handlePostCreated}
                        // Passiamo i dati del film al form
                        movieData={{
                            tmdbId: movieDetails.id,
                            movieTitle: movieDetails.title,
                            postImage: posterUrl,
                            genres: movieDetails.genres.map(g => g.name)
                        }}
                    />
                </Modal.Body>
            </Modal>
        </Container>
    );
}

export default MoviePage;