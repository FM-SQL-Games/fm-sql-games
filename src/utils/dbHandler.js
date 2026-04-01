import initSqlJs from 'sql.js';

export const initDatabase = async (createScript, insertScript) => {
    const SQL = await initSqlJs({
        locateFile: (f) => `${import.meta.env.BASE_URL}${f}`,
    });
    const database = new SQL.Database();
    database.run(createScript);
    database.run(insertScript);
    return database;
};

export const executeSafeQuery = (db, query) => {
    db.run('BEGIN TRANSACTION;');
    try {
        const res = db.exec(query);
        db.run('ROLLBACK;');
        return { res, error: null };
    } catch (e) {
        db.run('ROLLBACK;');
        return { res: null, error: e.message };
    }
};
