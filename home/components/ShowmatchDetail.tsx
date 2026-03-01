import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Showmatch } from '../types';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { Swords, ArrowLeft, Clock, Twitch, Edit2, Check, X as CloseIcon } from 'lucide-react';
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
        <div className="h-screen bg-stone-950 text-gray-200 font-sans selection:bg-gold-500/30 overflow-hidden relative">
            <Navbar />

            {/* Background - Clearer as requested */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <img
                    src="/fondoshowmatch.webp"
                    alt="War Background"
                    className="w-full h-full object-cover opacity-60 mix-blend-normal scale-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-stone-950/20"></div>
            </div>

            <main className="relative z-10 h-full flex flex-col pt-16 md:pt-20">
                <div className="max-w-6xl mx-auto px-4 w-full h-full flex flex-col justify-center py-4">

                    {/* Header Info - Smaller */}
                    <div className="text-center mb-2">
                        <Link to="/showmatchs" className="inline-flex items-center gap-1.5 text-stone-400 hover:text-white mb-2 transition-colors group text-xs">
                            <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" /> Cartelera
                        </Link>

                        <div className="flex justify-center mb-1">
                            <div className={`px-3 py-0.5 rounded-full text-[8px] font-black uppercase tracking-[0.2em] border backdrop-blur-md
                                ${match.status === 'live' ? 'bg-red-600/20 text-red-500 border-red-500/50 animate-pulse' :
                                    match.status === 'completed' ? 'bg-stone-800/40 text-stone-400 border-stone-700' :
                                        'bg-gold-600/20 text-gold-500 border-gold-500/30'}
                            `}>
                                {match.status === 'live' ? 'En Vivo' : match.status === 'completed' ? 'Finalizado' : 'Próximamente'}
                            </div>
                        </div>

                        <h1 className="text-2xl md:text-4xl font-serif font-black text-white mb-1 uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-stone-400 drop-shadow-md">
                            {match.title}
                        </h1>

                        {match.status === 'scheduled' && (
                            <div className="flex justify-center items-center gap-2 mb-2">
                                <Clock size={16} className="text-gold-500" />
                                <span className="text-lg md:text-xl font-mono font-bold text-gold-400 tracking-widest uppercase">
                                    {timeLeft || '...'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* VS Section - Much more compact */}
                    <div className="flex flex-row items-center justify-center gap-4 md:gap-12 mb-4 relative h-auto">

                        {/* Player 1 */}
                        <div className="flex-1 flex flex-col items-center max-w-[200px]">
                            <div className="relative w-24 h-24 md:w-32 md:h-32 mb-3">
                                <div className="absolute inset-0 rounded-full border-2 border-blue-500/40 bg-stone-900 object-cover overflow-hidden z-10 shadow-lg shadow-blue-900/20">
                                    {p1Avatar ? (
                                        <img src={p1Avatar} alt={p1Name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-stone-950 flex items-center justify-center text-stone-700 font-black text-2xl">P1</div>
                                    )}
                                </div>
                            </div>

                            <h2 className="text-xl md:text-2xl font-serif font-black text-white uppercase tracking-wide text-center truncate w-full">
                                {p1Name}
                            </h2>

                            <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                                {p1Badges.length > 0 ? p1Badges.map((badge: any, idx: number) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedBadge(badge)}
                                        className="w-7 h-7 md:w-8 md:h-8 rounded-lg overflow-hidden border border-white/10 hover:border-gold-500 transition-all bg-stone-950/80 p-0.5 hover:scale-110 shadow-md"
                                    >
                                        <img src={badge.image_url} alt={badge.description} className="w-full h-full object-contain" />
                                    </button>
                                )) : null}
                            </div>
                        </div>

                        {/* VS Divider - Compact */}
                        <div className="relative z-20 shrink-0">
                            <div className="text-5xl md:text-7xl font-serif font-black italic text-transparent bg-clip-text bg-gradient-to-b from-gold-400 to-gold-700 drop-shadow-lg -rotate-6 select-none leading-none">
                                VS
                            </div>
                        </div>

                        {/* Player 2 */}
                        <div className="flex-1 flex flex-col items-center max-w-[200px]">
                            <div className="relative w-24 h-24 md:w-32 md:h-32 mb-3">
                                <div className="absolute inset-0 rounded-full border-2 border-red-500/40 bg-stone-900 object-cover overflow-hidden z-10 shadow-lg shadow-red-900/20">
                                    {p2Avatar ? (
                                        <img src={p2Avatar} alt={p2Name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-stone-950 flex items-center justify-center text-stone-700 font-black text-2xl">P2</div>
                                    )}
                                </div>
                            </div>

                            <h2 className="text-xl md:text-2xl font-serif font-black text-white uppercase tracking-wide text-center truncate w-full">
                                {p2Name}
                            </h2>

                            <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                                {p2Badges.length > 0 ? p2Badges.map((badge: any, idx: number) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedBadge(badge)}
                                        className="w-7 h-7 md:w-8 md:h-8 rounded-lg overflow-hidden border border-white/10 hover:border-gold-500 transition-all bg-stone-950/80 p-0.5 hover:scale-110 shadow-md"
                                    >
                                        <img src={badge.image_url} alt={badge.description} className="w-full h-full object-contain" />
                                    </button>
                                )) : null}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Info Section - Modal style but smaller */}
                    <div className="max-w-2xl mx-auto w-full">
                        <div className="bg-stone-950/70 backdrop-blur-xl border border-white/5 p-4 md:p-5 rounded-2xl shadow-xl relative overflow-hidden ring-1 ring-white/5">

                            <div className="flex items-center justify-between mb-3">
                                <span className="text-gold-500 text-[8px] font-black uppercase tracking-[0.3em] flex items-center gap-2 mx-auto">
                                    <Swords size={12} /> Detalles
                                </span>
                                {canEdit && (
                                    <button
                                        onClick={() => setIsEditingDescription(!isEditingDescription)}
                                        className="absolute right-4 top-4 text-stone-500 hover:text-gold-500 transition-colors"
                                    >
                                        {isEditingDescription ? <CloseIcon size={14} /> : <Edit2 size={14} />}
                                    </button>
                                )}
                            </div>

                            {isEditingDescription ? (
                                <div className="space-y-3">
                                    <textarea
                                        value={descriptionDraft}
                                        onChange={(e) => setDescriptionDraft(e.target.value)}
                                        className="w-full bg-stone-900 border border-stone-700 rounded-lg p-3 text-white outline-none focus:border-gold-500 min-h-[80px] text-xs leading-relaxed"
                                    />
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => setIsEditingDescription(false)} className="px-3 py-1.5 text-[10px] font-bold text-stone-500 hover:text-white transition-colors uppercase">Cancelar</button>
                                        <button onClick={handleUpdateDescription} className="px-4 py-1.5 bg-gold-600 text-stone-950 text-[10px] font-black rounded hover:bg-gold-500 transition-all uppercase flex items-center gap-1.5">
                                            <Check size={12} /> Guardar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm md:text-base text-stone-300 text-center leading-relaxed font-light italic">
                                    {match.description || "Un duelo titánico está por suceder..."}
                                </p>
                            )}

                            {match.stream_url && !isEditingDescription && (
                                <div className="mt-4 flex justify-center">
                                    <a
                                        href={match.stream_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-6 py-2 bg-[#6441a5] hover:bg-[#7d5bbe] text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all shadow-lg active:scale-95"
                                    >
                                        <Twitch size={14} /> Transmisión
                                    </a>
                                </div>
                            )}

                            {match.status === 'completed' && match.result_score && (
                                <div className="mt-4 pt-3 border-t border-white/5 flex flex-col items-center">
                                    <span className="text-3xl font-mono font-black text-gold-500 bg-gold-500/5 px-4 py-1 rounded-lg border border-gold-500/10">
                                        {match.result_score}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Badge Popup Modal - Same size */}
            {selectedBadge && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-stone-950/90 backdrop-blur-xl" onClick={() => setSelectedBadge(null)}></div>
                    <div className="relative bg-stone-900 border border-gold-600/30 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center">
                        <button
                            onClick={() => setSelectedBadge(null)}
                            className="absolute top-4 right-4 text-stone-600 hover:text-white"
                        >
                            <CloseIcon size={24} />
                        </button>
                        <div className="w-24 h-24 mx-auto mb-6 p-2 bg-stone-950 rounded-2xl border border-white/10">
                            <img src={selectedBadge.image_url} alt="" className="w-full h-full object-contain" />
                        </div>
                        <h3 className="text-gold-500 text-[10px] font-black uppercase tracking-[0.5em] mb-4">Insignia</h3>
                        <p className="text-xl text-white font-serif font-bold leading-relaxed">{selectedBadge.description}</p>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};
