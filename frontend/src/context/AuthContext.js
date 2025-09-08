// Importiamo le dipendenze necessarie
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

// Importiamo il nostro servizio API centralizzato
import api from '../services/api';

// Importiamo useNavigate per la navigazione programmatica
import { useNavigate } from 'react-router-dom';

// Creiamo il contesto di autenticazione
const AuthContext = createContext(null);

// Creiamo il provider del contesto
export const AuthProvider = ({ children }) => {

    // Stato per l'utente attualmente autenticato
    const [currentUser, setCurrentUser] = useState(null);

    // Stato per indicare se stiamo ancora caricando lo stato di autenticazione
    const [loading, setLoading] = useState(true);

    // Inizializziamo useNavigate per la navigazione programmatica
    const navigate = useNavigate();


    // Funzione per effettuare il login
    const login = async (credentials) => {
        try {
            // Effettuiamo la richiesta di login al backend
            const response = await api.post('/auth/login', credentials);
            const { accessToken, user } = response.data;

            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('user', JSON.stringify(user));

            // Imposta l'header Authorization per tutte le future richieste axios
            api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

            setCurrentUser(user);
            navigate('/');
        } catch (error) {
            console.error("Errore di login:", error);
            throw error;
        }
    };

    const register = async (userData) => {
        try {
            // Restituiamo la risposta per dare un feedback di successo nel form
            const response = await api.post('/auth/register', userData);
            return response.data;
        } catch (error) {
            console.error("Errore di registrazione:", error);
            throw error;
        }
    };

    const logout = useCallback(async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error("Errore durante il logout dal server:", error);
        } finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            
            // Rimuovi l'header di autorizzazione dall'istanza di axios
            delete api.defaults.headers.common['Authorization'];

            setCurrentUser(null);
            navigate('/login');
        }
    }, [navigate]);

    useEffect(() => {
        const checkUserSession = () => {
            const token = localStorage.getItem('accessToken');
            const userString = localStorage.getItem('user');

            if (token && userString) {
                const user = JSON.parse(userString);
                setCurrentUser(user);
                // Imposta l'header anche al caricamento dell'app per le sessioni esistenti
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            }
            setLoading(false);
        };
        checkUserSession();
    }, []);

    const value = {
        currentUser,
        setCurrentUser,
        loading,
        login,
        register,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};