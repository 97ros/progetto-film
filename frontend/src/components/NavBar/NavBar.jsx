import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js'; // 1. Importiamo il nostro hook
import './NavBar.css';

// Import delle icone
import { FaHome, FaSearch, FaUser, FaSignOutAlt } from 'react-icons/fa';

// Import del logo
import logo from '../../assets/logo.png'; 

// 2. Il componente non ha più bisogno di props
function Navbar() {
    // 3. Usiamo il contesto per ottenere l'utente e la funzione di logout
    const { currentUser, logout } = useAuth();

    // 4. Se l'utente non è ancora stato caricato, non mostriamo nulla per evitare errori
    if (!currentUser) {
        return null; 
    }

    return (
        <nav className="navbar-container">
            <div className="navbar-logo">
                <Link to="/"> {/* Il logo ora è un link alla home */}
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
                    {/* 5. Il link al profilo ora è dinamico e usa lo username dell'utente loggato */}
                    <NavLink to={`/user/${currentUser.username}`} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                        <FaUser className="nav-icon" />
                        <span>Profilo</span>
                    </NavLink>
                </li>
            </ul>

            {/* 6. Aggiunta una sezione "footer" per raggruppare profilo utente e logout */}
            <div className="navbar-footer">
                    <span className="user-name">@{currentUser.username}</span>
                <div className="logout-section">
                    {/* 7. Il pulsante ora chiama direttamente la funzione `logout` dal contesto */}
                    <button onClick={logout} className="logout-button">
                        <FaSignOutAlt className="nav-icon" />
                        <span>Logout</span>
                    </button>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;