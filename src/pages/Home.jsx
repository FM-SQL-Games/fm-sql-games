import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Home.css';
import { gameLibrary } from '../data/gameLibrary';
import Navbar from '../components/Navbar';

function Home() {
    const { t, i18n } = useTranslation();

    const filteredGames = gameLibrary.filter(
        (game) => game.config.lang === i18n.language
    );
    return (
        <div className="home-container">
            <Navbar />

            <div className="home-header">
                <h1>{t('home.title')}</h1>
                <p>{t('home.subtitle')}</p>
            </div>

            
            <div className="game-grid">
                {filteredGames.length > 0 ? (
                    filteredGames.map((game) => (
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
                                        {game.config.active !== false 
                                            ? t('home.play') 
                                            : t('home.coming_soon')}
                                    </span>
                                </div>
                            </Link>
                        </div>
                    ))
                ) : (
                    <div className='no-games'>
                        <h3>{t('home.no_games')}</h3>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Home;
