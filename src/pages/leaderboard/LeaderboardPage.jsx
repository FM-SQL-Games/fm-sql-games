import React, { useState } from 'react';
import './LeaderboardPage.css';
import Navbar from '../../components/Navbar';
import { gameLibrary } from '../../data/gameLibrary';

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

    const currentData =
        mockData.filter((row) => row.game_name === activeTab).sort((a, b) => b.score - a.score) ||
        [];

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
                <div className="table-wrapper">
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
                            {currentData.length > 0 ? (
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

const mockData = [
    {
        id: 'uuid-1',
        created_at: '2026-03-21T18:45:00Z',
        game_name: 'SQLCraft',
        player_name: 'Miner99',
        score: 5000,
    },
    {
        id: 'uuid-2',
        created_at: '2026-03-19T20:00:00Z',
        game_name: 'SQLCraft',
        player_name: 'DiamondSeeker',
        score: 4500,
    },
    {
        id: 'uuid-3',
        created_at: '2026-03-23T10:00:00Z',
        game_name: 'TULEscape',
        player_name: 'NejlepsiStudentTUL',
        score: 2500,
    },
    {
        id: 'uuid-4',
        created_at: '2026-03-22T15:30:00Z',
        game_name: 'TULEscape',
        player_name: 'Karel.Okurka',
        score: 2100,
    },
    {
        id: 'uuid-5',
        created_at: '2026-03-20T08:15:00Z',
        game_name: 'TULEscape',
        player_name: 'ZmatenyAdmin',
        score: 1800,
    },
    {
        id: 'uuid-6',
        created_at: '2026-03-24T11:20:00Z',
        game_name: 'TULEscape',
        player_name: 'Hacker_FMTUL',
        score: 2950,
    },
    {
        id: 'uuid-7',
        created_at: '2026-03-24T23:55:00Z',
        game_name: 'TULEscape',
        player_name: 'NespavyStudent',
        score: 1400,
    },
    {
        id: 'uuid-8',
        created_at: '2026-03-25T09:10:00Z',
        game_name: 'TULEscape',
        player_name: 'KMD_Lover',
        score: 2250,
    },
    {
        id: 'uuid-9',
        created_at: '2026-03-25T14:30:00Z',
        game_name: 'TULEscape',
        player_name: 'ZapomenuteHeslo',
        score: 950,
    },
    {
        id: 'uuid-10',
        created_at: '2026-03-26T08:00:00Z',
        game_name: 'TULEscape',
        player_name: 'Kofola_v_Bufetu',
        score: 1850,
    },
    {
        id: 'uuid-11',
        created_at: '2026-03-26T16:45:00Z',
        game_name: 'TULEscape',
        player_name: 'Harcov_King',
        score: 2700,
    },
    {
        id: 'uuid-12',
        created_at: '2026-03-27T10:05:00Z',
        game_name: 'TULEscape',
        player_name: 'SkriptaZdarma',
        score: 1100,
    },
    {
        id: 'uuid-13',
        created_at: '2026-03-27T12:20:00Z',
        game_name: 'TULEscape',
        player_name: 'RektorSleduje',
        score: 1600,
    },
    {
        id: 'uuid-14',
        created_at: '2026-03-28T22:15:00Z',
        game_name: 'TULEscape',
        player_name: 'ZkouskoveJePeklo',
        score: 2050,
    },
    {
        id: 'uuid-15',
        created_at: '2026-03-29T13:40:00Z',
        game_name: 'TULEscape',
        player_name: 'VěčnýBakalář',
        score: 1250,
    },
    {
        id: 'uuid-16',
        created_at: '2026-03-22T09:30:00Z',
        game_name: 'SQLCraft',
        player_name: 'CreeperHunter',
        score: 3200,
    },
    {
        id: 'uuid-17',
        created_at: '2026-03-23T14:15:00Z',
        game_name: 'SQLCraft',
        player_name: 'RedstonePro',
        score: 5800,
    },
    {
        id: 'uuid-18',
        created_at: '2026-03-24T17:50:00Z',
        game_name: 'SQLCraft',
        player_name: 'Steve_123',
        score: 1500,
    },
    {
        id: 'uuid-19',
        created_at: '2026-03-25T20:25:00Z',
        game_name: 'SQLCraft',
        player_name: 'IronGolem',
        score: 4100,
    },
    {
        id: 'uuid-20',
        created_at: '2026-03-26T11:10:00Z',
        game_name: 'SQLCraft',
        player_name: 'EnderSlayer',
        score: 4900,
    },
    {
        id: 'uuid-21',
        created_at: '2026-03-26T22:45:00Z',
        game_name: 'SQLCraft',
        player_name: 'NoobMaster',
        score: 800,
    },
    {
        id: 'uuid-22',
        created_at: '2026-03-27T08:30:00Z',
        game_name: 'SQLCraft',
        player_name: 'BuildKing',
        score: 3600,
    },
    {
        id: 'uuid-23',
        created_at: '2026-03-28T15:55:00Z',
        game_name: 'SQLCraft',
        player_name: 'SQL_Miner',
        score: 5500,
    },
    {
        id: 'uuid-24',
        created_at: '2026-03-29T19:20:00Z',
        game_name: 'SQLCraft',
        player_name: 'ObsidianTears',
        score: 2900,
    },
    {
        id: 'uuid-25',
        created_at: '2026-03-30T10:40:00Z',
        game_name: 'SQLCraft',
        player_name: 'Villager',
        score: 1200,
    },
];
