import { describe, it, expect } from 'vitest';
import { preprocessQuery, isSuccessful } from './sqlValidator';
import _ from 'lodash';
const createRes = (columns, values) => [{ columns, values }];

describe('preprocessQuery() - Validace a preprocessing', () => {
    // --- 1. Úspěšné scénáře ---
    describe('Validní SELECT dotazy', () => {
        it('ÚSPĚCH: Přijme jednoduchý SELECT', () => {
            const sql = 'SELECT * FROM Users';
            expect(preprocessQuery(sql)).toBe(sql);
        });

        it('ÚSPĚCH: Přijme SELECT se středníkem a okolními mezerami', () => {
            const sql = '  SELECT id, name FROM Employees;  ';
            expect(preprocessQuery(sql)).toBe('SELECT id, name FROM Employees;');
        });

        it('ÚSPĚCH: Přijme komplexní SELECT (JOIN, WHERE, GROUP BY)', () => {
            const sql = `
        SELECT u.name, COUNT(p.id) 
        FROM Users u 
        JOIN Posts p ON u.id = p.user_id 
        WHERE u.active = 1 
        GROUP BY u.name
      `.trim();
            expect(preprocessQuery(sql)).toBe(sql);
        });

        it('ÚSPĚCH: Přijme dotaz se subdotazem', () => {
            const sql = 'SELECT name FROM (SELECT * FROM Students) WHERE id = 1';
            expect(preprocessQuery(sql)).toBe(sql);
        });
    });

    // --- 2. Bezpečnost a omezení ---
    describe('Bezpečnostní omezení', () => {
        it('SELŽE: Zakáže více dotazů v jednom řetězci (prevence SQL Injection)', () => {
            const sql = 'SELECT * FROM Students; DROP TABLE Users;';
            expect(() => preprocessQuery(sql)).toThrow('Pouze jeden dotaz najednou!');
        });

        it('SELŽE: Vyhodí chybu pro nebezpečné příkazy (DELETE)', () => {
            const sql = 'DELETE FROM Students WHERE id = 1';
            expect(() => preprocessQuery(sql)).toThrow('V tvém příkazu jsou nějaká nehezká slova.');
        });

        it('SELŽE: Vyhodí chybu pro nebezpečné příkazy (UPDATE)', () => {
            const sql = "UPDATE Students SET name = 'Hacker' WHERE id = 1";
            expect(() => preprocessQuery(sql)).toThrow('V tvém příkazu jsou nějaká nehezká slova.');
        });

        it('SELŽE: Nepovolí DDL příkazy (CREATE, DROP, ALTER)', () => {
            const sql = 'CREATE TABLE Test (id int)';
            expect(() => preprocessQuery(sql)).toThrow('V tvém příkazu jsou nějaká nehezká slova.');
        });
    });

    // --- 3. Syntaxe a formátování ---
    describe('Syntaktická správnost', () => {
        it('SELŽE: Detekuje totální nesmysl jako chybu syntaxe', () => {
            const sql = 'UKAZ MI VSECHNY STUDENTY';
            expect(() => preprocessQuery(sql)).toThrow('Chyba v syntaxi.');
        });

        it('SELŽE: Rozpozná překlep v klíčovém slově', () => {
            const sql = 'SELEKT * FROM Students';
            expect(() => preprocessQuery(sql)).toThrow('Chyba v syntaxi.');
        });

        it('SELŽE: Nepovolí prázdný řetězec', () => {
            const sql = '';
            expect(() => preprocessQuery(sql)).toThrow();
        });
    });

    // --- 4. Speciální případy (Edge Cases) ---
    describe('Speciální případy', () => {
        it('ÚSPĚCH: Povolí SELECT i s doprovodnými SQL komentáři', () => {
            const sql = '-- Hledáme studenty\nSELECT * FROM Students';
            expect(preprocessQuery(sql)).toBe(sql.trim());
        });

        it('SELŽE: Zastaví SELECT, pokud mu předchází jiný příkaz', () => {
            const sql = "INSERT INTO Logs (msg) VALUES ('test'); SELECT * FROM Students";
            expect(() => preprocessQuery(sql)).toThrow('Pouze jeden dotaz najednou!');
        });

        it('SELŽE: Vyhodí chybu pro neúplný dotaz (např. pouze SELECT ;)', () => {
            const sql = 'SELECT ;';
            expect(() => preprocessQuery(sql)).toThrow('Chyba v syntaxi.');
        });
    });

    // --- 5. Komentáře a formátování ---
    describe('Komentáře a formátování', () => {
        it('ÚSPĚCH: Přijme SELECT s blokovým komentářem uvnitř', () => {
            const sql = 'SELECT /* tohle je tajné */ * FROM Users';
            expect(preprocessQuery(sql)).toBe(sql);
        });

        it('ÚSPĚCH: Přijme SELECT s více řádkovými komentáři', () => {
            const sql = '-- komentář 1\n-- komentář 2\nSELECT * FROM Users';
            expect(preprocessQuery(sql)).toBe(sql.trim());
        });

        it('ÚSPĚCH: Přijme SELECT s tabulátory a mnoha novými řádky', () => {
            const sql = '\tSELECT\n\n*\nFROM   Users\n\t';
            expect(preprocessQuery(sql)).toBe(sql.trim());
        });
    });

    // --- 6. Prázdné a neplatné vstupy ---
    describe('Prázdné a neplatné vstupy', () => {
        it('SELŽE: Vyhodí chybu pro řetězec obsahující pouze mezery', () => {
            const sql = '   ';
            expect(() => preprocessQuery(sql)).toThrow('Chyba v syntaxi.');
        });

        it('SELŽE: Vyhodí chybu pro řetězec obsahující pouze středník', () => {
            const sql = ';';
            expect(() => preprocessQuery(sql)).toThrow('V tvém příkazu jsou nějaká nehezká slova.');
        });

        it('ÚSPĚCH: Přijme SELECT i s více středníky na konci (pokud je parser ignoruje)', () => {
            const sql = 'SELECT * FROM Users;;;';
            expect(preprocessQuery(sql)).toBe(sql.trim());
        });
    });

    // --- 7. Pokročilá SQL syntaxe ---
    describe('Pokročilá SQL syntaxe', () => {
        it('ÚSPĚCH: Přijme dotaz s WITH klauzulí (CTE)', () => {
            const sql = 'WITH cte AS (SELECT 1) SELECT * FROM cte';
            expect(preprocessQuery(sql)).toBe(sql);
        });

        it('ÚSPĚCH: Přijme dotaz s UNION', () => {
            const sql = 'SELECT name FROM Students UNION SELECT name FROM Teachers';
            expect(preprocessQuery(sql)).toBe(sql);
        });
    });

    // --- 8. Záludné útoky ---
    describe('Záludné pokusy', () => {
        it('SELŽE: Zakáže dotaz, kde je SELECT jen součástí řetězce v jiném příkazu', () => {
            const sql = "INSERT INTO Logs VALUES ('SELECT * FROM Users')";
            expect(() => preprocessQuery(sql)).toThrow('V tvém příkazu jsou nějaká nehezká slova.');
        });
    });
});

