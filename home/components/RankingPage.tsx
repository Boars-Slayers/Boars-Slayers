import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { syncPlayerStats, PlayerStats, getClanMatches } from '../lib/aoe';
import { Match } from '../types';
import { useAuth } from '../AuthContext';

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
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const { profile: currentUserProfile } = useAuth();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Profiles from Supabase with cached stats
            const { data: profiles, error } = await supabase
                .from('profiles')
                .select('*')
                .neq('role', 'candidate'); // Only members and admins

            if (error) {
                console.error('Error fetching members:', error);
                return;
            }

            const validProfiles = profiles || [];

            // 2. Map profiles to RankedMember and sync logic
            const membersList: RankedMember[] = validProfiles.map(p => {
                let aoeId = p.aoe_profile_id;
                // If aoe_profile_id is missing, try to extract from aoe_insights_url
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

            // 4. Fetch Matches
            const clanMatches = await getClanMatches(membersList.map((m: any) => ({
                steamId: m.steam_id,
                aoeProfileId: m.aoe_profile_id
            })));
            setMatches(clanMatches);

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
            // Sync each member that has a steam_id or aoe_profile_id
            for (const member of members) {
                if (member.steam_id || member.aoe_profile_id) {
                    await syncPlayerStats(member.id, member.steam_id, member.aoe_profile_id);
                }
            }
            // Refresh data from DB
            await loadData();
        } catch (err) {
            console.error('Error syncing stats:', err);
        } finally {
            setSyncing(false);
        }
    };

    return (
        <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8 text-white relative z-10">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600">
                        Clasificación de la Comunidad
                    </h1>
                    <p className="max-w-2xl mx-auto text-xl text-gray-400">
                        Los mejores jugadores de Boars Slayers y la historia de nuestras batallas.
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex flex-col sm:flex-row justify-center items-center mb-8 gap-4">
                    <div className="flex bg-gray-800/50 p-1 rounded-full border border-gray-700">
                        <button
                            onClick={() => setActiveTab('leaderboard')}
                            className={`px-6 py-2 rounded-full font-bold transition-all ${activeTab === 'leaderboard'
                                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20'
                                : 'text-gray-400 hover:text-gray-200'
                                }`}
                        >
                            Tabla de Clasificación
                        </button>
                        <button
                            onClick={() => setActiveTab('matches')}
                            className={`px-6 py-2 rounded-full font-bold transition-all ${activeTab === 'matches'
                                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20'
                                : 'text-gray-400 hover:text-gray-200'
                                }`}
                        >
                            Historial entre Miembros
                        </button>
                    </div>

                    {currentUserProfile?.role === 'admin' && (
                        <button
                            onClick={() => handleSyncAll()}
                            disabled={syncing}
                            className={`px-4 py-2 rounded-lg border border-amber-600/50 text-amber-500 font-bold text-xs uppercase tracking-widest hover:bg-amber-600/10 transition-colors flex items-center gap-2 ${syncing ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {syncing ? (
                                <>
                                    <div className="animate-spin h-3 w-3 border-t-2 border-b-2 border-amber-500 rounded-full"></div>
                                    Sincronizando...
                                </>
                            ) : (
                                'Sincronizar Estadísticas'
                            )}
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
                    </div>
                ) : (
                    <>
                        {activeTab === 'leaderboard' && (
                            <div className="bg-gray-900/60 backdrop-blur-md rounded-xl overflow-hidden border border-gray-700 shadow-2xl">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-700">
                                        <thead className="bg-gray-800/50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                    Posición
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                    Global #
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                    Jugador
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                    ELO 1v1
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                    ELO TG
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                    Victorias %
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                    Racha
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-700">
                                            {members.map((member, idx) => (
                                                <tr key={member.id} className="hover:bg-gray-800/30 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${idx === 0 ? 'bg-yellow-500 text-black' :
                                                            idx === 1 ? 'bg-gray-400 text-black' :
                                                                idx === 2 ? 'bg-amber-700 text-white' :
                                                                    'bg-gray-800 text-gray-500'
                                                            }`}>
                                                            {idx + 1}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="text-sm font-mono text-gray-300">
                                                            {member.rank ? `#${member.rank}` : '-'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex flex-col space-y-2">
                                                            <div className="flex items-center">
                                                                <div className="h-10 w-10 flex-shrink-0">
                                                                    <img className="h-10 w-10 rounded-full object-cover border border-gray-600" src={member.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg"} alt="" />
                                                                </div>
                                                                <div className="ml-4">
                                                                    <Link to={`/user/${member.username}`} className="text-sm font-medium text-white hover:text-amber-500 transition-colors">
                                                                        {member.username}
                                                                    </Link>
                                                                    <div className="text-xs text-gray-500">Steam ID: {member.steam_id || (member.aoe_profile_id ? `PV: ${member.aoe_profile_id}` : 'N/A')}</div>
                                                                </div>
                                                            </div>
                                                            {(member.steam_id || member.aoe_profile_id || member.aoe_insights_url) && (
                                                                <a
                                                                    href={member.aoe_insights_url || `https://www.aoe2insights.com/user/${member.aoe_profile_id || member.steam_id}/`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-xs text-amber-500 hover:text-amber-400 underline ml-14"
                                                                >
                                                                    Ver en AoE Insights ↗
                                                                </a>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="text-lg font-mono text-amber-400">{member.stats?.elo1v1 || 'N/A'}</span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="text-sm font-mono text-gray-300">{member.stats?.eloTG || 'N/A'}</span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${(member.stats?.winRate1v1 || 0) >= 50 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                            }`}>
                                                            {member.stats?.winRate1v1 ? `${member.stats.winRate1v1}%` : '-'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                                        {member.stats?.streak ? (
                                                            <span className={member.stats.streak > 0 ? 'text-green-500' : 'text-red-500'}>
                                                                {member.stats.streak > 0 ? `+${member.stats.streak}` : member.stats.streak}
                                                            </span>
                                                        ) : '-'}
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
                                {matches.length === 0 ? (
                                    <div className="text-center py-12 bg-gray-900/50 rounded-xl border border-gray-700">
                                        <p className="text-gray-400 text-lg">No se pudieron cargar las partidas recientes directamente.</p>
                                        <p className="text-sm text-gray-600 mt-2 max-w-lg mx-auto">
                                            Una vez desplegada la función de Supabase, verás aquí el historial automático.
                                            <br /><br />
                                            Por ahora, usa los enlaces en la pestaña de Clasificación para ver los detalles en AoE Insights.
                                        </p>
                                    </div>
                                ) : (
                                    matches.map((match) => (
                                        <div key={match.match_id} className="bg-gray-800/40 border border-gray-700 rounded-lg p-6 hover:bg-gray-800/60 transition-all">
                                            <div className="flex flex-col md:flex-row justify-between items-center mb-4">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="text-xl font-bold text-amber-500">{match.name}</h3>
                                                        {match.result && (
                                                            <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase ${match.result === 'Victory' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                                                }`}>
                                                                {match.result === 'Victory' ? 'Victoria' : 'Derrota'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-gray-400 flex flex-wrap gap-x-3 gap-y-1">
                                                        <span>{match.ranked ? 'Ranked' : 'Personalizada'}</span>
                                                        {match.type && (<span>•</span>)}
                                                        {match.type && (<span>{match.type}</span>)}
                                                        {match.duration && (<span>•</span>)}
                                                        {match.duration && (<span>{match.duration}</span>)}
                                                        {match.date_text && (<span>•</span>)}
                                                        {match.date_text && (<span>{match.date_text}</span>)}
                                                    </div>
                                                </div>
                                                <div className="mt-4 md:mt-0 flex flex-col items-end">
                                                    <a
                                                        href={`https://www.aoe2insights.com/match/${match.match_id}/`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs bg-gray-900 border border-gray-700 hover:border-amber-500 text-gray-400 hover:text-amber-500 px-3 py-1 rounded transition-colors"
                                                    >
                                                        Ver Análisis Completo ↗
                                                    </a>
                                                    <span className="text-[10px] text-gray-600 font-mono mt-1">ID: {match.match_id}</span>
                                                </div>
                                            </div>

                                            {match.players && match.players.length > 0 && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                                    <div className="bg-blue-900/10 p-3 rounded border border-blue-900/20">
                                                        <h4 className="text-blue-400 text-[10px] font-bold uppercase mb-2">Miembros Participantes</h4>
                                                        <ul className="space-y-1">
                                                            {match.players.map((p) => {
                                                                const isClan = members.some(m => m.steam_id === p.steam_id);
                                                                if (!isClan) return null;
                                                                return (
                                                                    <li key={p.steam_id} className="flex justify-between items-center bg-white/5 px-2 py-1 rounded">
                                                                        <div className="flex items-center space-x-2">
                                                                            {p.won && <span className="text-yellow-400 text-xs">👑</span>}
                                                                            <span className="text-sm text-white font-medium">{p.name}</span>
                                                                        </div>
                                                                        <span className="text-[10px] text-gray-500 font-mono">Civ: {p.civ}</span>
                                                                    </li>
                                                                );
                                                            })}
                                                        </ul>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
