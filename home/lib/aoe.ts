export interface PlayerStats {
    steamId: string;
    name: string;
    elo1v1: number | null;
    eloTG: number | null;
    winRate1v1: number | null; // Percentage
    gamesPlayed: number;
    streak: number; // positive for win, negative for loss
    rank: number | null; // Global Rank from AoE2Companion
}

import { supabase } from './supabase';

/**
 * Fetches player stats using the Supabase Edge Function (which calls AoE2Companion API).
 */
export const fetchPlayerStats = async (steamId: string, aoeProfileId?: string | null): Promise<PlayerStats | null> => {
    // Prioritize aoeProfileId (numeric ID from aoe2insights/companion)
    const pid = aoeProfileId || steamId;

    if (!pid) return null;

    try {
        const { data, error } = await supabase.functions.invoke('proxy-match-history', {
            body: {
                profileId: pid
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
 * Fetches stats and saves them to Supabase to avoid hitting the API too often.
 */
export const syncPlayerStats = async (profileId: string, steamId: string, aoeProfileId?: string | null) => {
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

/**
 * Match history is now disabled in the Edge Function (scraping removed).
 * Returning empty for now to avoid frontend errors.
 */
export const fetchMatchHistory = async (_steamId: string, _count: number = 10, _aoeProfileId?: string | null): Promise<import('../types').Match[]> => {
    return [];
};

export const getClanMatches = async (_members: { steamId?: string, aoeProfileId?: string | null }[]): Promise<import('../types').Match[]> => {
    return [];
};
