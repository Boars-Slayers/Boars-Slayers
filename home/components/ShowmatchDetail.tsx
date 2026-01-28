import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Showmatch } from '../types';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { Swords, ArrowLeft, Clock, Twitch } from 'lucide-react';

export const ShowmatchDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [match, setMatch] = useState<Showmatch | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const fetchMatch = async () => {
            if (!id) return;
            setLoading(true);
            const { data, error } = await supabase
                .from('showmatches')
                .select('*, p1:profiles!player1_id(username, avatar_url, favorite_civ), p2:profiles!player2_id(username, avatar_url, favorite_civ)')
                .eq('id', id)
                .single();

            if (!error && data) {
                setMatch(data);
            }
            setLoading(false);
        };
        fetchMatch();
    }, [id]);

    useEffect(() => {
        if (!match || match.status !== 'scheduled') return;

        const timer = setInterval(() => {
            const now = new Date().getTime();
            const distance = new Date(match.scheduled_time).getTime() - now;

            if (distance < 0) {
                setTimeLeft('¡EN VIVO!');
                clearInterval(timer);
            } else {
                const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [match]);

    if (loading) {
        return (
            <div className="min-h-screen bg-stone-950 flex items-center justify-center">
                <div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-gold-500 rounded-full"></div>
            </div>
        );
    }

    if (!match) return <div>No se encontró el showmatch</div>;

    const p1 = (match as any).p1;
    const p2 = (match as any).p2;
    const p1Name = p1?.username || match.p1_name || 'TBD';
    const p2Name = p2?.username || match.p2_name || 'TBD';
    const p1Avatar = p1?.avatar_url || null;
    const p2Avatar = p2?.avatar_url || null;

    return (
        <div className="min-h-screen bg-stone-950 text-gray-200 font-sans selection:bg-gold-500/30">
            <Navbar />

            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-1/2 h-full bg-blue-900/5 blur-[150px]"></div>
                <div className="absolute top-0 right-0 w-1/2 h-full bg-red-900/5 blur-[150px]"></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
            </div>

            <main className="relative pt-32 pb-20 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 text-center mb-12">
                    <Link to="/showmatchs" className="inline-flex items-center gap-2 text-stone-500 hover:text-white mb-8 transition-colors group">
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Volver a la cartelera
                    </Link>

                    {/* Status Badge */}
                    <div className="flex justify-center mb-6">
                        <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-[0.2em] border shadow-2xl backdrop-blur-md
                            ${match.status === 'live' ? 'bg-red-600/20 text-red-500 border-red-500/50 animate-pulse' :
                                match.status === 'completed' ? 'bg-stone-800 text-stone-400 border-stone-700' :
                                    'bg-gold-600/10 text-gold-500 border-gold-500/30'}
                        `}>
                            {match.status === 'live' ? '🔴 En Vivo Ahora' :
                                match.status === 'completed' ? 'Finalizado' : 'Próximamente'}
                        </div>
                    </div>

                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white mb-6 uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-stone-400 shadow-xl">
                        {match.title}
                    </h1>

                    {/* Countdown */}
                    {match.status === 'scheduled' && (
                        <div className="flex justify-center items-center gap-4 mb-12">
                            <Clock className="text-gold-500 animate-pulse" />
                            <span className="text-2xl md:text-4xl font-mono font-bold text-gold-400 tracking-widest tabular-nums">
                                {timeLeft || 'Cargando...'}
                            </span>
                        </div>
                    )}
                </div>

                {/* VS Section */}
                <div className="max-w-7xl mx-auto px-6 mb-20">
                    <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-20 relative">

                        {/* Player 1 */}
                        <div className="flex-1 flex flex-col items-center group relative z-10 w-full md:w-auto">
                            <div className="absolute inset-0 bg-blue-500/20 blur-[80px] rounded-full opacity-50 group-hover:opacity-70 transition-opacity"></div>
                            <div className="relative w-48 h-48 md:w-64 md:h-64 mb-8 transform group-hover:scale-105 transition-transform duration-500">
                                <div className="absolute inset-0 rounded-full border-4 border-blue-500/30 group-hover:border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.3)] bg-stone-900 object-cover overflow-hidden">
                                    {p1Avatar ? (
                                        <img src={p1Avatar} alt={p1Name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-stone-900 flex items-center justify-center text-stone-700 font-bold text-4xl">P1</div>
                                    )}
                                </div>
                                {/* Civ Badge */}
                                {p1?.favorite_civ && (
                                    <div className="absolute bottom-4 right-4 bg-stone-900 border border-stone-700 px-3 py-1 rounded-full text-xs font-bold text-stone-300 shadow-xl">
                                        {p1.favorite_civ}
                                    </div>
                                )}
                            </div>
                            <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-wider text-center drop-shadow-lg">
                                {p1Name}
                            </h2>
                            <div className="h-1 w-24 bg-blue-600 mt-4 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.8)]"></div>
                        </div>

                        {/* VS Divider */}
                        <div className="relative z-20 py-10 md:py-0">
                            <div className="text-7xl md:text-9xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-gold-400 to-gold-700 drop-shadow-[0_0_30px_rgba(234,179,8,0.4)] transform md:-rotate-12">
                                VS
                            </div>
                        </div>

                        {/* Player 2 */}
                        <div className="flex-1 flex flex-col items-center group relative z-10 w-full md:w-auto">
                            <div className="absolute inset-0 bg-red-500/20 blur-[80px] rounded-full opacity-50 group-hover:opacity-70 transition-opacity"></div>
                            <div className="relative w-48 h-48 md:w-64 md:h-64 mb-8 transform group-hover:scale-105 transition-transform duration-500">
                                <div className="absolute inset-0 rounded-full border-4 border-red-500/30 group-hover:border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)] bg-stone-900 object-cover overflow-hidden">
                                    {p2Avatar ? (
                                        <img src={p2Avatar} alt={p2Name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-stone-900 flex items-center justify-center text-stone-700 font-bold text-4xl">P2</div>
                                    )}
                                </div>
                                {p2?.favorite_civ && (
                                    <div className="absolute bottom-4 right-4 bg-stone-900 border border-stone-700 px-3 py-1 rounded-full text-xs font-bold text-stone-300 shadow-xl">
                                        {p2.favorite_civ}
                                    </div>
                                )}
                            </div>
                            <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-wider text-center drop-shadow-lg">
                                {p2Name}
                            </h2>
                            <div className="h-1 w-24 bg-red-600 mt-4 rounded-full shadow-[0_0_10px_rgba(220,38,38,0.8)]"></div>
                        </div>

                    </div>

                    {/* Results Overlay */}
                    {match.status === 'completed' && match.result_score && (
                        <div className="mt-12 flex justify-center animate-in zoom-in slide-in-from-bottom-4 duration-700">
                            <div className="bg-stone-900/80 backdrop-blur-xl border border-gold-500/30 px-12 py-6 rounded-2xl shadow-2xl flex flex-col items-center">
                                <span className="text-gold-500 text-xs font-black uppercase tracking-[0.3em] mb-2">Resultado Final</span>
                                <span className="text-6xl font-mono font-black text-white tracking-widest drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                                    {match.result_score}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Description Box */}
                <div className="max-w-3xl mx-auto px-6 relative z-10">
                    <div className="bg-stone-900/40 border border-stone-700/50 p-8 md:p-12 rounded-2xl backdrop-blur-sm relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold-500/50 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
                        <h3 className="text-center text-lg font-serif font-bold text-gold-500 mb-6 flex items-center justify-center gap-3">
                            <Swords size={20} /> Detalles del Encuentro
                        </h3>
                        <p className="text-lg md:text-xl text-stone-300 text-center leading-relaxed font-light">
                            {match.description || "Un duelo titánico está por suceder. Dos guerreros entrarán a la arena, pero solo uno saldrá victorioso."}
                        </p>

                        {/* Stream CTA */}
                        {match.stream_url && (
                            <div className="mt-10 flex justify-center">
                                <a
                                    href={match.stream_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group/btn relative inline-flex items-center gap-3 px-8 py-4 bg-[#6441a5] hover:bg-[#7d5bbe] text-white font-bold uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(100,65,165,0.3)] hover:shadow-[0_0_30px_rgba(100,65,165,0.6)] hover:-translate-y-1"
                                >
                                    <Twitch size={24} />
                                    Ver Transmisión
                                    <div className="absolute inset-0 rounded-xl ring-2 ring-white/20 group-hover/btn:ring-white/40 transition-all"></div>
                                </a>
                            </div>
                        )}
                    </div>
                </div>

            </main>
            <Footer />
        </div>
    );
};
