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

export const isSuccessful = (userQuery, referenceQuery, userRes, referenceRes, strictRules = []) => {
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

    const toObjects = (tab) => tab.values.map(row => {
        let obj = {};
        tab.columns.forEach((col, i) => { obj[col] = row[i]; });
        return obj;
    });

    const strictAs = strictRules.includes("strict_as")
    const strictColOrder = strictRules.includes("strict_column_order")
    const strictRowOrder = strictRules.includes("strict_row_order")

    let uData;
    let rData;

    if(strictAs && !strictColOrder){
        if(!_.isEqual([...uTab.columns].sort(), [...rTab.columns].sort())){
            return false;
        }
        uData = toObjects(uTab);
        rData = toObjects(rTab);
    }
    else if(strictAs && strictColOrder){
        if(!_.isEqual(uTab.columns, rTab.columns)){
            return false;
        }
        uData = uTab.values;
        rData = rTab.values;
    }
    else{
        uData = uTab.values;
        rData = rTab.values;
    }

    if(strictRowOrder){
        return _.isEqual(uData, rData);
    }
    else{
        const sortData = (data) => [...data].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
        return _.isEqual(sortData(uData), sortData(rData));
    }
};
