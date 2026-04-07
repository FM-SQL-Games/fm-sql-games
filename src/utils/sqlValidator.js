import _ from 'lodash';
import { Parser } from 'node-sql-parser';

export const preprocessQuery = (query) => {
    try {
        const trimmed = query.trim();
        const parser = new Parser();
        const obj = parser.astify(trimmed);
        const statements = Array.isArray(obj) ? obj : [obj];

        if (statements.length > 1) {
            throw new Error('Pouze jeden dotaz najednou!');
        }

        const statement = statements[0];
        console.log(statement.type);
        if (statement.type !== 'select') {
            throw new Error('V tvém příkazu jsou nějaká nehezká slova.');
        }

        return trimmed;
    } catch (error) {
        if (
            error.message === 'Pouze jeden dotaz najednou!' ||
            error.message === 'V tvém příkazu jsou nějaká nehezká slova.'
        ) {
            throw error;
        }
        throw new Error('Chyba v syntaxi.');
    }
};

export const isSuccessful = (userQuery, referenceQuery, userRes, referenceRes) => {
    let trimmedUser = userQuery.toLowerCase().trim();
    let trimmedAnswer = referenceQuery.toLowerCase().trim();

    if (!trimmedUser.endsWith(';')) {
        trimmedUser += ';';
    }
    if (!trimmedAnswer.endsWith(';')) {
        trimmedAnswer += ';';
    }

    if (trimmedUser === trimmedAnswer) {
        return true;
    }

    if (!userRes || userRes.length === 0 || !referenceRes || referenceRes.length === 0) {
        return false;
    }

    const uTab = userRes[0];
    const rTab = referenceRes[0];

    if (uTab.columns.length !== rTab.columns.length) {
        return false;
    }
    if (uTab.values.length !== rTab.values.length) {
        return false;
    }
    return _.isEqual(uTab.values, rTab.values);
};
