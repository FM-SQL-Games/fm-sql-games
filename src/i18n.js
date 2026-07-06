import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

export const SUPPORTED_LANGUAGES = {
    cs: { label: 'Čeština' },
    en: { label: 'English' }
};

const resources = {
    cs: {
        translation: {
            navbar: {
                games: 'Knihovna her',
                leaderboard: 'Žebříček',
                feedback: 'Dej nám feedback!'
            },
            home: {
                title: 'Výuková platforma pro SQL',
                subtitle: 'Procvičuj si databázový jazyk SQL zábavnou formou. Místo suché teorie na tebe čekají tematické minihry, ve kterých řešíš problémy pomocí SQL dotazů.',
                play: 'HRÁT',
                coming_soon: 'JIŽ BRZY',
                no_games: 'Pro tento jazyk nejsou zatím dostupné žádné hry.'
            },
            setup: {
                label: 'Zadej svou přezdívku:',
                placeholder: 'Tvoje přezdívka...',
                back: 'ZPĚT',
                error_short: 'Přezdívka musí být alespoň 3 znaky dlouhá.',
                error_profane: 'Tato přezdívka obsahuje nevhodné výrazy. Zvol prosím jinou.'
            },
            leaderboard: {
                title: 'Žebříček nejlepších hráčů',
                th_rank: '#',
                th_player: 'Přezdívka',
                th_score: 'Skóre',
                th_date: 'Datum',
                loading: 'Načítám data z databáze...',
                local_mode: 'Aplikace běží v lokálním testovacím režimu. Připojení k online žebříčku není dostupné.',
                no_records: 'Zatím zde nejsou žádné záznamy. Buď první!'
            },
            load_dialog: {
                title: 'Byla nalezena rozehraná hra!',
                text: 'Našli jsme tvůj předchozí postup (splněno: {{count}}). Chceš v něm pokračovat?',
                yes: 'Ano',
                no: 'Ne'
            },
            victory: {
                title: 'MISE DOKONČENA!',
                success_msg: 'Úspěšně jsi pokořil výzvu ve hře {{gameName}}',
                final_score: 'Tvé finální skóre:',
                local_mode: 'Lokální režim - Ukládání do online žebříčku je deaktivováno.',
                save_hint: 'Přeješ si uložit výsledek do leaderboardu pod přezdívkou {{playerName}}?',
                save_btn: 'Uložit do žebříčku',
                success_sent: 'Skóre bylo úspěšně odesláno!',
                back_to_menu: 'Zpět do menu',
                play_again: 'Hrát znovu'
            },
            game: {
                editor_placeholder: 'SEM PIŠ DOTAZY',
                system_error: 'Systémová chyba',
                detail: 'Detail:',
                db_init_fail: 'Nepodařilo se správně připravit herní prostředí. Zkontroluj připojení k internetu nebo zkus stránku obnovit.',
                refresh_page: 'Obnovit stránku',
                back_to_menu: 'Zpět do menu',
                btn_back: ' Zpět',
                btn_table: '📊 Tabulka',
                btn_schema: '📜 Schéma',
                btn_hint: '💡 Nápověda',
                query_result: 'VÝSLEDEK DOTAZU',
                no_data: 'Zatím žádná data. Spusť dotaz!',
                schema_title: 'SCHÉMA',
                no_schema: 'Dokumentace k této databázi nebyla nalezena.',
                hint_title: 'NÁPOVĚDA',
                hint_intro: 'K vyřešení tohoto úkolu zkus použít tyto příkazy:',
                definition_missing: ' - (Definice chybí)',
                answer_is: 'ODPOVĚĎ JE',
                no_hint: 'Pro tuto úroveň není k dispozici žádná speciální nápověda.',
                info_player: 'Přezdívka:',
                info_scene: 'Scéna:',
                info_score: 'Skóre:',
                task_title: 'Úkol {{id}}',
                execute_btn: 'PROVÉST DOTAZ',
                force_pass_msg: 'Z důvodu technické chyby v zadání tě pouštíme dál!',
                empty_data_error: 'Dotaz nevrátil žádná data.',
                finish_game_btn: ' DOKONČIT HRU '
            },
            validator: {
                multiple_queries: 'Pouze jeden dotaz najednou!',
                profanity: 'V tvém příkazu jsou nějaká nehezká slova.',
                syntax_error: 'Chyba v syntaxi.',
                empty_result: 'Dotaz nevrátil žádná data. Zkontroluj podmínky ve WHERE nebo název tabulky.',
                less_columns: 'Výsledek má méně sloupců. Vybíráš správné sloupce za SELECT?',
                more_columns: 'Výsledek má příliš mnoho sloupců. Zkontroluj SELECT.',
                less_rows: 'Výsledek má méně řádků. Filtrujete příliš přísně?',
                more_rows: 'Výsledek má příliš mnoho řádků. Zkus zpřesnit podmínky nebo typ JOINu.',
                column_mismatch: 'Sloupce se nepodařilo namapovat. Zkontroluj vybrané hodnoty.',
                row_order: 'Data sedí, ale pořadí řádků nesedí - zkontroluj ORDER BY.',
                value_mismatch: 'Počet řádků i sloupců sedí, ale hodnoty se neshodují.'
            }
        }
    },
    en: {
        translation: {
            navbar: {
                games: 'Games Library',
                leaderboard: 'Leaderboard',
                feedback: 'Give us feedback!'
            },
            home: {
                title: 'SQL Learning Platform',
                subtitle: 'Practice the SQL database language in a fun way. Instead of dry theory, themed minigames await you, where you solve problems using SQL queries.',
                play: 'PLAY',
                coming_soon: 'COMING SOON',
                no_games: 'There are currently no games available for this language.'
            },
            setup: {
                label: 'Enter your nickname:',
                placeholder: 'Your nickname...',
                back: 'BACK',
                error_short: 'Nickname must be at least 3 characters long.',
                error_profane: 'This nickname contains inappropriate language. Please choose another one.'
            },
            leaderboard: {
                title: 'Top Players Leaderboard',
                th_rank: '#',
                th_player: 'Nickname',
                th_score: 'Score',
                th_date: 'Date',
                loading: 'Loading data from database...',
                local_mode: 'Application is running in local testing mode. Online leaderboard connection is unavailable.',
                no_records: 'No records yet. Be the first one!'
            },
            load_dialog: {
                title: 'Saved game found!',
                text: 'We found your previous progress (completed: {{count}}). Do you want to continue?',
                yes: 'Yes',
                no: 'No'
            },
            victory: {
                title: 'MISSION ACCOMPLISHED!',
                success_msg: 'You have successfully conquered the challenge in {{gameName}}',
                final_score: 'Your final score:',
                local_mode: 'Local mode - Saving to online leaderboard is disabled.',
                save_hint: 'Do you want to save your score to the leaderboard under the nickname {{playerName}}?',
                save_btn: 'Save to Leaderboard',
                success_sent: 'Score was successfully submitted!',
                back_to_menu: 'Back to Menu',
                play_again: 'Play Again'
            },
            game: {
                editor_placeholder: 'WRITE QUERIES HERE',
                system_error: 'System Error',
                detail: 'Detail:',
                db_init_fail: 'Failed to prepare the game environment correctly. Please check your internet connection or try refreshing the page.',
                refresh_page: 'Refresh Page',
                back_to_menu: 'Back to Menu',
                btn_back: ' Back',
                btn_table: '📊 Table',
                btn_schema: '📜 Schema',
                btn_hint: '💡 Hint',
                query_result: 'QUERY RESULT',
                no_data: 'No data yet. Run a query!',
                schema_title: 'SCHEMA',
                no_schema: 'Documentation for this database was not found.',
                hint_title: 'HINT',
                hint_intro: 'To solve this task, try using these commands:',
                definition_missing: ' - (Definition missing)',
                answer_is: 'THE ANSWER IS',
                no_hint: 'No special hint is available for this level.',
                info_player: 'Nickname:',
                info_scene: 'Scene:',
                info_score: 'Score:',
                task_title: 'Task {{id}}',
                execute_btn: 'RUN QUERY',
                force_pass_msg: 'Due to a technical error in the assignment, we are letting you pass!',
                empty_data_error: 'The query returned no data.',
                finish_game_btn: ' FINISH GAME '
            },
            validator: {
                multiple_queries: 'Only one query at a time!',
                profanity: 'There are some inappropriate words in your command.',
                syntax_error: 'Syntax error.',
                empty_result: 'The query returned no data. Check your WHERE conditions or the table name.',
                less_columns: 'The result has fewer columns. Are you selecting the right columns after SELECT?',
                more_columns: 'The result has too many columns. Check your SELECT.',
                less_rows: 'The result has fewer rows. Are you filtering too strictly?',
                more_rows: 'The result has too many rows. Try refining your conditions or JOIN type.',
                column_mismatch: 'Failed to map columns. Check the selected values.',
                row_order: 'Data matches, but the row order does not - check your ORDER BY.',
                value_mismatch: 'Row and column counts match, but the values differ.'
            }
        }
    }
};

i18n.use(initReactI18next).init({
    resources,
    lng: 'cs', 
    fallbackLng: 'cs',
    interpolation: {
        escapeValue: false
    }
});

export default i18n;