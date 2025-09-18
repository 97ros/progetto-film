// Importiamo le librerie necessarie
import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

// Importiamo il componente principale dell'app e il contesto di autenticazione
import App from './App';
import { AuthProvider } from './context/AuthContext';

// Importiamo BrowserRouter per abilitare il routing
import { BrowserRouter } from 'react-router-dom';

// Creiamo il root e renderizziamo l'applicazione
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);