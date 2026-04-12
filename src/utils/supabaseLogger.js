import { supabase } from '../supabaseClient';

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
