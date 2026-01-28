export interface PlayerStats {
    steamId: string;
    name: string;
    elo1v1: number | null;
    eloTG: number | null;
    winRate1v1: number | null; // Percentage
    gamesPlayed: number;
    streak: number; // positive for win, negative for loss
}

import { supabase } from './supabase';

// Attempts to use available APIs (aoe2companion.com, etc)

export const fetchPlayerStats = async (steamId: string): Promise<PlayerStats | null> => {
    let cleanId = steamId.trim();

    if (cleanId.includes('steamcommunity.com')) {
        const matches = cleanId.match(/\/profiles\/(\d{17})/);
        if (matches && matches[1]) {
            cleanId = matches[1];
        } else {
            return null;
        }
    }

    if (!/^\d+$/.test(cleanId)) return null;

    try {
        // Use aoe2companion search API which is more reliable than nightbot text
        const response = await fetch(`https://data.aoe2companion.com/api/profiles?search=${cleanId}`);
        if (!response.ok) return null;

        const data = await response.json();
        const profiles = data.profiles || [];

        // Find the profile that matches steam_id (it might return multiple if searching by name)
        const profile = profiles.find((p: any) => p.steam_id === cleanId || p.profile_id.toString() === cleanId);

        if (!profile) return null;

        return {
            steamId: cleanId,
            name: profile.name,
            elo1v1: profile.rating || null,
            eloTG: profile.games?.find((g: any) => g.leaderboard_id === 4)?.rating || null,
            winRate1v1: profile.games?.find((g: any) => g.leaderboard_id === 3)?.win_rate || null,
            gamesPlayed: profile.games?.reduce((acc: number, g: any) => acc + (g.games || 0), 0) || 0,
            streak: profile.games?.find((g: any) => g.leaderboard_id === 3)?.streak || 0
        };

    } catch (error) {
        console.warn("Failed to fetch AoE stats:", error);
        return null;
    }
};

/**
 * Fetches stats and saves them to Supabase to avoid hitting the API too often.
 */
export const syncPlayerStats = async (profileId: string, steamId: string) => {
    const stats = await fetchPlayerStats(steamId);
    if (!stats) return null;

    const { error } = await supabase
        .from('profiles')
        .update({
            elo_1v1: stats.elo1v1,
            elo_tg: stats.eloTG,
            win_rate_1v1: stats.winRate1v1,
            games_played: stats.gamesPlayed,
            streak: stats.streak,
            last_stats_update: new Date().toISOString()
        })
        .eq('id', profileId);

    if (error) console.error('Error saving stats to Supabase:', error);
    return stats;
};

export const fetchMatchHistory = async (steamId: string, _count: number = 10): Promise<import('../types').Match[]> => {
    try {
        const { data, error } = await supabase.functions.invoke('proxy-match-history', {
            body: { steamId }
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

export const getClanMatches = async (members: { steamId?: string }[]): Promise<import('../types').Match[]> => {
    const allMatches: import('../types').Match[] = [];
    const validMembers = members.filter(m => m.steamId);

    const promises = validMembers.map(m => fetchMatchHistory(m.steamId!, 10));
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

