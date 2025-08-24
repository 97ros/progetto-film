// src/context/AuthContext.js
/*Scopo: Questo è uno dei file più importanti.
Crea un "contesto" globale per l'autenticazione.
Invece di passare le informazioni dell'utente (chi è loggato, come fare il logout, etc.)
come "prop" attraverso decine di componenti,
questo file le rende disponibili a qualsiasi componente dell'app che ne abbia bisogno.
Logica:
- Stato: Mantiene lo stato dell'utente (currentUser) e uno stato di loading per la sessione iniziale.
- Effetto Iniziale: Al caricamento dell'app, controlla se l'utente ha già una sessione valida
(verificando i dati in localStorage e facendo una chiamata di refresh al backend).
- Funzioni: Fornisce le funzioni login, register, e logout che interagiscono con l'API e aggiornano lo stato globale.
- Hook useAuth: Un piccolo hook personalizzato per rendere l'accesso a questo contesto semplice e pulito.*/

// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

// 1. Creiamo il Contesto
const AuthContext = createContext(null);

// 2. Creiamo il "Provider", il componente che gestirà la logica
export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true); // Inizia come true per gestire il controllo iniziale
    const navigate = useNavigate();

    // Funzione per gestire il login
    const login = async (credentials) => {
        try {
            const response = await api.post('/auth/login', credentials);
            const { accessToken, user } = response.data;
            
            // Salva il token e i dati utente per le sessioni future
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('user', JSON.stringify(user));

            // Aggiorna lo stato dell'app
            setCurrentUser(user);
            navigate('/'); // Reindirizza alla homepage dopo il login
        } catch (error) {
            console.error("Errore di login:", error);
            throw error; // Rilancia l'errore per gestirlo nel form
        }
    };

    // Funzione per gestire la registrazione (non fa il login automatico)
    const register = async (userData) => {
        try {
            await api.post('/auth/register', userData);
            navigate('/login'); // Reindirizza al login dopo la registrazione
        } catch (error) {
            console.error("Errore di registrazione:", error);
            throw error;
        }
    };

    // Funzione per il logout
    const logout = useCallback(async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error("Errore durante il logout dal server:", error);
        } finally {
            // Pulisce tutto a prescindere dal risultato del server
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            setCurrentUser(null);
            navigate('/login'); // Reindirizza al login dopo il logout
        }
    }, [navigate]);

    // Effetto per controllare la sessione all'avvio dell'app
    useEffect(() => {
        const checkLoggedIn = async () => {
            const token = localStorage.getItem('accessToken');
            const user = localStorage.getItem('user');

            if (token && user) {
                // Se abbiamo i dati, li usiamo per ripristinare lo stato
                setCurrentUser(JSON.parse(user));
            }
            // Indipendentemente da localStorage, il caricamento iniziale è finito
            setLoading(false);
        };
        checkLoggedIn();
    }, []);

    // Valore da passare a tutti i componenti figli
    const value = {
        currentUser,
        setCurrentUser, // Utile per la pagina di modifica profilo
        loading,
        login,
        register,
        logout,
    };

    // Il provider non mostra nulla finché non ha controllato la sessione
    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

// 3. Creiamo un Hook personalizzato per un accesso più semplice
export const useAuth = () => {
    return useContext(AuthContext);
};