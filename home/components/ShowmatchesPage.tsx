import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Showmatch } from '../types';
import { Swords, Calendar, Play, User } from 'lucide-react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

const CountdownLabel: React.FC<{ scheduledTime: string }> = ({ scheduledTime }) => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const update = () => {
            const now = new Date().getTime();
            const distance = new Date(scheduledTime).getTime() - now;

            if (distance < 0) {
                setTimeLeft('EN VIVO');
            } else {
                const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);

                if (days > 0) setTimeLeft(`${days}d ${hours}h`);
                else if (hours > 0) setTimeLeft(`${hours}h ${minutes}m`);
                else setTimeLeft(`${minutes}m ${seconds}s`);
            }
        };
        update();
        const timer = setInterval(update, 1000);
        return () => clearInterval(timer);
    }, [scheduledTime]);

    return <>{timeLeft || 'Programado'}</>;
};

export const ShowmatchesPage: React.FC = () => {
    const navigate = useNavigate();
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
        <div className="min-h-screen bg-stone-950 text-gray-200 font-sans selection:bg-gold-500/30 overflow-x-hidden relative">
            <Navbar />

            {/* Epic Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <img
                    src="/fondoshowmatch.webp"
                    alt="War Background"
                    className="w-full h-full object-cover opacity-20 mix-blend-luminosity scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/90 to-stone-950/40"></div>
            </div>

            <main className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-20">
                <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6 text-center md:text-left">
                    <div>
                        <h1 className="text-4xl md:text-6xl font-serif font-black text-white flex items-center justify-center md:justify-start gap-4 uppercase tracking-tight">
                            <Swords className="text-gold-500 w-10 h-10 md:w-16 md:h-16" /> Showmatchs
                        </h1>
                        <p className="text-gold-500/60 mt-3 font-serif italic text-lg md:text-xl">Duelos de gloria en la arena de Boars Slayers</p>
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
                            <div
                                key={match.id}
                                onClick={() => navigate(`/showmatchs/${match.id}`)}
                                className="bg-stone-900/40 backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden hover:border-gold-500/30 transition-all group cursor-pointer shadow-2xl relative"
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold-500/20 to-transparent group-hover:via-gold-500/50 transition-all"></div>

                                <div className="p-8 md:p-10">
                                    <div className="flex justify-between items-start mb-8">
                                        <div className="flex items-center gap-3 text-xs font-black text-stone-500 uppercase tracking-[0.2em]">
                                            <Calendar size={14} className="text-gold-600" />
                                            {new Date(match.scheduled_time).toLocaleString()}
                                        </div>
                                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border backdrop-blur-xl
                                            ${match.status === 'live' ? 'bg-red-600/20 text-red-500 border-red-500/50 animate-pulse' :
                                                match.status === 'completed' ? 'bg-stone-800/40 text-stone-400 border-stone-700' :
                                                    'bg-gold-600/20 text-gold-500 border-gold-500/30'}
                                        `}>
                                            {match.status === 'live' ? '🔴 En Vivo' :
                                                match.status === 'completed' ? 'Finalizado' : <CountdownLabel scheduledTime={match.scheduled_time} />}
                                        </div>
                                    </div>

                                    <h2 className="text-3xl md:text-4xl font-serif font-black text-white mb-10 text-center uppercase tracking-tight group-hover:text-gold-400 transition-colors drop-shadow-lg">
                                        {match.title}
                                    </h2>

                                    <div className="flex items-center justify-between gap-4 relative">
                                        {/* Player 1 */}
                                        <div className="flex-1 flex flex-col items-center group/p1">
                                            <div className="relative w-28 h-28 md:w-32 md:h-32 mb-4 transform transition-all group-hover:scale-110">
                                                <div className="absolute inset-0 rounded-full bg-blue-600/10 blur-2xl group-hover/p1:bg-blue-600/30 transition-colors"></div>
                                                <div className="relative w-full h-full rounded-full border-4 border-stone-800 bg-stone-950 overflow-hidden z-10 p-1">
                                                    {(match as any).p1?.avatar_url ? (
                                                        <img src={(match as any).p1.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-stone-700 bg-stone-900 rounded-full"><User size={40} /></div>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="text-xl font-serif font-black text-white text-center tracking-wide">{(match as any).p1?.username || match.p1_name || 'TBD'}</span>
                                        </div>

                                        <div className="text-5xl font-serif font-black text-stone-800 italic absolute left-1/2 top-4 md:top-8 -translate-x-1/2 opacity-50 select-none">VS</div>

                                        {/* Player 2 */}
                                        <div className="flex-1 flex flex-col items-center group/p2">
                                            <div className="relative w-28 h-28 md:w-32 md:h-32 mb-4 transform transition-all group-hover:scale-110">
                                                <div className="absolute inset-0 rounded-full bg-red-600/10 blur-2xl group-hover/p2:bg-red-600/30 transition-colors"></div>
                                                <div className="relative w-full h-full rounded-full border-4 border-stone-800 bg-stone-950 overflow-hidden z-10 p-1">
                                                    {(match as any).p2?.avatar_url ? (
                                                        <img src={(match as any).p2.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-stone-700 bg-stone-900 rounded-full"><User size={40} /></div>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="text-xl font-serif font-black text-white text-center tracking-wide">{(match as any).p2?.username || match.p2_name || 'TBD'}</span>
                                        </div>
                                    </div>

                                    {match.status === 'completed' && match.result_score && (
                                        <div className="mt-10 flex flex-col items-center">
                                            <div className="text-[10px] text-stone-500 uppercase tracking-[0.4em] font-black mb-2">Resultado Final</div>
                                            <div className="text-4xl font-mono font-black text-gold-500 bg-gold-500/5 px-8 py-3 rounded-2xl border border-gold-500/20 shadow-inner">{match.result_score}</div>
                                        </div>
                                    )}

                                    {match.description && (
                                        <div className="mt-8 pt-6 border-t border-stone-800/50">
                                            <p className="text-stone-400 text-sm text-center italic">{match.description}</p>
                                        </div>
                                    )}

                                    {match.stream_url && match.status !== 'completed' && (
                                        <div className="mt-10">
                                            <div className="w-full py-4 bg-[#6441a5] hover:bg-[#7d5bbe] text-white rounded-2xl font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-xl shadow-purple-900/40 group-hover:scale-[1.02]">
                                                <Play size={20} fill="currentColor" />
                                                Ver Transmisión
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
};
