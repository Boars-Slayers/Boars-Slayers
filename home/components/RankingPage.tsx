import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { syncPlayerStats, PlayerStats } from '../lib/aoe';
import { Match } from '../types';
import { useAuth } from '../AuthContext';
import { RefreshCw, Swords, Trophy, TrendingUp, Users } from 'lucide-react';

interface RankedMember {
    id: string;
    username: string;
    avatar_url: string;
    steam_id: string;
    aoe_profile_id?: string | null;
    aoe_insights_url?: string | null;
    stats?: PlayerStats;
    rank?: number; // Global Rank
}

export function RankingPage() {
    const [activeTab, setActiveTab] = useState<'leaderboard' | 'matches'>('leaderboard');
    const [members, setMembers] = useState<RankedMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const { profile: currentUserProfile } = useAuth();

    useEffect(() => {
        loadData();
    }, []);

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

            const validProfiles = profiles || [];

            const membersList: RankedMember[] = validProfiles.map(p => {
                let aoeId = p.aoe_profile_id;
                if (!aoeId && p.aoe_insights_url) {
                    const match = p.aoe_insights_url.match(/\/user\/(\d+)/);
                    if (match && match[1]) {
                        aoeId = match[1];
                    }
                }

                return {
                    id: p.id,
                    username: p.username,
                    avatar_url: p.avatar_url,
                    steam_id: p.steam_id,
                    aoe_profile_id: aoeId,
                    aoe_insights_url: p.aoe_insights_url,
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
                // Prioritize AoE Profile ID for the new Nightbot API flow
                const aoeId = member.aoe_profile_id;
                if (aoeId) {
                    await syncPlayerStats(member.id, member.steam_id, aoeId);
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
                    <h1 className="text-4xl md:text-6xl font-serif font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-gold-400 via-white to-gold-600 uppercase tracking-tighter">
                        Salón de la Fama
                    </h1>
                    <p className="max-w-2xl mx-auto text-stone-400 font-medium italic">
                        "Las crónicas de nuestros mejores guerreros, registradas por la eternidad."
                    </p>
                </div>

                {/* Tabs & Actions */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6 border-b border-white/5 pb-6">
                    <div className="flex bg-stone-900/80 p-1 rounded-xl border border-white/10 backdrop-blur-md">
                        <button
                            onClick={() => setActiveTab('leaderboard')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'leaderboard'
                                ? 'bg-gold-600 text-stone-950 shadow-lg'
                                : 'text-stone-500 hover:text-white'
                                }`}
                        >
                            <Trophy size={14} /> Clasificación
                        </button>
                        <button
                            onClick={() => setActiveTab('matches')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'matches'
                                ? 'bg-gold-600 text-stone-950 shadow-lg'
                                : 'text-stone-500 hover:text-white'
                                }`}
                        >
                            <Swords size={14} /> Batallas Recientes
                        </button>
                    </div>

                    {(currentUserProfile?.role === 'admin' || currentUserProfile?.role === 'web_master') && (
                        <button
                            onClick={handleSyncAll}
                            disabled={syncing}
                            className={`flex items-center gap-2 px-6 py-3 bg-stone-900 border border-gold-600/30 rounded-xl text-gold-500 text-[10px] font-black uppercase tracking-widest hover:bg-gold-600/10 transition-all ${syncing ? 'opacity-50 cursor-not-allowed' : ''} group`}
                        >
                            <RefreshCw size={14} className={syncing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
                            {syncing ? 'Actualizando Censo...' : 'Sincronizar Todo el Clan'}
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <Loader2 size={48} className="text-gold-500 animate-spin" />
                        <p className="text-stone-500 font-bold uppercase tracking-widest text-xs">Consultando a los oráculos...</p>
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
                                                    <td className="px-6 py-4">
                                                        <span className="text-xs font-mono text-stone-400 group-hover:text-stone-200 transition-colors">
                                                            {member.rank ? `#${member.rank}` : '---'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="relative">
                                                                <img className="h-10 w-10 rounded-full object-cover border border-white/10 bg-stone-800" src={member.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg"} alt="" />
                                                                {idx === 0 && <div className="absolute -top-1 -right-1 text-xs">👑</div>}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <Link to={`/user/${member.username}`} className="text-sm font-bold text-white hover:text-gold-500 transition-colors">
                                                                    {member.username}
                                                                </Link>
                                                                <div className="text-[10px] text-stone-500 font-medium">ID: {member.aoe_profile_id || 'Falta ID'}</div>
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
                                                            <div className="w-12 bg-stone-800 h-1.5 rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full ${(member.stats?.winRate1v1 || 0) >= 50 ? 'bg-emerald-500' : 'bg-red-500'}`}
                                                                    style={{ width: `${member.stats?.winRate1v1 || 0}%` }}
                                                                />
                                                            </div>
                                                            <span className={`text-[10px] font-black ${(member.stats?.winRate1v1 || 0) >= 50 ? 'text-emerald-500' : 'text-red-500'}`}>
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
                            <div className="text-center py-24 bg-stone-900/40 rounded-2xl border border-white/5 border-dashed max-w-2xl mx-auto">
                                <div className="bg-stone-800/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-stone-500">
                                    <Swords size={32} />
                                </div>
                                <h3 className="text-xl font-serif font-bold text-white mb-2">Historial Automatizado Desactivado</h3>
                                <p className="text-stone-400 text-sm mb-6 px-8 leading-relaxed">
                                    Hemos optimizado el sistema para enfocarnos en las estadísticas globales de los miembros. El historial detallado por partida ya no se sincroniza automáticamente para preservar la velocidad del campamento.
                                </p>
                                <div className="flex justify-center gap-4">
                                    <button
                                        onClick={() => setActiveTab('leaderboard')}
                                        className="px-6 py-2 bg-gold-600 text-stone-950 font-black uppercase tracking-widest text-[10px] rounded-lg hover:bg-gold-500 transition-colors"
                                    >
                                        Ver Clasificación
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

const Loader2 = ({ size, className }: { size: number, className: string }) => (
    <RefreshCw size={size} className={`animate-spin ${className}`} />
);
