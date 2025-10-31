// Importiamo le librerie necessarie
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

// Importiamo il nostro servizio API centralizzato
import api from '../services/api';

// Importiamo il contesto di autenticazione
import { useAuth } from '../context/AuthContext';

// Importiamo il file .scss per lo stile della pagina
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

// Creiamo il componente principale
function ProfilePage() {
    // Otteniamo lo username dai parametri dell'URL
    const { username } = useParams();
    const { currentUser, setCurrentUser } = useAuth();

    // Stato del profilo utente
    const [profileData, setProfileData] = useState(null);
    // Stato dedicato per i post
    const [userPosts, setUserPosts] = useState([]);

    // Stati per la gestione del caricamento e degli errori
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Booleano che attiva/disattiva la modalità di modifica del profilo
    const [isEditing, setIsEditing] = useState(false);
    // Oggetto che contiene i valori dei campi del form di modifica
    const [formData, setFormData] = useState({});

    // Hook per la navigazione
    const navigate = useNavigate();

    // Stati per la gestione del modal di selezione generi
    const [showGenreModal, setShowGenreModal] = useState(false);
    const [allGenres, setAllGenres] = useState([]);

    // Contiene il post da modificare
    const [editingPost, setEditingPost] = useState(null);
    // Dati del form di modifica post
    const [editPostData, setEditPostData] = useState({ review: '', rating: 0 }); 

    // Variabile per differenziare utente loggato e altri utenti 
    const isOwner = currentUser && currentUser.username === username;

    // Funzione che viene eseguita appena la pagina si carica e SOLO se username cambia
    const fetchProfileData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Eseguiamo la chiamata api per ottenere le informazioni sull'utente
            const response = await api.get(`/users/${username}`);
            // Impostiamo i dati del profilo e i post
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

    // Funzione eseguita al primo caricamento della pagina e ogni volta che lo username nei parametri dell'URL cambia
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
                // Filtriamo la watchlist per rimuovere il film con il tmdbId specificato
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

    // Funzione per gestire il "like"
    const handleLikePost = async (postId) => {
        try {
            // Chiamata all'API per mettere/togliere il like
            const response = await api.post(`/posts/${postId}/like`);
            // Otteniamo il post aggiornato dalla risposta
            const updatedPost = response.data.post;
            // Aggiorniamo lo stato dei post per riflettere il cambiamento
            setUserPosts(currentPosts => 
                currentPosts.map(p => p._id === postId ? updatedPost : p)
            );
        } catch(err) {
            console.error("Errore durante il like:", err);
            alert((err.response && err.response.data && err.response.data.message) || "Non è stato possibile aggiornare il like.");
        }
    };

    // Funzione per eliminare un post
    const handleDeletePost = async (postId) => {
        // Chiediamo conferma all'utente
        if (window.confirm("Sei sicuro di voler eliminare questo post?")) {
            try {
                // Chiamata all'API per eliminare il post
                await api.delete(`/posts/${postId}`);
                // Rimuoviamo il post dallo stato per aggiornare la UI istantaneamente
                setUserPosts(currentPosts => currentPosts.filter(p => p._id !== postId));
            } catch (err) {
                console.error("Errore durante l'eliminazione del post:", err);
                alert("Non è stato possibile eliminare il post.");
            }
        }
    };

    // Apriamo il modal e impostiamo il post da modificare
    const handleOpenEditModal = (post) => {
        setEditingPost(post);
        setEditPostData({
            review: post.review || '',
            rating: post.rating || 0,
            isPrivate: post.isPrivate || false
        });
    };

    // Chiudiamo il modal e resettiamo il post in modifica
    const handleCloseEditModal = () => {
        setEditingPost(null);
    };

    // Gestiamo il salvataggio delle modifiche del post
    const handleUpdatePost = async () => {
        // Se non c'è un post in modifica, usciamo
        if (!editingPost) return;
        try {
            // Chiamata all'API per aggiornare il post
            const response = await api.put(`/posts/${editingPost._id}`, editPostData);
            // Otteniamo il post aggiornato dalla risposta
            const updatedPost = response.data.post;
            // Aggiorniamo lo stato dei post con il post modificato
            setUserPosts(currentPosts =>
                currentPosts.map(p => (p._id === updatedPost._id ? updatedPost : p))
            );
            // Chiudiamo il modal
            handleCloseEditModal();

        } catch (err) {
            console.error("Errore durante l'aggiornamento del post:", err);
            alert("Non è stato possibile aggiornare il post.");
        }
    };

    // Funzione per gestire i cambiamenti nei campi del form di modifica profilo
    const handleFormChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    // Funzione per salvare le modifiche del profilo
    const handleProfileUpdate = async () => {
        try {
            // Chiamata all'API per aggiornare il profilo
            const response = await api.put('/users/me', formData);
            // Aggiorniamo il contesto dell'utente loggato se necessario
            setCurrentUser(response.data.user);
            // Ricarichiamo i dati del profilo per riflettere le modifiche
            setIsEditing(false);
            // Controlliamo se lo username è cambiato.
            // Se è cambiato, reindirizziamo alla nuova pagina del profilo.
            // Altrimenti, ricarichiamo i dati della pagina corrente.
            if (response.data.user.username !== username) {
                navigate(`/user/${response.data.user.username}`);
            } else {
                // Ricarica i dati solo se lo username non è cambiato
                await fetchProfileData();
            }

        } catch (err) {
            console.error("Errore nell'aggiornare il profilo:", err);
            alert((err.response && err.response.data && err.response.data.message) || "Errore durante l'aggiornamento.");
        }
    };
    
    // Funzione per aprire il modal di selezione generi
    const openGenreModal = async () => {
        if (allGenres.length === 0) {
            try {
                // Carichiamo i generi solo la prima volta che apriamo il modal
                const res = await api.get('/genres');
                setAllGenres(res.data);
            } catch (error) {
                console.error("Errore nel caricare i generi", error);
            }
        }
        setShowGenreModal(true);
    };

    // Funzione per gestire la selezione/deselezione dei generi
    const handleGenreChange = (genreName) => {
        // Controlliamo se il genere è già selezionato
        const currentGenres = formData.preferredGenres || [];
        const isSelected = currentGenres.includes(genreName);
        const newGenres = isSelected
            ? currentGenres.filter(g => g !== genreName)
            : [...currentGenres, genreName];
        setFormData({ ...formData, preferredGenres: newGenres });
    };

    // Gestiamo i vari stati di caricamento, errore e visualizzazione
    if (loading) return <div className="text-center mt-5"><Spinner animation="border" /></div>;
    if (error) return <Container className="mt-5"><Alert variant="danger">{error}</Alert></Container>;
    if (!profileData) return null;

    // Destrutturazione corretta dei dati dalla risposta del backend
    const { userProfile } = profileData;
    const genresToShow = isEditing ? formData.preferredGenres : userProfile.preferredGenres;

    // Ordiniamo la watchlist per data di aggiunta (dal più recente al più vecchio)
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
                    {sortedWatchlist.length > 0 ? sortedWatchlist.map(movie => (
                        <Col xs="auto" key={movie.tmdbId}>
                            <div style={{ position: 'relative' }}> 
                            <Link to={`/movie/${movie.tmdbId}`}>
                                <Image src={movie.posterPath || 'https://www.ninodangelo.com/wp-content/uploads/no-locandina.jpg'} style={{height: '225px', width: '150px'}} rounded />
                            </Link>
                                <IconButton
                                    size="small"
                                    onClick={(e) => {
                                        e.preventDefault();
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
                    const isLiked = currentUser && post.likes?.some(likeId => likeId === currentUser?.id);

                    return (
                        <Card key={post._id} className="mb-3">
                            <Card.Body>
                                <Row>
                                    <Col xs={3} md={2}>
                                        <Link to={`/movie/${post.tmdbId}`}>
                                            <Card.Img src={post.postImage || 'https://www.ninodangelo.com/wp-content/uploads/no-locandina.jpg'} />
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

<Modal show={Boolean(editingPost)} onHide={handleCloseEditModal} centered>
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

// Esportiamo il componente ProfilePage
export default ProfilePage;