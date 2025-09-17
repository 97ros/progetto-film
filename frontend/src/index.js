// src/index.js
/*Scopo: È il punto di ingresso dell'applicazione. È il primo file JavaScript che viene eseguito.
Il suo compito è semplice ma cruciale:
- Importare le librerie fondamentali (React).
- Importare il componente principale (App).
- "Iniettare" l'intera applicazione React all'interno dell'elemento <div id="root"> nel file public/index.html.
- Avvolgere l'intera app nei "Provider" necessari, come BrowserRouter (per abilitare il routing)
e il nostro AuthProvider (per fornire il contesto di autenticazione).*/

// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';


import 'bootstrap/dist/css/bootstrap.min.css'; // Importa gli stili di Bootstrap
import './index.css'; // I tuoi stili globali

import App from './App';
import { AuthProvider } from './context/AuthContext';
import { BrowserRouter } from 'react-router-dom';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* BrowserRouter abilita la navigazione tra pagine */}
    <BrowserRouter>
      {/* AuthProvider rende disponibile lo stato di login a tutta l'app */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);