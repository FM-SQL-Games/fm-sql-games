import { BrowserRouter as Router, Routes, Route, useParams } from 'react-router-dom';
import Home from './pages/Home';
import GameSetup from './pages/game/GameSetup';
import GamePage from './pages/game/GamePage';
import LeaderboardPage from './pages/leaderboard/LeaderboardPage';
import { getGameById } from './data/gameLibrary';

function GameLoader(props) {
    const { component: Component } = props;
    const { gameId } = useParams();
    const gameData = getGameById(gameId);

    if (!gameData) {
        return (
            <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>
                Hra "{gameId}" neexistuje!
            </div>
        );
    }

    return <Component gameData={gameData} />;
}

function App() {
    return (
        <Router basename={import.meta.env.BASE_URL}>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/leaderboard" element={<LeaderboardPage />} />
                <Route path="/:gameId" element={<GameLoader component={GameSetup} />} />
                <Route path="/:gameId/game" element={<GameLoader component={GamePage} />} />
            </Routes>
        </Router>
    );
}

export default App;
