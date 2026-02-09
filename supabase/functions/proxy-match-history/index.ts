import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PROJECT_URL = "https://github.com/jesus18112003/AoEDash";

const fetchNightbotStats = async (profileId: string) => {
    const url = `https://data.aoe2companion.com/api/nightbot/rank?profile_id=${profileId}`;
    try {
        console.log(`Fetching Nightbot stats for ${profileId}`);
        const res = await fetch(url, {
            headers: { "User-Agent": PROJECT_URL }
        });

        if (!res.ok) {
            console.error(`Nightbot API error: ${res.status}`);
            return null;
        }

        let text = await res.text();
        // Clean text: strip(), replace non-breaking space, strip quotes
        text = text.trim().replace(/\u00A0/g, " ").replace(/^"|"$/g, "");

        // Pattern: "Name (ELO) Rank #Ranking ... Winrate% winrate"
        // Python: r"(.+?)\s\((\d+)\)\sRank\s#(\d+).*?(\d+)%\swinrate"
        const pattern = /(.+?)\s\((\d+)\)\sRank\s#(\d+).*?(\d+)%\swinrate/;
        const match = text.match(pattern);

        if (match) {
            return {
                name: match[1].trim(),
                elo: parseInt(match[2]),
                rank: parseInt(match[3]),
                winrate: parseInt(match[4])
            };
        }
        console.log(`Nightbot response did not match pattern: ${text}`);
        return null; // Return null if pattern doesn't match
    } catch (e: any) {
        console.error("Nightbot fetch error", e);
        return null;
    }
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { steamId } = await req.json();

        if (!steamId) {
            throw new Error('Missing steamId');
        }

        console.log(`Fetching profile for Steam ID: ${steamId}`);

        // 1. Resolve Profile ID from Steam ID via Search Redirect
        const searchUrl = `https://www.aoe2insights.com/?q=${steamId}`;
        const searchRes = await fetch(searchUrl, {
            redirect: 'follow',
            headers: {
                'User-Agent': PROJECT_URL
            }
        });

        let finalUrl = searchRes.url;
        console.log(`Resolved URL: ${finalUrl}`);

        let profileId = null;
        const profileIdMatch = finalUrl.match(/\/user\/(\d+)/);

        if (profileIdMatch) {
            profileId = profileIdMatch[1];
        } else {
            // If No redirect, try to parse the results page (fallback)
            // But sometimes the redirect happens immediately. 
            // If finalUrl is still /?q=..., then search failed or no redirect.

            // Note: If the search yields a list, we might need to pick the first one.
            // Simplified from original: if redirect didn't happen to /user/, maybe we are on search page.
            if (!finalUrl.includes("/user/")) {
                console.log("No direct redirect to user page, trying to parse search results...");
                const searchHtml = await searchRes.text();
                const searchDoc = new DOMParser().parseFromString(searchHtml, "text/html");
                // Find first user link in search results
                const firstUserLink = searchDoc?.querySelector('a[href*="/user/"]');
                const href = firstUserLink?.getAttribute('href');
                if (href) {
                    const match = href.match(/\/user\/(\d+)/);
                    if (match) profileId = match[1];
                }
            }
        }

        // Fallback: assumes the steamId PASSED might be a profileId if it's short?
        if (!profileId) {
            if (/^\d{1,10}$/.test(steamId)) {
                // Assume it's a profile ID if it's numeric and reasonably short
                profileId = steamId;
            } else {
                console.log("Could not resolve specific user profile from search.");
                // Return empty stats but valid response so frontend handles 'not found' gracefully
                return new Response(JSON.stringify({
                    profileId: null,
                    stats: null,
                    matches: [],
                    error: 'User not found'
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }
        }

        console.log(`Using Profile ID: ${profileId}`);
        const profileUrl = `https://www.aoe2insights.com/user/${profileId}/`;

        // 2. Fetch Profile Page from AoE2Insights (Baseline Data + TG ELO)
        const profileRes = await fetch(profileUrl);
        const profileHtml = await profileRes.text();
        const profileDoc = new DOMParser().parseFromString(profileHtml, "text/html");

        const stats: any = {
            name: profileDoc?.querySelector("h1 strong")?.textContent?.trim() || "Unknown",
            elo1v1: null,
            eloTG: null,
            gamesPlayed: 0,
            winRate: null,
            rank: null, // Global Rank
        };

        // Extract ELOs from cards
        const ratingCards = profileDoc?.querySelectorAll(".tile");
        if (ratingCards) {
            for (const card of ratingCards) {
                const label = card.querySelector("strong")?.textContent?.trim() || "";
                const ratingText = card.querySelector("small")?.textContent || "";
                const ratingMatch = ratingText.match(/Rating (\d+)/);
                const rating = ratingMatch ? parseInt(ratingMatch[1]) : null;

                if (label.includes("1v1 RM")) stats.elo1v1 = rating;
                else if (label.includes("Team RM")) stats.eloTG = rating;
            }
        }

        // Extract Summary Stats (Games Played and Win Rate)
        const aboutText = profileDoc?.querySelector(".mb-5 p")?.textContent || "";
        const gamesMatch = aboutText.match(/(\d+) matches/);
        if (gamesMatch) stats.gamesPlayed = parseInt(gamesMatch[1]);

        const winRateMatch = aboutText.match(/win rate of ([\d.]+)%/);
        if (winRateMatch) stats.winRate = parseFloat(winRateMatch[1]);

        // 3. ENHANCEMENT: Fetch from AoE2Companion Nightbot API (Overrides logic using Python script logic)
        // This is requested by the user to ensure we match the python logic.
        if (profileId) {
            const nightbotStats = await fetchNightbotStats(profileId);
            if (nightbotStats) {
                console.log("Used Nightbot stats:", nightbotStats);
                stats.elo1v1 = nightbotStats.elo; // Overwrite 1v1 ELO
                stats.rank = nightbotStats.rank; // Set global rank
                stats.winRate = nightbotStats.winrate; // Overwrite winrate
                // Optional: Update name if available and better
                if (nightbotStats.name) stats.name = nightbotStats.name;
            }
        }

        // 4. Fetch Match History
        const matchesUrl = `https://www.aoe2insights.com/user/${profileId}/matches/`;
        const matchesRes = await fetch(matchesUrl);
        const matchesHtml = await matchesRes.text();

        const matchesDoc = new DOMParser().parseFromString(matchesHtml, "text/html");
        const rows = matchesDoc?.querySelectorAll("table.table tbody tr");

        const matches = [];
        if (rows) {
            for (const row of rows) {
                try {
                    const mapName = row.querySelector("td:nth-child(2) a")?.textContent?.trim() || "Unknown Map";
                    const dateText = row.querySelector("td:nth-child(5)")?.textContent?.trim() || "";
                    const resultText = row.querySelector("td .badge")?.textContent?.trim() || "";
                    const isVictory = resultText.toLowerCase().includes("won");
                    const duration = row.querySelector("td:nth-child(3)")?.textContent?.trim() || "";
                    const type = row.querySelector("td:nth-child(4)")?.textContent?.trim() || "";
                    const matchLink = row.querySelector("td:nth-child(2) a")?.getAttribute("href");
                    const matchId = matchLink?.match(/\/match\/(\d+)/)?.[1] || crypto.randomUUID();

                    matches.push({
                        match_id: matchId,
                        name: mapName,
                        ranked: type.toLowerCase().includes("ranked"),
                        result: isVictory ? 'Victory' : 'Defeat',
                        duration,
                        type,
                        date_text: dateText
                    });
                } catch (err: any) {
                    console.error("Error parsing match row", err);
                }
            }
        }

        return new Response(JSON.stringify({ profileId, stats, matches }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
