// src/services/api.js
/*
Scopo: Centralizza la configurazione delle chiamate API.
Crea un'istanza "pre-configurata" di Axios.

Logica:
- baseURL: Imposta la parte base dell'URL per tutte le chiamate, così non devi ripeterla ogni volta.
- Interceptor di Richiesta**: Questa è la parte più potente.
Prima che *qualsiasi* chiamata API parta, questo "intercettore" controlla se c'è un `accessToken` salvato.
Se c'è, lo aggiunge automaticamente all'header `Authorization`.
Questo significa che non devi mai più preoccuparti di aggiungere manualmente il token a ogni chiamata protetta.
*/

import axios from 'axios';

const api = axios.create({
    baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api',
    withCredentials: true, // Fondamentale per inviare/ricevere i cookie (come il refresh token)
});

// Interceptor per aggiungere il token di accesso a ogni richiesta
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Opzionale ma consigliato: Interceptor di Risposta per gestire il refresh del token
api.interceptors.response.use(
    (response) => response, // Se la risposta è OK, non fare nulla
    async (error) => {
        const originalRequest = error.config;

        // Se l'errore è 403 (Forbidden) e non abbiamo già ritentato
        if (error.response.status === 403 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                // Tenta di ottenere un nuovo access token
                const { data } = await api.get('/auth/refresh');
                localStorage.setItem('accessToken', data.accessToken);
                // Aggiorna l'header della richiesta originale e rieseguila
                api.defaults.headers.common['Authorization'] = 'Bearer ' + data.accessToken;
                return api(originalRequest);
            } catch (refreshError) {
                // Se anche il refresh fallisce, esegui il logout
                // (Questa parte richiede la funzione di logout, quindi è più complessa da implementare qui.
                // Per ora, rigettiamo l'errore, che causerà il fallimento della chiamata originale)
                localStorage.removeItem('accessToken');
                localStorage.removeItem('user');
                window.location = '/login'; // Forza il reindirizzamento
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);


export default api;