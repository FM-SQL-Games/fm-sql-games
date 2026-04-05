import React from 'react';
import './LoadDialog.css';

export default function LoadDialog({ foundData, onAccept, onDecline }) {
    if (!foundData) return null;

    return (
        <div className="load-dialog-overlay">
            <div className="load-dialog-box">
                <h2>Byla nalezena rozehraná hra!</h2>
                <p>
                    Našli jsme tvůj předchozí postup (splněno: {foundData.lastSuccess}). Chceš v něm
                    pokračovat?
                </p>
                <div className="load-dialog-buttons">
                    <button className="btn-accept" onClick={onAccept}>
                        Ano
                    </button>
                    <button className="btn-decline" onClick={onDecline}>
                        Ne
                    </button>
                </div>
            </div>
        </div>
    );
}
