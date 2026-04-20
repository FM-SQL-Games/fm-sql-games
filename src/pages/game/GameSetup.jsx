import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './GameSetup.css';

export default function GameSetup({ gameData }) {
    const navigate = useNavigate();
    const [playerName, setPlayerName] = useState(localStorage.getItem('sqlPlayerName') || '');

    const config = gameData.config;

    /**
     * Spustí hru přechodem na obrazovku s hrou a předáním potřebných informací o hráči a relaci, uloží jméno hráče do LocalStorage pro případné budoucí použití.
     */
    const handleStart = () => {
        if (playerName.trim().length < 3) {
            return;
        }
        const sessionId = window.crypto?.randomUUID
            ? window.crypto.randomUUID()
            : `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem('sqlPlayerName', playerName.trim());

        navigate(`/${config.id}/game`, { state: { playerName: playerName.trim(), sessionId } });
    };

    /**
     * Vrátí hráče zpět na hlavní obrazovku, kde může vybrat jinou hru nebo znovu spustit tuto hru.
     */
    const handleBack = () => {
        navigate('/');
    };

    return (
        <div className={`setup-container ${config.theme}`}>
            <div className="setup-modal">
                <h1>{config.setupTitle}</h1>
                <p>{config.setupDescription}</p>

                <div className="player-input-section">
                    <label htmlFor="nickname">Zadej svou přezdívku:</label>
                    <input
                        id="nickname"
                        type="text"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        placeholder="Tvoje přezdívka..."
                        maxLength={20}
                    />
                </div>
                <button
                    className="setup-btn"
                    onClick={handleStart}
                    disabled={playerName.trim().length < 3}
                >
                    {config.btnText}
                </button>
                <button className="setup-btn secondary" onClick={handleBack}>
                    ZPĚT
                </button>
            </div>
        </div>
    );
}
