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

        // 1. Search for the user to get the internal AoE Insights User ID
        // We use the search URL which usually redirects or shows a list. 
        // Best way is to fetch the page that 'https://www.aoe2insights.com/user/STEAMID_OR_SEARCH' might point to if we can guessing.
        // Actually, AoE Insights search logic: ?q=STEAMID might redirect.
        // Let's try to fetch the search page.
        const searchUrl = `https://www.aoe2insights.com/?q=${steamId}`;
        const searchRes = await fetch(searchUrl, { redirect: 'follow' });
        const finalUrl = searchRes.url;

        console.log(`Resolved URL: ${finalUrl}`);

        // Extract ID from URL like https://www.aoe2insights.com/user/12345/
        const profileIdMatch = finalUrl.match(/\/user\/(\d+)/);

        if (!profileIdMatch) {
            console.log("Could not resolve specific user profile from search.");
            return new Response(JSON.stringify({ error: 'User not found', matches: [] }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const profileId = profileIdMatch[1];
        console.log(`Found Profile ID: ${profileId}`);

        // 2. Fetch Match History Page
        const matchesUrl = `https://www.aoe2insights.com/user/${profileId}/matches/`;
        const matchesRes = await fetch(matchesUrl);
        const htmlText = await matchesRes.text();

        const doc = new DOMParser().parseFromString(htmlText, "text/html");
        const rows = doc?.querySelectorAll("table.table tbody tr");

        const matches = [];

        if (rows) {
            for (const row of rows) {
                try {
                    // Determine structure based on observation of AoE Insights HTML/CSS classes
                    // This is brittle and depends on their current layout.
                    const mapName = row.querySelector("td:nth-child(2) a")?.textContent?.trim() || "Unknown Map";
                    const dateText = row.querySelector("td:nth-child(5)")?.textContent?.trim() || "";
                    // We'd parse dateText like "2 hours ago" or "2023-01-01" if needed.

                    // For players, AoE Insights usually lists them in a column or requires drilling down.
                    // For summary, let's just get the main meta-data we can easily see in the table row.
                    // Or if the table is "Match | Map | Duration | Played", we extract what we can.
                    // Assuming standard "Replays/Matches" list:
                    // <td>Result (Won/Lost)</td> <td>Map</td> <td>Duration</td> <td>Type (1v1/TG)</td> <td>Date</td>

                    // Let's scrape basic details to prove concept.
                    const resultText = row.querySelector("td .badge")?.textContent?.trim() || "";
                    const isVictory = resultText.toLowerCase().includes("won");

                    const duration = row.querySelector("td:nth-child(3)")?.textContent?.trim() || "";
                    const type = row.querySelector("td:nth-child(4)")?.textContent?.trim() || "";

                    // Getting players is hard from the list view without fetching each match detail page.
                    // However, we can return the ID to link to it, or try to get basic info.
                    const matchLink = row.querySelector("td:nth-child(2) a")?.getAttribute("href");
                    const matchId = matchLink?.match(/\/match\/(\d+)/)?.[1] || crypto.randomUUID();

                    matches.push({
                        match_id: matchId,
                        name: mapName,
                        started: 0, // Date parsing is complex from "2 hours ago" without library
                        finished: null,
                        ranked: type.toLowerCase().includes("ranked"),
                        players: [], // Populating players from list view is hard. We might skip player details or fetch deeper if needed.
                        // Custom fields for UI
                        result: isVictory ? 'Victory' : 'Defeat',
                        duration,
                        type,
                        date_text: dateText
                    });

                } catch (err) {
                    console.error("Error parsing row", err);
                }
            }
        }

        return new Response(JSON.stringify({ profileId, matches }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
