import React, { useState, useEffect } from 'react';
import './LeaderboardPage.css';
import Navbar from '../../components/Navbar';
import { gameLibrary } from '../../data/gameLibrary';
import { fetchLeaderboardData } from '../../utils/supabaseLogger';

export default function LeaderboardPage() {
    const availableGames = gameLibrary
        .filter((game) => game.config.active !== false)
        .map((game) => ({
            dbName: game.config.dbName,
            title: game.config.title,
        }));

    const [activeTab, setActiveTab] = useState(
        availableGames.length > 0 ? availableGames[0].dbName : ''
    );
    const [currentData, setCurrentData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    /**
     * Načte data z leaderboardu pro aktuálně aktivní hru při změně aktivní záložky.
     * Zobrazí načítací stav během načítání dat a aktualizuje zobrazení tabulky s novými daty po načtení.
     */
    useEffect(() => {
        const loadData = async () => {
            if (!activeTab) return;

            setIsLoading(true);
            const data = await fetchLeaderboardData(activeTab);
            setCurrentData(data);
            setIsLoading(false);
        };

        loadData();
    }, [activeTab]);

    return (
        <div className="leaderboard-container">
            <Navbar />
            <div className="leaderboard-content">
                <h1>Žebříček nejlepších hráčů</h1>
                <div className="tabs">
                    {availableGames.map((game) => (
                        <button
                            key={game.dbName}
                            className={`tab-btn ${activeTab === game.dbName ? 'active' : ''}`}
                            onClick={() => setActiveTab(game.dbName)}
                        >
                            {game.title}
                        </button>
                    ))}
                </div>
                <div className="leaderboard-table-wrapper ">
                    <table className="leaderboard-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Přezdívka</th>
                                <th>Skóre</th>
                                <th>Datum</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="4" className="empty-state">
                                        Načítám data z databáze...
                                    </td>
                                </tr>
                            ) : currentData.length > 0 ? (
                                currentData.map((row, index) => {
                                    const formattedDate = new Date(
                                        row.created_at
                                    ).toLocaleDateString('cs-CZ');

                                    return (
                                        <tr key={row.id}>
                                            <td className="rank-col">{index + 1}</td>
                                            <td className="player-col">{row.player_name}</td>
                                            <td className="score-col">{row.score}</td>
                                            <td className="date-col">{formattedDate}</td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="4" className="empty-state">
                                        Zatím zde nejsou žádné záznamy. Buď první!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
