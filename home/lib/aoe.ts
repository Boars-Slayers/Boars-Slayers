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
        const { data, error } = await supabase.functions.invoke('proxy-match-history', {
            body: { profileId: aoeCompanionId }
        });

        if (error) {
            console.error("Error en Edge Function:", error);
            return null;
        }

        const { stats } = data;

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

export const fetchMatchHistory = async (_s: string, _c: number, _a: string) => [];
export const getClanMatches = async (_m: any) => [];
