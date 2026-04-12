import initSqlJs from 'sql.js';

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
