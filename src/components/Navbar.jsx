import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '../i18n';
import './Navbar.css';

export default function Navbar() {
    const location = useLocation();
    const { t, i18n } = useTranslation();

    const handleLanguageChange = (e) => {
        i18n.changeLanguage(e.target.value);
    };
    return (
        <nav className="main-navbar">
            <div className="nav-brand">
                FM TUL <span>SQL GAMES</span>
            </div>
            <div className="nav-links">
                <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
                    {t('navbar.games')}
                </Link>
                <Link
                    to="/leaderboard"
                    className={location.pathname === '/leaderboard' ? 'active' : ''}
                >
                    {t('navbar.leaderboard')}
                </Link>
                <a
                    href="https://forms.gle/M4TnYB5ZzeJPF7zo7"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {t('navbar.feedback')}
                </a>
                <select 
                    className="lang-switcher" 
                    value={i18n.language} 
                    onChange={handleLanguageChange}
                >
                    {Object.entries(SUPPORTED_LANGUAGES).map(([code, { label, flag }]) => (
                        <option key={code} value={code}>
                            {flag} {code.toUpperCase()}
                        </option>
                    ))}
                </select>
            </div>
        </nav>
    );
}
