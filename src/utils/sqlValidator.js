import _ from 'lodash';
import { Parser } from 'node-sql-parser';
/**
 * Zvaliduje a upraví SQL dotaz před jeho spuštěním.
 * @param {string} query - SQL dotaz
 * @returns {string} - Předzpracovaný SQL dotaz
 * @throws {Error} - Vyhodí chybu, pokud je dotazů více nebo obsahují zakázaná slova
 */
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

const setWarning = (msg, callback) => {
    if (callback) callback(msg);
    return false;
};

/**
 * Ověří, zda je uživatelský dotaz úspěšný.
 * @param {string} userQuery - Uživatelský SQL dotaz
 * @param {string} referenceQuery - Referenční SQL dotaz
 * @param {Array<Object>} userRes - Výsledek uživatelského dotazu
 * @param {Array<Object>} referenceRes - Výsledek referenčního dotazu
 * @param {Array<string>} [strictRules=[]] - Pole aplikovaných striktních pravidel
 * @returns {boolean} - Indikátor úspěšnosti dotazu
 */
export const isSuccessful = (userQuery, referenceQuery, userRes, referenceRes, strictRules = [], onWarning = null) => {
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
    if (isUserEmpty !== isRefEmpty) return setWarning('Dotaz nevrátil žádná data. Zkontroluj podmínky ve WHERE nebo název tabulky.', onWarning);

    const uTab = userRes[0];
    const rTab = referenceRes[0];

    //Porovnání počtu sloupců
    if (uTab.columns.length !== rTab.columns.length) {
        return setWarning(
            uTab.columns.length < rTab.columns.length
                ? 'Výsledek má méně sloupců. Vybíráš správné sloupce za SELECT?'
                : 'Výsledek má příliš mnoho sloupců. Zkontroluj SELECT.',
            onWarning
        );
    }

    //Porovnání počtu řádků
    if (uTab.values.length !== rTab.values.length) {
        return setWarning(
            uTab.values.length < rTab.values.length
                ? 'Výsledek má méně řádků. Filtrujete příliš přísně?'
                : 'Výsledek má příliš mnoho řádků. Zkus zpřesnit podmínky nebo typ JOINu.',
            onWarning
        );
    }

   const colMap = findColMap(uTab, rTab, rules);

   if(!colMap) return setWarning('Sloupce se nepodařilo namapovat. Zkontroluj vybrané hodnoty.', onWarning);

   const dataMatch =  compareData(uTab.values, rTab.values, colMap, rules.strictRowOrder)

   if (!dataMatch) return setWarning(
        rules.strictRowOrder
            ? 'Data sedí, ale pořadí řádků nesedí - zkontroluj ORDER BY.'
            : 'Počet řádků i sloupců sedí, ale hodnoty se neshodují.',
        onWarning
    );

    return true;
};

/**
 * Nalezne mapování sloupců mezi uživatelskou a referenční tabulkou na základě pravidel.
 * @param {Object} user - Uživatelská tabulka obsahující `columns` a `values`
 * @param {Object} reference - Referenční tabulka obsahující `columns` a `values`
 * @param {Object} rules - Objekt aktivních pravidel (strictAs, strictColOrder)
 * @returns {Array<number>|null} - Pole indexů mapující sloupce uživatele na referenční, nebo null při neúspěchu
 */
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

/**
 * Vytvoří mapu sloupců pouze na základě jejich názvů (aliasů).
 * @param {Array<string>} userCols - Názvy sloupců uživatele
 * @param {Array<string>} referenceCols - Názvy sloupců referenčního řešení
 * @returns {Array<number>|null} - Pole indexů odpovídajících sloupců, nebo null, pokud nelze namapovat
 */
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

/**
 * Pokusí se spárovat sloupce nezávisle na názvu, čistě na základě shody dat.
 * @param {Array<Array<any>>} userValues - Hodnoty z uživatelské tabulky
 * @param {Array<Array<any>>} refValues - Hodnoty z referenční tabulky
 * @param {number} numCols - Počet sloupců k namapování
 * @returns {Array<number>|null} - Správná mapa indexů sloupců, nebo null, pokud neexistuje platná permutace
 */
function mapByDataIntersect(userValues, refValues, numCols) {
    const refColData = Array.from({length: numCols}, (_, i) => sortCols(refValues, i));
    const userColData = Array.from({length: numCols}, (_, i) => sortCols(userValues, i));

    const map = [];
    const usedCols = new Set();

    for (let i = 0; i < numCols; i++) {
        const match = userColData.findIndex((col, j) =>
            !usedCols.has(j) && _.isEqual(refColData[i], col)
        );
        if (match === -1) return null;
        usedCols.add(match);
        map.push(match);
    }
    return map;
}

/**
 * Porovná dvě primitivní hodnoty převedením na řetězec. Zajišťuje stabilní řazení i pro různé datové typy.
 * @param {any} a - První hodnota k porovnání
 * @param {any} b - Druhá hodnota k porovnání
 * @returns {number} - Kladné, záporné číslo, nebo nula dle lexikografického pořadí
 */
function comparePrimitives(a,b){
    return JSON.stringify(a).localeCompare(JSON.stringify(b));
}

/**
 * Seřadí celé řádky datové matice lexikograficky.
 * @param {Array<Array<any>>} values - Dvourozměrné pole dat (řádky)
 * @returns {Array<Array<any>>} - Nové pole se seřazenými řádky
 */
function sortRows(values){
    return [...values].sort((rowA, rowB) => comparePrimitives(rowA,rowB))
}

/**
 * Extrahuje a seřadí jeden konkrétní sloupec z datové matice.
 * @param {Array<Array<any>>} values - Dvourozměrné pole dat
 * @param {number} colIndex - Index sloupce, který se má extrahovat a seřadit
 * @returns {Array<any>} - Seřazené pole hodnot z daného sloupce
 */
function sortCols(values, colIndex){
    return values.map(row => row[colIndex]).sort(comparePrimitives);
}

/**
 * Transformuje uživatelská data podle mapy sloupců a porovná je s referenčními daty.
 * @param {Array<Array<any>>} userVals - Data uživatele (neupravená)
 * @param {Array<Array<any>>} refVals - Referenční data
 * @param {Array<number>} colMap - Pole určující, jak přeskládat sloupce uživatele
 * @param {boolean} strictRowOrder - Pokud je true, vyžaduje přesnou shodu pořadí řádků
 * @returns {boolean} - True, pokud jsou si data rovna
 */
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