import initSqlJs from 'sql.js';
/**
 * Inicializuje SQL databázi s danými skripty pro vytvoření a naplnění tabulek.
 * @param {string} createScript - SQL skript pro vytvoření tabulek
 * @param {string} insertScript - SQL skript pro vložení dat do tabulek
 * @returns {Promise<{db: SQL.Database|null, error: string|null}>} - Objekt obsahující instanci databáze a případnou chybu
 */
export const initDatabase = async (createScript, insertScript) => {
    try {
        const SQL = await initSqlJs({
            locateFile: (f) => `${import.meta.env.BASE_URL}${f}`,
        });
        const database = new SQL.Database();
        try {
            database.run(createScript);
            database.run(insertScript);
        } catch (scriptError) {
            console.error('Chyba v inicializačních skriptech (JSON):', scriptError);
            return { db: database, error: `Chyba v datech hry: ${scriptError.message}` };
        }

        return { db: database, error: null };
    } catch (e) {
        console.error('Kritická chyba inicializace SQL.js engine:', e);
        return { db: null, error: `Nepodařilo se spustit databázový engine: ${e.message}` };
    }
};
/**
 * Spustí bezpečný SQL dotaz v databázi uvnitř transakce.
 * @param {SQL.Database} db - Instance databáze
 * @param {string} query - SQL dotaz
 * @returns {Promise<{res: any|null, error: string|null}>} - Objekt obsahující výsledek dotazu a případnou chybu
 */
export const executeSafeQuery = (db, query) => {
    if (!db) {
        return { res: null, error: 'Chyba: Databáze není připravena k použití.' };
    }
    try {
        db.run('BEGIN TRANSACTION;');
        const res = db.exec(query);
        db.run('ROLLBACK;');
        return { res, error: null };
    } catch (e) {
        try {
            db.run('ROLLBACK;');
        } catch (rollbackError) {
            console.error('Kritické selhání transakce:', rollbackError);
        }
        return { res: null, error: e.message };
    }
};
