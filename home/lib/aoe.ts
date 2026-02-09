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

// Attempts to use available APIs (aoe2companion.com, etc)

export const fetchPlayerStats = async (steamId: string, aoeProfileId?: string | null): Promise<PlayerStats | null> => {
    let cleanId = steamId?.trim() || '';

    // If we have a profile ID, we can work even without valid Steam ID (if user data is messy)
    if (!cleanId && !aoeProfileId) return null;

    if (cleanId.includes('steamcommunity.com')) {
        const matches = cleanId.match(/\/profiles\/(\d{17})/);
        if (matches && matches[1]) {
            cleanId = matches[1];
        } else if (!aoeProfileId) {
            // Only fail if we don't have a profile ID fallback
            return null;
        }
    }

    try {
        const { data, error } = await supabase.functions.invoke('proxy-match-history', {
            body: {
                steamId: cleanId,
                profileId: aoeProfileId // Pass explicit profile ID if available
            }
        });

        if (error || !data?.stats) {
            console.warn("Failed to fetch AoE stats via proxy:", error);
            return null;
        }

        const { stats } = data;

        return {
            steamId: cleanId,
            name: stats.name,
            elo1v1: stats.elo1v1,
            eloTG: stats.eloTG, // This will be null if only nightbot is used, but we combined it
            winRate1v1: stats.winRate,
            gamesPlayed: stats.gamesPlayed,
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
            rank_1v1: stats.rank, // Saving global rank
            last_stats_update: new Date().toISOString()
        })
        .eq('id', profileId);

    if (error) console.error('Error saving stats to Supabase:', error);
    return stats;
};

export const fetchMatchHistory = async (steamId: string, _count: number = 10, aoeProfileId?: string | null): Promise<import('../types').Match[]> => {
    try {
        const { data, error } = await supabase.functions.invoke('proxy-match-history', {
            body: {
                steamId,
                profileId: aoeProfileId
            }
        });

        if (error) {
            console.error('Edge Function Error:', error);
            return [];
        }

        return data?.matches || [];
    } catch (error) {
        console.warn(`Failed to fetch matches for ${steamId}`, error);
        return [];
    }
};

export const getClanMatches = async (members: { steamId?: string, aoeProfileId?: string | null }[]): Promise<import('../types').Match[]> => {
    const allMatches: import('../types').Match[] = [];
    const validMembers = members.filter(m => m.steamId || m.aoeProfileId);

    const promises = validMembers.map(m => fetchMatchHistory(m.steamId || '', 10, m.aoeProfileId));
    const results = await Promise.all(promises);

    results.forEach(matches => allMatches.push(...matches));

    const uniqueMatches = Array.from(new Map(allMatches.map(m => [m.match_id, m])).values());

    return uniqueMatches.filter(_match => {
        // If we don't have player details from the scraper, we might need to assume it's a clan match if we found it through a member
        return true;
    }).sort(() => {
        // Fallback if started/finished are not available (scraper returns 0 usually)
        return 0;
    });
};
