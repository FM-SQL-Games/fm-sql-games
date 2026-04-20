import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

const isValidUrl = (url) => {
    try {
        new URL(url);
        return true;
    } catch (error) {
        console.error('Neplatná URL: ', error);
        return false;
    }
};

export let isSupabaseConfigured = Boolean(supabaseKey && supabaseUrl && isValidUrl(supabaseUrl));

export let supabase = null;

if (isSupabaseConfigured) {
    try {
        supabase = createClient(supabaseUrl, supabaseKey);
    } catch (error) {
        console.error('Chyba při inicializaci Supabase klienta:', error);
        isSupabaseConfigured = false;
    }
}

if (isSupabaseConfigured && supabase) {
    (async () => {
        try {
            const { error } = await supabase.from('leaderboard').select('id').limit(1);
            if (error) {
                console.warn('Chyba při testování připojení k Supabase:', error.message);
                isSupabaseConfigured = false;
            }
        } catch (err) {
            console.warn('Chyba při komunikaci se Supabase:', err);
            isSupabaseConfigured = false;
        }
    })();
}

if (!isSupabaseConfigured && (!supabaseUrl || !supabaseKey)) {
    console.warn(
        ' Aplikace běží v lokálním režimu. ENV proměnné pro Supabase chybí. Logování a žebříček jsou deaktivovány.'
    );
}
