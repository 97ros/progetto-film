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

            // Salviamo i dati della sessione per permetterle di persistere
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('user', JSON.stringify(user));

            // Impostiamo l'header Authorization per tutte le future richieste axios
            api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

            // Memorizziamo chi è l'utente attuale
            setCurrentUser(user);

            // Spostiamoci nella pagina home
            navigate('/');

        } catch (error) {
            console.error("Errore di login:", error);
            throw error;
        }
    };

    // Funzione per effettuare la registrazione
    const register = async (userData) => {
        try {
            // Restituiamo la risposta per dare un feedback di successo nel form di registrazione
            const response = await api.post('/auth/register', userData);
            return response.data;
        } catch (error) {
            console.error("Errore di registrazione:", error);
            throw error;
        }
    };

    // Funzione per effettuare il logout
    const logout = useCallback(async () => {
        try {
            // Informiamo il server che vogliamo fare il logout
            await api.post('/auth/logout');
        } catch (error) {
            console.error("Errore durante il logout dal server:", error);
        } finally {
            // Puliamo i dati della sessione lato client
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            
            // Rimuoviamo l'header di autorizzazione dall'istanza di axios
            delete api.defaults.headers.common['Authorization'];

            // Aggiorniamo lo stato dell'utente
            setCurrentUser(null);
            // Reindirizziamo alla pagina di login
            navigate('/login');
        }
    }, [navigate]);

    useEffect(() => {
        // Funzione che controlla se già esiste una sessione
        const checkUserSession = () => {
            // Recuperiamo i dati salvati nella sessione
            const token = localStorage.getItem('accessToken');
            const userString = localStorage.getItem('user');

            // Controlliamo se l'utente era già loggato
            if (token && userString) {
                const user = JSON.parse(userString);
                setCurrentUser(user);

                // Impostiamo l'header anche al caricamento dell'app per le sessioni esistenti
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            }
            setLoading(false);
        };
        checkUserSession();
    }, []);

    // Salviamo dati e funzioni da rendere disponibili ai componenti figli
    const value = {
        currentUser,
        setCurrentUser,
        loading,
        login,
        register,
        logout,
    };

    return (
        // Ritorniamo il provider
        <AuthContext.Provider value={value}>
            {/* Renderizziamo i componenti figli solo quando loading=false */}
            {!loading && children}
        </AuthContext.Provider>
    );
};

// Esportiamo il contesto di autenticazione come "useAuth" (custom hook)
export const useAuth = () => {
    return useContext(AuthContext);
};