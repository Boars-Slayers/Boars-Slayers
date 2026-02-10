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

        if (error || !data?.stats) {
            console.error("Error en Edge Function:", error);
            return null;
        }

        const { stats } = data;

        return {
            steamId: steamId || '',
            name: stats.name,
            elo1v1: stats.elo1v1,
            eloTG: stats.eloTG,
            winRate1v1: stats.winRate,
            gamesPlayed: stats.gamesPlayed || 0,
            streak: 0,
            rank: stats.rank,
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
