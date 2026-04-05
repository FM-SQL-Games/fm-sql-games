import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import { gameLibrary } from '../data/gameLibrary';
import Navbar from '../components/Navbar';

function Home() {
    return (
        <div className="home-container">
            <Navbar />
            <div className="game-grid">
                {gameLibrary.map((game) => (
                    <div
                        key={game.config.id}
                        className={`game-card ${game.config.active === false ? 'disabled' : ''}`}
                    >
                        <Link to={game.config.active !== false ? `/${game.config.id}` : '#'}>
                            <div className="card-content">
                                <div
                                    className="card-image"
                                    style={{
                                        backgroundImage: game.config.cardImage
                                            ? `url("${import.meta.env.BASE_URL}${game.config.cardImage}")`
                                            : 'linear-gradient(135deg, #2c3e50, #000)',
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        imageRendering: 'auto',
                                        backgroundColor: '#1a1a1a',
                                    }}
                                ></div>
                                <h2>{game.config.title}</h2>
                                <p>{game.config.description}</p>
                                <span className="play-button">
                                    {game.config.active !== false ? 'HRÁT' : 'JIŽ BRZY'}
                                </span>
                            </div>
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Home;
