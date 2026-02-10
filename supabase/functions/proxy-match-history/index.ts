import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// URL de este proyecto para cumplir con el requisito de User-Agent de la API de AoE2 Companion
const PROJECT_URL = "https://github.com/Boars-Slayers/Boars-Slayers";

const pattern = /(.+?)\s\((\d+)\)\sRank\s#(\d+).*?(\d+)%\swinrate/;

const fetchNightbotStats = async (profileId: string, leaderboardId: number = 3) => {
    const url = `https://data.aoe2companion.com/api/nightbot/rank?profile_id=${profileId}&leaderboard_id=${leaderboardId}`;
    try {
        const res = await fetch(url, {
            headers: { "User-Agent": PROJECT_URL }
        });

        if (!res.ok) return null;

        let text = await res.text();
        // Limpiamos la respuesta de comillas y espacios especiales como en la lógica de referencia
        text = text.trim().replace(/\u00A0/g, " ").replace(/^"|"$/g, "");

        const match = text.match(pattern);
        if (match) {
            return {
                name: match[1].trim(),
                elo: parseInt(match[2]),
                rank: parseInt(match[3]),
                winrate: parseInt(match[4])
            };
        }
        return null;
    } catch (e) {
        console.error(`Error fetching LB ${leaderboardId} for ${profileId}:`, e);
        return null;
    }
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { profileId } = await req.json();

        if (!profileId) {
            return new Response(JSON.stringify({ error: 'Missing numeric profileId' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Ejecutamos las tareas concurrentemente (asyncio gather)
        const [stats1v1, statsTG] = await Promise.all([
            fetchNightbotStats(profileId, 3), // 1v1 RM
            fetchNightbotStats(profileId, 4)  // Team RM
        ]);

        if (!stats1v1 && !statsTG) {
            return new Response(JSON.stringify({
                profileId,
                stats: null,
                error: 'Player not found with this numeric ID'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Combinamos los datos para reflejarlos en los cuadros del perfil
        const combinedStats = {
            name: stats1v1?.name || statsTG?.name || "Unknown",
            elo1v1: stats1v1?.elo || null,
            eloTG: statsTG?.elo || null,
            winRate: stats1v1?.winrate || statsTG?.winrate || 0,
            rank: stats1v1?.rank || null,
            gamesPlayed: 0
        };

        return new Response(JSON.stringify({
            profileId,
            stats: combinedStats
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
