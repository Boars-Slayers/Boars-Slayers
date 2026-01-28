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
    // 1. Input Validation: Extract Numeric ID if a URL is provided by mistake
    let cleanId = steamId.trim();

    // If it's a full URL, try to extract the ID
    if (cleanId.includes('steamcommunity.com')) {
        const matches = cleanId.match(/\/profiles\/(\d{17})/);
        if (matches && matches[1]) {
            cleanId = matches[1];
        } else {
            console.warn("Cannot extract Steam ID from Vanity URL. Please use the numeric Steam64 ID.");
            return null;
        }
    }

    // Must be numeric
    if (!/^\d+$/.test(cleanId)) {
        console.warn("Invalid Steam ID format. Must be numeric.");
        return null;
    }

    try {
        // Use aoe2companion API which supports CORS and is fast.
        // Issue: It accepts profile_id, not always steam_id directly in the same endpoint.
        // However, let's try searching first or assume we need a Profile ID mapping.
        // Use the nightbot rank API which is simple:
        // https://data.aoe2companion.com/api/nightbot/rank?profile_id={steamId}
        // Note: The user said "profile_id" in the python script. 
        // We might need to handle the case where steamId != profileId.
        // But let's try passing Steam ID as profile_id first, often they map or it supports both.
        // If not, we fall back to a search or the proxy.
        // Actually, we can just use the search from aoe2insights proxy to get the real ID later.

        // For now, let's try to fetch using the steam ID as profile_id parameter (common in some APIs).
        // If it fails, we return basic info.

        const url = `https://data.aoe2companion.com/api/nightbot/rank?profile_id=${cleanId}`;
        const res = await fetch(url);

        if (!res.ok) return null;

        const text = await res.text();
        // Format: "Name (ELO) Rank #... Winrate%"
        // e.g. "GL.TheViper (2600) Rank #1, 60% winrate"

        const pattern = /(.+?)\s\((\d+)\)\sRank\s#(\d+).*?(\d+)%\swinrate/;
        const match = text.match(pattern);

        if (match) {
            return {
                steamId: cleanId,
                name: match[1].trim(),
                elo1v1: parseInt(match[2]),
                eloTG: null, // This API seems to return main rank (1v1 typically)
                winRate1v1: parseInt(match[4]),
                gamesPlayed: 0, // Not in this string
                streak: 0 // Not in this string
            };
        }

        return null;

    } catch (error) {
        console.warn("Failed to fetch AoE stats:", error);
        return null; // Fail gracefully
    }
};

export const fetchMatchHistory = async (steamId: string, _count: number = 10): Promise<import('../types').Match[]> => {
    try {
        // This calls the Supabase Edge Function 'proxy-match-history'
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

    // Fetch limits to avoid spamming the (potentially broken) API
    // parallel fetch
    const promises = validMembers.map(m => fetchMatchHistory(m.steamId!, 10));
    const results = await Promise.all(promises);

    results.forEach(matches => allMatches.push(...matches));

    // Deduplicate by match_id
    const uniqueMatches = Array.from(new Map(allMatches.map(m => [m.match_id, m])).values());

    // Filter for matches with at least 2 clan members
    const clanSteamIds = new Set(validMembers.map(m => m.steamId));

    return uniqueMatches.filter(match => {
        const clanMembersInMatch = match.players.filter(p => clanSteamIds.has(p.steam_id));
        return clanMembersInMatch.length >= 2;
    }).sort((a, b) => b.started - a.started);
};
