import React, { useState } from 'react';
import './VictoryScreen.css';
import { useTranslation } from 'react-i18next';
import { isSupabaseConfigured } from '../supabaseClient';

export default function VictoryScreen({
    score,
    gameName,
    playerName,
    onRestart,
    onBackToMenu,
    onSubmitScore,
}) {
    const { t } = useTranslation();
    const [isSubmitted, setIsSubmitted] = useState(false);
    /**
     * Odesílá skóre hráče do leaderboardu a aktualizuje stav odeslání, aby zobrazil potvrzení o úspěšném odeslání.
     */
    const handleSubmit = () => {
        onSubmitScore(playerName);
        setIsSubmitted(true);
    };
    return (
        <div className="victory-overlay">
            <div className="victory-modal">
                <div className="victory-header">
                    <h2>{t('victory.title')}</h2>
                </div>

                <div className="victory-body">
                    <p>
                        {t('victory.success_msg', { gameName })}
                    </p>

                    <div className="score-display">
                        <span className="score-label">{t('victory.final_score')}</span>
                        <span className="score-value">{score}</span>
                    </div>
                </div>
                <div className="leaderboard-submission">
                    {!isSupabaseConfigured ? (
                        <div className="submission-confirm">
                            <p className="leaderboard-hint warning">
                                {t('victory.local_mode')}
                            </p>
                        </div>
                    ) : !isSubmitted ? (
                        <div className="submission-confirm">
                            <p className="leaderboard-hint">
                                {t('victory.save_hint', { playerName })}
                                <strong>{playerName}</strong>?
                            </p>
                            <button className="btn-submit" onClick={handleSubmit}>
                                {t('victory.save_btn')}
                            </button>
                        </div>
                    ) : (
                        <p className="success-msg">{t('victory.success_sent')}</p>
                    )}
                </div>

                <div className="victory-actions">
                    <button className="btn-menu" onClick={onBackToMenu}>
                        {t('victory.back_to_menu')}
                    </button>
                    <button className="btn-restart" onClick={onRestart}>
                        {t('victory.play_again')}
                    </button>
                </div>
            </div>
        </div>
    );
}
