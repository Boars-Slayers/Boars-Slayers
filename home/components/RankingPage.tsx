import { useEffect, useState, FC } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { syncPlayerStats, PlayerStats, fetchMatchHistory } from '../lib/aoe';
import { useAuth } from '../AuthContext';
import { RefreshCw, Swords, Trophy, Clock, Map as MapIcon, Loader2 } from 'lucide-react';

interface RankedMember {
    id: string;
    username: string;
    avatar_url: string;
    steam_id: string;
    aoe_companion_id?: string | null;
    stats?: PlayerStats;
    rank?: number;
}

export function RankingPage() {
    const [activeTab, setActiveTab] = useState<'leaderboard' | 'matches'>('leaderboard');
    const [members, setMembers] = useState<RankedMember[]>([]);
    const [recentMatches, setRecentMatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMatches, setLoadingMatches] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const { profile: currentUserProfile } = useAuth();

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (activeTab === 'matches' && recentMatches.length === 0 && members.length > 0) {
            loadRecentMatches();
        }
    }, [activeTab, members]);

    const loadRecentMatches = async () => {
        setLoadingMatches(true);
        try {
            // Buscamos partidas para los miembros que tengan companion_id
            const membersWithId = members.filter(m => m.aoe_companion_id);
            const allMatches: any[] = [];

            // Para no saturar, pedimos solo de los primeros 10 miembros con ID
            const limit = Math.min(membersWithId.length, 10);

            const matchPromises = membersWithId.slice(0, limit).map(async (m) => {
                const matches = await fetchMatchHistory('', 0, m.aoe_companion_id!);
                return matches.map((match: any) => ({
                    ...match,
                    playerName: m.username,
                    playerAvatar: m.avatar_url,
                    aoeCompanionId: m.aoe_companion_id
                }));
            });

            const results = await Promise.all(matchPromises);
            results.forEach((res: any[]) => allMatches.push(...res));

            // Ordenar por fecha desc (las más recientes primero)
            const sortedMatches = allMatches.sort((a, b) => b.started - a.started);

            // Eliminar duplicados si hay partidas entre miembros del clan
            const uniqueMatches = Array.from(new Map(sortedMatches.map(m => [m.match_id, m])).values());

            setRecentMatches(uniqueMatches.slice(0, 20)); // Mostrar las 20 más recientes
        } catch (err) {
            console.error('Error loading matches:', err);
        } finally {
            setLoadingMatches(false);
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const { data: profiles, error } = await supabase
                .from('profiles')
                .select('*')
                .neq('role', 'candidate');

            if (error) {
                console.error('Error fetching members:', error);
                return;
            }

            const validProfiles = (profiles || []) as any[];

            const membersList: RankedMember[] = validProfiles.map((p: any) => {
                return {
                    id: p.id,
                    username: p.username,
                    avatar_url: p.avatar_url,
                    steam_id: p.steam_id,
                    aoe_companion_id: p.aoe_companion_id,
                    rank: p.rank_1v1,
                    stats: p.elo_1v1 ? {
                        steamId: p.steam_id || '',
                        name: p.username,
                        elo1v1: p.elo_1v1,
                        eloTG: p.elo_tg,
                        winRate1v1: p.win_rate_1v1,
                        gamesPlayed: p.games_played,
                        streak: p.streak,
                        rank: p.rank_1v1
                    } : undefined
                };
            });

            // Sort by 1v1 ELO desc
            const sortedMembers = membersList.sort((a, b) => {
                const eloA = a.stats?.elo1v1 || 0;
                const eloB = b.stats?.elo1v1 || 0;
                return eloB - eloA;
            });

            setMembers(sortedMembers);

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSyncAll = async () => {
        if (!members.length) return;
        setSyncing(true);
        try {
            for (const member of members) {
                if (member.aoe_companion_id) {
                    await syncPlayerStats(member.id, member.steam_id, member.aoe_companion_id);
                }
            }
            await loadData();
        } catch (err) {
            console.error('Error syncing stats:', err);
        } finally {
            setSyncing(false);
        }
    };

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 text-white relative z-10 bg-stone-950">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-6xl font-serif font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-gold-400 via-white to-gold-600 uppercase tracking-tighter text-shadow-xl">
                        Salón de la Fama
                    </h1>
                    <p className="max-w-2xl mx-auto text-stone-400 font-medium italic">
                        "Las crónicas de nuestros mejores guerreros, registradas por la eternidad."
                    </p>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6 border-b border-white/5 pb-6">
                    <div className="flex bg-stone-900/80 p-1 rounded-xl border border-white/10 backdrop-blur-md">
                        <button
                            onClick={() => setActiveTab('leaderboard')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'leaderboard' ? 'bg-gold-600 text-stone-950 shadow-lg' : 'text-stone-500 hover:text-white'}`}
                        >
                            <Trophy size={14} /> Clasificación
                        </button>
                        <button
                            onClick={() => setActiveTab('matches')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'matches' ? 'bg-gold-600 text-stone-950 shadow-lg' : 'text-stone-500 hover:text-white'}`}
                        >
                            <Swords size={14} /> Batallas Recientes
                        </button>
                    </div>

                    {(currentUserProfile?.role === 'admin' || currentUserProfile?.role === 'web_master') && (
                        <button
                            onClick={handleSyncAll}
                            disabled={syncing}
                            className={`flex items-center gap-2 px-6 py-3 bg-stone-900 border border-gold-600/30 rounded-xl text-gold-500 text-[10px] font-black uppercase tracking-widest hover:bg-gold-600/10 transition-all ${syncing ? 'opacity-50 cursor-not-allowed' : ''} group shadow-lg`}
                        >
                            <RefreshCw size={14} className={syncing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
                            {syncing ? 'Sincronizando Clan...' : 'Sincronizar Todo el Clan'}
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <Loader2 size={48} className="text-gold-500 animate-spin" />
                    </div>
                ) : (
                    <>
                        {activeTab === 'leaderboard' && (
                            <div className="bg-stone-900/40 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full">
                                        <thead>
                                            <tr className="bg-black/40 border-b border-white/5">
                                                <th className="px-6 py-5 text-left text-[10px] font-black text-stone-500 uppercase tracking-widest">Pos</th>
                                                <th className="px-6 py-5 text-left text-[10px] font-black text-stone-500 uppercase tracking-widest">Global #</th>
                                                <th className="px-6 py-5 text-left text-[10px] font-black text-stone-500 uppercase tracking-widest">Guerrero</th>
                                                <th className="px-6 py-5 text-left text-[10px] font-black text-stone-500 uppercase tracking-widest">ELO 1v1</th>
                                                <th className="px-6 py-5 text-left text-[10px] font-black text-stone-500 uppercase tracking-widest">ELO TG</th>
                                                <th className="px-6 py-5 text-left text-[10px] font-black text-stone-500 uppercase tracking-widest">Victoria %</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {members.map((member, idx) => (
                                                <tr key={member.id} className="group hover:bg-white/[0.02] transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className={`flex items-center justify-center w-8 h-8 rounded-lg font-black text-xs ${idx === 0 ? 'bg-gold-500 text-stone-950 shadow-[0_0_15px_rgba(234,179,8,0.3)]' :
                                                            idx === 1 ? 'bg-stone-300 text-stone-950' :
                                                                idx === 2 ? 'bg-amber-800 text-white' :
                                                                    'bg-stone-800/50 text-stone-500 border border-white/5'
                                                            }`}>
                                                            {idx + 1}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-xs font-mono text-stone-400">
                                                        {member.rank ? `#${member.rank}` : '---'}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-4">
                                                            <img className="h-10 w-10 rounded-full object-cover border border-white/10" src={member.avatar_url} alt="" />
                                                            <div className="flex flex-col">
                                                                <Link to={`/user/${member.username}`} className="text-sm font-bold text-white hover:text-gold-500">
                                                                    {member.username}
                                                                </Link>
                                                                <div className="text-[9px] text-stone-600 font-mono">Companion ID: {member.aoe_companion_id || 'Falta'}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm font-black text-gold-500">{member.stats?.elo1v1 || '---'}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-xs font-bold text-stone-300">{member.stats?.eloTG || '---'}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-12 bg-stone-800 h-1 rounded-full overflow-hidden">
                                                                <div className="h-full bg-emerald-500" style={{ width: `${member.stats?.winRate1v1 || 0}%` }} />
                                                            </div>
                                                            <span className="text-[10px] font-black text-emerald-500">
                                                                {member.stats?.winRate1v1 ? `${member.stats.winRate1v1}%` : '---'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'matches' && (
                            <div className="space-y-4">
                                {loadingMatches ? (
                                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                                        <Loader2 size={32} className="text-gold-500 animate-spin" />
                                        <p className="text-stone-500 text-xs uppercase tracking-widest font-bold">Consultando el historial de guerra...</p>
                                    </div>
                                ) : recentMatches.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {recentMatches.map((match: any) => {
                                            const playerStats = match.players?.find((p: any) => p.profile_id.toString() === match.aoeCompanionId?.toString());
                                            const isWin = playerStats?.result === 1;

                                            return (
                                                <div key={match.match_id} className="bg-stone-900/60 border border-white/5 rounded-2xl p-5 hover:border-gold-600/30 transition-all group overflow-hidden relative">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <img src={match.playerAvatar} className="w-8 h-8 rounded-full border border-white/10" alt="" />
                                                            <div>
                                                                <div className="text-xs font-black text-white uppercase tracking-tight">{match.playerName}</div>
                                                                <div className="text-[10px] text-stone-500 flex items-center gap-1">
                                                                    <Clock size={10} /> {new Date(match.started * 1000).toLocaleString()}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter ${isWin ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'}`}>
                                                                {isWin ? 'Victoria' : 'Derrota'}
                                                            </div>
                                                            <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter ${match.ranked ? 'bg-gold-600/20 text-gold-500 border border-gold-600/30' : 'bg-stone-800 text-stone-500'}`}>
                                                                {match.ranked ? 'Ranked' : 'Unranked'}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4 relative z-10">
                                                        <div className="space-y-1">
                                                            <div className="text-[9px] font-black text-stone-500 uppercase tracking-widest flex items-center gap-1">
                                                                <MapIcon size={10} /> Mapa
                                                            </div>
                                                            <div className="text-sm font-serif font-bold text-white">{match.name || 'Batalla Sangrienta'}</div>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="text-[9px] font-black text-stone-500 uppercase tracking-widest flex items-center gap-1">
                                                                <Swords size={10} /> Tipo
                                                            </div>
                                                            <div className="text-sm font-serif font-bold text-white">
                                                                {match.players?.length === 2 ? '1v1 Combat' : `${match.players?.length / 2}v${match.players?.length / 2} Team Game`}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Detalle de victoria/derrota si está disponible */}
                                                    <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 bg-gradient-to-br ${isWin ? 'from-emerald-500/10' : 'from-rose-500/10'} to-transparent rounded-full blur-2xl group-hover:opacity-100 opacity-50 transition-all`}></div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="bg-stone-900/40 border border-white/5 rounded-2xl p-20 text-center">
                                        <Clock size={48} className="text-stone-700 mx-auto mb-4" />
                                        <p className="text-stone-500 italic">No se han registrado batallas recientemente. ¡Id al frente de batalla!</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

// Eliminamos Loader2 local ya que lo importamos de lucide-react
