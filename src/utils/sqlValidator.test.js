import { describe, it, expect } from 'vitest';
import { preprocessQuery, isSuccessful } from './sqlValidator';
import _ from 'lodash';

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

describe('isSuccessful() - Verze na FEATURE (Flexibilní pravidla)', () => {
    // --- Mock Data ---
    const refQuery = "SELECT user_id, username, role, score FROM Accounts;";
    const refRes = [{
        columns: ['user_id', 'username', 'role', 'score'],
        values: [
            [101, 'admin_alik', 'admin', 100.5],
            [102, 'guest_micka', 'guest', 0.0],
            [103, 'user_azor', 'user', 42.1]
        ]
    }];

    // Dotaz, který vrací stejná data, ale má jiný text 
    const diffQuery = "SELECT user_id, username, role, score FROM Accounts WHERE 1=1;";

    // --- 1. Základní flexibilita ---
    describe('Základní flexibilita (Bez pravidel)', () => {
        it('ÚSPĚCH: Uzná dotaz se stejným textem', () => {
            expect(isSuccessful(refQuery, refQuery, refRes, refRes)).toBe(true);
        });

        it('ÚSPĚCH: Nyní uzná správná data i v jiném pořadí řádků (Vyřešeno!)', () => {
            const userRes = [{
                columns: ['user_id', 'username', 'role', 'score'],
                values: [
                    [103, 'user_azor', 'user', 42.1],    
                    [101, 'admin_alik', 'admin', 100.5], 
                    [102, 'guest_micka', 'guest', 0.0]  
                ]
            }];
            expect(isSuccessful(diffQuery, refQuery, userRes, refRes, [])).toBe(true);
        });

        it('SELŽE: Pokud jsou data skutečně jiná (např. jiná hodnota score)', () => {
            const userRes = [{
                columns: ['user_id', 'username', 'role', 'score'],
                values: [
                    [101, 'admin_alik', 'admin', 100.5],
                    [102, 'guest_micka', 'guest', 0.0],
                    [103, 'user_azor', 'user', 99.9] 
                ]
            }];
            expect(isSuccessful(diffQuery, refQuery, userRes, refRes, [])).toBe(false);
        });
    });

    // --- 2. Pravidlo: strict_row_order ---
    describe('Pravidlo: strict_row_order', () => {
        it('SELŽE: Pokud jsou řádky prohozené a pravidlo je AKTIVNÍ', () => {
            const userRes = [{
                columns: ['user_id', 'username', 'role', 'score'],
                values: [
                    [102, 'guest_micka', 'guest', 0.0],
                    [101, 'admin_alik', 'admin', 100.5],
                    [103, 'user_azor', 'user', 42.1]
                ]
            }];
            expect(isSuccessful(diffQuery, refQuery, userRes, refRes, ['strict_row_order'])).toBe(false);
        });

        it('ÚSPĚCH: Pokud je pořadí přesné a pravidlo je AKTIVNÍ', () => {
            expect(isSuccessful(diffQuery, refQuery, refRes, refRes, ['strict_row_order'])).toBe(true);
        });
    });

    // --- 3. Pravidlo: strict_as ---
    describe('Pravidlo: strict_as (Aliasy a pořadí sloupců)', () => {
        it('ÚSPĚCH: Uzná prohozené sloupce, pokud hráč použil správné názvy (aliasy)', () => {
            const userRes = [{
                columns: ['role', 'score', 'user_id', 'username'], 
                values: [
                    ['admin', 100.5, 101, 'admin_alik'],
                    ['guest', 0.0, 102, 'guest_micka'],
                    ['user', 42.1, 103, 'user_azor']
                ]
            }];
            expect(isSuccessful(diffQuery, refQuery, userRes, refRes, ['strict_as'])).toBe(true);
        });

        it('SELŽE: Pokud hráč nepoužil správné názvy a strict_as je aktivní', () => {
            const userRes = [{
                columns: ['role', 'body', 'user_id', 'username'], 
                values: [
                    ['admin', 100.5, 101, 'admin_alik'],
                    ['guest', 0.0, 102, 'guest_micka'],
                    ['user', 42.1, 103, 'user_azor']
                ]
            }];
            expect(isSuccessful(diffQuery, refQuery, userRes, refRes, ['strict_as'])).toBe(false);
        });
    });

    // --- 4. Kombinace pravidel ---
    describe('Kombinace pravidel a specifické situace', () => {
        it('SELŽE: strict_as + strict_column_order (Sloupce prohozené, i když názvy sedí)', () => {
            const userRes = [{
                columns: ['username', 'user_id', 'role', 'score'],
                values: [
                    ['admin_alik', 101, 'admin', 100.5],
                    ['guest_micka', 102, 'guest', 0.0],
                    ['user_azor', 103, 'user', 42.1]
                ]
            }];
            expect(isSuccessful(diffQuery, refQuery, userRes, refRes, ['strict_as', 'strict_column_order'])).toBe(false);
        });

        it('SELŽE: Prohozené sloupce BEZ pravidla strict_as (Vrací se k porovnání surových matic)', () => {
            const userRes = [{
                columns: ['username', 'user_id', 'role', 'score'],
                values: [
                    ['admin_alik', 101, 'admin', 100.5],
                    ['guest_micka', 102, 'guest', 0.0],
                    ['user_azor', 103, 'user', 42.1]
                ]
            }];
            expect(isSuccessful(diffQuery, refQuery, userRes, refRes, [])).toBe(false);
        });

        it('ÚSPĚCH: Všechna 3 pravidla aktivní a data jsou naprosto identická', () => {
            const rules = ['strict_as', 'strict_column_order', 'strict_row_order'];
            expect(isSuccessful(diffQuery, refQuery, refRes, refRes, rules)).toBe(true);
        });
    });

    // --- 5. Strukturální a chybové stavy ---
    describe('Strukturální neshody a prázdné vstupy', () => {
        it('SELŽE: Pokud hráč vrátí jiný počet sloupců', () => {
            const userRes = [{
                columns: ['user_id', 'username', 'role'],
                values: [
                    [101, 'admin_alik', 'admin'],
                    [102, 'guest_micka', 'guest'],
                    [103, 'user_azor', 'user']
                ]
            }];
            expect(isSuccessful(diffQuery, refQuery, userRes, refRes, [])).toBe(false);
        });

        it('SELŽE: Pokud hráč vrátí jiný počet řádků', () => {
            const userRes = [{
                columns: ['user_id', 'username', 'role', 'score'],
                values: [
                    [101, 'admin_alik', 'admin', 100.5],
                    [102, 'guest_micka', 'guest', 0.0] 
                ]
            }];
            expect(isSuccessful(diffQuery, refQuery, userRes, refRes, [])).toBe(false);
        });

        it('SELŽE: Pokud userRes je prázdné pole', () => {
            expect(isSuccessful(diffQuery, refQuery, [], refRes)).toBe(false);
        });

        it('SELŽE: Pokud dotaz nevrátil žádné řádky (prázdné values)', () => {
            const userRes = [{ columns: ['user_id', 'username'], values: [] }];
            expect(isSuccessful(diffQuery, refQuery, userRes, refRes)).toBe(false);
        });
    });

    // --- 6. Test na dalších datech ---
    describe('Robustnost na další datech', () => {
        const robustRefQuery = "SELECT * FROM Students_Complex;";
        const robustDiffQuery = "SELECT * FROM Students_Complex WHERE id > 0;";

        const robustRes = [{
            columns: ['id', 'name', 'grade', 'is_active', 'note'],
            values: [
                [1, 'Jan Žluťoučký', 1.5, 1, 'Pravidelná docházka'],
                [2, 'Petr "Rychlý" O.', 2.0, 0, null],
                [3, 'Eva Nová', 1.0, 1, ''],
                [4, 'Marek Středník;', 3.5, 1, 'Zmatek; ve; střednících'],
                [5, 'Lucie\nNováková', 1.2, 0, 'Nový\nřádek v buňce']
            ]
        }];

        it('ÚSPĚCH: Zvládne porovnat data s diakritikou, uvozovkami, NULL a speciálními znaky', () => {
            expect(isSuccessful(robustDiffQuery, robustRefQuery, robustRes, robustRes)).toBe(true);
        });

        it('SELŽE: Pokud je v datech rozdíl mezi NULL a prázdným řetězcem', () => {
            const userRes = [{
                columns: ['id', 'name', 'grade', 'is_active', 'note'],
                values: [
                    [1, 'Jan Žluťoučký', 1.5, 1, 'Pravidelná docházka'],
                    [2, 'Petr "Rychlý" O.', 2.0, 0, ''], // NULL nahrazen prázdným řetězcem
                    [3, 'Eva Nová', 1.0, 1, ''],
                    [4, 'Marek Středník;', 3.5, 1, 'Zmatek; ve; střednících'],
                    [5, 'Lucie\nNováková', 1.2, 0, 'Nový\nřádek v buňce']
                ]
            }];
            expect(isSuccessful(robustDiffQuery, robustRefQuery, userRes, robustRes)).toBe(false);
        });

        it('SELŽE: Pokud je v datech rozdíl v hodnotě (např. grade 1.0 vs 1.2)', () => {
            const userRes = [{
                columns: ['id', 'name', 'grade', 'is_active', 'note'],
                values: [
                    [1, 'Jan Žluťoučký', 1.5, 1, 'Pravidelná docházka'],
                    [2, 'Petr "Rychlý" O.', 2.0, 0, null],
                    [3, 'Eva Nová', 1.2, 1, ''], // Zde je chyba (1.0 místo 1.2)
                    [4, 'Marek Středník;', 3.5, 1, 'Zmatek; ve; střednících'],
                    [5, 'Lucie\nNováková', 1.2, 0, 'Nový\nřádek v buňce']
                ]
            }];
            expect(isSuccessful(robustDiffQuery, robustRefQuery, userRes, robustRes)).toBe(false);
        });

        it('SELŽE: Pokud je v datech rozdíl v pořadí řádků a strict_row_order je aktivní', () => {
            const userRes = [{
                columns: ['id', 'name', 'grade', 'is_active', 'note'],
                values: [
                    [2, 'Petr "Rychlý" O.', 2.0, 0, null],
                    [1, 'Jan Žluťoučký', 1.5, 1, 'Pravidelná docházka'], // Prohozené řádky
                    [3, 'Eva Nová', 1.0, 1, ''],
                    [4, 'Marek Středník;', 3.5, 1, 'Zmatek; ve; střednících'],
                    [5, 'Lucie\nNováková', 1.2, 0, 'Nový\nřádek v buňce']
                ]
            }];
            expect(isSuccessful(robustDiffQuery, robustRefQuery, userRes, robustRes, ['strict_row_order'])).toBe(false);
        });

        it('SELŽE: Pokud je v datech rozdíl v hodnotě a strict_as je aktivní', () => {
            const userRes = [{
                columns: ['id', 'name', 'grade', 'is_active', 'note'],
                values: [
                    [1, 'Jan Žluťoučký', 1.5, 1, 'Pravidelná docházka'],
                    [2, 'Petr "Rychlý" O.', 2.0, 0, null],
                    [3, 'Eva Nová', 1.2, 1, ''], // Zde je chyba (1.0 místo 1.2)
                    [4, 'Marek Středník;', 3.5, 1, 'Zmatek; ve; střednících'],
                    [5, 'Lucie\nNováková', 1.2, 0, 'Nový\nřádek v buňce']
                ]
            }];
            expect(isSuccessful(robustDiffQuery, robustRefQuery, userRes, robustRes)).toBe(false);
        });
    });
});