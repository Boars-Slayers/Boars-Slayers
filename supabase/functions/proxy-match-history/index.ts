import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Usamos EXACTAMENTE el PROJECT_URL de tu script de referencia
const PROJECT_URL = "https://github.com/jesus18112003/AoEDash";

// Regex idéntico al de tu referencia
const pattern = /(.+?)\s\((\d+)\)\sRank\s#(\d+).*?(\d+)%\swinrate/;

const fetchFromAPI = async (profileId: string, leaderboardId: number) => {
    const url = `https://data.aoe2companion.com/api/nightbot/rank?profile_id=${profileId}&leaderboard_id=${leaderboardId}`;
    try {
        const res = await fetch(url, { headers: { "User-Agent": PROJECT_URL } });
        if (!res.ok) return { error: `HTTP ${res.status}`, raw: "" };

        let text = await res.text();
        text = text.trim().replace(/\u00A0/g, " ").replace(/^"|"$/g, "");

        const match = text.match(pattern);
        if (match) {
            return {
                data: {
                    name: match[1].trim(),
                    elo: parseInt(match[2]),
                    rank: parseInt(match[3]),
                    winrate: parseInt(match[4])
                },
                raw: text
            };
        }
        return { error: "No match", raw: text };
    } catch (e) {
        return { error: e.message, raw: "" };
    }
};

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const { profileId } = await req.json();
        if (!profileId) throw new Error("Missing profileId");

        console.log(`[ORACLE] Iniciando consulta para ID: ${profileId}`);

        // Llamadas concurrentes (asyncio.gather)
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
            // Debug info
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
