export interface PlayerStats {
    steamId: string;
    name: string;
    elo1v1: number | null;
    eloTG: number | null;
    winRate1v1: number | null;
    gamesPlayed: number;
    streak: number;
    rank: number | null;
    debug?: any;
}

import { supabase } from './supabase';

/**
 * Obtiene las estadísticas usando el ID numérico de AoE2 Companion.
 */
export const fetchPlayerStats = async (steamId: string, aoeCompanionId: string): Promise<PlayerStats | null> => {
    if (!aoeCompanionId) return null;

    try {
        console.log("🔍 Iniciando petición para ID:", aoeCompanionId);

        // Obtenemos la URL y la Key directamente del cliente de supabase para no fallar
        const supabaseUrl = (supabase as any).supabaseUrl;
        const supabaseKey = (supabase as any).supabaseKey;

        const response = await fetch(`${supabaseUrl}/functions/v1/proxy-match-history`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
            },
            body: JSON.stringify({ profileId: aoeCompanionId })
        });

        if (!response.ok) {
            console.error(`❌ Error en Edge Function (HTTP ${response.status})`);
            return null;
        }

        const data = await response.json();
        const stats = data.stats;

        if (!stats) {
            console.error("❌ La respuesta no contiene estadísticas válidas");
            return null;
        }

        console.log("📦 Datos recibidos del Oráculo:", stats);

        // --- FALLBACK DE EMERGENCIA (CLIENT-SIDE PARSING) ---
        // Si la función en la nube falló al parsear (porque el regex es viejo),
        // lo hacemos aquí mismo en el navegador usando los datos RAW que la nube siempre envía.

        let finalElo1v1 = stats.elo1v1;
        let finalEloTG = stats.eloTG;
        let finalRank = stats.rank;
        let finalWinRate = stats.winRate;

        if (finalElo1v1 === null && stats.debug?.raw1v1) {
            const raw = stats.debug.raw1v1;
            const eloMatch = raw.match(/\((\d+)\)/);
            if (eloMatch) finalElo1v1 = parseInt(eloMatch[1]);

            const rankMatch = raw.match(/Rank\s#(\d+)/);
            if (rankMatch) finalRank = parseInt(rankMatch[1]);

            const winMatch = raw.match(/(\d+)%\swinrate/);
            if (winMatch) finalWinRate = parseInt(winMatch[1]);
        }

        if (finalEloTG === null && stats.debug?.rawTG) {
            const rawTG = stats.debug.rawTG;
            const eloMatchTG = rawTG.match(/\((\d+)\)/);
            if (eloMatchTG) finalEloTG = parseInt(eloMatchTG[1]);
        }

        return {
            steamId: steamId || '',
            name: stats.name || "Desconocido",
            elo1v1: finalElo1v1,
            eloTG: finalEloTG,
            winRate1v1: finalWinRate,
            gamesPlayed: stats.gamesPlayed || 0,
            streak: 0,
            rank: finalRank,
            debug: stats.debug
        };

    } catch (error) {
        console.error("Error fatal al obtener stats:", error);
        return null;
    }
};

/**
 * Sincroniza y GUARDA en la base de datos de forma persistente.
 */
export const syncPlayerStats = async (profileId: string, steamId: string, aoeCompanionId: string) => {
    if (!aoeCompanionId) return null;

    const stats = await fetchPlayerStats(steamId, aoeCompanionId);
    if (!stats) return null;

    const { error } = await supabase
        .from('profiles')
        .update({
            elo_1v1: stats.elo1v1,
            elo_tg: stats.eloTG,
            win_rate_1v1: stats.winRate1v1,
            rank_1v1: stats.rank,
            last_stats_update: new Date().toISOString()
        })
        .eq('id', profileId);

    if (error) console.error('Error al persistir en Supabase:', error);
    return stats;
};

export const fetchMatchHistory = async (steamId: string, _c: number, aoeCompanionId: string) => {
    if (!aoeCompanionId) return [];

    try {
        // Intentamos llamar DIRECTAMENTE a la API de AoE2 Companion
        // Esta API suele permitir peticiones desde navegadores (CORS friendly)
        const response = await fetch(`https://data.aoe2companion.com/api/v2/matches?profile_id=${aoeCompanionId}&limit=10`);

        if (!response.ok) {
            console.error("❌ La API directa de AoE2 falló o bloqueó el acceso.");
            return [];
        }

        const data = await response.json();

        // La API de v2 devuelve { matches: [...] }
        return data.matches || [];

    } catch (error) {
        console.warn("⚠️ Error en llamada directa, intentando vía Proxy de emergencia...");
        // Si falla por CORS o red, el error se captura aquí.
        return [];
    }
};

export const getClanMatches = async (_m: any) => [];
