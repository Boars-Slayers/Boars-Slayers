import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PROJECT_URL = "https://github.com/jesus18112003/AoEDash";

const fetchNightbotStats = async (profileId: string, leaderboardId: number = 3) => {
    // leaderboard_id: 3 = 1v1 RM, 4 = Team RM
    const url = `https://data.aoe2companion.com/api/nightbot/rank?profile_id=${profileId}&leaderboard_id=${leaderboardId}`;
    try {
        console.log(`Fetching Nightbot stats for ${profileId} (LB: ${leaderboardId})`);
        const res = await fetch(url, {
            headers: { "User-Agent": PROJECT_URL }
        });

        if (!res.ok) {
            // Not necessarily an error, just player not in this leaderboard or API issue
            return null;
        }

        let text = await res.text();
        text = text.trim().replace(/\u00A0/g, " ").replace(/^"|"$/g, "");

        if (text.includes("Player not found") || text.includes("Unranked")) return null;

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
        return null; // Pattern didn't match
    } catch (e: any) {
        console.error(`Nightbot fetch error (LB ${leaderboardId})`, e);
        return null;
    }
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { steamId, profileId: explicitProfileId } = await req.json();

        if (!steamId && !explicitProfileId) {
            throw new Error('Missing steamId or profileId');
        }

        let profileId = explicitProfileId;

        // Only search/resolve if no explicit Profile ID is provided
        if (!profileId && steamId) {
            console.log(`Resolving profile for Steam ID: ${steamId}`);

            // Check if steamId is suspiciously a Discord ID (18-19 digits starting with 7 but not 765...)
            // But AoE2Insights handles random strings gracefully (returns 404 or search page), so we can just try.

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
            const profileIdMatch = finalUrl.match(/\/user\/(\d+)/);

            if (profileIdMatch) {
                profileId = profileIdMatch[1];
            } else {
                // Fallback parsing if redirect didn't happen directly to user page (search results page)
                if (!finalUrl.includes("/user/")) {
                    console.log("No direct redirect to user page, trying to parse search results...");
                    const searchHtml = await searchRes.text();
                    const searchDoc = new DOMParser().parseFromString(searchHtml, "text/html");
                    const firstUserLink = searchDoc?.querySelector('a[href*="/user/"]');
                    const href = firstUserLink?.getAttribute('href');
                    if (href) {
                        const match = href.match(/\/user\/(\d+)/);
                        if (match) profileId = match[1];
                    }
                }
            }

            // Fallback: assume steamId MIGHT be a profileId if it's numeric and short enough (<10 digits means < 1 billion, current profile IDs are around 1-100 million ranges, while steam IDs are huge)
            if (!profileId && /^\d{1,10}$/.test(steamId)) {
                profileId = steamId;
            }
        }

        if (!profileId) {
            console.log("Could not resolve specific user profile.");
            return new Response(JSON.stringify({
                profileId: null,
                stats: null,
                matches: [],
                error: 'User not found'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
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
        if (profileId) {
            // Attempt 1v1 RM (Leaderboard 3)
            const nightbot1v1 = await fetchNightbotStats(profileId, 3);

            // Attempt Team RM (Leaderboard 4)
            const nightbotTG = await fetchNightbotStats(profileId, 4);

            if (nightbot1v1) {
                console.log("Used Nightbot 1v1 stats:", nightbot1v1);
                stats.elo1v1 = nightbot1v1.elo; // Overwrite 1v1 ELO
                stats.rank = nightbot1v1.rank; // Set global rank (1v1)
                stats.winRate = nightbot1v1.winrate; // Prefer 1v1 winrate
                if (nightbot1v1.name) stats.name = nightbot1v1.name;
            }

            if (nightbotTG) {
                console.log("Used Nightbot TG stats:", nightbotTG);
                stats.eloTG = nightbotTG.elo; // Set TG ELO from Nightbot (fresher than AoE2Insights sometimes)

                // If 1v1 stats are missing, fallback to TG stats for generic info
                if (!nightbot1v1) {
                    stats.winRate = nightbotTG.winrate;
                    if (nightbotTG.name) stats.name = nightbotTG.name;
                    // Note: We don't set stats.rank here because that field implies 1v1 Global Rank 
                    // and mixing ranks from different leaderboards could be confusing.
                }
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
