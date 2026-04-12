import { supabase } from '../supabaseClient';
/**
 * Loguje každý pokus uživatele o provedení SQL dotazu do SupaBase.
 * @param {Object} queryData - Data o SQL dotazu
 * @param {string} queryData.gameName - Název hry
 * @param {string} queryData.sceneId - ID scény
 * @param {string} queryData.query - SQL dotaz
 * @param {boolean} queryData.isCorrect - Indikátor správnosti dotazu
 * @param {string|null} queryData.error - Chybová zpráva
 * @param {string} queryData.sessionId - ID relace
 */
export const logQueryToSupabase = async (queryData) => {
    const { error } = await supabase.from('query_logs').insert([
        {
            game_name: queryData.gameName,
            scene_id: queryData.sceneId,
            query: queryData.query,
            is_correct: queryData.isCorrect,
            error: queryData.error || null,
            session_id: queryData.sessionId,
        },
    ]);
    if (error) {
        console.error('Chyba při logování:', error.message);
    }
};

/**
 * Uloží finální dosažené skóre hráče do leaderboardu.
 * @param {string} gameName - Název hry
 * @param {string} playerName - Přezdívka hráče
 * @param {number} score - Celkový počet bodů
 * @param {string} sessionId - ID relace
 */
export const saveLeaderboardScore = async (gameName, playerName, score, sessionId) => {
    const { error } = await supabase.from('leaderboard').insert([
        {
            game_name: gameName,
            player_name: playerName,
            score: score,
            session_id: sessionId,
        },
    ]);
    if (error) {
        console.error('Chyba při ukládání skóre:', error.message);
    }
};
/**
 * Načte data z leaderboardu pro danou hru.
 * @param {string} gameName - Název hry
 * @returns {Promise<Array>} - Pole s daty z leaderboardu
 */
export const fetchLeaderboardData = async (gameName) => {
    try {
        const { data, error } = await supabase
            .from('leaderboard')
            .select('id, player_name, score, created_at')
            .eq('game_name', gameName)
            .order('score', { ascending: false })
            .order('created_at', { ascending: true })
            .limit(100);

        if (error) {
            console.error('Chyba při stahování leaderboardu:', error.message);
            return [];
        }

        return data || [];
    } catch (err) {
        console.error('Chyba při komunikaci se Supabase:', err);
        return [];
    }
};
/**
 * Loguje chyby do SupaBase.
 * @param {Object} errorData - Data o chybě
 * @param {string} errorData.sessionId - ID relace
 * @param {string} errorData.gameName - Název hry
 * @param {string} errorData.type - Typ chyby
 * @param {string} errorData.message - Chybová zpráva
 * @param {string|null} errorData.stack - Stack trace
 */
export const logErrorToSupabase = async (errorData) => {
    const { error } = await supabase.from('error_logs').insert([
        {
            session_id: errorData.sessionId,
            game_name: errorData.gameName,
            error_type: errorData.type,
            message: errorData.message,
            stack_trace: errorData.stack || null,
        },
    ]);
    if (error) {
        console.error('Chyba při logování erroru:', error.message);
    }
};
