import _, { isEqual } from 'lodash';
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
    let trimmedUser = userQuery.trim();
    let trimmedAnswer = referenceQuery.trim();

    const rules = {
        strictAs: strictRules.includes("strict_as"),
        strictColOrder: strictRules.includes("strict_column_order"),
        strictRowOrder: strictRules.includes("strict_row_order")
    }

    if (!trimmedUser.endsWith(';')) {
        trimmedUser += ';';
    }
    if (!trimmedAnswer.endsWith(';')) {
        trimmedAnswer += ';';
    }

    //Je celý dotaz stejný?
    if (trimmedUser === trimmedAnswer) {
        return true;
    }

    //Je jedna tabulka prázndá a druhá ne?
    const isUserEmpty = !userRes || userRes.length === 0 || !userRes[0].values || userRes[0].values.length === 0;
    const isRefEmpty = !referenceRes || referenceRes.length === 0 || !referenceRes[0].values || referenceRes[0].values.length === 0;
    if (isUserEmpty && isRefEmpty) return true; 
    if (isUserEmpty !== isRefEmpty) return false;

    const uTab = userRes[0];
    const rTab = referenceRes[0];

    //Porovnání počtu sloupců
    if (uTab.columns.length !== rTab.columns.length) {
        return false;
    }

    //Porovnání počtu řádků
    if (uTab.values.length !== rTab.values.length) {
        return false;
    }

   const colMap = findColMap(uTab, rTab, rules);

   if(!colMap) return false;

   return compareData(uTab.values, rTab.values, colMap, rules.strictRowOrder)
};


function findColMap(user, reference, rules){
    const numCols = reference.columns.length;

    //Záleží na pořadí sloupců
    if(rules.strictColOrder){
        if(rules.strictAs && !_.isEqual(user.columns, reference.columns)) return null; // Pokud záleží na namingu ale názvy columns nejsou stejný vrátíme null

        return Array.from({length: numCols}, (_,i)=>i);
    }
    //Na pořadí nezáleží ale na namingu ano
    if(rules.strictAs){
        return mapByName(user.columns, reference.columns);
    }

    //Absolutní chaos nezáleží na ničem
    return mapByDataIntersect(user.values, reference.values, numCols);
}

function mapByName(userCols, referenceCols){
    const map = [];
    const usedIndexes= new Set();

    for(let i = 0; i < referenceCols.length; i++){
        let foundIndex = -1;
        for(let j = 0; j < userCols.length; j++){
            if(userCols[j] === referenceCols[i] && !usedIndexes.has(j)){
                foundIndex = j;
                break;
            }
        }
        if(foundIndex === -1) return null; 
        usedIndexes.add(foundIndex);
        map.push(foundIndex);
    }
    return map;
}

function mapByDataIntersect(userValues, refValues, numCols){
    let iterations = 0;
    const maxIterations = 5000;

    //Rozdělení a seřazní sloupců
    const refColData = Array.from({length: numCols}, (_, i) => sortCols(refValues, i));
    const userColData = Array.from({length: numCols}, (_, i) => sortCols(userValues, i));

    const candidates = [];
    for(let i = 0; i < numCols; i++){
        const valid = [];
        for(let j = 0; j < numCols; j++){
            if(_.isEqual(refColData[i], userColData[j])){
                valid.push(j);
            }
        }
        if(valid.length === 0 ) return null;
        candidates.push(valid);
    }

    let validMap = null;

    function backtrack(colIndex, currMap, usedCols){
        if (iterations++ > maxIterations) return;
        if(validMap) return;
        if(colIndex === numCols){
            validMap = [...currMap];
            return;
        }
        for(const userColIndex of candidates[colIndex]){
            if(!usedCols.has(userColIndex)){
                usedCols.add(userColIndex);
                currMap.push(userColIndex);
                backtrack(colIndex+1, currMap,usedCols);
                currMap.pop();
                usedCols.delete(userColIndex);
            }
        }
    }
    backtrack(0,[], new Set());
    return validMap;

}


function comparePrimitives(a,b){
    return JSON.stringify(a).localeCompare(JSON.stringify(b));
}

function sortRows(values){
    return [...values].sort((rowA, rowB) => comparePrimitives(rowA,rowB))
}

function sortCols(values, colIndex){
    return values.map(row => row[colIndex]).sort(comparePrimitives);
}

function compareData(userVals, refVals, colMap, strictRowOrder){
    const mappedUserVals = userVals.map(row => { return colMap.map(i => row[i])});

    if (strictRowOrder){
        return _.isEqual(refVals,mappedUserVals);
    }
    else{
        const sortedRef = sortRows(refVals);
        const sortedUser = sortRows(mappedUserVals);
        return _.isEqual(sortedRef,sortedUser);
    }
}