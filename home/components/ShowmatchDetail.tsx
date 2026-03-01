import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Showmatch } from '../types';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { Swords, ArrowLeft, Twitch, X as CloseIcon } from 'lucide-react';
import { FireParticles } from './FireParticles';

// Custom CSS for animations
const animationStyles = `
@keyframes breathing {
  0% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(1); opacity: 0.8; }
}

@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
}

.animate-breathing {
  animation: breathing 4s ease-in-out infinite;
}

.animate-float {
  animation: float 6s ease-in-out infinite;
}
`;

export const ShowmatchDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [match, setMatch] = useState<Showmatch | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState('');
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
            }
            setLoading(false);
        };
        fetchMatch();
    }, [id]);

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

    return (
        <div className="h-screen bg-stone-950 text-gray-200 font-sans selection:bg-gold-500/30 overflow-hidden relative">
            <style>{animationStyles}</style>
            <Navbar />

            {/* Background - Using the new image with incorporated boars */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <img
                    src="/showmatchfondo2.webp"
                    alt="War Background"
                    className="w-full h-full object-cover opacity-90 scale-100"
                />

                {/* Fire Overlay Gradients */}
                <div className="absolute inset-x-0 bottom-0 h-[60vh] bg-gradient-to-t from-[#ff4500]/15 via-[#ff0000]/5 to-transparent mix-blend-screen"></div>
                <div className="absolute inset-0 bg-stone-950/20"></div> {/* General darkening */}
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-stone-950/40"></div> {/* Vignette */}

                {/* Embedded Particles */}
                <div className="absolute inset-0 z-10">
                    <FireParticles />
                </div>
            </div>

            <main className="relative z-10 h-full flex flex-col pt-16 md:pt-20">
                <div className="max-w-6xl mx-auto px-4 w-full h-full flex flex-col justify-center py-4">

                    {/* Header Info - Smaller */}
                    <div className="text-center mb-2">
                        <Link to="/showmatchs" className="inline-flex items-center gap-1.5 text-stone-200 hover:text-white mb-2 transition-colors group text-xs drop-shadow-lg font-bold">
                            <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" /> Cartelera
                        </Link>

                        <div className="flex justify-center mb-1">
                            <div className={`px-3 py-0.5 rounded-full text-[8px] font-black uppercase tracking-[0.2em] border backdrop-blur-md shadow-lg
                                ${match.status === 'live' ? 'bg-red-600/40 text-white border-red-500 animate-pulse' :
                                    match.status === 'completed' ? 'bg-stone-800/60 text-stone-200 border-stone-600' :
                                        'bg-gold-600/40 text-white border-gold-500'}
                            `}>
                                {match.status === 'live' ? 'En Vivo' : match.status === 'completed' ? 'Finalizado' : 'Próximamente'}
                            </div>
                        </div>

                        <h1 className="text-2xl md:text-5xl font-serif font-black text-white mb-1 uppercase tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                            {match.title}
                        </h1>

                        {match.status === 'scheduled' && (
                            <div className="flex justify-center items-center gap-2 mb-2">
                                <span className="text-xl md:text-3xl font-serif text-gold-300 tracking-[0.2em] uppercase drop-shadow-[0_2px_15px_rgba(255,215,0,0.6)]">
                                    {timeLeft || '...'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* VS Section - Cinematic Wide Layout */}
                    <div className="flex flex-row items-center justify-between gap-4 w-full max-w-7xl mx-auto mb-12 relative h-auto mt-8 md:mt-24">

                        {/* Outer P1 Container - Left Side */}
                        <div className="flex flex-col items-center w-48 relative z-20 shrink-0 animate-float">
                            {/* Glowing P1 Ring */}
                            <div className="relative w-32 h-32 md:w-56 md:h-56 mb-4 flex items-center justify-center">
                                {/* Outer Glow Effect */}
                                <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-2xl animate-pulse"></div>
                                {/* Intricate Blue Ring Style */}
                                <div className="absolute inset-0 rounded-full border-[12px] border-[#0a2e5c]/80 shadow-[0_0_30px_#00bfff,inset_0_0_20px_#00bfff] animate-[spin_30s_linear_infinite]">
                                    {/* Decorative outer markers */}
                                    <div className="absolute -inset-[14px] border-[2px] border-blue-400/50 rounded-full border-dashed opacity-50"></div>
                                </div>
                                {/* Inner Avatar */}
                                <div className="absolute inset-3 rounded-full bg-stone-900 overflow-hidden flex items-center justify-center z-10 border-4 border-blue-300/80 shadow-[inset_0_0_20px_rgba(0,0,0,0.9)]">
                                    {p1Avatar ? (
                                        <img src={p1Avatar} alt={p1Name} className="w-full h-full object-cover scale-110" />
                                    ) : (
                                        <div className="w-full h-full bg-stone-900 flex items-center justify-center text-blue-500 font-bold text-2xl">P1</div>
                                    )}
                                </div>
                            </div>

                            <h2 className="text-lg md:text-2xl font-serif font-black text-white uppercase tracking-widest text-center drop-shadow-[0_2px_8px_rgba(0,0,0,1)]">
                                {p1Name}
                            </h2>

                            <div className="flex flex-wrap justify-center gap-2 mt-3 z-30">
                                {p1Badges.length > 0 ? p1Badges.map((badge: any, idx: number) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedBadge(badge)}
                                        className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden border-2 border-amber-600/50 hover:border-gold-400 transition-all bg-stone-950 hover:scale-110 shadow-[0_0_10px_rgba(0,0,0,0.8)] relative group p-0"
                                    >
                                        <div className="absolute inset-0 bg-gold-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <img src={badge.image_url} alt={badge.description} className="w-full h-full object-contain p-1 relative z-10" />
                                    </button>
                                )) : null}
                            </div>
                        </div>

                        {/* Center Stage - Boars are in the background image */}
                        <div className="flex-1 flex items-center justify-center relative min-h-[400px]">

                            <div className="relative z-30 transform hover:scale-110 transition-transform duration-500 animate-breathing">
                                {/* Intense glowing VS sign */}
                                <div className="absolute inset-0 bg-gold-500 blur-3xl opacity-20 animate-pulse"></div>
                                <div className="text-8xl md:text-[160px] font-serif font-black italic text-transparent bg-clip-text bg-gradient-to-b from-[#ffd700] via-[#ffaa00] to-[#b8860b] drop-shadow-[0_10px_30px_rgba(0,0,0,0.9)] leading-none select-none relative z-10"
                                    style={{ WebkitTextStroke: '2px rgba(255, 255, 255, 0.4)' }}>
                                    VS
                                </div>
                            </div>
                        </div>

                        {/* Outer P2 Container - Right Side */}
                        <div className="flex flex-col items-center w-48 relative z-20 shrink-0 animate-float" style={{ animationDelay: '1s' }}>
                            {/* Glowing P2 Ring */}
                            <div className="relative w-32 h-32 md:w-56 md:h-56 mb-4 flex items-center justify-center">
                                {/* Outer Glow Effect */}
                                <div className="absolute inset-0 rounded-full bg-red-600/20 blur-2xl animate-pulse"></div>
                                {/* Intricate Red Ring Style */}
                                <div className="absolute inset-0 rounded-full border-[12px] border-[#5c0a0a]/80 shadow-[0_0_30px_#ff0000,inset_0_0_20px_#ff0000] animate-[spin_30s_linear_infinite_reverse]">
                                    {/* Decorative outer markers */}
                                    <div className="absolute -inset-[14px] border-[2px] border-red-500/50 rounded-full border-dashed opacity-50"></div>
                                </div>
                                {/* Inner Avatar */}
                                <div className="absolute inset-3 rounded-full bg-stone-900 overflow-hidden flex items-center justify-center z-10 border-4 border-red-400/80 shadow-[inset_0_0_20px_rgba(0,0,0,0.9)]">
                                    {p2Avatar ? (
                                        <img src={p2Avatar} alt={p2Name} className="w-full h-full object-cover scale-110" />
                                    ) : (
                                        <div className="w-full h-full bg-stone-900 flex items-center justify-center text-red-600 font-bold text-2xl">P2</div>
                                    )}
                                </div>
                            </div>

                            <h2 className="text-lg md:text-2xl font-serif font-black text-white uppercase tracking-widest text-center drop-shadow-[0_2px_8px_rgba(0,0,0,1)]">
                                {p2Name}
                            </h2>

                            <div className="flex flex-wrap justify-center gap-2 mt-3 z-30">
                                {p2Badges.length > 0 ? p2Badges.map((badge: any, idx: number) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedBadge(badge)}
                                        className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden border-2 border-amber-600/50 hover:border-gold-400 transition-all bg-stone-950 hover:scale-110 shadow-[0_0_10px_rgba(0,0,0,0.8)] relative group p-0"
                                    >
                                        <div className="absolute inset-0 bg-gold-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <img src={badge.image_url} alt={badge.description} className="w-full h-full object-contain p-1 relative z-10" />
                                    </button>
                                )) : null}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Info Section - Parchment Style */}
                    <div className="max-w-3xl mx-auto w-full mt-auto relative z-20 pb-12">
                        {/* Parchment background simulation using CSS textures */}
                        <div className="bg-[#d4bca0] p-6 md:p-8 relative shadow-[0_20px_50px_rgba(0,0,0,0.8)] border-4 border-[#8b6b4b]"
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.15'/%3E%3C/svg%3E")`,
                                clipPath: 'polygon(2% 0%, 98% 1%, 100% 98%, 1% 99%)', // Tattered edges simulation
                                boxShadow: 'inset 0 0 40px rgba(101,67,33,0.6)',
                            }}>

                            {/* Inner parchment dark border */}
                            <div className="absolute inset-2 border-2 border-[#5c3a21] opacity-30 pointer-events-none" style={{ clipPath: 'polygon(1% 1%, 99% -1%, 98% 99%, 0% 100%)' }}></div>

                            <div className="flex items-center justify-center mb-3 text-[#3a2012]">
                                <span className="text-sm font-serif font-black uppercase tracking-[0.2em] flex items-center gap-2 border-b border-[#5c3a21] pb-1">
                                    <Swords size={20} /> DETALLES DEL ENCUENTRO
                                </span>
                            </div>

                            <p className="text-base md:text-xl text-[#2a170a] text-center leading-relaxed font-serif italic font-semibold max-w-2xl mx-auto">
                                {match.description || "Un duelo legendario en las tierras sombrías. Dos campeones de 'Boars Slayers' se enfrentan por la gloria eterna en una batalla que sacudirá los cimientos del reino. ¿Quién prevalecerá?"}
                            </p>
                        </div>

                        {/* Twitch Button underneath */}
                        <div className="flex justify-center mt-6">
                            {match.stream_url && (
                                <a
                                    href={match.stream_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="relative inline-flex items-center justify-center gap-3 px-12 py-4 bg-gradient-to-r from-[#4d2c88] via-[#6441a5] to-[#4d2c88] text-white text-sm font-black uppercase tracking-[0.3em] transition-all shadow-[0_0_20px_rgba(100,65,165,0.6)] hover:shadow-[0_0_40px_rgba(100,65,165,0.9)] hover:scale-105 active:scale-95 group overflow-hidden border-2 border-[#9b6cd8] rounded-full"
                                >
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none"></div>
                                    <Twitch size={24} className="animate-pulse" /> VER TRANSMISIÓN
                                </a>
                            )}
                        </div>

                        {match.status === 'completed' && match.result_score && (
                            <div className="mt-8 flex flex-col items-center">
                                <span className="text-5xl md:text-7xl font-serif font-black text-transparent bg-clip-text bg-gradient-to-b from-stone-200 to-stone-500 drop-shadow-[0_5px_15px_rgba(0,0,0,1)]">
                                    {match.result_score}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Badge Popup Modal - Same size */}
            {selectedBadge && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-stone-950/95 backdrop-blur-xl" onClick={() => setSelectedBadge(null)}></div>
                    <div className="relative bg-stone-900 border border-gold-600/30 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center">
                        <button
                            onClick={() => setSelectedBadge(null)}
                            className="absolute top-4 right-4 text-stone-500 hover:text-white transition-colors"
                        >
                            <CloseIcon size={24} />
                        </button>
                        <div className="w-28 h-28 mx-auto mb-6 p-2 bg-stone-950 rounded-2xl border border-white/20">
                            <img src={selectedBadge.image_url} alt="" className="w-full h-full object-contain" />
                        </div>
                        <h3 className="text-gold-500 text-[10px] font-black uppercase tracking-[0.5em] mb-4">Insignia de Guerrero</h3>
                        <p className="text-xl text-white font-serif font-bold leading-relaxed drop-shadow-md">{selectedBadge.description}</p>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};
