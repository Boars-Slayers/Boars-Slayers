import { useEffect, useState, FC } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, UserProfile } from '../lib/supabase';
import { ExternalLink, MessageSquare, Loader2, Award, Swords, TrendingUp, Trophy, RefreshCw, AlertCircle, Terminal, ShieldCheck, ImageIcon, Plus } from 'lucide-react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { syncPlayerStats, PlayerStats } from '../lib/aoe';
import { useAuth } from '../AuthContext';
import { Moment } from '../types';
import { MomentCard } from './Moments/MomentCard';
import { UploadMomentModal } from './Moments/UploadMomentModal';
import { ProfileEditor } from './ProfileEditor';

export const ProfilePage: FC = () => {
    const { username } = useParams<{ username: string }>();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [stats, setStats] = useState<PlayerStats | null>(null);
    const [moments, setMoments] = useState<Moment[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [showDebug, setShowDebug] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const { user: currentUser, profile: currentUserProfile, refreshProfile } = useAuth();


    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select(`*, user_roles (clan_roles (name, color)), user_badges (badges (*))`)
                .eq('username', username)
                .single();

            if (!error && data) {
                const formattedProfile = {
                    ...data,
                    roles: data.user_roles?.map((ur: any) => ur.clan_roles) || [],
                    badges: data.user_badges?.map((ub: any) => ub.badges) || []
                };
                setProfile(formattedProfile);

                // NO CARGAMOS DESDE DB. Ignoramos lo que haya en el perfil para forzar el "en vivo".
                setStats(null);

                // SIEMPRE REFRESCAR EN VIVO SI TENEMOS ID
                if (data.aoe_companion_id) {
                    handleRefreshStats(data.id, data.steam_id, data.aoe_companion_id);
                }

                fetchMoments(data.id);
            }
            setLoading(false);
        };
        if (username) fetchProfile();
    }, [username]);

    const fetchMoments = async (profileId: string) => {
        try {
            const { data: uploadedMoments } = await supabase
                .from('moments')
                .select('*')
                .eq('user_id', profileId)
                .order('created_at', { ascending: false });

            const { data: taggedData } = await supabase
                .from('moment_tags')
                .select('moment_id')
                .eq('user_id', profileId);

            let allMoments = uploadedMoments || [];

            if (taggedData && taggedData.length > 0) {
                const momentIds = taggedData.map((t: any) => t.moment_id);
                const { data: taggedMoments } = await supabase
                    .from('moments')
                    .select('*')
                    .in('id', momentIds);

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

    const handleRefreshStats = async (pId?: string, sId?: string, cId?: string) => {
        const targetId = cId || profile?.aoe_companion_id;
        const targetProfileId = pId || profile?.id;
        const targetSteamId = sId || profile?.steam_id;

        if (!targetId || !targetProfileId) return;

        setSyncing(true);
        try {
            const newStats = await syncPlayerStats(targetProfileId, targetSteamId || '', targetId);
            if (newStats) setStats(newStats);
        } catch (err) {
            console.error(err);
        } finally {
            setSyncing(false);
        }
    };



    if (loading) return <div className="min-h-screen bg-stone-950 flex items-center justify-center"><Loader2 size={48} className="text-gold-500 animate-spin" /></div>;
    if (!profile) return <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center text-white"><h1 className="text-2xl font-serif mb-4">Guerrero No Encontrado</h1><Link to="/" className="text-gold-500">Volver</Link></div>;

    return (
        <div className="min-h-screen bg-stone-950 text-gray-200">
            <Navbar />
            <div className="relative h-64 md:h-80 w-full overflow-hidden">
                <div className="absolute inset-0 bg-stone-900">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-stone-950"></div>
                </div>
                <div className="relative max-w-7xl mx-auto px-6 h-full flex items-end pb-8">
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-6 w-full">
                        <img src={profile.avatar_url} className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-stone-950 shadow-2xl bg-stone-800 object-cover" />
                        <div className="flex-1 text-center md:text-left mb-2">
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-2">
                                <h1 className="text-3xl md:text-5xl font-serif font-black text-white">{profile.username}</h1>
                                {profile.aoe_companion_id && <div className="bg-gold-600/20 text-gold-500 border border-gold-600/30 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-1"><ShieldCheck size={10} /> Verificado</div>}

                                {currentUser?.id === profile.id && (
                                    <button
                                        onClick={() => setIsEditingProfile(true)}
                                        className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border border-white/10 transition-all flex items-center gap-2"
                                    >
                                        Editar Perfil
                                    </button>
                                )}
                            </div>
                            <p className="text-stone-400 italic text-sm">{profile.bio || 'Sin historia...'}</p>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                            <StatCard
                                icon={<Trophy className={syncing ? "animate-bounce text-yellow-500" : "text-yellow-500"} />}
                                label="Rank # (Global)"
                                value={stats?.rank ? `#${stats.rank}` : (syncing ? '...' : '--')}
                            />
                            <StatCard
                                icon={<Swords className={syncing ? "animate-pulse text-emerald-500" : "text-emerald-500"} />}
                                label="Win Rate"
                                value={stats?.winRate1v1 !== null && stats?.winRate1v1 !== undefined ? `${stats.winRate1v1}%` : (syncing ? '...' : '--')}
                            />
                            <StatCard
                                icon={<TrendingUp className={syncing ? "animate-bounce text-gold-500" : "text-gold-500"} />}
                                label="ELO (1v1)"
                                value={stats?.elo1v1 ? stats.elo1v1.toString() : (syncing ? '...' : '--')}
                            />
                            <StatCard
                                icon={<Award className={syncing ? "animate-pulse text-purple-500" : "text-purple-500"} />}
                                label="ELO (TG)"
                                value={stats?.eloTG ? stats.eloTG.toString() : (syncing ? '...' : '--')}
                            />
                        </div>

                        <div className="flex justify-between items-center">
                            {!profile.aoe_companion_id && (
                                <div className="flex items-center gap-2 text-amber-500 text-[10px] font-bold uppercase tracking-widest bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
                                    <AlertCircle size={14} /> Falta configurar AoE Companion ID para estadísticas
                                </div>
                            )}

                            {(currentUser?.id === profile.id || currentUserProfile?.role === 'admin') && (
                                <button
                                    onClick={() => handleRefreshStats()}
                                    disabled={syncing || !profile.aoe_companion_id}
                                    className="ml-auto flex items-center gap-2 px-4 py-2 bg-stone-900 border border-gold-600/30 text-gold-500 rounded-lg hover:bg-gold-600/10 transition-all text-[10px] font-black uppercase tracking-widest disabled:opacity-30 group"
                                >
                                    <RefreshCw size={14} className={syncing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'} />
                                    {syncing ? 'Sincronizando...' : 'Actualizar'}
                                </button>
                            )}
                        </div>

                        {currentUserProfile?.role === 'admin' && stats?.debug && (
                            <div className="mt-4">
                                <button onClick={() => setShowDebug(!showDebug)} className="text-[9px] text-stone-600 hover:text-stone-400 flex items-center gap-1 uppercase tracking-tighter">
                                    <Terminal size={10} /> {showDebug ? 'Ocultar' : 'Ver'} Oráculo Debug
                                </button>
                                {showDebug && (
                                    <div className="mt-2 p-3 bg-black rounded border border-stone-800 font-mono text-[10px] text-stone-400 overflow-x-auto">
                                        <div className="space-y-1">
                                            <p>AoE Companion ID Usado: {profile.aoe_companion_id}</p>
                                            <p>1v1_RAW: "{stats.debug.raw1v1}"</p>
                                            <p>TG_RAW: "{stats.debug.rawTG}"</p>
                                            {stats.debug.err1v1 && <p className="text-red-500">1v1_ERR: {stats.debug.err1v1}</p>}
                                            {stats.debug.errTG && <p className="text-red-500">TG_ERR: {stats.debug.errTG}</p>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="bg-stone-900/50 border border-white/5 rounded-2xl p-8 backdrop-blur-sm">
                        <h3 className="text-xl font-serif font-bold text-white mb-6 flex items-center gap-2">
                            <MessageSquare className="text-gold-500" size={20} /> Crónica de Guerra
                        </h3>
                        <p className="text-stone-300 leading-relaxed whitespace-pre-wrap">{profile.reason || 'Sin historia registrada todavía.'}</p>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
                                <ImageIcon className="text-gold-500" /> Momentos de Gloria
                            </h3>
                            {currentUser?.id === profile.id && (
                                <button
                                    onClick={() => setIsUploadModalOpen(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-gold-600 text-stone-950 rounded-lg font-bold text-xs hover:bg-gold-500 transition-colors shadow-lg"
                                >
                                    <Plus size={16} /> Subir Momento
                                </button>
                            )}
                        </div>

                        {moments.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {moments.map((moment: Moment) => (
                                    <MomentCard
                                        key={moment.id}
                                        moment={moment}
                                        currentUser={currentUser}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="bg-stone-900/30 border border-white/5 rounded-2xl p-12 text-center">
                                <ImageIcon size={48} className="text-stone-700 mx-auto mb-4" />
                                <p className="text-stone-500 italic">Este guerrero aún no ha inmortalizado sus batallas...</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-stone-900 border border-gold-600/20 rounded-2xl p-6 shadow-xl">
                        <h4 className="text-xs font-black uppercase tracking-widest text-gold-500 mb-6">Información de Combate</h4>
                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between py-2 border-b border-stone-800">
                                <span className="text-stone-500">AoE Companion ID</span>
                                <span className="text-white font-mono">{profile.aoe_companion_id || 'Oculto'}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-stone-800">
                                <span className="text-stone-500">Steam ID</span>
                                <span className="text-white font-mono">{profile.steam_id || '---'}</span>
                            </div>

                            {profile.steam_id && (
                                <a
                                    href={`https://steamcommunity.com/profiles/${profile.steam_id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-[#171a21] text-blue-400 rounded-xl font-bold text-xs mt-2 hover:bg-[#2a475e] transition-colors"
                                >
                                    Steam Profile <ExternalLink size={14} />
                                </a>
                            )}

                            {/* Botón de AoE Insights más visible */}
                            {profile.aoe_insights_url ? (
                                <a
                                    href={profile.aoe_insights_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full flex items-center justify-center gap-2 py-4 bg-gold-600/10 border border-gold-600/30 text-gold-500 rounded-xl font-black text-[10px] uppercase tracking-widest mt-4 hover:bg-gold-600/20 transition-all shadow-lg group"
                                >
                                    Ver Perfil AoE Insights <ExternalLink size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </a>
                            ) : profile.steam_id && (
                                <a
                                    href={`https://www.aoeinsights.com/user/${profile.steam_id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full flex items-center justify-center gap-2 py-4 bg-stone-800 border border-white/5 text-stone-400 rounded-xl font-black text-[10px] uppercase tracking-widest mt-4 hover:bg-stone-700 transition-all"
                                >
                                    AoE Insights (Auto-link) <ExternalLink size={14} />
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {profile && isEditingProfile && (
                <ProfileEditor
                    profile={profile}
                    onClose={() => setIsEditingProfile(false)}
                    onUpdate={() => {
                        setIsEditingProfile(false);
                        refreshProfile();
                        window.location.reload(); // Re-fetch all
                    }}
                />
            )}

            {profile && isUploadModalOpen && (
                <UploadMomentModal
                    isOpen={isUploadModalOpen}
                    onClose={() => setIsUploadModalOpen(false)}
                    onUploadComplete={() => {
                        setIsUploadModalOpen(false);
                        fetchMoments(profile.id);
                    }}
                    currentUserId={currentUser?.id || ''}
                />
            )}
            <Footer />
        </div>
    );
};

const StatCard: FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
    <div className="bg-stone-900 border border-stone-800 p-6 rounded-xl text-center flex flex-col items-center gap-2 hover:border-gold-600/30 transition-all shadow-lg w-full">
        <div className="text-2xl">{icon}</div>
        <p className="text-[10px] uppercase tracking-widest text-stone-500 font-bold whitespace-nowrap">{label}</p>
        <p className="text-xl md:text-2xl font-serif font-black text-white">{value}</p>
    </div>
);
