import React from 'react';
import './LoadDialog.css';
import { useTranslation } from 'react-i18next';

export default function LoadDialog({ foundData, onAccept, onDecline }) {
    const { t } = useTranslation();
    if (!foundData) return null;

    return (
        <div className="load-dialog-overlay">
            <div className="load-dialog-box">
                <h2>{t('load_dialog.title')}</h2>
                <p>
                    {t('load_dialog.text', { count: foundData.lastSuccess })}
                </p>
                <div className="load-dialog-buttons">
                    <button className="btn-accept" onClick={onAccept}>
                        {t('load_dialog.yes')}
                    </button>
                    <button className="btn-decline" onClick={onDecline}>
                        {t('load_dialog.no')}
                    </button>
                </div>
            </div>
        </div>
    );
}
