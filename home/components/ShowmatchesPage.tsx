import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Showmatch } from '../types';
import { Swords, Calendar, Play, Trophy, User } from 'lucide-react';

export const ShowmatchesPage: React.FC = () => {
    const [matches, setMatches] = useState<Showmatch[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMatches();
    }, []);

    const fetchMatches = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('showmatches')
            .select('*, p1:profiles!player1_id(username, avatar_url), p2:profiles!player2_id(username, avatar_url)')
            .order('scheduled_time', { ascending: false });

        if (!error && data) {
            setMatches(data);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-stone-950 text-gray-200">
            <main className="max-w-7xl mx-auto px-6 pt-32 pb-12">
                <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-10 gap-4">
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-white flex items-center gap-3">
                            <Swords className="text-gold-500" /> Showmatchs de la Comunidad
                        </h1>
                        <p className="text-stone-400 mt-2">Duelos épicos organizados por Boars Slayers.</p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-gold-500 rounded-full"></div>
                    </div>
                ) : matches.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed border-stone-800 rounded-2xl">
                        <p className="text-stone-500 font-serif italic">No hay showmatchs programados por ahora...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {matches.map((match) => (
                            <div key={match.id} className="bg-stone-900/50 border border-gold-600/20 rounded-2xl overflow-hidden hover:border-gold-500/50 transition-all group">
                                <div className="p-8">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-2 text-xs font-bold text-stone-500 uppercase tracking-widest">
                                            <Calendar size={14} />
                                            {new Date(match.scheduled_time).toLocaleString()}
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border
                                            ${match.status === 'live' ? 'bg-red-500/20 text-red-500 border-red-500/30 animate-pulse' :
                                                match.status === 'completed' ? 'bg-stone-800 text-stone-400 border-stone-700' :
                                                    'bg-blue-500/20 text-blue-400 border-blue-500/30'}
                                        `}>
                                            {match.status === 'live' ? 'En Vivo' :
                                                match.status === 'completed' ? 'Finalizado' : 'Programado'}
                                        </div>
                                    </div>

                                    <h2 className="text-2xl font-serif font-bold text-white mb-8 text-center">{match.title}</h2>

                                    <div className="flex items-center justify-between gap-4 relative">
                                        {/* Player 1 */}
                                        <div className="flex-1 flex flex-col items-center">
                                            <div className="relative w-24 h-24 mb-4">
                                                <div className="absolute inset-0 rounded-full bg-gold-600/10 blur-xl"></div>
                                                <div className="relative w-full h-full rounded-full border-2 border-stone-800 bg-stone-950 overflow-hidden">
                                                    {(match as any).p1?.avatar_url ? (
                                                        <img src={(match as any).p1.avatar_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-stone-700"><User size={40} /></div>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="text-lg font-bold text-white text-center">{(match as any).p1?.username || match.p1_name || 'TBD'}</span>
                                        </div>

                                        <div className="text-4xl font-serif font-black text-stone-800 italic absolute left-1/2 -top-4 -translate-x-1/2">VS</div>

                                        {/* Player 2 */}
                                        <div className="flex-1 flex flex-col items-center">
                                            <div className="relative w-24 h-24 mb-4">
                                                <div className="absolute inset-0 rounded-full bg-gold-600/10 blur-xl"></div>
                                                <div className="relative w-full h-full rounded-full border-2 border-stone-800 bg-stone-950 overflow-hidden">
                                                    {(match as any).p2?.avatar_url ? (
                                                        <img src={(match as any).p2.avatar_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-stone-700"><User size={40} /></div>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="text-lg font-bold text-white text-center">{(match as any).p2?.username || match.p2_name || 'TBD'}</span>
                                        </div>
                                    </div>

                                    {match.status === 'completed' && match.result_score && (
                                        <div className="mt-8 flex flex-col items-center">
                                            <div className="text-[10px] text-stone-500 uppercase tracking-[0.2em] font-bold mb-2">Resultado Final</div>
                                            <div className="text-3xl font-mono font-black text-gold-500 bg-gold-500/5 px-6 py-2 rounded-xl border border-gold-500/10">{match.result_score}</div>
                                        </div>
                                    )}

                                    {match.description && (
                                        <div className="mt-8 pt-6 border-t border-stone-800/50">
                                            <p className="text-stone-400 text-sm text-center italic">{match.description}</p>
                                        </div>
                                    )}

                                    {match.stream_url && match.status !== 'completed' && (
                                        <div className="mt-8">
                                            <a
                                                href={match.stream_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-600/20"
                                            >
                                                <Play size={20} fill="currentColor" />
                                                Ver Transmisión
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};
