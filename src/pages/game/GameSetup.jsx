import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import leoProfanity from 'leo-profanity';
import { czechProfanities } from '../../data/czechProfanities';
import './GameSetup.css';

leoProfanity.loadDictionary('en');
leoProfanity.add(czechProfanities);

const normalizeForProfanity = (text) => {
    return text.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
        .replace(/@/g, 'a')  
        .replace(/0/g, 'o') 
        .replace(/1/g, 'i') 
        .replace(/3/g, 'e') 
        .replace(/!/g, 'i')
        .replace(/[^a-z]/g, '');
};

export default function GameSetup({ gameData }) {
    const navigate = useNavigate();
    const [playerName, setPlayerName] = useState(localStorage.getItem('sqlPlayerName') || '');
    const [error, setError] = useState('');

    const config = gameData.config;

    /**
     * Spustí hru přechodem na obrazovku s hrou a předáním potřebných informací o hráči a relaci, uloží jméno hráče do LocalStorage pro případné budoucí použití.
     */
    const handleStart = () => {
        const trimmedName = playerName.trim();

        if (trimmedName.length < 3) {
            setError('Přezdívka musí být alespoň 3 znaky dlouhá.');
            return;
        }
        const exposedName = normalizeForProfanity(trimmedName);
        const isProfane = czechProfanities.some(badWord => exposedName.includes(badWord)) || leoProfanity.check(trimmedName) || leoProfanity.check(exposedName);
        if (isProfane) {
            setError('Tato přezdívka obsahuje nevhodné výrazy. Zvol prosím jinou.');
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
                        onChange={(e) => {
                            setPlayerName(e.target.value);
                            setError('');
                        }}
                        placeholder="Tvoje přezdívka..."
                        maxLength={20}
                        className={error ? 'input-error' : ''}
                    />
                    {error && <div className="error-message">{error}</div>}
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
