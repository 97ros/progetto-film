// Importiamo le librerie necessarie
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

// Import degli stili
import './App.css';

// Un componente helper per le rotte protette
function ProtectedRoute({ children }) {
    // Otteniamo l'utente corrente e la posizione attuale
    const { currentUser } = useAuth();
    const location = useLocation();

    // Se non c'è un utente loggato, reindirizziamo al login
    if (!currentUser) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
    return children;
}

// Componente principale dell'applicazione
function App() {
    // Otteniamo l'utente corrente dal contesto di autenticazione
    const { currentUser } = useAuth();

    return (
        <div className="app-container">
            {/* La Navbar è visibile solo se l'utente è loggato */}
            {currentUser && <Navbar />}

            <main className={`main-content ${currentUser ? 'protected-routes' : 'no-navbar'}`}>
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

                    {/* Rotta per URL non trovati */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
        </div>
    );
}

// Esportiamo il componente App come default
export default App;