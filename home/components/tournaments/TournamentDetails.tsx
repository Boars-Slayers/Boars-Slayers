import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Calendar, Users, Trophy as TrophyIcon, ArrowLeft, Loader, Shield, DollarSign, Gift, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../../AuthContext';

export const TournamentDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user, profile } = useAuth();
    const navigate = useNavigate();

    const [tournament, setTournament] = useState<any>(null);
    const [participants, setParticipants] = useState<any[]>([]);
    const [matches, setMatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isJoining, setIsJoining] = useState(false);
    const [isParticipant, setIsParticipant] = useState(false);

    useEffect(() => {
        if (id) {
            fetchTournamentDetails();
        }
    }, [id, user]);

    const fetchTournamentDetails = async () => {
        setLoading(true);
        try {
            // Fetch tournament
            const { data: tData, error: tError } = await supabase
                .from('tournaments')
                .select('*')
                .eq('id', id)
                .single();

            if (tError) throw tError;
            setTournament(tData);

            // Fetch participants
            const { data: pData, error: pError } = await supabase
                .from('tournament_participants')
                .select('*, profiles(id, username, avatar_url)')
                .eq('tournament_id', id);

            if (pError) throw pError;
            setParticipants(pData || []);

            // Fetch matches
            const { data: mData, error: mError } = await supabase
                .from('matches')
                .select('*, p1:profiles!player1_id(username), p2:profiles!player2_id(username), winner:profiles!winner_id(username)')
                .eq('tournament_id', id)
                .order('round', { ascending: true })
                .order('match_number', { ascending: true });

            if (mError) throw mError;
            setMatches(mData || []);

            // Check if current user is participant
            if (user) {
                setIsParticipant(pData?.some(p => p.user_id === user.id) || false);
            }
        } catch (error) {
            console.error('Error fetching tournament details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async () => {
        if (!user) {
            alert('Debes iniciar sesión para unirte al torneo.');
            return;
        }
        setIsJoining(true);
        try {
            const { error } = await supabase
                .from('tournament_participants')
                .insert({
                    tournament_id: id,
                    user_id: user.id,
                    status: 'pending'
                });

            if (error) throw error;
            setIsParticipant(true);
            fetchTournamentDetails();
        } catch (error) {
            console.error('Error joining tournament:', error);
            alert('Error al unirse al torneo.');
        } finally {
            setIsJoining(false);
        }
    };

    const handleUpdateMatchResult = async (matchId: string, winnerId: string, score: string) => {
        try {
            const { error } = await supabase
                .from('matches')
                .update({ winner_id: winnerId, result_score: score })
                .eq('id', matchId);

            if (error) throw error;
            fetchTournamentDetails();
        } catch (error) {
            console.error('Error updating match:', error);
            alert('Error al actualizar el resultado.');
        }
    };

    const handleCreateMatch = async (p1Id: string, p2Id: string, round: number) => {
        try {
            const { error } = await supabase
                .from('matches')
                .insert({
                    tournament_id: id,
                    player1_id: p1Id,
                    player2_id: p2Id,
                    round: round,
                    match_number: matches.filter(m => m.round === round).length + 1
                });

            if (error) throw error;
            fetchTournamentDetails();
        } catch (error) {
            console.error('Error creating match:', error);
            alert('Error al crear el enfrentamiento.');
        }
    };

    const handleGenerateBracket = async () => {
        const approvedParticipants = participants.filter(p => !p.status || p.status === 'approved' || p.status === 'confirmado');
        if (approvedParticipants.length < 2) {
            alert('Se necesitan al menos 2 participantes confirmados.');
            return;
        }

        if (!confirm(`¿Generar cuadro automático con ${approvedParticipants.length} participantes? Esto borrará enfrentamientos previos.`)) return;

        // Shuffle participants
        const shuffled = [...approvedParticipants].sort(() => Math.random() - 0.5);

        // Find next power of 2
        let nextPowerOfTwo = 2;
        while (nextPowerOfTwo < shuffled.length) {
            nextPowerOfTwo *= 2;
        }

        const matchesToCreate = [];

        // Simplified logic for Round 1: Pair up as many as possible
        // The ones that don't have a pair in Round 1 (Byes) will effectively "skip" Round 1
        // But for UI simplicity, we'll just pair everyone and those with null P2 pass.

        for (let i = 0; i < shuffled.length; i += 2) {
            const p1 = shuffled[i];
            const p2 = shuffled[i + 1]; // Could be undefined

            matchesToCreate.push({
                tournament_id: id,
                player1_id: p1.user_id,
                player2_id: p2 ? p2.user_id : null,
                round: 1,
                match_number: (i / 2) + 1,
                status: p2 ? 'scheduled' : 'completed',
                winner_id: p2 ? null : p1.user_id,
                result_score: p2 ? null : 'BYE'
            });
        }

        const { error: dError } = await supabase.from('matches').delete().eq('tournament_id', id);
        if (dError) {
            alert('Error al limpiar enfrentamientos previos.');
            return;
        }

        const { error: iError } = await supabase.from('matches').insert(matchesToCreate);
        if (iError) {
            console.error(iError);
            alert('Error al generar enfrentamientos.');
        } else {
            fetchTournamentDetails();
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader className="animate-spin text-gold-500" size={40} />
            </div>
        );
    }

    if (!tournament) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-white mb-4">Torneo no encontrado</h2>
                <button onClick={() => navigate('/tournaments')} className="text-gold-500 hover:text-gold-400">Volver a la lista</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-20 px-6 max-w-7xl mx-auto">
            <button
                onClick={() => navigate('/tournaments')}
                className="flex items-center gap-2 text-stone-500 hover:text-stone-300 transition-colors mb-8 group"
            >
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                Volver a Torneos
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Header Card */}
                    <div className="bg-stone-900/40 border border-stone-800 rounded-2xl overflow-hidden">
                        {tournament.image_url ? (
                            <div className="h-64 md:h-80 w-full relative">
                                <img src={tournament.image_url} alt={tournament.title} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-stone-900 border-b border-stone-800" />
                                <div className="absolute bottom-6 left-8">
                                    <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">{tournament.title}</h1>
                                    <div className="flex flex-wrap gap-4 items-center text-stone-300">
                                        <div className="flex items-center gap-2 px-3 py-1 bg-black/40 rounded-full backdrop-blur-sm border border-white/10">
                                            <Calendar size={16} className="text-gold-500" />
                                            <span className="text-sm font-medium">{new Date(tournament.start_date).toLocaleString()}</span>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border backdrop-blur-sm
                                            ${tournament.status === 'open' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                                tournament.status === 'ongoing' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                                    tournament.status === 'completed' ? 'bg-stone-700 text-stone-400 border-stone-600' :
                                                        'bg-yellow-500/20 text-yellow-500 border-yellow-500/30'}
                                        `}>
                                            {tournament.status === 'open' ? 'Inscripciones Abiertas' :
                                                tournament.status === 'ongoing' ? 'En Curso' :
                                                    tournament.status === 'draft' ? 'Borrador' : 'Finalizado'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 border-b border-stone-800 bg-gradient-to-br from-stone-900 to-stone-950">
                                <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">{tournament.title}</h1>
                                <div className="flex flex-wrap gap-4 items-center text-stone-400">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={20} className="text-gold-500" />
                                        <span>{new Date(tournament.start_date).toLocaleString()}</span>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border
                                        ${tournament.status === 'open' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                            tournament.status === 'ongoing' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                                tournament.status === 'completed' ? 'bg-stone-700 text-stone-400 border-stone-600' :
                                                    'bg-yellow-500/20 text-yellow-500 border-yellow-500/30'}
                                    `}>
                                        {tournament.status === 'open' ? 'Inscripciones Abiertas' :
                                            tournament.status === 'ongoing' ? 'En Curso' :
                                                tournament.status === 'draft' ? 'Borrador' : 'Finalizado'}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="p-8">
                            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Shield className="text-gold-500" size={20} /> Descripción y Reglas
                            </h2>
                            <div className="prose prose-invert max-w-none text-stone-400 text-lg leading-relaxed mb-8">
                                {tournament.description ? (
                                    tournament.description.split('\n').map((para: string, i: number) => <p key={i}>{para}</p>)
                                ) : (
                                    <p className="italic">No hay descripción detallada para este torneo.</p>
                                )}
                            </div>

                            {tournament.rules && (
                                <div className="bg-stone-950/50 border border-stone-800 rounded-xl p-6 mt-8">
                                    <h3 className="text-white font-bold mb-3 uppercase tracking-wider text-xs flex items-center gap-2">
                                        Reglas Oficiales
                                    </h3>
                                    <div className="text-stone-400 text-sm whitespace-pre-wrap leading-relaxed">
                                        {tournament.rules}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Matches Section */}
                    {tournament.status !== 'draft' && (
                        <div className="bg-stone-900/40 border border-stone-800 rounded-2xl p-8">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                    <TrophyIcon className="text-gold-500" /> Enfrentamientos
                                </h2>
                                {profile?.role === 'admin' && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleGenerateBracket}
                                            className="text-xs bg-stone-800 text-stone-300 border border-stone-700 px-3 py-1.5 rounded-lg hover:bg-stone-700 transition-colors uppercase font-bold tracking-wider"
                                        >
                                            Generar Cuadro
                                        </button>
                                        <button
                                            onClick={() => {
                                                const p1 = prompt('ID o nombre parcial del Jugador 1');
                                                const p2 = prompt('ID o nombre parcial del Jugador 2');
                                                if (p1 && p2) {
                                                    // Find participants
                                                    const player1 = participants.find(p => p.profiles.username.toLowerCase().includes(p1.toLowerCase()));
                                                    const player2 = participants.find(p => p.profiles.username.toLowerCase().includes(p2.toLowerCase()));
                                                    if (player1 && player2) {
                                                        handleCreateMatch(player1.user_id, player2.user_id, 1);
                                                    } else {
                                                        alert('Jugadores no encontrados en la lista de participantes.');
                                                    }
                                                }
                                            }}
                                            className="text-xs bg-gold-600/10 text-gold-500 border border-gold-500/20 px-3 py-1.5 rounded-lg hover:bg-gold-600/20 transition-colors uppercase font-bold tracking-wider"
                                        >
                                            + Agregar Partido
                                        </button>
                                    </div>
                                )}
                            </div>

                            {matches.length === 0 ? (
                                <div className="text-center py-12 text-stone-500 italic">
                                    {tournament.status === 'open' ? 'El cuadro se generará cuando cierren las inscripciones.' : 'No hay enfrentamientos registrados.'}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {Array.from(new Set(matches.map(m => m.round))).sort((a, b) => a - b).map(round => (
                                        <div key={round} className="space-y-3">
                                            <h3 className="text-xs font-bold text-stone-500 uppercase tracking-[0.2em] mb-4 border-b border-stone-800 pb-2">
                                                Ronda {round}
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {matches.filter(m => m.round === round).map(match => (
                                                    <div key={match.id} className="bg-stone-950/40 border border-stone-800 rounded-xl p-4 hover:border-stone-700 transition-colors">
                                                        <div className="flex flex-col gap-3">
                                                            <div className={`flex justify-between items-center p-2 rounded ${match.winner_id === match.player1_id ? 'bg-gold-500/10 border border-gold-500/20' : ''}`}>
                                                                <span className={`text-sm ${match.winner_id === match.player1_id ? 'text-gold-400 font-bold' : 'text-stone-300'}`}>
                                                                    {match.p1?.username || 'Por definir'}
                                                                </span>
                                                                {match.winner_id === match.player1_id && <TrophyIcon size={12} className="text-gold-500" />}
                                                            </div>
                                                            <div className="text-[10px] text-stone-600 font-black text-center uppercase tracking-widest">VS</div>
                                                            <div className={`flex justify-between items-center p-2 rounded ${match.winner_id === match.player2_id ? 'bg-gold-500/10 border border-gold-500/20' : ''}`}>
                                                                <span className={`text-sm ${match.winner_id === match.player2_id ? 'text-gold-400 font-bold' : 'text-stone-300'}`}>
                                                                    {match.p2?.username || 'Por definir'}
                                                                </span>
                                                                {match.winner_id === match.player2_id && <TrophyIcon size={12} className="text-gold-500" />}
                                                            </div>
                                                        </div>

                                                        {match.result_score && (
                                                            <div className="mt-4 pt-3 border-t border-stone-800/50 text-center">
                                                                <span className="text-xs font-serif italic text-gold-500/80">Resultado: {match.result_score}</span>
                                                            </div>
                                                        )}

                                                        {profile?.role === 'admin' && (
                                                            <div className="mt-4 flex gap-2">
                                                                <button
                                                                    onClick={() => {
                                                                        const winner = prompt(`¿Quién ganó? (1 para ${match.p1.username}, 2 para ${match.p2.username})`);
                                                                        const score = prompt('Score (ej: 2-1)');
                                                                        if (winner && score) {
                                                                            const winnerId = winner === '1' ? match.player1_id : match.player2_id;
                                                                            handleUpdateMatchResult(match.id, winnerId, score);
                                                                        }
                                                                    }}
                                                                    className="flex-1 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px] font-bold uppercase rounded transition-colors"
                                                                >
                                                                    Reportar
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Sidebar Info */}
                <div className="space-y-8">
                    {/* Action Card */}
                    <div className="bg-stone-900/40 border-2 border-gold-500/20 rounded-2xl p-6 text-center">
                        <h3 className="text-white font-bold mb-6 text-xl">¿Quieres participar?</h3>
                        {user ? (
                            isParticipant ? (
                                <div className="flex flex-col items-center gap-3 py-4">
                                    <div className="w-12 h-12 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-2">
                                        <CheckCircle size={24} />
                                    </div>
                                    <p className="text-green-400 font-bold">Ya estás inscrito</p>
                                    <p className="text-xs text-stone-500">Espera a que un administrador confirme tu participación.</p>
                                </div>
                            ) : tournament.status === 'open' ? (
                                <button
                                    onClick={handleJoin}
                                    disabled={isJoining}
                                    className="w-full py-4 bg-gold-600 hover:bg-gold-500 text-stone-950 font-black rounded-xl transition-all shadow-xl shadow-gold-900/20 active:scale-95 disabled:opacity-50"
                                >
                                    {isJoining ? 'Inscribiendo...' : 'INSCRIBIRSE AHORA'}
                                </button>
                            ) : (
                                <div className="py-4 text-stone-500 flex flex-col items-center gap-2">
                                    <Clock size={24} />
                                    <p>Las inscripciones no están disponibles.</p>
                                </div>
                            )
                        ) : (
                            <p className="text-stone-400 mb-6">Inicia sesión para poder participar en este torneo.</p>
                        )}
                        <div className="mt-6 pt-6 border-t border-stone-800 flex justify-center gap-8">
                            <div className="text-center">
                                <p className="text-[10px] text-stone-500 uppercase tracking-widest font-bold mb-1">Cupos</p>
                                <p className="text-xl font-bold text-gray-100">{participants.length} / {tournament.max_participants || '∞'}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] text-stone-500 uppercase tracking-widest font-bold mb-1">Formato</p>
                                <p className="text-lg font-bold text-gray-100">
                                    {tournament.bracket_type === 'single_elimination' ? '1v1 Directo' :
                                        tournament.bracket_type === 'double_elimination' ? 'Doble El.' :
                                            tournament.bracket_type === 'round_robin' ? 'Liga' : tournament.bracket_type}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Sponsors & Prizes Card */}
                    {(tournament.sponsors?.length > 0 || tournament.prizes?.length > 0) && (
                        <div className="bg-stone-900/40 border border-stone-800 rounded-2xl overflow-hidden">
                            <div className="p-6 border-b border-stone-800 bg-stone-900/20">
                                <h3 className="text-white font-bold flex items-center gap-2">
                                    <DollarSign className="text-gold-500" size={18} /> Premios y Patrocinios
                                </h3>
                            </div>
                            <div className="p-6 space-y-6">
                                {tournament.prizes?.length > 0 && (
                                    <div>
                                        <h4 className="text-[10px] text-stone-500 uppercase font-bold tracking-widest mb-3 flex items-center gap-1">
                                            <Gift size={12} /> Premios
                                        </h4>
                                        <div className="space-y-2">
                                            {tournament.prizes.map((prize: string, i: number) => (
                                                <div key={i} className="flex items-center gap-3 p-3 bg-stone-950/40 rounded-lg border border-stone-800/50">
                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold 
                                                        ${i === 0 ? 'bg-gold-500/20 text-gold-500' :
                                                            i === 1 ? 'bg-slate-400/20 text-slate-400' :
                                                                i === 2 ? 'bg-amber-700/20 text-amber-700' : 'bg-stone-800 text-stone-500'}`}>
                                                        {i + 1}
                                                    </div>
                                                    <span className="text-sm text-stone-300">{prize}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {tournament.sponsors?.length > 0 && (
                                    <div>
                                        <h4 className="text-[10px] text-stone-500 uppercase font-bold tracking-widest mb-3">Patrocinadores</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            {tournament.sponsors.map((sponsor: string, i: number) => (
                                                <div key={i} className="p-2 bg-stone-800/20 border border-stone-800 rounded text-[10px] text-center text-stone-400 truncate font-bold uppercase tracking-wider">
                                                    {sponsor}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Participants Card */}
                    <div className="bg-stone-900/40 border border-stone-800 rounded-2xl overflow-hidden">
                        <div className="p-6 border-b border-stone-800 bg-stone-900/20 flex justify-between items-center">
                            <h3 className="text-white font-bold flex items-center gap-2">
                                <Users className="text-gold-500" size={18} /> Participantes
                            </h3>
                            <span className="text-xs text-stone-500 font-bold">{participants.length}</span>
                        </div>
                        <div className="p-2 h-[400px] overflow-y-auto">
                            {participants.length === 0 ? (
                                <div className="text-center py-8 text-stone-600 italic text-sm">No hay inscritos aún.</div>
                            ) : (
                                participants.map((p: any) => (
                                    <div key={p.user_id} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-stone-800 border border-stone-700 overflow-hidden">
                                                {p.profiles?.avatar_url ? (
                                                    <img src={p.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-xs text-stone-600 font-bold uppercase">
                                                        {p.profiles?.username?.charAt(0) || '?'}
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-sm font-medium text-stone-300">{p.profiles?.username || 'Usuario desconocido'}</span>
                                        </div>
                                        {p.status === 'approved' && (
                                            <div className="w-2 h-2 rounded-full bg-green-500" title="Confirmado" />
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
