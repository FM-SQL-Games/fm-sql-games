import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
    const location = useLocation();
    return (
        <nav className="main-navbar">
            <div className="nav-brand">
                FM TUL <span>SQL GAMES</span>
            </div>
            <div className="nav-links">
                <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
                    Knihovna her
                </Link>
                <Link
                    to="/leaderboard"
                    className={location.pathname === '/leaderboard' ? 'active' : ''}
                >
                    Žebříček
                </Link>
            </div>
        </nav>
    );
}
