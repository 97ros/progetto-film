// src/App.jsx
/*Scopo: È il componente "scheletro" dell'applicazione. Non contiene una pagina specifica, ma definisce la struttura generale (layout + routing).

Logica:
- Layout: Renderizza sempre la Navbar e un'area per il contenuto principale.
- Routing: Usa Routes e Route per definire quale componente di pagina (HomePage, SearchPage, etc.) deve essere mostrato in base all'URL corrente.
- Rotte Protette: Usa il currentUser dal nostro useAuth per proteggere le rotte. Se l'utente non è loggato, viene reindirizzato alla pagina di login.
- Rotte Pubbliche: Gestisce le rotte di login/registrazione, reindirizzando gli utenti già loggati alla homepage.*/
// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

import { useAuth } from './context/AuthContext';

// Import dei componenti Layout e Pagine
import Navbar from './components/NavBar/NavBar';
import HomePage from './pages/HomePage';
import SearchPage from './components/SearchPage/SearchPage';
import ProfilePage from './pages/ProfilePage';
import MoviePage from './pages/MoviePage';
import AuthPage from './components/AuthPage/AuthPage';

import './App.css';

// Un componente helper per le rotte protette
function ProtectedRoute({ children }) {
    const { currentUser } = useAuth();
    const location = useLocation();

    if (!currentUser) {
        // Reindirizza al login, ma ricorda da dove l'utente proveniva
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
    return children;
}

function App() {
    const { currentUser } = useAuth();

    return (
        <div className="app-container">
            {/* La Navbar è visibile solo se l'utente è loggato */}
            {currentUser && <Navbar />}

            <main className="main-content">
                <Routes>
                    {/* Rotte Pubbliche (Login/Registrazione) */}
                    <Route 
                        path="/login" 
                        element={!currentUser ? <AuthPage formType="login" /> : <Navigate to="/" />} 
                    />
                    <Route 
                        path="/register" 
                        element={!currentUser ? <AuthPage formType="register" /> : <Navigate to="/" />} 
                    />

                    {/* Rotte Protette */}
                    <Route 
                        path="/" 
                        element={<ProtectedRoute><HomePage /></ProtectedRoute>} 
                    />
                    <Route 
                        path="/search" 
                        element={<ProtectedRoute><SearchPage /></ProtectedRoute>} 
                    />
                    {/* Rotta dinamica per il profilo utente */}
                    <Route 
                        path="/user/:username" 
                        element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} 
                    />
                    {/* Rotta dinamica per la pagina del film */}
                    <Route 
                        path="/movie/:movieId" 
                        element={<ProtectedRoute><MoviePage /></ProtectedRoute>} 
                    />

                    {/* Rotta jolly per URL non trovati */}
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </main>
        </div>
    );
}

export default App;