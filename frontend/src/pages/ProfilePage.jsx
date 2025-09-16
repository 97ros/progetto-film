// Importiamo le librerie necessarie
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';


import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './custom.scss';

// Import componenti UI
import { Container, Row, Col, Image, Spinner, Alert, Card, Badge, Button, Modal, FormCheck, Form as BootstrapForm } from 'react-bootstrap';
import { IconButton, TextField, Rating } from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';

function ProfilePage() {
    const { username } = useParams();
    const { currentUser, setCurrentUser } = useAuth();

    const [profileData, setProfileData] = useState(null);
    const [userPosts, setUserPosts] = useState([]); // Stato dedicato per i post
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [showGenreModal, setShowGenreModal] = useState(false);
    const [allGenres, setAllGenres] = useState([]);

    const [editingPost, setEditingPost] = useState(null); // Contiene il post da modificare
    const [editPostData, setEditPostData] = useState({ review: '', rating: 0 }); // Dati del form di modifica post

    const isOwner = currentUser && currentUser.username === username;

    const fetchProfileData = useCallback(async () => {
        setLoading(true);
        setError(null); // Resetta l'errore a ogni nuovo fetch
        try {
            const response = await api.get(`/users/${username}`);
            setProfileData(response.data);
            setUserPosts(response.data.userPosts || []);
            setFormData({
                username: response.data.userProfile.username,
                profilePicture: response.data.userProfile.profilePicture || '',
                bio: response.data.userProfile.bio || '',
                preferredGenres: response.data.userProfile.preferredGenres || [],
                isPrivate: response.data.userProfile.isPrivate || false
            });
        } catch (err) {
            console.error("Errore nel caricare il profilo:", err);
            setError("Questo utente non esiste o si è verificato un errore.");
        } finally {
            setLoading(false);
        }
    }, [username]);

    
    useEffect(() => {
        fetchProfileData();
    }, [fetchProfileData]);


     // Funzione per RIMUOVERE dalla watchlist 
    const handleRemoveFromWatchlist = async (tmdbId) => {
        // Chiediamo conferma all'utente
        if (!window.confirm("Sei sicuro di voler rimuovere questo film dalla tua watchlist?")) {
            return;
        }

        try {
            // Chiamata all'API per la rimozione
            await api.delete(`/users/me/watchlist/${tmdbId}`);

            // Aggiorniamo lo stato per riflettere la rimozione
            setProfileData(currentProfile => {
                const updatedWatchlist = currentProfile.userProfile.watchlist.filter(movie => movie.tmdbId !== tmdbId);
                return {
                    ...currentProfile,
                    userProfile: {
                        ...currentProfile.userProfile,
                        watchlist: updatedWatchlist
                    }
                };
            });

        } catch (err) {
            console.error("Errore durante la rimozione dalla watchlist:", err);
            alert((err.response?.data?.message) || "Non è stato possibile rimuovere il film.");
        }
    };


    const handleLikePost = async (postId) => {
        try {
            const response = await api.post(`/posts/${postId}/like`);
            const updatedPost = response.data.post;
            setUserPosts(currentPosts => 
                currentPosts.map(p => p._id === postId ? updatedPost : p)
            );
        } catch(err) {
            console.error("Errore durante il like:", err);
            alert((err.response && err.response.data && err.response.data.message) || "Non è stato possibile aggiornare il like.");
        }
    };

    const handleDeletePost = async (postId) => {
        if (window.confirm("Sei sicuro di voler eliminare questo post?")) {
            try {
                await api.delete(`/posts/${postId}`);
                // Rimuovi il post dallo stato per aggiornare la UI istantaneamente
                setUserPosts(currentPosts => currentPosts.filter(p => p._id !== postId));
            } catch (err) {
                console.error("Errore durante l'eliminazione del post:", err);
                alert("Non è stato possibile eliminare il post.");
            }
        }
    };

    // FUNZIONI PER LA MODIFICA DEL POST 
    // Apre il modal e pre-compila il form di modifica
    const handleOpenEditModal = (post) => {
        setEditingPost(post);
        setEditPostData({
            review: post.review || '',
            rating: post.rating || 0,
            isPrivate: post.isPrivate || false
        });
    };

    // Chiude il modal
    const handleCloseEditModal = () => {
        setEditingPost(null);
    };

    // Gestisce il salvataggio delle modifiche del post
    const handleUpdatePost = async () => {
        if (!editingPost) return;
        try {
            const response = await api.put(`/posts/${editingPost._id}`, editPostData);
            const updatedPost = response.data.post;
            setUserPosts(currentPosts =>
                currentPosts.map(p => (p._id === updatedPost._id ? updatedPost : p))
            );
            handleCloseEditModal();
        } catch (err) {
            console.error("Errore durante l'aggiornamento del post:", err);
            alert("Non è stato possibile aggiornare il post.");
        }
    };

    const handleFormChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleProfileUpdate = async () => {
        try {
            const response = await api.put('/users/me', formData);
            setCurrentUser(response.data.user);
            await fetchProfileData();
            setIsEditing(false);
        } catch (err) {
            console.error("Errore nell'aggiornare il profilo:", err);
            alert((err.response && err.response.data && err.response.data.message) || "Errore durante l'aggiornamento.");
        }
    };
    
    const openGenreModal = async () => {
        if (allGenres.length === 0) {
            try {
                const res = await api.get('/genres');
                setAllGenres(res.data);
            } catch (error) {
                console.error("Errore nel caricare i generi", error);
            }
        }
        setShowGenreModal(true);
    };

    const handleGenreChange = (genreName) => {
        const currentGenres = formData.preferredGenres || [];
        const isSelected = currentGenres.includes(genreName);
        const newGenres = isSelected
            ? currentGenres.filter(g => g !== genreName)
            : [...currentGenres, genreName];
        setFormData({ ...formData, preferredGenres: newGenres });
    };

    if (loading) return <div className="text-center mt-5"><Spinner animation="border" /></div>;
    if (error) return <Container className="mt-5"><Alert variant="danger">{error}</Alert></Container>;
    if (!profileData) return null;

    // Destrutturazione corretta dei dati dalla risposta del backend
    const { userProfile } = profileData;
    const genresToShow = isEditing ? formData.preferredGenres : userProfile.preferredGenres;


    // Ordina la watchlist per data di aggiunta (dal più recente al più vecchio)
    // Usiamo [...userProfile.watchlist] per creare una copia dell'array prima di ordinarlo.
    // È una buona pratica per non modificare direttamente lo stato.
    const sortedWatchlist = userProfile.watchlist 
    ? [...userProfile.watchlist].sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
    : [];

    return (
        <Container className="mt-4" px={4} style={{ maxWidth: '1110px', width: '100%', paddingTop: null, position:'relative' }}>            
        <Row className="align-items-center mb-4">
                <Col xs="auto">
                    <Image src={isEditing ? (formData.profilePicture || 'https://via.placeholder.com/150') : (userProfile.profilePicture || 'https://via.placeholder.com/150')}
                    roundedCircle
                    style={{ objectFit: 'cover' }}
                    width="150px"
                    height="150px"
                    />
                </Col>
                <Col>
                    {isEditing ? (
                        <React.Fragment>
                            <TextField label="Username" name="username" value={formData.username} onChange={handleFormChange} variant="standard" fullWidth sx={{ mb: 2 }} />
                            <TextField label="URL Immagine Profilo" name="profilePicture" value={formData.profilePicture} onChange={handleFormChange} variant="standard" fullWidth />
                        </React.Fragment>
                    ) : (
                        <div className="d-flex align-items-center">
                            <h1 className="me-2">{userProfile.username}</h1>
                            {isOwner && <IconButton onClick={() => setIsEditing(true)}><EditIcon /></IconButton>}
                        </div>
                    )}
                </Col>
            </Row>

            <Row>
                <Col>
                    <h5>Bio</h5>
                    {isEditing ? (
                        <TextField label="Bio" name="bio" value={formData.bio} onChange={handleFormChange} multiline rows={3} variant="outlined" fullWidth />
                    ) : (
                        <p>{userProfile.bio || 'Nessuna biografia impostata.'}</p>
                    )}

                    <h5 className="mt-3">Generi Preferiti</h5>
                    <div>
                        {genresToShow && genresToShow.map(genre => (
                            <Badge pill bg="genre" className="me-1 fs-6" key={genre}>{genre}</Badge>
                        ))}
                    </div>
                    {isEditing && (
                        <Button variant="outline-primary" size="sm" className="mt-2" onClick={openGenreModal}>
                            Modifica Generi
                        </Button>
                    )}

                    {isEditing && (
                        <div className="mt-3">
                            <Button variant="success" onClick={handleProfileUpdate} className="me-2"><SaveIcon fontSize="small"/> Salva</Button>
                            <Button variant="secondary" onClick={() => setIsEditing(false)}><CancelIcon fontSize="small"/> Annulla</Button>
                        </div>
                    )}
                </Col>
            </Row>
            
            <hr className="my-4" />

            {/* Sezione Watchlist, visibile solo al proprietario del profilo */}
            {isOwner && (
                 <React.Fragment>
                    <h3>La mia Watchlist</h3>
                    <Row className="flex-nowrap overflow-auto g-3 mb-4">
                        {/* 
                            **CORREZIONE CHIAVE**:
                            La watchlist viene letta da `userProfile.watchlist`, che è la sua posizione corretta
                            nella risposta dell'API dopo aver corretto il backend.
                        */}
                    {sortedWatchlist.length > 0 ? sortedWatchlist.map(movie => (
                        <Col xs="auto" key={movie.tmdbId}>
                            <div style={{ position: 'relative' }}> 
                            <Link to={`/movie/${movie.tmdbId}`}>
                                <Image src={movie.posterPath || 'https://via.placeholder.com/150x225'} style={{height: '225px', width: '150px'}} rounded />
                            </Link>
                            {/* Aggiunta del pulsante di eliminazione */}
                                <IconButton
                                    size="small"
                                    onClick={(e) => {
                                        e.preventDefault(); // Impedisce al Link di attivarsi
                                        handleRemoveFromWatchlist(movie.tmdbId);
                                    }}
                                    aria-label={`Rimuovi ${movie.title} dalla watchlist`}
                                    style={{
                                        position: 'absolute',
                                        top: '5px',
                                        right: '5px',
                                        backgroundColor: 'rgba(255, 255, 255, 0.7)',
                                    }}
                                >
                                    <DeleteIcon fontSize="small" color="error" />
                                </IconButton>
                                </div>
                        </Col>
                    )) : <p>La tua watchlist è vuota.</p>}
                </Row>
                <hr className="my-4" />
            </React.Fragment>
        )}

            <h3>Post di {userProfile.username}</h3>
            {userPosts && userPosts.length > 0 ? (
                userPosts.map(post => {
                    const isLiked = currentUser && post.likes.includes(currentUser.id);

                    return (
                        <Card key={post._id} className="mb-3">
                            <Card.Body>
                                <Row>
                                    <Col xs={3} md={2}>
                                        <Link to={`/movie/${post.tmdbId}`}>
                                            <Card.Img src={post.postImage || 'https://via.placeholder.com/150x225'} />
                                        </Link>
                                    </Col>
                                    <Col xs={9} md={10}>
                                        <h5>{post.movieTitle}</h5>
                                        {post.rating > 0 && (
                                            <Rating name="read-only" value={post.rating} readOnly size="small" />
                                        )}
                                        <p className="mt-2">{post.review}</p>
                                        {post.isPrivate && <Badge bg="secondary">Post Privato</Badge>}
                                    </Col>
                                </Row>
                            </Card.Body>
                            {/* 
                                --- CORREZIONE CHIAVE: Unico Card.Footer ---
                                Questo footer ora contiene sia la sezione like che i pulsanti di modifica/elimina,
                                ma mostra i pulsanti di modifica/elimina solo se `isOwner` è true.
                            */}
                            <Card.Footer className="bg-white d-flex justify-content-between align-items-center">
                                {/* Sezione Like (a sinistra) */}
                                <div className="d-flex align-items-center">
                                    <IconButton onClick={() => handleLikePost(post._id)} color='error' disabled={!currentUser}>
                                        {isLiked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                                    </IconButton>
                                    <span>{post.likes.length} Mi piace</span>
                                </div>

                                {/* Sezione Modifica/Elimina (a destra, visibile solo al proprietario) */}
                                {isOwner && (
                                    <div>
                                        <IconButton size="small" onClick={() => handleOpenEditModal(post)}>
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton size="small" onClick={() => handleDeletePost(post._id)}>
                                            <DeleteIcon fontSize="small" color="error" />
                                        </IconButton>
                                    </div>
                                )}
                            </Card.Footer>
                        </Card>
                    );
                })
            ) : (
                <p>Questo utente non ha ancora pubblicato nessun post.</p>
            )}

<Modal show={!!editingPost} onHide={handleCloseEditModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Modifica il tuo post</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <BootstrapForm>
                        <BootstrapForm.Group className="mb-3">
                            <BootstrapForm.Label>La tua recensione</BootstrapForm.Label>
                            <BootstrapForm.Control
                                as="textarea"
                                rows={4}
                                value={editPostData.review}
                                onChange={(e) => setEditPostData({ ...editPostData, review: e.target.value })}
                            />
                        </BootstrapForm.Group>
                        <BootstrapForm.Group>
                            <BootstrapForm.Label>Il tuo voto</BootstrapForm.Label>
                            <Rating
                                name="edit-rating"
                                value={editPostData.rating}
                                onChange={(event, newValue) => {
                                    setEditPostData({ ...editPostData, rating: newValue || 0 });
                                }}
                                size="large"
                            />
                            <BootstrapForm.Check
                                type="checkbox"
                                id="edit-private"
                                label="Post privato"
                                checked={editPostData.isPrivate}
                                onChange={(e) => setEditPostData({ ...editPostData, isPrivate: e.target.checked })}
                            />
                        </BootstrapForm.Group>
                    </BootstrapForm>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseEditModal}>
                        Annulla
                    </Button>
                    <Button variant="primary" onClick={handleUpdatePost}>
                        Salva Modifiche
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal per la modifica dei generi */}
            <Modal show={showGenreModal} onHide={() => setShowGenreModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Seleziona i tuoi generi preferiti</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{maxHeight: '400px', overflowY: 'auto'}}>
                    {allGenres.map(genre => (
                        <FormCheck 
                            key={genre._id}
                            type="checkbox"
                            id={`genre-${genre._id}`}
                            label={genre.name}
                            checked={formData.preferredGenres && formData.preferredGenres.includes(genre.name)}
                            onChange={() => handleGenreChange(genre.name)}
                        />
                    ))}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={() => setShowGenreModal(false)}>
                        Conferma
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}

export default ProfilePage;