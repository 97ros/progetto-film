// src/pages/MoviePage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

// Componenti UI
import { Container, Row, Col, Card, Image, Spinner, Alert, Button, Modal, Badge } from 'react-bootstrap';
import CreatePostForm from '../components/CreatePostForm'; // Assicurati di avere questo componente
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';
import PostAddIcon from '@mui/icons-material/PostAdd';

const linkStyle = { textDecoration: 'none', color: 'inherit' };

function MoviePage() {
    const { movieId } = useParams();
    const { currentUser } = useAuth(); // Prendiamo l'utente corrente dal contesto

    const [movieDetails, setMovieDetails] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false); // Stato per il modal

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

    // 2. Logica per aggiungere alla watchlist
    const handleAddToWatchlist = async () => {
        if (!currentUser) return alert("Devi effettuare il login per aggiungere film alla watchlist.");
        try {
            const posterUrl = movieDetails.poster_path ? `https://image.tmdb.org/t/p/w500${movieDetails.poster_path}` : null;
            const watchlistData = {
                tmdbId: movieDetails.id,
                title: movieDetails.title,
                posterPath: posterUrl,
                cast: movieDetails.cast,
                languages: movieDetails.languages,
                imdb: movieDetails.imdb_id.rating
            };
            await api.post('/users/me/watchlist', watchlistData);
            alert(`"${movieDetails.title}" è stato aggiunto alla tua watchlist!`);
        } catch(err) {
            alert(
                err.response?<div className="text-danger">{err.response.data.message}</div> :
                <div className="text-danger">"Questo film è già nella tua watchlist o si è verificato un errore."</div>
            );
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

    // 3. Costruiamo l'URL completo della locandina
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
                            <Badge pill bg="secondary" className="me-1" key={genre.id}>{genre.name}</Badge>
                        ))}
                    </div>

                    <h5 className="mt-3">Trama</h5>
                    <p>{movieDetails.overview}</p>
                    
                    {/* 4. I pulsanti di azione sono mostrati solo se l'utente è loggato */}
                    {currentUser && (
                         <div className="d-flex align-items-center mt-4">
                            <Button variant="outline-primary" onClick={handleAddToWatchlist} className="me-2">
                                <BookmarkAddIcon fontSize="small" className="me-1" />
                                Aggiungi alla Watchlist
                            </Button>
                            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
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
                posts.map(post => (
                    <Card key={post._id} className="mb-3">
                        <Card.Body>
                            <div className="d-flex align-items-start">
                                <Link to={`/user/${post.authorId.username}`}>
                                    <Image src={post.authorId.profilePicture || 'https://via.placeholder.com/50'} roundedCircle width="50" height="50" />
                                </Link>
                                <div className="ms-3 w-100">
                                    <Link to={`/user/${post.authorId.username}`} style={linkStyle}>
                                        <strong>{post.authorId.username}</strong>
                                    </Link>
                                    <p className="mt-1 mb-0">{post.review}</p>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                ))
            ) : (
                <p>Nessuno ha ancora scritto un post su questo film. Sii il primo!</p>
            )}

            {/* 5. Modal per la creazione del post */}
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