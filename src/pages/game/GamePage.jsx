import React, { useState, useEffect } from 'react';
import initSqlJs from 'sql.js';
import _ from 'lodash';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-sql';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { sqlDictionary } from '../../data/sqlDictionary';
import { useGameScore } from '../../hooks/useGameScore';
import VictoryScreen from '../../components/VictoryScreen';

import './GamePage.css';

export default function GamePage({ gameData }) {
    const navigate = useNavigate();
    const { score, registerMistake, registerHint, submitScene, resetScore } = useGameScore();

    const defaultConfig = {
        id: 'unknown',
        theme: 'default-theme',
        dbName: 'GenericSQL',
        playerStatus: 'Hráč: Student',
        loadingText: 'Načítám...',
        assetFolder: 'default',
        schemaImg: 'default.png',
    };

    const config = { ...defaultConfig, ...gameData.config };

    const [activeOverlay, setActiveOverlay] = useState('table');
    const [db, setDb] = useState(null);
    const [currentScene, setCurrentScene] = useState(1);
    const [lastSuccessScene, setLastSuccessScene] = useState(5);
    const currSceneData = gameData.scenes[currentScene - 1];
    const [query, setQuery] = useState('SEM PIŠ DOTAZY');
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [isGameFinished, setIsGameFinished] = useState(false);

    const toggleOverlay = (type) => {
        setActiveOverlay(type);
    };

    useEffect(() => {
        const editor = document.querySelector('.sql-editor');
        if (editor) {
            setTimeout(() => {
                editor.scrollTop = editor.scrollHeight;
            }, 0);
        }
    }, [query]);

    useEffect(() => {
        initSqlJs({ locateFile: (f) => `${import.meta.env.BASE_URL}${f}` }).then((SQL) => {
            const database = new SQL.Database();
            database.run(gameData.createScript);
            database.run(gameData.insertScript);
            setDb(database);
        });
    }, [gameData]);

    const logQuery = async (queryData) => {
        const { error } = await supabase.from('query_logs').insert([
            {
                game_name: queryData.gameName,
                scene_id: queryData.sceneId,
                query: queryData.query,
                is_correct: queryData.isCorrect,
                error: queryData.error || null,
            },
        ]);

        if (error) {
            console.error('Chyba při logování:', error.message);
        }
    };

    const isSuccesful = (res) => {
        let trimmedUser = query.toLowerCase().trim();
        let trimmedAnswer = currSceneData.answer.toLowerCase().trim();
        if (!trimmedUser.endsWith(';')) {
            trimmedUser += ';';
        }
        if (trimmedUser == trimmedAnswer) {
            return true;
        }
        const sceneConfirmTable = db.exec(currSceneData.answer);

        if (!res || res.length === 0 || !sceneConfirmTable || sceneConfirmTable.length === 0) {
            return false;
        }

        if (res[0].columns.length !== sceneConfirmTable[0].columns.length) {
            return false;
        }

        if (res[0].values.length !== sceneConfirmTable[0].values.length) {
            return false;
        }
        
        if (_.isEqual(res[0].values, sceneConfirmTable[0].values)) {
            
            return true;
        }
        return false;
    };

    function nextScene() {
        if (currentScene >= gameData.number_of_scenes) {
            setIsGameFinished(true);
        } else {
            setCurrentScene((prev) => prev + 1);
        }
    }

    function prevScene() {
        setCurrentScene((prev) => prev - 1);
    }

    const handleRestart = () => {
        setIsGameFinished(false);
        setCurrentScene(1);
        setLastSuccessScene(0);
        setQuery('SEM PIŠ DOTAZY');
        setResult(null);
        setError(null);
        resetScore();
    };

    const handleBackToMenu = () => {
        navigate('/');
    };

    const badWords = [
        'drop',
        'delete',
        'insert',
        'update',
        'alter',
        'truncate',
        'grant',
        'commit',
        'rollback',
        'pragma',
        'attach',
        'replace',
        'upsert',
        'vacuum',
        'detach',
        'begin',
    ];

    const runSql = () => {
        setActiveOverlay('table');
        setError(null);
        setResult(null);

        let currentError = null;
        let isCorrect = false;
        db.run('BEGIN TRANSACTION;');
        try {
            if (badWords.some((word) => query.toLowerCase().includes(word))) {
                throw new Error('Ve tvém dotazu jsou nějaká nehezká slova!');
            }
            const statements = query
                .split(';')
                .map((s) => s.trim())
                .filter((s) => s.length > 0);
            if (statements.length > 1) {
                throw new Error('Pouze jeden dotaz najednou!');
            }

            const res = db.exec(query);
            isCorrect = isSuccesful(res);

            if (isCorrect) {
                if (currentScene - 1 == lastSuccessScene) {
                    setLastSuccessScene((prev) => prev + 1);
                    submitScene();
                }
            } else {
                registerMistake();
            }

            setError(null);
            if (!_.isEqual(res, [])) {
                setResult(res);
            } else {
                currentError = 'Nic tu není :/';
                setError(currentError);
            }
            db.run('ROLLBACK;');
        } catch (e) {
            registerMistake();
            currentError = e.message;
            setError(currentError);
            db.run('ROLLBACK;');
        }

        const queryData = {
            gameName: config.dbName,
            sceneId: currentScene,
            query: query,
            isCorrect: isCorrect,
            error: currentError,
        };

        logQuery(queryData);
    };

    const saveScoreToLeaderboard = async (playerName) => {
        const { error } = await supabase.from('leaderboard').insert([
            {
                game_name: config.dbName,
                player_name: playerName,
                score: score,
            },
        ]);

        if (error) {
            console.error('Chyba při ukládání skóre:', error.message);
        } else {
            console.log('Skóre úspěšně uloženo do žebříčku!');
        }
    };

    const sceneStyle = {
        backgroundImage: currSceneData.img
            ? `url("${import.meta.env.BASE_URL}pageAssets/${config.assetFolder}/scenes/${currSceneData.img}")`
            : 'none',
        backgroundColor: '#f2f2c0',
    };

    if (!db) return <div className={`loading-screen ${config.theme}`}>{config.loadingText}</div>;

    return (
        <div className={`game-page ${config.theme}`}>
            {isGameFinished && (
                <VictoryScreen
                    score={score}
                    gameName={config.dbName}
                    onRestart={handleRestart}
                    onBackToMenu={handleBackToMenu}
                    onSubmitScore={saveScoreToLeaderboard}
                />
            )}

            <div className="side-toolbar">
                <button className="tool-btn" onClick={() => toggleOverlay('table')}>
                    📊
                </button>
                <button className="tool-btn" onClick={() => toggleOverlay('schema')}>
                    📜
                </button>
                <button
                    className="tool-btn"
                    onClick={() => {
                        toggleOverlay('hint');
                        registerHint();
                    }}
                >
                    💡
                </button>
            </div>

            <div className="side-overlay">
                <div className="overlay-content">
                    {activeOverlay === 'table' && (
                        <div className="content-box">
                            <h3>VÝSLEDEK DOTAZU</h3>
                            {error ? (
                                <div className="error-box">{error}</div>
                            ) : result ? (
                                <div className="table-wrapper">
                                    <table>
                                        <thead>
                                            <tr>
                                                {result[0].columns.map((c) => (
                                                    <th key={c}>{c}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {result[0].values.map((row, i) => (
                                                <tr key={i}>
                                                    {row.map((val, j) => (
                                                        <td key={j}>{val}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p>Zatím žádná data. Spusť dotaz!</p>
                            )}
                        </div>
                    )}

                    {activeOverlay === 'schema' && (
                        <div className="content-box">
                            <h3>SCHÉMA</h3>
                            {config.schemaImg ? (
                                <img
                                    src={`${import.meta.env.BASE_URL}assets/${config.schemaImg}`}
                                    alt="Schema"
                                />
                            ) : (
                                <div
                                    style={{
                                        padding: '20px',
                                        border: '2px dashed #666',
                                        textAlign: 'center',
                                        color: '#666',
                                    }}
                                >
                                    <p>Dokumentace k této databázi nebyla nalezena.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeOverlay === 'hint' && (
                        <div className="content-box">
                            <h3>NÁPOVĚDA</h3>
                            {currSceneData.keywords && currSceneData.keywords.length > 0 ? (
                                <div className="hint-content">
                                    <p className="hint-intro">
                                        K vyřešení tohoto úkolu zkus použít tyto příkazy:
                                    </p>
                                    <ul className="keyword-list">
                                        {currSceneData.keywords.map((keyword, index) => (
                                            <li key={index} className="hint-item">
                                                <strong className="hint-keyword">{keyword}</strong>
                                                <span className="hint-definition">
                                                    {sqlDictionary[keyword] ||
                                                        ' - (Definice chybí)'}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : (
                                <p className="hint-text">
                                    Pro tuto úroveň není k dispozici žádná speciální nápověda.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="main-viewport" style={sceneStyle}>
                <div className="info-bar">
                    <span>{config.playerStatus}</span> | <span>Skóre: {score}</span>
                </div>

                <div className="navigation">
                    {currentScene > 1 && (
                        <button className="prev-btn" onClick={prevScene}>
                            ◀
                        </button>
                    )}
                    {currentScene <= lastSuccessScene && (
                        <button className="next-btn" onClick={nextScene}>
                            {currentScene === gameData.number_of_scenes ? ' DOKONČIT HRU ' : '▶'}
                        </button>
                    )}
                </div>

                <div className="task-container">
                    <h3>Úkol {currSceneData.id}</h3>
                    <p>{currSceneData.story}</p>
                    <p>
                        <small>{currSceneData.prompt}</small>
                    </p>
                </div>

                <div className="editor-section">
                    <Editor
                        value={query}
                        onValueChange={(code) => setQuery(code)}
                        highlight={(code) => highlight(code, languages.sql)}
                        padding={15}
                        className="sql-editor"
                    />
                    <button className="execute-btn" onClick={runSql}>
                        PROVÉST DOTAZ
                    </button>
                </div>
            </div>
        </div>
    );
}
