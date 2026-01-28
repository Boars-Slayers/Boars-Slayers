import React from 'react';
import { Trophy } from 'lucide-react';

interface BracketViewProps {
    matches: any[];
}

export const BracketView: React.FC<BracketViewProps> = ({ matches }) => {
    // Group matches by round
    const rounds = Array.from(new Set(matches.map(m => m.round))).sort((a, b) => a - b);

    // Sort matches within rounds
    const matchesByRound: Record<number, any[]> = {};
    rounds.forEach(round => {
        matchesByRound[round] = matches
            .filter(m => m.round === round)
            .sort((a, b) => a.match_number - b.match_number);
    });

    return (
        <div className="bg-stone-900/40 border border-stone-800 rounded-2xl p-8 overflow-x-auto">
            <h3 className="text-white font-bold mb-8 flex items-center gap-2">
                <Trophy className="text-gold-500" size={18} /> Cuadro del Torneo
            </h3>

            <div className="flex gap-12 min-w-max">
                {rounds.map(round => (
                    <div key={round} className="flex flex-col justify-around gap-8">
                        <div className="text-center mb-4">
                            <h4 className="text-xs font-bold text-stone-500 uppercase tracking-widest bg-stone-900 py-1 px-3 rounded-full border border-stone-800">
                                Ronda {round}
                            </h4>
                        </div>
                        {matchesByRound[round].map(match => (
                            <div key={match.id} className="relative w-64 bg-stone-950 border border-stone-800 rounded-lg overflow-hidden group hover:border-gold-500/30 transition-all shadow-lg">
                                {/* Connector Lines (Visual Only - simplified) */}
                                {round < rounds.length && (
                                    <div className="absolute right-0 top-1/2 w-6 h-px bg-stone-800 translate-x-full z-0" />
                                )}

                                <div className={`flex justify-between items-center p-3 border-b border-stone-900 ${match.winner_id === match.player1_id ? 'bg-gold-500/10' : ''}`}>
                                    <span className={`text-sm truncate ${match.winner_id === match.player1_id ? 'font-bold text-gold-400' : 'text-stone-400'}`}>
                                        {match.p1?.username || 'TBD'}
                                    </span>
                                    {match.result_score && match.winner_id === match.player1_id && (
                                        <span className="text-xs font-serif italic text-stone-500">
                                            {match.result_score.split('-')[0]}
                                        </span>
                                    )}
                                </div>
                                <div className={`flex justify-between items-center p-3 ${match.winner_id === match.player2_id ? 'bg-gold-500/10' : ''}`}>
                                    <span className={`text-sm truncate ${match.winner_id === match.player2_id ? 'font-bold text-gold-400' : 'text-stone-400'}`}>
                                        {match.p2?.username || 'TBD'}
                                    </span>
                                    {match.result_score && match.winner_id === match.player2_id && (
                                        <span className="text-xs font-serif italic text-stone-500">
                                            {match.result_score.split('-')[1] || match.result_score.split('-')[0]}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};
