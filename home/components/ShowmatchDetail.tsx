import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Showmatch } from '../types';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { Swords, ArrowLeft, Twitch, X as CloseIcon } from 'lucide-react';
import { FireParticles } from './FireParticles';

// Custom CSS for animations and high-fidelity effects
const animationStyles = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&display=swap');

@keyframes breathing {
  0% { transform: scale(1); opacity: 0.8; box-shadow: 0 0 20px rgba(255, 215, 0, 0.2); }
  50% { transform: scale(1.05); opacity: 1; box-shadow: 0 0 50px rgba(255, 215, 0, 0.5); }
  100% { transform: scale(1); opacity: 0.8; box-shadow: 0 0 20px rgba(255, 215, 0, 0.2); }
}

@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-15px); }
  100% { transform: translateY(0px); }
}

@keyframes pulse-glow {
  0% { opacity: 0.4; }
  50% { opacity: 0.8; }
  100% { opacity: 0.4; }
}

.animate-breathing {
  animation: breathing 4s ease-in-out infinite;
}

.animate-float {
  animation: float 6s ease-in-out infinite;
}

.font-cinzel {
  font-family: 'Cinzel', serif;
}

.font-crimson {
  font-family: 'Crimson Text', serif;
}

.parchment-border {
  border-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0H100V100H0V0Z' fill='none'/%3E%3Cpath d='M5 5V95M95 5V95M5 5H95M5 95H95' stroke='%235c3a21' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M2 2L8 8M92 2L98 8M2 92L8 98M92 92L98 98' stroke='%238b6b4b' stroke-width='2'/%3E%3C/svg%3E") 30 stretch;
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
                    className="w-full h-full object-cover opacity-100 scale-105"
                />

                {/* Fire Overlay Gradients - Enhanced for Cinematic Depth */}
                <div className="absolute inset-x-0 bottom-0 h-[70vh] bg-gradient-to-t from-[#ff4500]/30 via-[#ff0000]/10 to-transparent mix-blend-screen"></div>
                <div className="absolute inset-0 bg-stone-950/30"></div> {/* General darkening */}
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-transparent to-stone-950/60"></div> {/* Stronger Vignette */}

                {/* Bottom Embers Resplandor */}
                <div className="absolute inset-x-0 bottom-0 h-32 bg-[#ff6600]/10 blur-3xl"></div>

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

                        <h1 className="text-3xl md:text-6xl font-cinzel font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-stone-200 to-stone-400 mb-1 uppercase tracking-[0.1em] drop-shadow-[0_4px_15px_rgba(0,0,0,1)]">
                            {match.title}
                        </h1>

                        {match.status === 'scheduled' && (
                            <div className="flex justify-center items-center gap-2 mb-2">
                                <span className="text-2xl md:text-4xl font-cinzel text-transparent bg-clip-text bg-gradient-to-b from-[#ffd700] to-[#b8860b] tracking-[0.3em] uppercase drop-shadow-[0_0_20px_rgba(255,170,0,0.8)]">
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
                                <div className="absolute inset-3 rounded-full bg-stone-900 overflow-hidden flex items-center justify-center z-10 border-[6px] border-blue-400/80 shadow-[inset_0_0_30px_#000,0_0_40px_rgba(0,191,255,0.4)]">
                                    {p1Avatar ? (
                                        <img src={p1Avatar} alt={p1Name} className="w-full h-full object-cover scale-110" />
                                    ) : (
                                        <div className="w-full h-full bg-stone-900 flex items-center justify-center text-blue-500 font-bold text-2xl">P1</div>
                                    )}
                                </div>
                            </div>

                            <h2 className="text-xl md:text-3xl font-cinzel font-black text-white uppercase tracking-widest text-center drop-shadow-[0_5px_15px_rgba(0,0,0,1)]">
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
                                <div className="absolute inset-0 bg-[#ffd700] blur-[100px] opacity-20 animate-pulse"></div>
                                <div className="text-9xl md:text-[180px] font-cinzel font-black italic text-transparent bg-clip-text bg-gradient-to-b from-[#ffd700] via-[#ffaa00] to-[#b8860b] drop-shadow-[0_15px_40px_rgba(0,0,0,1)] leading-none select-none relative z-10"
                                    style={{ WebkitTextStroke: '2.5px rgba(255, 255, 255, 0.5)' }}>
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
                                <div className="absolute inset-3 rounded-full bg-stone-900 overflow-hidden flex items-center justify-center z-10 border-[6px] border-red-500/80 shadow-[inset_0_0_30px_#000,0_0_40px_rgba(255,0,0,0.4)]">
                                    {p2Avatar ? (
                                        <img src={p2Avatar} alt={p2Name} className="w-full h-full object-cover scale-110" />
                                    ) : (
                                        <div className="w-full h-full bg-stone-900 flex items-center justify-center text-red-600 font-bold text-2xl">P2</div>
                                    )}
                                </div>
                            </div>

                            <h2 className="text-xl md:text-3xl font-cinzel font-black text-white uppercase tracking-widest text-center drop-shadow-[0_5px_15px_rgba(0,0,0,1)]">
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
                    <div className="max-w-3xl mx-auto w-full mt-auto relative z-20 pb-8 translate-y-4">
                        {/* High-Fidelity Parchment with tattered edges and burnt border */}
                        <div className="relative p-7 md:p-10 shadow-[0_30px_80px_rgba(0,0,0,0.9)] transform-gpu"
                            style={{
                                background: '#dcc6ac',
                                backgroundImage: `url("https://www.transparenttextures.com/patterns/paper-fibers.png")`,
                                boxShadow: 'inset 0 0 60px rgba(101,67,33,0.7), 0 20px 50px rgba(0,0,0,0.8)',
                                clipPath: 'polygon(1.5% 2%, 98.5% 1%, 99.5% 98%, 0.5% 99.5%, 2% 85%, 0% 50%, 2% 15%)',
                                border: '1px solid #5c3a21',
                            }}>

                            {/* Inner antique border */}
                            <div className="absolute inset-3 border-[3px] border-[#5c3a21]/40 pointer-events-none"
                                style={{ clipPath: 'polygon(1% 1%, 99% 1.5%, 98.5% 99%, 0.5% 98.5%)' }}></div>

                            <div className="flex items-center justify-center mb-4 text-[#3a2012]">
                                <span className="text-lg font-cinzel font-black uppercase tracking-[0.4em] flex items-center gap-3 border-b-2 border-[#5c3a21]/60 pb-1">
                                    <Swords size={24} className="text-[#5c3a21]" /> DETALLES DEL ENCUENTRO
                                </span>
                            </div>

                            <p className="text-xl md:text-2xl text-[#2a170a] text-center leading-[1.6] font-crimson italic font-bold max-w-2xl mx-auto drop-shadow-sm">
                                {match.description || "Un duelo legendario en las tierras sombrías. Dos campeones de 'Boars Slayers' se enfrentan por la gloria eterna en una batalla que sacudirá los cimientos del reino. ¿Quién prevalecerá?"}
                            </p>

                            {/* Decorative corner accents */}
                            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#5c3a21]/30"></div>
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#5c3a21]/30"></div>
                        </div>

                        {/* Metallic Twitch Button underneath */}
                        <div className="flex justify-center mt-8">
                            {match.stream_url && (
                                <a
                                    href={match.stream_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="relative inline-flex items-center justify-center gap-4 px-14 py-5 font-cinzel font-black text-white text-base uppercase tracking-[0.3em] transition-all group overflow-hidden border-2 border-[#ffd700]/30 rounded-lg shadow-[0_10px_30px_rgba(0,0,0,0.8)]"
                                    style={{
                                        background: 'linear-gradient(135deg, #1b0a33 0%, #4d2c88 50%, #1b0a33 100%)',
                                        boxShadow: '0 0 20px rgba(155, 108, 216, 0.3), inset 0 0 15px rgba(255, 255, 255, 0.1)',
                                    }}
                                >
                                    {/* Lustre Animado */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                                    {/* Hover resplandor */}
                                    <div className="absolute inset-0 bg-[#ffd700]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                    <Twitch size={28} className="drop-shadow-[0_0_10px_white]" />
                                    <span className="relative z-10 drop-shadow-md">VER TRANSMISIÓN</span>

                                    {/* Bordes dorados sutiles */}
                                    <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-[#ffd700]/60"></div>
                                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-[#ffd700]/60"></div>
                                </a>
                            )}
                        </div>

                        {match.status === 'completed' && match.result_score && (
                            <div className="mt-8 flex flex-col items-center">
                                <span className="text-6xl md:text-8xl font-cinzel font-black text-transparent bg-clip-text bg-gradient-to-b from-[#ffd700] to-[#b8860b] drop-shadow-[0_10px_30px_rgba(0,0,0,1)]">
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
