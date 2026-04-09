const gameModules = import.meta.glob('./games/*.json', { eager: true });

export const gameLibrary = Object.values(gameModules).map((module) => module.default);

export const getGameById = (id) => {
    return gameLibrary.find((game) => game.config.id === id);
};
