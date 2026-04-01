import React from 'react';
import { useNavigate } from 'react-router-dom';
import './GameSetup.css';

export default function GameSetup({ gameData }) {
    const navigate = useNavigate();

    const defaultConfig = {
        id: 'unknown',
        theme: 'default-theme',
        setupTitle: 'Nová SQL Výzva',
        setupDescription: 'Popis této hry zatím chybí.',
        btnText: 'Hrát',
    };

    const config = { ...defaultConfig, ...gameData.config };

    const handleStart = () => {
        navigate(`/${config.id}/game`);
    };

    const handleBack = () => {
        navigate('/');
    };

    return (
        <div className={`setup-container ${config.theme}`}>
            <div className="setup-modal">
                <h1>{config.setupTitle}</h1>
                <p>{config.setupDescription}</p>
                <button className="setup-btn" onClick={handleStart}>
                    {config.btnText}
                </button>
                <button className="setup-btn secondary" onClick={handleBack}>
                    ZPĚT
                </button>
            </div>
        </div>
    );
}
