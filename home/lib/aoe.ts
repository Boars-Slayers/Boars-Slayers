export interface PlayerStats {
    steamId: string;
    name: string;
    elo1v1: number | null;
    eloTG: number | null;
    winRate1v1: number | null;
    gamesPlayed: number;
    streak: number;
    rank: number | null;
}

import { supabase } from './supabase';

/**
 * STRICTLY fetches player stats using the ao2insights numeric ID via Edge Function.
 */
export const fetchPlayerStats = async (steamId: string, aoeProfileId?: string | null): Promise<PlayerStats | null> => {
    // If we don't have the numeric ID, we don't call the API.
    if (!aoeProfileId) {
        console.warn("Cannot fetch stats: Missing numeric AoE Profile ID (aoe2insights ID).");
        return null;
    }

    try {
        const { data, error } = await supabase.functions.invoke('proxy-match-history', {
            body: {
                profileId: aoeProfileId
            }
        });

        if (error || !data?.stats) {
            console.warn("Failed to fetch AoE stats via proxy:", error);
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
            rank: stats.rank || null
        };

    } catch (error) {
        console.warn("Failed to fetch AoE stats:", error);
        return null;
    }
};

/**
 * Fetches stats and saves them to Supabase.
 */
export const syncPlayerStats = async (profileId: string, steamId: string, aoeProfileId?: string | null) => {
    if (!aoeProfileId) return null;

    const stats = await fetchPlayerStats(steamId, aoeProfileId);
    if (!stats) return null;

    const { error } = await supabase
        .from('profiles')
        .update({
            elo_1v1: stats.elo1v1,
            elo_tg: stats.eloTG,
            win_rate_1v1: stats.winRate1v1,
            games_played: stats.gamesPlayed,
            rank_1v1: stats.rank,
            last_stats_update: new Date().toISOString()
        })
        .eq('id', profileId);

    if (error) console.error('Error saving stats to Supabase:', error);
    return stats;
};

export const fetchMatchHistory = async (_steamId: string, _count: number = 10, _aoeProfileId?: string | null): Promise<import('../types').Match[]> => {
    return [];
};

export const getClanMatches = async (_members: { steamId?: string, aoeProfileId?: string | null }[]): Promise<import('../types').Match[]> => {
    return [];
};
