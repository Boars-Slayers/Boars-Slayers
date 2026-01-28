export interface PlayerStats {
    steamId: string;
    name: string;
    elo1v1: number | null;
    eloTG: number | null;
    winRate1v1: number | null; // Percentage
    gamesPlayed: number;
    streak: number; // positive for win, negative for loss
}

// Using aoe2.net API or fallback
const BASE_URL = 'https://aoe2.net/api';

export const fetchPlayerStats = async (steamId: string): Promise<PlayerStats | null> => {
    try {
        // Fetch 1v1 Leaderboard (ID 3)
        const res1v1 = await fetch(`${BASE_URL}/leaderboard?game=aoe2de&leaderboard_id=3&steam_id=${steamId}&count=1`);
        const data1v1 = await res1v1.json();

        // Fetch TG Leaderboard (ID 4)
        const resTG = await fetch(`${BASE_URL}/leaderboard?game=aoe2de&leaderboard_id=4&steam_id=${steamId}&count=1`);
        const dataTG = await resTG.json();

        const p1v1 = data1v1.leaderboard && data1v1.leaderboard.length > 0 ? data1v1.leaderboard[0] : null;
        const pTG = dataTG.leaderboard && dataTG.leaderboard.length > 0 ? dataTG.leaderboard[0] : null;

        if (!p1v1 && !pTG) return null;

        // Calculate simple win rate from what we have (this API gives wins/losses)
        const wins = p1v1?.wins || 0;
        const losses = p1v1?.losses || 0;
        const total = wins + losses;
        const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

        return {
            steamId,
            name: p1v1?.name || pTG?.name || 'Unknown',
            elo1v1: p1v1?.rating || null,
            eloTG: pTG?.rating || null,
            winRate1v1: winRate,
            gamesPlayed: p1v1?.games || 0,
            streak: p1v1?.streak || 0
        };

    } catch (error) {
        console.warn("Failed to fetch AOE stats:", error);
        return null; // Fail gracefully
    }
};
