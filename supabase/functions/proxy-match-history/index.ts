import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Usamos EXACTAMENTE el PROJECT_URL de tu script de referencia
const PROJECT_URL = "https://github.com/jesus18112003/AoEDash";

const fetchFromAPI = async (profileId: string, leaderboardId: number) => {
    const url = `https://data.aoe2companion.com/api/nightbot/rank?profile_id=${profileId}&leaderboard_id=${leaderboardId}`;
    try {
        const res = await fetch(url, { headers: { "User-Agent": PROJECT_URL } });
        if (!res.ok) return { error: `HTTP ${res.status}`, raw: "" };

        let text = await res.text();
        // Limpiar el texto de comillas y espacios raros
        text = text.trim().replace(/\u00A0/g, " ").replace(/^"|"$/g, "");

        // Intentar extraer ELO: "Nombre (1234)"
        const eloMatch = text.match(/\(( \d+ | \d+ )\)/) || text.match(/\((\d+)\)/);
        const elo = eloMatch ? parseInt(eloMatch[1]) : null;

        // Intentar extraer Rank: "Rank #123"
        const rankMatch = text.match(/Rank\s#(\d+)/);
        const rank = rankMatch ? parseInt(rankMatch[1]) : null;

        // Intentar extraer Winrate: "12% winrate"
        const winrateMatch = text.match(/(\d+)%\swinrate/);
        const winrate = winrateMatch ? parseInt(winrateMatch[1]) : null;

        // Intentar extraer Nombre: Todo antes del primer '('
        let name = "Desconocido";
        if (text.includes('(')) {
            name = text.split('(')[0].trim().replace(/^\?+\s*/, "");
        }

        if (elo !== null || rank !== null) {
            return {
                data: {
                    name: name,
                    elo: elo,
                    rank: rank,
                    winrate: winrate
                },
                raw: text
            };
        }

        return { error: "Formato no reconocido", raw: text };
    } catch (e) {
        return { error: e.message, raw: "" };
    }
};

const fetchMatches = async (profileId: string) => {
    const url = `https://data.aoe2companion.com/api/v2/matches?profile_id=${profileId}&limit=10`;
    try {
        const res = await fetch(url, { headers: { "User-Agent": PROJECT_URL } });
        if (!res.ok) return { error: `HTTP ${res.status}` };
        const data = await res.json();
        return { data: data.matches || [] };
    } catch (e) {
        return { error: e.message };
    }
};

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const { profileId, action } = await req.json();
        if (!profileId) throw new Error("Missing profileId");

        console.log(`[ORACLE] Iniciando consulta para ID: ${profileId}, Acción: ${action || 'stats'}`);

        if (action === 'matches') {
            const matchesRes = await fetchMatches(profileId);
            return new Response(JSON.stringify({ profileId, matches: matchesRes.data || [], error: matchesRes.error }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Por defecto: Stats
        const [res1v1, resTG] = await Promise.all([
            fetchFromAPI(profileId, 3), // 1v1
            fetchFromAPI(profileId, 4)  // TG
        ]);

        const stats = {
            name: res1v1.data?.name || resTG.data?.name || "Desconocido",
            elo1v1: res1v1.data?.elo || null,
            eloTG: resTG.data?.elo || null,
            winRate: res1v1.data?.winrate || resTG.data?.winrate || 0,
            rank: res1v1.data?.rank || null,
            debug: {
                raw1v1: res1v1.raw,
                rawTG: resTG.raw,
                err1v1: res1v1.error,
                errTG: resTG.error
            }
        };

        return new Response(JSON.stringify({ profileId, stats }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
