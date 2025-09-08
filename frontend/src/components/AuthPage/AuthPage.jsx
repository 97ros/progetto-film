import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext'; // Importa useAuth dal contesto di autenticazione
import './AuthPage.css';

function AuthPage() {
    // Stato per controllare se mostrare il form di login (true) o di registrazione (false)
    const [isLoginView, setIsLoginView] = useState(true);
    
    // Stati per i campi del form
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    
    // Stati per il feedback utente
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const auth = useAuth(); // Otteniamo le funzioni di login/register dal contesto

    // Funzione per passare da login a registrazione e viceversa
    const toggleView = () => {
        setIsLoginView(!isLoginView);
        // Pulisce i campi e gli errori quando si cambia vista
        setUsername('');
        setEmail('');
        setPassword('');
        setError('');
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            if (isLoginView) {
                await auth.login({ email, password });
                // Il reindirizzamento viene gestito da AuthContext
            } else {
                await auth.register({ username, email, password });
                // Dopo la registrazione, mostriamo un messaggio e passiamo al login
                alert('Registrazione completata! Ora puoi effettuare il login.');
                toggleView();
            }
        } catch (err) {
            // Mostra il messaggio di errore proveniente dal backend
            setError(err.response?.data?.message || 'Si è verificato un errore.');
        } finally {
            setIsLoading(false);
        }
    };

    const togglePasswordVisibility = () => {
        setIsPasswordVisible(currentValue => !currentValue);
    };

    return (
        <main className='main-content'>
        <div className="auth-page-container"> 
            <form onSubmit={handleSubmit} className="auth-form-card"> 
                <h2>{isLoginView ? 'Accedi al tuo account' : 'Crea un nuovo account'}</h2>

                {/* Mostra il campo Username solo nella vista di registrazione */}
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

                {/* Mostra il messaggio di errore se presente */}
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

export default AuthPage;