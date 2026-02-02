import React from 'react';
import { Clock, Sword } from 'lucide-react';

interface UpcomingMatchesProps {
    matches: any[];
    participants: any[];
}

export const UpcomingMatches: React.FC<UpcomingMatchesProps> = ({ matches, participants }) => {
    // Filter for scheduled matches, limit to next 5
    const upcoming = matches
        .filter(m => m.status !== 'completed' && m.player1_id && m.player2_id)
        .sort((a, b) => {
            if (a.scheduled_time && b.scheduled_time) return new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime();
            if (a.scheduled_time) return -1;
            return 1;
        })
        .slice(0, 5);

    if (upcoming.length === 0) return null;

    const getPlayer = (id: string) => participants.find(p => p.user_id === id)?.profiles;

    return (
        <div className="mb-10">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Sword className="text-gold-500" size={24} />
                Próximos Enfrentamientos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcoming.map(match => {
                    const p1 = getPlayer(match.player1_id);
                    const p2 = getPlayer(match.player2_id);

                    return (
                        <div key={match.id} className="bg-gradient-to-br from-stone-900 to-stone-950 border border-stone-800 rounded-xl p-4 relative overflow-hidden group hover:border-gold-500/30 transition-all">
                            <div className="flex justify-between items-center mb-4 text-xs font-bold text-stone-500 uppercase tracking-wider">
                                <span>Ronda {match.round}</span>
                                {match.scheduled_time ? (
                                    <span className="flex items-center gap-1 text-gold-500">
                                        <Clock size={12} /> {new Date(match.scheduled_time).toLocaleDateString()}
                                    </span>
                                ) : (
                                    <span className="text-stone-700">Horario TBD</span>
                                )}
                            </div>

                            <div className="flex items-center justify-between gap-2">
                                {/* Player 1 */}
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="w-10 h-10 rounded-full border border-stone-800 bg-stone-900 overflow-hidden flex-shrink-0">
                                        {p1?.avatar_url ? (
                                            <img src={p1.avatar_url} alt={p1.username} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-stone-700 font-bold">?</div>
                                        )}
                                    </div>
                                    <span className="font-bold text-stone-200 truncate text-sm">{p1?.username || 'Player 1'}</span>
                                </div>

                                <div className="text-stone-700 font-black text-xl italic px-2">VS</div>

                                {/* Player 2 */}
                                <div className="flex items-center gap-3 flex-1 min-w-0 justify-end text-right">
                                    <span className="font-bold text-stone-200 truncate text-sm">{p2?.username || 'Player 2'}</span>
                                    <div className="w-10 h-10 rounded-full border border-stone-800 bg-stone-900 overflow-hidden flex-shrink-0">
                                        {p2?.avatar_url ? (
                                            <img src={p2.avatar_url} alt={p2.username} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-stone-700 font-bold">?</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
