import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Showmatch } from '../types';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { Swords, ArrowLeft, Clock, Twitch, Edit2, Check, X as CloseIcon, Info } from 'lucide-react';
import { useAuth } from '../AuthContext';

export const ShowmatchDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { profile } = useAuth();
    const [match, setMatch] = useState<Showmatch | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState('');
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [descriptionDraft, setDescriptionDraft] = useState('');
    const [selectedBadge, setSelectedBadge] = useState<{ image_url: string, description: string } | null>(null);

    useEffect(() => {
        const fetchMatch = async () => {
            if (!id) return;
            setLoading(true);
            const { data, error } = await supabase
                .from('showmatches')
                .select(`
                    *, 
                    p1:profiles!player1_id(
                        username, 
                        avatar_url, 
                        favorite_civ,
                        user_badges(badges(image_url, description))
                    ), 
                    p2:profiles!player2_id(
                        username, 
                        avatar_url, 
                        favorite_civ,
                        user_badges(badges(image_url, description))
                    )
                `)
                .eq('id', id)
                .single();

            if (!error && data) {
                setMatch(data);
                setDescriptionDraft(data.description || '');
            }
            setLoading(false);
        };
        fetchMatch();
    }, [id]);

    const handleUpdateDescription = async () => {
        if (!match) return;
        const { error } = await supabase
            .from('showmatches')
            .update({ description: descriptionDraft })
            .eq('id', match.id);

        if (!error) {
            setMatch({ ...match, description: descriptionDraft });
            setIsEditingDescription(false);
        }
    };

    useEffect(() => {
        if (!match || match.status !== 'scheduled') return;

        const updateTimer = () => {
            const now = new Date().getTime();
            const scheduledTime = new Date(match.scheduled_time).getTime();
            const distance = scheduledTime - now;

            if (distance < 0) {
                setTimeLeft('¡EN VIVO!');
            } else {
                const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);

                if (days > 0) {
                    setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
                } else {
                    setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
                }
            }
        };

        updateTimer();
        const timer = setInterval(updateTimer, 1000);

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

    const p1Badges = (p1?.user_badges || []).map((ub: any) => ub.badges);
    const p2Badges = (p2?.user_badges || []).map((ub: any) => ub.badges);

    const canEdit = profile?.role === 'admin' || profile?.role === 'web_master';

    return (
        <div className="min-h-screen bg-stone-950 text-gray-200 font-sans selection:bg-gold-500/30 overflow-x-hidden">
            <Navbar />

            {/* Epic Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <img
                    src="/fondoshowmatch.webp"
                    alt="War Background"
                    className="w-full h-full object-cover opacity-30 mix-blend-luminosity scale-110 animate-pulse-slow"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/80 to-stone-950/40"></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
            </div>

            {/* Illustration Layers */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-10 md:opacity-20 select-none">
                <img
                    src="/logo.png"
                    className="absolute -left-20 top-1/2 -translate-y-1/2 w-[60vh] h-[60vh] object-contain blur-sm brightness-50"
                    alt=""
                />
                <img
                    src="/logo.png"
                    className="absolute -right-20 top-1/2 -translate-y-1/2 w-[60vh] h-[60vh] object-contain blur-sm brightness-50 scale-x-[-1]"
                    alt=""
                />
            </div>

            <main className="relative z-10 min-h-screen flex flex-col pt-24 md:pt-28 pb-10">
                <div className="max-w-7xl mx-auto px-6 w-full flex-1 flex flex-col justify-between">

                    {/* Header Info */}
                    <div className="text-center">
                        <Link to="/showmatchs" className="inline-flex items-center gap-2 text-stone-500 hover:text-white mb-4 transition-colors group text-sm">
                            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Volver a la cartelera
                        </Link>

                        <div className="flex justify-center mb-4">
                            <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.3em] border backdrop-blur-xl shadow-2xl
                                ${match.status === 'live' ? 'bg-red-600/20 text-red-500 border-red-500/50 animate-pulse' :
                                    match.status === 'completed' ? 'bg-stone-800/40 text-stone-400 border-stone-700' :
                                        'bg-gold-600/20 text-gold-500 border-gold-500/30'}
                            `}>
                                {match.status === 'live' ? '🔴 En Vivo Ahora' :
                                    match.status === 'completed' ? 'Finalizado' : 'Próximamente'}
                            </div>
                        </div>

                        <h1 className="text-4xl md:text-5xl lg:text-7xl font-serif font-black text-white mb-4 uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-stone-200 to-stone-500 drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)]">
                            {match.title}
                        </h1>

                        {match.status === 'scheduled' && (
                            <div className="flex justify-center items-center gap-3 mb-8">
                                <Clock size={20} className="text-gold-500 animate-pulse" />
                                <span className="text-xl md:text-3xl font-mono font-bold text-gold-400 tracking-[0.2em] tabular-nums drop-shadow-lg">
                                    {timeLeft || 'Cargando...'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* VS Section */}
                    <div className="flex flex-col md:flex-row items-center justify-center gap-10 md:gap-4 lg:gap-20 mb-10 relative">

                        {/* Player 1 */}
                        <div className="flex-1 flex flex-col items-center group w-full md:w-auto">
                            <div className="relative w-40 h-40 md:w-56 md:h-56 lg:w-64 lg:h-64 mb-6 group-hover:scale-105 transition-all duration-700">
                                <div className="absolute inset-x-[-20%] inset-y-[-20%] bg-blue-600/20 blur-[60px] rounded-full animate-pulse-slow opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="absolute inset-0 rounded-full border-4 border-blue-500/40 group-hover:border-blue-400 shadow-[0_0_50px_rgba(59,130,246,0.2)] bg-stone-900 object-cover overflow-hidden z-10 transition-colors">
                                    {p1Avatar ? (
                                        <img src={p1Avatar} alt={p1Name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-stone-900 flex items-center justify-center text-stone-700 font-black text-6xl">P1</div>
                                    )}
                                </div>
                                <div className="absolute inset-2 rounded-full border border-blue-500/20 z-20 pointer-events-none"></div>
                            </div>

                            <h2 className="text-3xl lg:text-5xl font-serif font-black text-white uppercase tracking-wider text-center drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                                {p1Name}
                            </h2>

                            <div className="flex flex-wrap justify-center gap-3 mt-4 px-4 py-2 bg-stone-900/40 backdrop-blur-md rounded-2xl border border-white/5">
                                {p1Badges.length > 0 ? p1Badges.map((badge: any, idx: number) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedBadge(badge)}
                                        className="w-10 h-10 md:w-12 md:h-12 rounded-xl overflow-hidden border border-white/10 hover:border-gold-500 transition-all bg-stone-950 p-1 hover:scale-110 hover:-translate-y-1 shadow-lg"
                                    >
                                        <img src={badge.image_url} alt={badge.description} className="w-full h-full object-contain" />
                                    </button>
                                )) : <div className="text-[10px] text-stone-600 uppercase font-bold tracking-widest py-1">Sin Insignias</div>}
                            </div>

                            <div className="h-1 w-32 bg-blue-600/80 mt-6 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.6)]"></div>
                        </div>

                        {/* VS Divider */}
                        <div className="relative z-20 py-4 md:py-0">
                            <div className="text-8xl md:text-9xl font-serif font-black italic text-transparent bg-clip-text bg-gradient-to-b from-gold-400 via-gold-600 to-gold-800 drop-shadow-[0_0_40px_rgba(234,179,8,0.5)] transform md:-rotate-12 animate-float leading-none px-6 py-4 select-none">
                                VS
                            </div>
                        </div>

                        {/* Player 2 */}
                        <div className="flex-1 flex flex-col items-center group w-full md:w-auto">
                            <div className="relative w-40 h-40 md:w-56 md:h-56 lg:w-64 lg:h-64 mb-6 group-hover:scale-105 transition-all duration-700">
                                <div className="absolute inset-x-[-20%] inset-y-[-20%] bg-red-600/20 blur-[60px] rounded-full animate-pulse-slow opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="absolute inset-0 rounded-full border-4 border-red-500/40 group-hover:border-red-400 shadow-[0_0_50px_rgba(239,68,68,0.2)] bg-stone-900 object-cover overflow-hidden z-10 transition-colors">
                                    {p2Avatar ? (
                                        <img src={p2Avatar} alt={p2Name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-stone-900 flex items-center justify-center text-stone-700 font-black text-6xl">P2</div>
                                    )}
                                </div>
                                <div className="absolute inset-2 rounded-full border border-red-500/20 z-20 pointer-events-none"></div>
                            </div>

                            <h2 className="text-3xl lg:text-5xl font-serif font-black text-white uppercase tracking-wider text-center drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                                {p2Name}
                            </h2>

                            <div className="flex flex-wrap justify-center gap-3 mt-4 px-4 py-2 bg-stone-900/40 backdrop-blur-md rounded-2xl border border-white/5">
                                {p2Badges.length > 0 ? p2Badges.map((badge: any, idx: number) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedBadge(badge)}
                                        className="w-10 h-10 md:w-12 md:h-12 rounded-xl overflow-hidden border border-white/10 hover:border-gold-500 transition-all bg-stone-950 p-1 hover:scale-110 hover:-translate-y-1 shadow-lg"
                                    >
                                        <img src={badge.image_url} alt={badge.description} className="w-full h-full object-contain" />
                                    </button>
                                )) : <div className="text-[10px] text-stone-600 uppercase font-bold tracking-widest py-1">Sin Insignias</div>}
                            </div>

                            <div className="h-1 w-32 bg-red-600/80 mt-6 rounded-full shadow-[0_0_20px_rgba(220,38,38,0.6)]"></div>
                        </div>
                    </div>

                    {/* Bottom Info Section */}
                    <div className="max-w-4xl mx-auto w-full group">
                        <div className="bg-stone-950/60 backdrop-blur-2xl border border-white/10 p-6 md:p-8 rounded-3xl shadow-2xl relative overflow-hidden ring-1 ring-white/5 group-hover:ring-gold-500/20 transition-all">

                            <div className="flex items-center justify-between mb-4">
                                <span className="text-gold-500 text-[10px] font-black uppercase tracking-[0.4em] flex items-center gap-3 mx-auto">
                                    <Swords size={16} /> Detalles del Encuentro
                                </span>
                                {canEdit && (
                                    <button
                                        onClick={() => setIsEditingDescription(!isEditingDescription)}
                                        className="absolute right-6 top-6 text-stone-500 hover:text-gold-500 transition-colors"
                                        title="Editar detalles"
                                    >
                                        {isEditingDescription ? <CloseIcon size={18} /> : <Edit2 size={18} />}
                                    </button>
                                )}
                            </div>

                            {isEditingDescription ? (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <textarea
                                        value={descriptionDraft}
                                        onChange={(e) => setDescriptionDraft(e.target.value)}
                                        className="w-full bg-stone-900/50 border border-stone-700 rounded-xl p-4 text-white outline-none focus:border-gold-500 min-h-[100px] text-sm leading-relaxed"
                                        placeholder="Escribe los detalles del encuentro..."
                                    />
                                    <div className="flex justify-end gap-3">
                                        <button onClick={() => setIsEditingDescription(false)} className="px-4 py-2 text-xs font-bold text-stone-500 hover:text-white transition-colors uppercase">Cancelar</button>
                                        <button onClick={handleUpdateDescription} className="px-6 py-2 bg-gold-600 text-stone-950 text-xs font-black rounded-lg hover:bg-gold-500 transition-all uppercase flex items-center gap-2">
                                            <Check size={14} /> Guardar cambios
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-lg md:text-xl text-stone-300 text-center leading-relaxed font-light italic drop-shadow-sm">
                                    {match.description || "Un duelo titánico está por suceder. Dos guerreros entrarán a la arena, pero solo uno saldrá victorioso."}
                                </p>
                            )}

                            {match.stream_url && !isEditingDescription && (
                                <div className="mt-8 flex justify-center">
                                    <a
                                        href={match.stream_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group/btn relative inline-flex items-center gap-3 px-8 py-3 bg-[#6441a5] hover:bg-[#7d5bbe] text-white text-xs font-black uppercase tracking-[0.2em] rounded-xl transition-all shadow-[0_10px_30px_rgba(0,0,0,0.4)] hover:-translate-y-1 active:scale-95"
                                    >
                                        <Twitch size={18} />
                                        Ver Transmisión
                                        <div className="absolute inset-0 rounded-xl ring-1 ring-white/20 group-hover/btn:ring-white/40 transition-all"></div>
                                    </a>
                                </div>
                            )}

                            {match.status === 'completed' && match.result_score && (
                                <div className="mt-6 pt-6 border-t border-white/5 flex flex-col items-center">
                                    <span className="text-[10px] text-stone-500 font-bold uppercase tracking-widest mb-1">Resultado Final</span>
                                    <span className="text-4xl font-mono font-black text-gold-500 tracking-tighter bg-gold-500/5 px-6 py-2 rounded-2xl border border-gold-500/10">
                                        {match.result_score}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Badge Popup Modal */}
            {selectedBadge && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-stone-950/90 backdrop-blur-xl" onClick={() => setSelectedBadge(null)}></div>
                    <div className="relative bg-stone-900 border border-gold-600/30 p-8 rounded-3xl shadow-[0_0_100px_rgba(234,179,8,0.2)] max-w-sm w-full text-center group/modal">
                        <button
                            onClick={() => setSelectedBadge(null)}
                            className="absolute top-4 right-4 text-stone-600 hover:text-white transition-colors"
                        >
                            <CloseIcon size={24} />
                        </button>

                        <div className="w-32 h-32 mx-auto mb-6 p-2 bg-stone-950 rounded-2xl border border-white/10 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gold-600/10 animate-pulse"></div>
                            <img src={selectedBadge.image_url} alt="" className="w-full h-full object-contain relative z-10" />
                        </div>

                        <h3 className="text-gold-500 text-[10px] font-black uppercase tracking-[0.5em] mb-4 flex items-center justify-center gap-2">
                            <Info size={14} /> Logro de Guerrero
                        </h3>
                        <p className="text-xl text-white font-serif font-bold leading-relaxed">
                            {selectedBadge.description}
                        </p>

                        <button
                            onClick={() => setSelectedBadge(null)}
                            className="mt-8 w-full py-4 border border-stone-800 rounded-xl text-stone-400 hover:bg-stone-800 hover:text-white transition-all text-xs font-bold uppercase tracking-widest"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}

            <Footer />

            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px) rotate(-12deg); }
                    50% { transform: translateY(-10px) rotate(-10deg); }
                }
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
                .animate-pulse-slow {
                    animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 0.4; transform: scale(1.1); }
                    50% { opacity: 0.5; transform: scale(1.12); }
                }
            `}</style>
        </div>
    );
};
