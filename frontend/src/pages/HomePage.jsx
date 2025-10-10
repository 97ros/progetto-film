// Importiamo le librerie necessarie e il nostro api per comunicare con il server
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

// Importiamo i componenti UI
import { Container, Modal, Spinner, Alert, Card, Row, Col, Image } from 'react-bootstrap';
import { Fab, Rating, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { theme } from '../components/theme';
import './custom.scss';

// Importiamo il contesto di autenticazione
import { useAuth } from '../context/AuthContext';

// Importiamo CreatePostForm associato al pulsante per creare un nuvo post
import CreatePostForm from '../components/CreatePostForm';

// Stile per i link
const linkStyle = { textDecoration: 'none', color: 'inherit' };

// Creiamo il nostro componente
const HomePage = () => {
    // Invochiamo il contesto di autenticazione per sapere chi è l'utente loggato
    const { currentUser } = useAuth();

    // Stati per gestire i post, il caricamento, gli errori e la modale di creazione
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Logghiamo currentUser per assicurarci che sia corretto
    useEffect(() => {
        console.log("CurrentUser in HomePage:", currentUser);
        if (currentUser) {
            console.log("CurrentUser ID:", currentUser._id);
        }
    }, [currentUser]);

    // Funzione responsabile del caricamento dei dati
    useEffect(() => {
        const fetchHomepagePosts = async () => {
            // Non fare nulla se l'utente non è loggato
            if (!currentUser) return;

            try {
                // Chiamata API all'endpoint /posts
                const response = await api.get('/posts');
                // Aggiorniamo lo stato dei post con i dati ricevuti
                setPosts(response.data || []);
            } catch (err) {
                console.error("Errore nel caricare i post della homepage:", err);
                setError("Impossibile caricare il feed. Riprova più tardi.");
            } finally {
                setLoading(false);
            }
        };
        fetchHomepagePosts();
    }, [currentUser]); // Riesegui il fetch se cambia l'utente loggato
    
    // Funzione per gestire il "like"
    const handleLikePost = async (postId) => {
        try {
            // Chiamata API all'endpoint /posts/:id/like
            const response = await api.post(`/posts/${postId}/like`);
            // Aggiorniamo il post specifico nella lista dei post
            const updatedPost = response.data.post;
            // Aggiorniamo lo stato dei post
            setPosts(currentPosts => 
                currentPosts.map(p => p._id === postId ? updatedPost : p)
            );
        } catch(err) {
            console.error("Errore durante il like:", err);
            alert((err.response && err.response.data && err.response.data.message) || "Non è stato possibile aggiornare il like.");
        }
    };

    // Funzione per il form di creazione
    const handlePostCreated = (newPost) => {
        // Aggiungiamo il nuovo post in cima alla lista
        setPosts(currentPosts => [newPost, ...currentPosts]);
        // Chiudiamo la modale
        setShowCreateModal(false);
    };

    return (
        <Container className="mt-4" px={4} style={{ width: '100%', padding: '100px', paddingTop: null }}>
            {loading && <div className="text-center"><Spinner animation="border" /></div>}
            {error && <Alert variant="danger">{error}</Alert>}
            
            {!loading && !error && (
                posts.length > 0 ? (
                    posts.map(post => {
                        if (!post || !post.authorId) return null;
                        const isLiked = currentUser && post.likes.includes(currentUser.id);
                        return (
                            <Card key={post._id} className="mb-4 shadow-sm">
                                <Card.Header className="bg-white border-bottom-0">
                                    <Link to={`/user/${post.authorId.username}`} style={linkStyle}>
                                        <Image 
                                            src={post.authorId.profilePicture || 'https://via.placeholder.com/40'} 
                                            roundedCircle 
                                            style={{ objectFit: 'cover' }}
                                            width="40" 
                                            height="40" 
                                            className="me-2"
                                        />
                                        <strong>{post.authorId.username}</strong>
                                    </Link>
                                </Card.Header>
                                <Card.Body>
                                    <Row>
                                        <Col xs={4} md={3} className="pe-0">
                                            <Link to={`/movie/${post.tmdbId}`}>
                                                <Card.Img 
                                                    src={post.postImage || 'https://via.placeholder.com/300x450.png?text=N/A'}
                                                    style={{ borderRadius: '8px' }}
                                                />
                                            </Link>
                                        </Col>
                                        <Col xs={8} md={9}>
                                            <Link to={`/movie/${post.tmdbId}`} style={linkStyle}>
                                                <h5 className="mb-1">{post.movieTitle}</h5>
                                            </Link>
                                            {post.rating > 0 && 
                                                <Rating name="read-only" value={post.rating} readOnly size="small" />
                                            }
                                            <p className="mt-2 mb-0">{post.review}</p>
                                        </Col>
                                    </Row>
                                </Card.Body>
                                <Card.Footer className="bg-white d-flex align-items-center">
                                    <IconButton onClick={() => handleLikePost(post._id)} color='error' disabled={!currentUser} >
                                        {isLiked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                                    </IconButton>
                                    <span>{post.likes.length} Mi piace</span>
                                </Card.Footer>
                            </Card>
                        );
                    })
                ) : (
                    <div className="text-center p-5 bg-light rounded">
                        <h4>Nessun post da visualizzare.</h4>
                        <p>Il tuo feed è vuoto oppure non ci sono post che corrispondono ai tuoi generi preferiti.</p>
                    </div>
                )
            )}

            {/* Pulsante Fluttuante (FAB) per creare un nuovo post */}
            <Fab 
                color="primary" 
                aria-label="add" 
                onClick={() => setShowCreateModal(true)}
                sx={{ position: 'fixed', bottom: 24, right: 24, backgroundColor: theme.palette.secondary.light, '&:hover': { backgroundColor: theme.palette.secondary.main } }}
            >
                <AddIcon />
            </Fab>

            {/* Modal che contiene il form di creazione */}
            <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>Crea un nuovo post</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <CreatePostForm onPostCreated={handlePostCreated} />
                </Modal.Body>
            </Modal>
        </Container>
    );
};

// Esportiamo il componente HomePage
export default HomePage;