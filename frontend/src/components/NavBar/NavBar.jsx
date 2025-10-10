// Importiamo la libreria di React
import React from 'react';

// Importiamo i componenti NavLink e Link
import { NavLink, Link } from 'react-router-dom';

// Importiamo il nostro hook di autenticazione
import { useAuth } from '../../context/AuthContext.js';

// Importiamo il foglio di stile di questa pagina
import './NavBar.css';

// Importiamo le icone
import { FaHome, FaSearch, FaUser, FaSignOutAlt } from 'react-icons/fa';

// Importiamo il logo della web application
import logo from '../../assets/logo_app.png'; 

// Creiamo il componente NavBar
function Navbar() {
    // Usiamo il contesto per ottenere l'utente e la funzione di logout 
    const { currentUser, logout } = useAuth();

    return (
        <nav className="navbar-container">
            <div className="navbar-logo">
                <Link to="/"> {/* Il logo è un link alla home */}
                    <img src={logo} alt="Logo" />
                </Link>
            </div>

            <ul className="nav-links">
                <li>
                    <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                        <FaHome className="nav-icon" />
                        <span>Home</span>
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/search" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                        <FaSearch className="nav-icon" />
                        <span>Cerca</span>
                    </NavLink>
                </li>
                <li>
                    {/* Il link al profilo è dinamico e usa lo username dell'utente loggato */}
                    <NavLink to={`/user/${currentUser.username}`} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                        <FaUser className="nav-icon" />
                        <span>Profilo</span>
                    </NavLink>
                </li>
            </ul>

            {/* Sezione "footer" per raggruppare profilo utente e logout */}
            <div className="navbar-footer">
                    <span className="user-name">@{currentUser.username}</span>
                <div className="logout-section">
                    {/* Il pulsante chiama direttamente la funzione 'logout' dal contesto */}
                    <button onClick={logout} className="logout-button">
                        <FaSignOutAlt className="nav-icon" />
                        <span>Logout</span>
                    </button>
                </div>
            </div>
        </nav>
    );
}

// Esportiamo il componente NavBar
export default Navbar;