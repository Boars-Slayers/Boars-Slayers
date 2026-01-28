import React, { useMemo } from 'react';
import { Trophy } from 'lucide-react';

interface StandingsTableProps {
    participants: any[];
    matches: any[];
}

export const StandingsTable: React.FC<StandingsTableProps> = ({ participants, matches }) => {
    const standings = useMemo(() => {
        const stats: Record<string, {
            id: string;
            username: string;
            played: number;
            won: number;
            lost: number;
            points: number;
            avatar_url: string;
        }> = {};

        // Initialize from participants (ensure everyone is listed even if 0 matches)
        participants.forEach(p => {
            stats[p.user_id] = {
                id: p.user_id,
                username: p.profiles?.username || 'Unknown',
                avatar_url: p.profiles?.avatar_url,
                played: 0,
                won: 0,
                lost: 0,
                points: 0
            };
        });

        // Calculate from matches
        matches.forEach(m => {
            if (m.status !== 'completed' || !m.winner_id || !m.player2_id) return; // Ignore unplayed or bye matches for now

            // Update Played
            if (stats[m.player1_id]) stats[m.player1_id].played += 1;
            if (stats[m.player2_id]) stats[m.player2_id].played += 1;

            // Update Won/Lost/Points
            if (m.winner_id === m.player1_id) {
                if (stats[m.player1_id]) {
                    stats[m.player1_id].won += 1;
                    stats[m.player1_id].points += 3; // Win = 3 points
                }
                if (stats[m.player2_id]) stats[m.player2_id].lost += 1;
            } else if (m.winner_id === m.player2_id) {
                if (stats[m.player2_id]) {
                    stats[m.player2_id].won += 1;
                    stats[m.player2_id].points += 3;
                }
                if (stats[m.player1_id]) stats[m.player1_id].lost += 1;
            }
        });

        return Object.values(stats).sort((a, b) => b.points - a.points || b.won - a.won);
    }, [participants, matches]);

    return (
        <div className="bg-stone-900/40 border border-stone-800 rounded-2xl overflow-hidden mb-8">
            <div className="p-4 border-b border-stone-800 bg-stone-900/20">
                <h3 className="text-white font-bold flex items-center gap-2">
                    <Trophy className="text-gold-500" size={18} /> Tabla de Posiciones
                </h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-stone-300">
                    <thead className="bg-stone-950/40 text-xs uppercase font-bold text-stone-500">
                        <tr>
                            <th className="px-6 py-3 tracking-wider">#</th>
                            <th className="px-6 py-3 tracking-wider">Jugador</th>
                            <th className="px-6 py-3 text-center tracking-wider">PJ</th>
                            <th className="px-6 py-3 text-center tracking-wider text-green-500">G</th>
                            <th className="px-6 py-3 text-center tracking-wider text-red-500">P</th>
                            <th className="px-6 py-3 text-center tracking-wider text-gold-500">PTS</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-800/50">
                        {standings.map((player, index) => (
                            <tr key={player.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 font-bold text-stone-500">{index + 1}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        {player.avatar_url ? (
                                            <img src={player.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover border border-stone-800" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center text-xs font-bold text-stone-600">
                                                {player.username.charAt(0)}
                                            </div>
                                        )}
                                        <span className="font-medium text-white">{player.username}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">{player.played}</td>
                                <td className="px-6 py-4 text-center text-green-400 font-bold">{player.won}</td>
                                <td className="px-6 py-4 text-center text-red-400 font-bold">{player.lost}</td>
                                <td className="px-6 py-4 text-center text-gold-400 font-black text-lg">{player.points}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
