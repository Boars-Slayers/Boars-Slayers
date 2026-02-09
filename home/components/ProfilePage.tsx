import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, UserProfile } from '../lib/supabase';
import { ExternalLink, MessageSquare, ArrowLeft, Loader2, Award, Swords, TrendingUp, Trophy } from 'lucide-react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { fetchPlayerStats, PlayerStats } from '../lib/aoe';
import { useAuth } from '../AuthContext';
import { Moment } from '../types';
import { MomentCard } from './Moments/MomentCard';
import { UploadMomentModal } from './Moments/UploadMomentModal';
import { ImageIcon } from 'lucide-react';


export const ProfilePage: React.FC = () => {
    const { username } = useParams<{ username: string }>();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [stats, setStats] = useState<PlayerStats | null>(null);
    const [loading, setLoading] = useState(true);
    const { user: currentUser } = useAuth();
    const [moments, setMoments] = useState<Moment[]>([]);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [userBadges, setUserBadges] = useState<{ id: string, image_url: string, description: string }[]>([]);


    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select(`
                    *,
                    user_roles (
                        clan_roles (name, color)
                    ),
                    user_badges (
                        badges (*)
                    )
                `)
                .eq('username', username)
                .single();

            if (!error && data) {
                const formattedProfile = {
                    ...data,
                    roles: data.user_roles?.map((ur: any) => ur.clan_roles) || [],
                    badges: data.user_badges?.map((ub: any) => ub.badges) || []
                };
                setProfile(formattedProfile);

                // Use cached stats if available
                if (data.elo_1v1) {
                    setStats({
                        steamId: data.steam_id,
                        name: data.username,
                        elo1v1: data.elo_1v1,
                        eloTG: data.elo_tg,
                        winRate1v1: data.win_rate_1v1,
                        gamesPlayed: data.games_played,
                        streak: data.streak,
                        rank: data.rank_1v1
                    });
                } else if (data.steam_id || data.aoe_profile_id || data.aoe_insights_url) {
                    // Fetch only if not cached and we have at least one ID
                    let aoeId = data.aoe_profile_id;
                    if (!aoeId && data.aoe_insights_url) {
                        const match = data.aoe_insights_url.match(/\/user\/(\d+)/);
                        if (match && match[1]) {
                            aoeId = match[1];
                        }
                    }

                    fetchPlayerStats(data.steam_id, aoeId).then(setStats);
                }

                // Fetch Moments
                fetchMoments(data.id);
                // Set Badges (already fetched in join)
                setUserBadges(formattedProfile.badges);
            }
            setLoading(false);
        };
        if (username) fetchProfile();
    }, [username]);

    const fetchMoments = async (userId: string) => {
        try {
            // Fetch moments uploaded by the user
            const { data: uploadedMoments } = await supabase
                .from('moments')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            // Fetch moments where the user is tagged
            const { data: taggedData } = await supabase
                .from('moment_tags')
                .select('moment_id')
                .eq('user_id', userId);

            let allMoments = uploadedMoments || [];

            if (taggedData && taggedData.length > 0) {
                const momentIds = taggedData.map(t => t.moment_id);
                const { data: taggedMoments } = await supabase
                    .from('moments')
                    .select('*')
                    .in('id', momentIds)
                    .order('created_at', { ascending: false });

                if (taggedMoments) {
                    const combined = [...allMoments, ...taggedMoments];
                    const uniqueMap = new Map();
                    combined.forEach(m => uniqueMap.set(m.id, m));
                    allMoments = Array.from(uniqueMap.values()).sort((a, b) =>
                        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    );
                }
            }
            setMoments(allMoments);
        } catch (error) {
            console.error('Error fetching moments:', error);
        }
    };



    if (loading) {
        return (
            <div className="min-h-screen bg-stone-950 flex items-center justify-center">
                <Loader2 size={48} className="text-gold-500 animate-spin" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center text-center px-6">
                <h1 className="text-4xl font-serif font-bold text-white mb-4">Guerrero No Encontrado</h1>
                <p className="text-stone-400 mb-8 text-lg">Este combatiente aún no ha sido reclutado o su nombre ha sido borrado de las crónicas.</p>
                <Link to="/" className="text-gold-500 hover:text-gold-400 flex items-center gap-2 font-bold uppercase tracking-widest text-sm bg-gold-900/20 px-6 py-3 rounded-lg border border-gold-600/30">
                    <ArrowLeft size={16} /> Volver al Campamento
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-950 text-gray-200">
            <Navbar />
            <div className="relative h-64 md:h-80 w-full overflow-hidden">
                <div className="absolute inset-0 bg-stone-900">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-stone-950"></div>
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>
                </div>
                <div className="relative max-w-7xl mx-auto px-6 h-full flex items-end pb-8">
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-6 w-full">
                        <div className="relative group">
                            <img
                                src={profile.avatar_url}
                                alt={profile.username}
                                className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-stone-950 shadow-2xl relative z-10 bg-stone-800 object-cover"
                            />
                            <div className="absolute inset-0 rounded-full bg-gold-600 animate-pulse -z-0 opacity-20 group-hover:opacity-40 blur-xl transition-opacity"></div>
                        </div>
                        <div className="flex-1 text-center md:text-left mb-2">
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
                                <h1 className="text-3xl md:text-5xl font-serif font-black text-white">{profile.username}</h1>
                                <div className="flex flex-wrap gap-2">
                                    {profile.roles && profile.roles.length > 0 ? (
                                        profile.roles.map((r, i) => (
                                            <span
                                                key={i}
                                                className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border"
                                                style={{
                                                    backgroundColor: `${r.color}20`,
                                                    color: r.color,
                                                    borderColor: `${r.color}40`
                                                }}
                                            >
                                                {r.name}
                                            </span>
                                        ))
                                    ) : (
                                        <span className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest ${profile.role === 'admin' ? 'bg-gold-600 text-stone-950' : 'bg-stone-800 text-stone-400 border border-stone-700'}`}>
                                            {profile.role === 'admin' ? 'Fundador' : profile.role}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <p className="text-stone-400 italic text-sm md:text-base max-w-2xl">{profile.bio || 'Sin historia registrada...'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Nickname Proposal Banner */}
            {currentUser && profile && currentUser.id === profile.id && (profile as any).pending_nickname && (
                <div className="bg-gradient-to-r from-purple-900/90 to-blue-900/90 border-y border-purple-500/30 text-white px-6 py-4 relative z-20 backdrop-blur-md">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-purple-500/20 p-2 rounded-full border border-purple-500/50">
                                <Award size={20} className="text-purple-300" />
                            </div>
                            <div>
                                <p className="font-bold text-lg">¡Nuevo Apodo Propuesto!</p>
                                <p className="text-purple-200 text-sm">
                                    Los líderes del clan te han otorgado el título: <span className="font-black text-white text-lg ml-1">"{(profile as any).pending_nickname}"</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={async () => {
                                    if (confirm('¿Aceptas este apodo?')) {
                                        const { error } = await supabase.from('profiles').update({ nickname: (profile as any).pending_nickname, pending_nickname: null }).eq('id', profile.id);
                                        if (!error) window.location.reload();
                                    }
                                }}
                                className="px-6 py-2 bg-white text-purple-900 font-black uppercase tracking-widest text-xs rounded hover:bg-purple-100 transition-colors shadow-lg"
                            >
                                Aceptar Honor
                            </button>
                            <button
                                onClick={async () => {
                                    if (confirm('¿Rechazas este apodo?')) {
                                        const { error } = await supabase.from('profiles').update({ pending_nickname: null }).eq('id', profile.id);
                                        if (!error) window.location.reload();
                                    }
                                }}
                                className="px-6 py-2 bg-black/30 hover:bg-black/50 text-white font-bold uppercase tracking-widest text-xs rounded border border-white/20 transition-colors"
                            >
                                Rechazar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <main className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Stats Section */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                        <StatCard icon={<Trophy className="text-yellow-500" />} label="Rank # (Global)" value={stats?.rank ? `#${stats.rank}` : '--'} />
                        <StatCard icon={<Swords className="text-emerald-500" />} label="Win Rate" value={stats ? `${stats.winRate1v1}%` : '--'} />
                        <StatCard icon={<TrendingUp className="text-gold-500" />} label="ELO (1v1)" value={stats?.elo1v1 ? stats.elo1v1.toString() : '--'} />
                        <StatCard icon={<Award className="text-purple-500" />} label="ELO (TG)" value={stats?.eloTG ? stats.eloTG.toString() : '--'} />
                    </div>

                    <div className="bg-stone-900/50 border border-white/5 rounded-2xl p-8 backdrop-blur-sm">
                        <h3 className="text-xl font-serif font-bold text-white mb-6 flex items-center gap-2">
                            <MessageSquare className="text-gold-500" size={20} /> Crónica de Guerra
                        </h3>
                        <p className="text-stone-300 leading-relaxed whitespace-pre-wrap">{profile.reason || 'Este guerrero aún no ha compartido su motivación para unirse al clan.'}</p>
                    </div>

                    {/* Moments Section */}
                    <div className="bg-stone-900/50 border border-white/5 rounded-2xl p-8 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-serif font-bold text-white flex items-center gap-2">
                                <ImageIcon className="text-gold-500" size={20} /> Momentos Épicos
                            </h3>
                            {currentUser && profile && currentUser.id === profile.id && (
                                <button
                                    onClick={() => setIsUploadModalOpen(true)}
                                    className="text-xs bg-gold-600/20 hover:bg-gold-600/40 text-gold-400 px-3 py-1 rounded border border-gold-600/30 transition-colors font-bold uppercase tracking-wider"
                                >
                                    Subir Momento
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {moments.length > 0 ? (
                                moments.map(moment => (
                                    <MomentCard key={moment.id} moment={moment} currentUser={currentUser} />
                                ))
                            ) : (
                                <div className="col-span-full text-center py-10 bg-black/20 rounded-xl border border-white/5 border-dashed">
                                    <p className="text-stone-500 italic">Aún no hay momentos registrados en las crónicas.</p>
                                </div>
                            )}
                        </div>
                    </div>


                    {/* Placeholder for future API integration */}
                    <div className="bg-stone-900/50 border border-white/5 rounded-2xl p-8 backdrop-blur-sm opacity-50 cursor-not-allowed">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-serif font-bold text-white flex items-center gap-2">
                                <Swords className="text-gold-500" size={20} /> Historial de Batallas
                            </h3>
                            <span className="text-[10px] bg-gold-900/20 text-gold-500 px-2 py-1 rounded border border-gold-600/30">Próximamente</span>
                        </div>
                        <div className="flex flex-col items-center py-10">
                            <p className="text-stone-500 italic">Conectando con las APIs de AOE... Esperando suministros.</p>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="bg-stone-900 border border-gold-600/20 rounded-2xl p-6 shadow-xl">
                        <h4 className="text-xs font-black uppercase tracking-widest text-gold-500 mb-6">Información de Combate</h4>
                        <div className="space-y-4">
                            <InfoRow label="Steam ID" value={profile.steam_id || (profile.aoe_profile_id ? `PV: ${profile.aoe_profile_id}` : 'Oculto')} />
                            <InfoRow label="Miembro desde" value={new Date(profile.created_at).toLocaleDateString()} />
                            {stats && <InfoRow label="Partidas" value={stats.gamesPlayed.toString()} />}

                            {profile.aoe_insights_url && (
                                <a
                                    href={profile.aoe_insights_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-stone-800 hover:bg-stone-750 text-gold-400 rounded-xl border border-gold-600/30 transition-all font-bold text-sm mt-4"
                                >
                                    Ver en AOE Insights <ExternalLink size={14} />
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Badges Section */}
                    {userBadges.length > 0 && (
                        <div className="bg-stone-900 border border-gold-600/20 rounded-2xl p-6 shadow-xl">
                            <h4 className="text-xs font-black uppercase tracking-widest text-gold-500 mb-6">Condecoraciones</h4>
                            <div className="grid grid-cols-3 gap-4">
                                {userBadges.map(badge => (
                                    <div key={badge.id} className="group/badge relative flex flex-col items-center" title={badge.description}>
                                        <div className="w-16 h-16 rounded-xl bg-stone-900 border border-gold-600/30 p-1 group-hover/badge:border-gold-500 transition-all transform group-hover/badge:scale-105 shadow-lg">
                                            <img src={badge.image_url} alt="Badge" className="w-full h-full object-cover rounded-lg" />
                                        </div>
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-2 bg-stone-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap pointer-events-none z-20 border border-gold-600/50 shadow-2xl backdrop-blur-md">
                                            <p className="font-bold text-gold-500 text-[10px] uppercase mb-1">Insignia</p>
                                            {badge.description}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
            {currentUser && profile && (
                <UploadMomentModal
                    isOpen={isUploadModalOpen}
                    onClose={() => setIsUploadModalOpen(false)}
                    onUploadComplete={() => fetchMoments(profile.id)}
                    currentUserId={currentUser.id}
                />
            )}
        </div>

    );
};

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
    <div className="bg-stone-900 border border-stone-800 p-6 rounded-xl text-center flex flex-col items-center gap-2 hover:border-gold-600/30 transition-all">
        {icon}
        <p className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">{label}</p>
        <p className="text-2xl font-serif font-bold text-white">{value}</p>
    </div>
);

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="flex justify-between items-center text-sm py-2 border-b border-stone-800">
        <span className="text-stone-500 font-medium">{label}</span>
        <span className="text-white font-bold">{value}</span>
    </div>
);
