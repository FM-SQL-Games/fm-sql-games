import React, { useState, useEffect, useCallback } from 'react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-sql';
import { useNavigate, useLocation } from 'react-router-dom';
import { preprocessQuery, isSuccessful } from '../../utils/sqlValidator';
import { initDatabase, executeSafeQuery } from '../../utils/dbHandler';
import { logQueryToSupabase, saveLeaderboardScore } from '../../utils/supabaseLogger';
import { sqlDictionary } from '../../data/sqlDictionary';
import { useGameScore } from '../../hooks/useGameScore';
import VictoryScreen from '../../components/VictoryScreen';

import './GamePage.css';
import LoadDialog from '../../components/LoadDialog';

export default function GamePage({ gameData }) {
    const navigate = useNavigate();
    const location = useLocation();

    const playerName = location.state?.playerName || 'Host';

    const { score, registerMistake, registerHint, loadScore, submitScene, resetScore } =
        useGameScore();

    const defaultConfig = {
        id: 'unknown',
        theme: 'default-theme',
        dbName: 'GenericSQL',
        loadingText: 'Načítám...',
        assetFolder: 'default',
        schemaImg: 'default.png',
    };

    const config = { ...defaultConfig, ...gameData.config };

    const [activeOverlay, setActiveOverlay] = useState('schema');
    const [db, setDb] = useState(null);
    const [currentScene, setCurrentScene] = useState(1);
    const [lastSuccessScene, setLastSuccessScene] = useState(0);
    const currSceneData = gameData.scenes[currentScene - 1];
    const [query, setQuery] = useState('SEM PIŠ DOTAZY');
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [isGameFinished, setIsGameFinished] = useState(false);
    const [succesfulAnwsersArray, setSuccesfulAnwsersArray] = useState(
        Array(gameData.number_of_scenes).fill('')
    );
    const [foundData, setFoundData] = useState(null);
    const [showLoadDialog, setShowLoadDialog] = useState(false);
    const [isFound, setIsFound] = useState(false);

    const saveToLocalStorage = useCallback(
        (newLastSuccess, newAnsArray, newScore) => {
            const rawData = localStorage.getItem('storage');
            const storage = rawData ? JSON.parse(rawData) : {};
            storage[config.id] = {
                lastSuccess: newLastSuccess,
                ansArray: newAnsArray,
                score: newScore,
            };
            localStorage.setItem('storage', JSON.stringify(storage));
        },
        [config.id]
    );

    useEffect(() => {
        const rawData = localStorage.getItem('storage');
        const storage = rawData ? JSON.parse(rawData) : {};
        const storage_gameData = storage[config.id];

        if (storage_gameData) {
            setFoundData(storage_gameData);
            setShowLoadDialog(true);
        }
        setIsFound(true);
    }, [config.id]);

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
        initDatabase(gameData.createScript, gameData.insertScript).then((database) =>
            setDb(database)
        );
    }, [gameData]);

    useEffect(() => {
        if (showLoadDialog) return;
        if (!isFound) return;
        if (lastSuccessScene === 0) return;
        saveToLocalStorage(lastSuccessScene, succesfulAnwsersArray, score);
    }, [
        lastSuccessScene,
        succesfulAnwsersArray,
        score,
        config.id,
        showLoadDialog,
        isFound,
        saveToLocalStorage,
    ]);

    function nextScene() {
        if (currentScene >= gameData.number_of_scenes) {
            setIsGameFinished(true);
        } else {
            setQuery(succesfulAnwsersArray[currentScene]);
            setCurrentScene((prev) => prev + 1);
        }
    }

    function prevScene() {
        setQuery(succesfulAnwsersArray[currentScene - 2]);
        setCurrentScene((prev) => prev - 1);
    }

    const handleAcceptLoad = () => {
        console.log(foundData);
        setLastSuccessScene(foundData.lastSuccess);
        setSuccesfulAnwsersArray(foundData.ansArray);
        loadScore(foundData.score);
        setCurrentScene(foundData.lastSuccess + 1);
        setShowLoadDialog(false);
        setQuery('SEM PIŠ DOTAZY');
    };

    const handleDeclineLoad = () => {
        clearGameStorage();
        setShowLoadDialog(false);
    };

    const clearGameStorage = () => {
        const rawData = localStorage.getItem('storage');
        if (rawData) {
            const storage = JSON.parse(rawData);
            delete storage[config.id];
            localStorage.setItem('storage', JSON.stringify(storage));
        }
    };

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

    const handleBackToSetup = () => {
        navigate(`/${config.id}`);
    };

    const runSql = () => {
        setActiveOverlay('table');
        setError(null);
        setResult(null);

        let currentError = null;
        let isCorrect = false;
        try {
            const cleanQuery = preprocessQuery(query);

            const { res, error: dbError } = executeSafeQuery(db, cleanQuery);
            if (dbError) {
                throw new Error(dbError);
            }

            const referenceRes = db.exec(currSceneData.answer);

            isCorrect = isSuccessful(cleanQuery, currSceneData.answer, res, referenceRes, currSceneData.strict_rules);

            if (isCorrect) {
                const newArray = [...succesfulAnwsersArray];
                newArray[currentScene - 1] = query;
                setSuccesfulAnwsersArray(newArray);
                if (currentScene - 1 == lastSuccessScene) {
                    setLastSuccessScene((prev) => prev + 1);
                    submitScene();
                }
            } else {
                registerMistake();
            }

            if (res && res.length > 0) {
                setResult(res);
            } else if (isCorrect) {
                setError(null);
                setResult(null);
            } else {
                currentError = 'Dotaz nevrátil žádná data.';
                setError(currentError);
            }
        } catch (e) {
            registerMistake();
            currentError = e.message;
            setError(currentError);
        }

        logQueryToSupabase({
            gameName: config.dbName,
            sceneId: currentScene,
            query: query,
            isCorrect: isCorrect,
            error: currentError,
        });
    };

    const saveScoreToLeaderboard = (playerName) => {
        saveLeaderboardScore(config.dbName, playerName, score);
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
            {showLoadDialog && (
                <LoadDialog
                    foundData={foundData}
                    onAccept={handleAcceptLoad}
                    onDecline={handleDeclineLoad}
                />
            )}

            {isGameFinished && (
                <VictoryScreen
                    score={score}
                    gameName={config.dbName}
                    playerName={playerName}
                    onRestart={() => {
                        clearGameStorage();
                        handleRestart();
                    }}
                    onBackToMenu={() => {
                        clearGameStorage();
                        handleBackToMenu();
                    }}
                    onSubmitScore={() => {
                        clearGameStorage();
                        saveScoreToLeaderboard();
                    }}
                />
            )}

            <div className="side-overlay">
                <div className="tabs-container">
                    <button
                        className="back-btn"
                        onClick={() => {
                            handleBackToSetup();
                        }}
                    >
                        &#8617; Zpět
                    </button>
                    <button
                        className={`tool-btn ${activeOverlay === 'table' ? 'active' : ''}`}
                        onClick={() => toggleOverlay('table')}
                    >
                        📊 Tabulka
                    </button>
                    <button
                        className={`tool-btn ${activeOverlay === 'schema' ? 'active' : ''}`}
                        onClick={() => toggleOverlay('schema')}
                    >
                        📜 Schéma
                    </button>
                    <button
                        className={`tool-btn ${activeOverlay === 'hint' ? 'active' : ''}`}
                        onClick={() => {
                            toggleOverlay('hint');
                            registerHint();
                        }}
                    >
                        💡 Nápověda
                    </button>
                </div>
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
                    <span>
                        Přezdívka: <strong>{playerName}</strong>
                    </span>{' '}
                    |{' '}
                    <span>
                        Scéna: {currentScene}/{gameData.number_of_scenes}
                    </span>{' '}
                    | <span>Skóre: {score}</span>
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
                        onFocus={() => {
                            if (query === 'SEM PIŠ DOTAZY') {
                                setQuery('');
                            }
                        }}
                    />
                    <button className="execute-btn" onClick={runSql}>
                        PROVÉST DOTAZ
                    </button>
                </div>
            </div>
        </div>
    );
}
