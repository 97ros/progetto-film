# 🎬 La Pellicola Digitale

Applicazione web full-stack dedicata al mondo del cinema.  

## 🎞️ Funzionalità Principali
- Registrazione e login con JWT
- Ricerca e visualizzazione dettagli film
- Recensioni pubbliche e private con sistema di rating
- Lista personale dei film “da vedere”
- Selezione dei generi preferiti e feed personalizzato
- Like alle recensioni di altri utenti

## 🌐 Demo Online
👉 [https://la-pellicola-digitale-prova.netlify.app/](https://la-pellicola-digitale-prova.netlify.app/)

> ⚠️ Per utilizzare correttamente l’app, assicurati di avere **JavaScript abilitato** nel browser.

---

## 🛠️ Tecnologie Utilizzate

### Frontend
- **React** (creato con [Create React App](https://create-react-app.dev/))
- **React Router DOM** – Gestione delle rotte
- **React Icons** – Icone grafiche
- **Material UI** (`@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`)
- **React Bootstrap / Bootstrap** – Stile e layout responsive
- **Axios** – Gestione richieste HTTP verso il backend

### Backend
- **Node.js + Express.js** – Server e API REST
- **MongoDB + Mongoose** – Database e modelli dati
- **cors** – Gestione delle policy di accesso
- **cookie-parser** – Gestione cookie
- **bcryptjs** – Crittografia password
- **jsonwebtoken** – Autenticazione tramite token JWT
- **dotenv** – Gestione variabili d’ambiente
- **nodemon** – Auto-reload durante lo sviluppo

---

## ⚙️ Installazione in Locale

### 1️⃣ Clona la repository
```bash
git clone https://github.com/97ros/progetto-film.git
cd progetto-film
```

### 2️⃣ Installa le dipendenze
Per il frontend e il backend (esegui **in entrambe le cartelle**):
```bash
npm install
```

### 3️⃣ Avvia l’applicazione
Nella root del progetto:
```bash
npm start
```

Oppure avvia separatamente:
```bash
cd backend
npm start
```
```bash
cd ../frontend
npm start
```

---

## 🔐 Configurazione

L’applicazione utilizza due file `.env`, uno per il **backend** e uno per il **frontend**.

### 📁 backend/.env
Crea un file `.env` nella cartella `backend` con il seguente contenuto:
```env
TMDB_API_KEY=your_tmdb_api_key
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
MONGO_URI=your_mongodb_connection_string
PORT=5001
```

Crea un file `.env` nella cartella `frontend` con il seguente contenuto:
```env
PORT=3000
REACT_APP_API_BASE_URL=http://localhost:5001/api
```

⚠️ Importante: Non includere i file .env nel repository pubblico, **inglobali nel file `.gitignore`**.

## 👥 Autori
Progetto universitario – **“La Pellicola Digitale”**, sviluppato con *React*, *Node.js* ed *Express* da:    
**Elia Aurora**      
**Lasorsa Rossana**      

Docente: **Ferrara Antonio**   
Università: **Politecnico di Bari**