describe('SQL Validator Engine - isSuccessful', () => {

    const refQuery = "SELECT id, name, score FROM players;";
    const diffQuery = "SELECT id, name, score FROM players WHERE 1=1;";
    const refCols = ['id', 'name', 'score'];
    const refVals = [
        [1, 'Alice', 100],
        [2, 'Bob', 50],
        [3, 'Charlie', 10]
    ];
    const refRes = createRes(refCols, refVals);


    describe('1. Fast-Pass a Základní shoda', () => {
        it('ÚSPĚCH: Zcela identický text dotazu (včetně mezer) projde okamžitě', () => {
            expect(isSuccessful(refQuery, refQuery, refRes, refRes)).toBe(true);
        });

        it('ÚSPĚCH: Identická data, jiný text dotazu', () => {
            expect(isSuccessful(diffQuery, refQuery, refRes, refRes)).toBe(true);
        });
    });


    describe('2. Absolutní volnost (Žádná pravidla)', () => {
        it('ÚSPĚCH: Zvládne prohozené řádky', () => {
            const userRes = createRes(refCols, [
                [3, 'Charlie', 10],
                [1, 'Alice', 100],
                [2, 'Bob', 50]
            ]);
            expect(isSuccessful(diffQuery, refQuery, userRes, refRes, [])).toBe(true);
        });

        it('ÚSPĚCH: Zvládne prohozené sloupce (spoléhá na data intersect)', () => {
            const userRes = createRes(['score', 'id', 'name'], [
                [100, 1, 'Alice'],
                [50, 2, 'Bob'],
                [10, 3, 'Charlie']
            ]);
            expect(isSuccessful(diffQuery, refQuery, userRes, refRes, [])).toBe(true);
        });

        it('ÚSPĚCH: Zvládne prohozené sloupce, prohozené řádky i jiné aliasy najednou', () => {
            const userRes = createRes(['body', 'jmeno', 'identifikator'], [
                [50, 'Bob', 2],
                [10, 'Charlie', 3],
                [100, 'Alice', 1]
            ]);
            expect(isSuccessful(diffQuery, refQuery, userRes, refRes, [])).toBe(true);
        });
    });


    describe('3. Pravidlo: strict_row_order', () => {
        it('SELŽE: Řádky jsou v jiném pořadí', () => {
            const userRes = createRes(refCols, [
                [2, 'Bob', 50], [1, 'Alice', 100], [3, 'Charlie', 10]
            ]);
            expect(isSuccessful(diffQuery, refQuery, userRes, refRes, ['strict_row_order'])).toBe(false);
        });

        it('ÚSPĚCH: Řádky jsou ve správném pořadí, ale sloupce prohozené', () => {
            const userRes = createRes(['name', 'id', 'score'], [
                ['Alice', 1, 100], ['Bob', 2, 50], ['Charlie', 3, 10]
            ]);
            expect(isSuccessful(diffQuery, refQuery, userRes, refRes, ['strict_row_order'])).toBe(true);
        });
    });


    describe('4. Pravidlo: strict_column_order', () => {
        it('SELŽE: Sloupce jsou v jiném pořadí', () => {
            const userRes = createRes(['name', 'id', 'score'], [
                ['Alice', 1, 100], ['Bob', 2, 50], ['Charlie', 3, 10]
            ]);
            expect(isSuccessful(diffQuery, refQuery, userRes, refRes, ['strict_column_order'])).toBe(false);
        });

        it('ÚSPĚCH: Sloupce jsou ve správném pořadí, ale mají jiné názvy (aliasy)', () => {
            const userRes = createRes(['ident', 'jmeno', 'body'], refVals);
            expect(isSuccessful(diffQuery, refQuery, userRes, refRes, ['strict_column_order'])).toBe(true);
        });
    });


    describe('5. Pravidlo: strict_as', () => {
        it('SELŽE: Názvy sloupců (aliasy) se neshodují', () => {
            const userRes = createRes(['id', 'jmeno', 'score'], refVals);
            expect(isSuccessful(diffQuery, refQuery, userRes, refRes, ['strict_as'])).toBe(false);
        });

        it('ÚSPĚCH: Názvy sloupců sedí, ale jsou v jiném pořadí', () => {
            const userRes = createRes(['score', 'id', 'name'], [
                [100, 1, 'Alice'], [50, 2, 'Bob'], [10, 3, 'Charlie']
            ]);
            expect(isSuccessful(diffQuery, refQuery, userRes, refRes, ['strict_as'])).toBe(true);
        });
    });


    describe('6. Kombinace pravidel', () => {
        it('SELŽE: strict_as + strict_column_order (Správná jména, ale špatné pořadí)', () => {
            const userRes = createRes(['name', 'id', 'score'], [
                ['Alice', 1, 100], ['Bob', 2, 50], ['Charlie', 3, 10]
            ]);
            expect(isSuccessful(diffQuery, refQuery, userRes, refRes, ['strict_as', 'strict_column_order'])).toBe(false);
        });

        it('SELŽE: strict_as + strict_column_order (Správné pořadí, ale špatná jména)', () => {
            const userRes = createRes(['id', 'nick', 'score'], refVals);
            expect(isSuccessful(diffQuery, refQuery, userRes, refRes, ['strict_as', 'strict_column_order'])).toBe(false);
        });

        it('ÚSPĚCH: Všechna 3 pravidla splněna', () => {
            expect(isSuccessful(diffQuery, refQuery, refRes, refRes, ['strict_as', 'strict_column_order', 'strict_row_order'])).toBe(true);
        });
    });


    describe('7. Strukturální chyby a prázdná data', () => {
        it('ÚSPĚCH: Obě tabulky jsou prázdné', () => {
            expect(isSuccessful(diffQuery, refQuery, createRes([], []), createRes([], []))).toBe(true);
        });

        it('SELŽE: Jedna tabulka je prázdná a druhá ne', () => {
            expect(isSuccessful(diffQuery, refQuery, createRes([], []), refRes)).toBe(false);
        });

        it('SELŽE: Jiný počet sloupců', () => {
            const userRes = createRes(['id', 'name'], [[1, 'Alice'], [2, 'Bob'], [3, 'Charlie']]);
            expect(isSuccessful(diffQuery, refQuery, userRes, refRes)).toBe(false);
        });

        it('SELŽE: Jiný počet řádků', () => {
            const userRes = createRes(refCols, [[1, 'Alice', 100], [2, 'Bob', 50]]);
            expect(isSuccessful(diffQuery, refQuery, userRes, refRes)).toBe(false);
        });
    });


    describe('8. Robustnost a komplexní datové typy', () => {
        const complexCols = ['id', 'is_active', 'note', 'ratio'];
        const complexVals = [
            [1, 1, 'Nový\nřádek', 1.5],
            [2, 0, null, 2.0],
            [3, 1, '', 0.0]
        ];
        const complexRes = createRes(complexCols, complexVals);

        it('ÚSPĚCH: Porovná správně NULL, prázdné stringy, čísla s plovoucí čárkou a odřádkování', () => {
            const userRes = createRes(['note', 'id', 'ratio', 'is_active'], [
                [null, 2, 2.0, 0],
                ['', 3, 0.0, 1],
                ['Nový\nřádek', 1, 1.5, 1]
            ]);
            expect(isSuccessful(diffQuery, "SELECT * FROM t;", userRes, complexRes, [])).toBe(true);
        });

        it('SELŽE: Rozliší NULL od prázdného řetězce ("")', () => {
            const userRes = createRes(complexCols, [
                [1, 1, 'Nový\nřádek', 1.5],
                [2, 0, '', 2.0], 
                [3, 1, '', 0.0]
            ]);
            expect(isSuccessful(diffQuery, "SELECT * FROM t;", userRes, complexRes, [])).toBe(false);
        });
    });


    describe('9. Zátěžový test Backtrackingu (Duplicitní sloupce)', () => {
        it('ÚSPĚCH: Backtracking se nezasekne a spáruje identické sloupce', () => {
            const dupRefRes = createRes(['a', 'b', 'c'], [
                [1, 1, 'X'],
                [2, 2, 'Y'],
                [3, 3, 'Z']
            ]);
            const userRes = createRes(['b', 'c', 'a'], [
                [2, 'Y', 2],
                [1, 'X', 1],
                [3, 'Z', 3]
            ]);
            expect(isSuccessful(diffQuery, "SELECT * FROM t;", userRes, dupRefRes, [])).toBe(true);
        });
    });

    describe('10. Datové typy a Case Sensitivity (Velká/Malá písmena)', () => {
        const refCols = ['id', 'jmeno'];
        const refVals = [[1, 'Alice'], [2, 'Bob']];
        const refRes = createRes(refCols, refVals);

        it('SELŽE: Rozlišuje velká a malá písmena v datech (Data Case Sensitivity)', () => {
            const userRes = createRes(['id', 'jmeno'], [
                [1, 'ALICE'],
                [2, 'bob']
            ]);
            expect(isSuccessful('Q1', 'Q2', userRes, refRes, [])).toBe(false);
        });

        it('SELŽE: Rozlišuje čísla a texty (1 vs "1")', () => {
            const userRes = createRes(['id', 'jmeno'], [
                ['1', 'Alice'],
                ['2', 'Bob']
            ]);
            expect(isSuccessful('Q1', 'Q2', userRes, refRes, [])).toBe(false);
        });

        it('SELŽE: Pravidlo strict_as je citlivé na velikost písmen u sloupců', () => {
            const userRes = createRes(['ID', 'JMENO'], refVals);
            expect(isSuccessful('Q1', 'Q2', userRes, refRes, ['strict_as'])).toBe(false);
        });

        it('ÚSPĚCH: Bez strict_as nezáleží na velikosti písmen u sloupců (namapuje se přes data)', () => {
            const userRes = createRes(['ID', 'JMENO'], refVals);
            expect(isSuccessful('Q1', 'Q2', userRes, refRes, [])).toBe(true);
        });
    });

    describe('11. Speciální znaky a agregační funkce (COUNT, SUM)', () => {
        const refCols = ['oddeleni', 'COUNT(*)'];
        const refVals = [['IT', 5], ['HR', 2]];
        const refRes = createRes(refCols, refVals);

        it('ÚSPĚCH: Zvládne spárovat sloupce s agregací, i když si hráč udělal vlastní alias', () => {
            const userRes = createRes(['pocet_lidi', 'oddeleni'], [
                [2, 'HR'],
                [5, 'IT']
            ]);
            expect(isSuccessful('Q1', 'Q2', userRes, refRes, [])).toBe(true);
        });

        it('SELŽE: Pokud hráč použije vlastní alias, ale ty vyžaduješ strict_as', () => {
            const userRes = createRes(['oddeleni', 'pocet_lidi'], refVals);
            expect(isSuccessful('Q1', 'Q2', userRes, refRes, ['strict_as'])).toBe(false);
        });
    });

    describe('12. Extrémní formátování mezer (Whitespace)', () => {
        it('ÚSPĚCH: Ignoruje zbytečné středníky a mezery navíc v čistém SQL', () => {
            const uglyUserQuery = "   SELECT * FROM test  ;  ;   ";
            const cleanRefQuery = "SELECT * FROM test;";
            expect(isSuccessful(uglyUserQuery, cleanRefQuery, null, null, [])).toBe(true);
        });

        it('SELŽE: Uznává mezery UVNITŘ dat jako rozdíl', () => {
            const refRes = createRes(['jmeno'], [['Jan Novák']]);
            const userRes = createRes(['jmeno'], [['Jan  Novák']]);
            expect(isSuccessful('Q1', 'Q2', userRes, refRes, [])).toBe(false);
        });
    });


});