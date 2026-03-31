import sqlCraftData from './SQLCraft.json';
import tulEscapeData from './TULEscape.json';

export const gameLibrary = [sqlCraftData, tulEscapeData];

export const getGameById = (id) => {
    return gameLibrary.find((game) => game.config.id === id);
};
