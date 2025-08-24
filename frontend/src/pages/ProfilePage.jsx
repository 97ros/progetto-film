// src/pages/ProfilePage.jsx
import React, { useState, useEffect, useCallback } from 'react'; // React deve essere importato per usare React.Fragment
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

// Import componenti UI
import { Container, Row, Col, Image, Spinner, Alert, Card, Badge, Button, Form, Modal, FormCheck } from 'react-bootstrap';
import { IconButton, TextField } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';


function ProfilePage() {
    const { username } = useParams();
    const { currentUser, setCurrentUser } = useAuth();

    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [showGenreModal, setShowGenreModal] = useState(false);
    const [allGenres, setAllGenres] = useState([]);
    
    const isOwner = currentUser && currentUser.username === username;

    const fetchProfileData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get(`/users/${username}`);
            setProfileData(response.data);
            setFormData({
                username: response.data.userProfile.username,
                profilePicture: response.data.userProfile.profilePicture || '',
                bio: response.data.userProfile.bio || '',
                preferredGenres: response.data.userProfile.preferredGenres || [],
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

    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

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

    const { userProfile, userPosts, watchedList } = profileData;
    const genresToShow = isEditing ? formData.preferredGenres : userProfile.preferredGenres;

    return (
        <Container className="mt-4">
            <Row className="align-items-center mb-4">
                <Col xs="auto">
                    <Image src={isEditing ? (formData.profilePicture || 'https://via.placeholder.com/150') : (userProfile.profilePicture || 'https://via.placeholder.com/150')} roundedCircle width="150" height="150" />
                </Col>
                <Col>
                    {isEditing ? (
                        // --- CORREZIONE 1: Sostituito <> con React.Fragment ---
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
                        {/* --- CORREZIONE 2: Sostituito ?.map con && --- */}
                        {genresToShow && genresToShow.map(genre => (
                            <Badge pill bg="info" className="me-1 fs-6" key={genre}>{genre}</Badge>
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

            {isOwner && (
                 <React.Fragment>
                    <h3>La mia Watchlist</h3>
                    <Row className="flex-nowrap overflow-auto g-3 mb-4">
                        {watchedList && watchedList.length > 0 ? watchedList.map(movie => (
                            <Col xs="auto" key={movie.tmdbId}>
                                <Link to={`/movie/${movie.tmdbId}`}>
                                    <Image src={movie.posterPath || 'https://via.placeholder.com/150x225'} style={{height: '225px', width: '150px'}} rounded />
                                </Link>
                            </Col>
                        )) : <p>La tua watchlist è vuota.</p>}
                    </Row>
                    <hr className="my-4" />
                </React.Fragment>
            )}

            <h3>Post di {userProfile.username}</h3>
            {userPosts && userPosts.length > 0 ? (
                userPosts.map(post => (
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
                                    {post.rating > 0 && <Badge bg="warning" text="dark">Voto: {post.rating}/5</Badge>}
                                    <p className="mt-2">{post.review}</p>
                                    {post.isPrivate && <Badge bg="secondary">Post Privato</Badge>}
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                ))
            ) : (
                <p>Questo utente non ha ancora pubblicato nessun post.</p>
            )}

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
                            // --- CORREZIONE 3: Sostituito ?.includes con && ---
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