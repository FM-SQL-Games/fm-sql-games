import React, { useState } from 'react';
import './VictoryScreen.css';

export default function VictoryScreen({
    score,
    gameName,
    playerName,
    onRestart,
    onBackToMenu,
    onSubmitScore,
}) {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const handleSubmit = () => {
        onSubmitScore(playerName);
        setIsSubmitted(true);
    };
    return (
        <div className="victory-overlay">
            <div className="victory-modal">
                <div className="victory-header">
                    <h2> MISE DOKONČENA! </h2>
                </div>

                <div className="victory-body">
                    <p>
                        Úspěšně jsi pokořil výzvu ve hře <strong>{gameName}</strong>
                    </p>

                    <div className="score-display">
                        <span className="score-label">Tvé finální skóre:</span>
                        <span className="score-value">{score}</span>
                    </div>
                </div>
                <div className="leaderboard-submission">
                    {!isSubmitted ? (
                        <div className="submission-confirm">
                            <p className="leaderboard-hint">
                                Přeješ si uložit výsledek do leaderboardu pod přezdívkou{' '}
                                <strong>{playerName}</strong>?
                            </p>
                            <button className="btn-submit" onClick={handleSubmit}>
                                Uložit do žebříčku
                            </button>
                        </div>
                    ) : (
                        <p className="success-msg">Skóre bylo úspěšně odesláno!</p>
                    )}
                </div>

                <div className="victory-actions">
                    <button className="btn-menu" onClick={onBackToMenu}>
                        Zpět do menu
                    </button>
                    <button className="btn-restart" onClick={onRestart}>
                        Hrát znovu
                    </button>
                </div>
            </div>
        </div>
    );
}
