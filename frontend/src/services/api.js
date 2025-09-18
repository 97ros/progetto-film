// Importiamo la libreria Axios
import axios from 'axios';

// Creiamo la nostra nuova istanza Axios
const api = axios.create({
    baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api',
    // Fondamentale per inviare/ricevere i cookie
    withCredentials: true, 
});

// Interceptor di richiesta per aggiungere il token di accesso a ogni richiesta
api.interceptors.request.use(
    (config) => {
        // Recuperiamo il token dai localStorage
        const token = localStorage.getItem('accessToken');
        // Se esiste, lo aggiungiamo agli header della richiesta
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor di risposta per gestire il refresh del token
api.interceptors.response.use(
    // Lasciamo passare le risposte di successo senza fare nulla
    (response) => response,
    async (error) => {
        // salviamo la richiesta originale che ha fallito
        const originalRequest = error.config;

        // Se l'errore è 403 (Forbidden) e non abbiamo già ritentato:
        if (error.response.status === 403 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                // Tentiamo di ottenere un nuovo access token
                const { data } = await api.get('/auth/refresh');
                localStorage.setItem('accessToken', data.accessToken);
                // Aggiorniamo l'header della richiesta originale e rieseguiamola
                api.defaults.headers.common['Authorization'] = 'Bearer ' + data.accessToken;
                return api(originalRequest);
            } catch (refreshError) {
                // Se anche il refresh fallisce, rigettiamo l'errore, che causerà il fallimento della chiamata originale
                localStorage.removeItem('accessToken');
                localStorage.removeItem('user');
                // Forziamo il reindirizzamento
                window.location = '/login';
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

// Esportiamo l'istanza di Axios per l'uso in altre parti dell'applicazione
export default api;