import _ from 'lodash';

export const FORBIDDEN_WORDS = [
    'drop',
    'delete',
    'insert',
    'update',
    'alter',
    'truncate',
    'grant',
    'commit',
    'rollback',
    'pragma',
    'attach',
    'replace',
    'upsert',
    'vacuum',
    'detach',
    'begin',
];

export const preprocessQuery = (query) => {
    const trimmed = query.trim();
    if (FORBIDDEN_WORDS.some((word) => trimmed.toLowerCase().includes(word))) {
        throw new Error('Ve tvém dotazu jsou nějaká nehezká slova!');
    }

    const statements = trimmed
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

    if (statements.length > 1) {
        throw new Error('Pouze jeden dotaz najednou!');
    }

    return statements[0] || '';
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

    if (uTab.columns.length !== rTab.columns.length){
        return false;
    } 
    if (uTab.values.length !== rTab.values.length) {
        return false;
    }
    return _.isEqual(uTab.values, rTab.values);
};
