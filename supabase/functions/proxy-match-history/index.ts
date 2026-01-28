import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
        const searchRes = await fetch(searchUrl, { redirect: 'follow' });
        const finalUrl = searchRes.url;

        console.log(`Resolved URL: ${finalUrl}`);

        const profileIdMatch = finalUrl.match(/\/user\/(\d+)/);
        if (!profileIdMatch) {
            console.log("Could not resolve specific user profile from search.");
            return new Response(JSON.stringify({ error: 'User not found', matches: [] }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const profileId = profileIdMatch[1];
        const profileUrl = `https://www.aoe2insights.com/user/${profileId}/`;

        // 2. Fetch Profile Page for Stats
        const profileRes = await fetch(profileUrl);
        const profileHtml = await profileRes.text();
        const profileDoc = new DOMParser().parseFromString(profileHtml, "text/html");

        const stats: any = {
            name: profileDoc?.querySelector("h1 strong")?.textContent?.trim() || "Unknown",
            elo1v1: null,
            eloTG: null,
            gamesPlayed: 0,
            winRate: null
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
        // Usually found in the "About" paragraph or summary text
        const aboutText = profileDoc?.querySelector(".mb-5 p")?.textContent || "";
        const gamesMatch = aboutText.match(/(\d+) matches/);
        if (gamesMatch) stats.gamesPlayed = parseInt(gamesMatch[1]);

        const winRateMatch = aboutText.match(/win rate of ([\d.]+)%/);
        if (winRateMatch) stats.winRate = parseFloat(winRateMatch[1]);

        // 3. Fetch Match History
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
                } catch (err) {
                    console.error("Error parsing match row", err);
                }
            }
        }

        return new Response(JSON.stringify({ profileId, stats, matches }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
