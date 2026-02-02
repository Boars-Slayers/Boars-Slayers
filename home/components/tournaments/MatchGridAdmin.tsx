import React from 'react';
import { CheckCircle, Circle, FileText, Trash2 } from 'lucide-react';

interface MatchGridAdminProps {
    matches: any[];
    participants: any[];
    onEditMatch: (match: any) => void;
    onDeleteMatch: (matchId: string) => void;
}

export const MatchGridAdmin: React.FC<MatchGridAdminProps> = ({ matches, participants, onEditMatch, onDeleteMatch }) => {
    // Group matches by round
    const rounds = matches.reduce((acc, match) => {
        const round = match.round || 1;
        if (!acc[round]) acc[round] = [];
        acc[round].push(match);
        return acc;
    }, {} as Record<number, any[]>);

    const getPlayerName = (id: string) => {
        // Try getting from match joined data first
        const match = matches.find(m => m.player1_id === id || m.player2_id === id);
        if (match) {
            if (match.player1_id === id && match.p1) return match.p1.username;
            if (match.player2_id === id && match.p2) return match.p2.username;
        }

        // Fallback to participants list
        const participant = participants.find(p => p.user_id === id);
        return participant?.user?.username || 'Unknown';
    };

    return (
        <div className="space-y-8">
            {Object.keys(rounds).sort((a, b) => Number(a) - Number(b)).map(round => (
                <div key={round} className="bg-stone-950 border border-stone-800 rounded-xl overflow-hidden">
                    <div className="bg-stone-900/50 px-4 py-3 border-b border-stone-800 flex justify-between items-center">
                        <h5 className="font-bold text-stone-300">Ronda {round}</h5>
                        <span className="text-xs text-stone-500 font-mono">{rounds[Number(round)].length} Partidos</span>
                    </div>

                    <div className="divide-y divide-stone-900">
                        {rounds[Number(round)].map((match: any) => (
                            <div
                                key={match.id}
                                className="group flex flex-col md:flex-row items-center gap-4 p-4 hover:bg-stone-900/30 transition-colors"
                            >
                                {/* Status Indicator */}
                                <div className="hidden md:flex flex-col items-center justify-center w-12 text-stone-600">
                                    {match.status === 'completed' ? (
                                        <CheckCircle size={20} className="text-green-500" />
                                    ) : (
                                        <Circle size={20} />
                                    )}
                                </div>

                                {/* Matchup (Clickable for Edit) */}
                                <div
                                    className="flex-1 w-full grid grid-cols-3 items-center gap-4 text-center md:text-left cursor-pointer"
                                    onClick={() => onEditMatch(match)}
                                >
                                    <div className={`text-sm font-medium truncate text-right ${match.winner_id === match.player1_id ? 'text-gold-400 font-bold' : 'text-stone-300'}`}>
                                        {getPlayerName(match.player1_id)}
                                    </div>

                                    <div className="flex justify-center flex-col items-center">
                                        <div className="bg-stone-900 border border-stone-800 px-3 py-1 rounded text-stone-200 font-mono font-bold text-sm min-w-[60px] text-center group-hover:border-gold-500/50 transition-colors">
                                            {match.result_score || 'vs'}
                                        </div>
                                    </div>

                                    <div className={`text-sm font-medium truncate text-left ${match.winner_id === match.player2_id ? 'text-gold-400 font-bold' : 'text-stone-300'}`}>
                                        {getPlayerName(match.player2_id)}
                                    </div>
                                </div>

                                {/* Metadata / Actions */}
                                <div className="w-full md:w-auto flex justify-center items-center gap-4 text-stone-500">
                                    {match.replay_url && (
                                        <div className="flex items-center gap-1 text-green-500 text-xs font-medium bg-green-500/10 px-2 py-1 rounded">
                                            <FileText size={12} />
                                            Rec
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => onEditMatch(match)}
                                            className="text-xs font-bold text-gold-500 uppercase tracking-wider hover:text-gold-400 px-2 py-1"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteMatch(match.id);
                                            }}
                                            className="text-stone-600 hover:text-red-500 p-1 rounded hover:bg-stone-800 transition-colors"
                                            title="Eliminar partido"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {matches.length === 0 && (
                <div className="text-center py-12 text-stone-500 italic">
                    No hay partidos generados. Usa el botón "Nuevo Partido" para comenzar.
                </div>
            )}
        </div>
    );
};
