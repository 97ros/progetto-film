// Importiamo React e gli hook necessari
import React, { useState } from 'react';

// Importiamo il contesto di autenticazione per gestire login e registrazione
import { useAuth } from '../../context/AuthContext';

// Importiamo il CSS specifico per questa pagina
import './AuthPage.css';

// Creiamo il componente AuthPage
function AuthPage() {

    // Stato per controllare se mostrare il form di login (true) o di registrazione (false)
    const [isLoginView, setIsLoginView] = useState(true);
    
    // Stati per i campi del form
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    
    // Stati per gestire caricamento ed errori
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Invochiamo l'hook useAuth
    const auth = useAuth();

    // Funzione per passare da login a registrazione e viceversa 
    const toggleView = () => {
        setIsLoginView(!isLoginView);
        // Puliamo i campi e gli errori quando cambiamo vista
        setUsername('');
        setEmail('');
        setPassword('');
        setError('');
    };

    // Funzione per gestire l'invio del form
    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // Eseguiamo il login o la registrazione a seconda della vista attuale
            if (isLoginView) {
                await auth.login({ email, password });
            } else {
                await auth.register({ username, email, password });
                alert('Registrazione completata! Ora puoi effettuare il login.');
                toggleView();
            }
        } catch (err) {
            // Mostriamo il messaggio di errore proveniente dal backend o un messaggio generico
            setError(err.response?.data?.message || 'Si è verificato un errore.');
        } finally {
            // Terminiamo il caricamento
            setIsLoading(false);
        }
    };

    // Funzione per mostrare/nascondere la password
    const togglePasswordVisibility = () => {
        setIsPasswordVisible(currentValue => !currentValue);
    };

    // Renderizziamo il form di autenticazione
    return (
        <main className='main-content'>
        <div className="auth-page-container">
            <form onSubmit={handleSubmit} className="auth-form-card"> 
                <h2>{isLoginView ? 'Accedi al tuo account' : 'Crea un nuovo account'}</h2>

                {/* Mostriamo il campo Username solo nella vista di registrazione */}
                {!isLoginView && (
                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                )}
                
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                        type={isPasswordVisible ? "text" : "password"}
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={!isLoginView ? 6 : undefined}
                    />
                    <button type="button" onClick={togglePasswordVisibility} className="toggle-password-btn">
                            {isPasswordVisible ? 'Nascondi' : 'Mostra'}
                    </button>
                </div>

                {/* Mostriamo il messaggio di errore se presente */}
                {error && <p className="error-message">{error}</p>}

                <button type="submit" className="submit-btn" disabled={isLoading}>
                    {isLoading ? 'Caricamento...' : (isLoginView ? 'Login' : 'Registrati')}
                </button>

                {/* Testo per cambiare form */}
                <p className="auth-switcher">
                    {isLoginView ? "Non hai un account? " : "Hai già un account? "}
                    <span onClick={toggleView} className="switcher-link">
                        {isLoginView ? "Registrati ora" : "Effettua il login"}
                    </span>
                </p>
            </form>
        </div>
        </main>
    );
}

// Esportiamo il componente AuthPage
export default AuthPage;