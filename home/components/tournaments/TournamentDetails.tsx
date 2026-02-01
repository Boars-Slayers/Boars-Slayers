import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Calendar, Users, Trophy as TrophyIcon, ArrowLeft, Loader, Shield, Gift, CheckCircle, Lock, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../../AuthContext';

import { StandingsTable } from './StandingsTable';
import { BracketView } from './BracketView';
import { MomentCard } from '../Moments/MomentCard';

export const TournamentDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [tournament, setTournament] = useState<any>(null);
    const [participants, setParticipants] = useState<any[]>([]);
    const [matches, setMatches] = useState<any[]>([]);
    const [moments, setMoments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isJoining, setIsJoining] = useState(false);
    const [isParticipant, setIsParticipant] = useState(false);
    const [activeTab, setActiveTab] = useState<'info' | 'bracket' | 'moments'>('info');

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
            const { data: pData } = await supabase
                .from('tournament_participants')
                .select('*, profiles(id, username, avatar_url)')
                .eq('tournament_id', id);
            setParticipants(pData || []);

            // Fetch matches
            const { data: mData } = await supabase
                .from('matches')
                .select('*, p1:profiles!player1_id(username), p2:profiles!player2_id(username), winner:profiles!winner_id(username)')
                .eq('tournament_id', id)
                .order('round', { ascending: true })
                .order('match_number', { ascending: true });
            setMatches(mData || []);

            await supabase
                .from('tournament_admins')
                .select('*, user:profiles(id, username, avatar_url)')
                .eq('tournament_id', id);

            // Fetch moments
            const { data: moData } = await supabase
                .from('moments')
                .select('*')
                .eq('tournament_id', id)
                .order('created_at', { ascending: false });
            setMoments(moData || []);

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



    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader className="animate-spin text-gold-500" size={40} />
            </div>
        );
    }

    if (!tournament) return <div>Torneo no encontrado</div>;

    return (
        <div className="min-h-screen pt-24 pb-20 px-6 max-w-7xl mx-auto">
            <button
                onClick={() => navigate('/tournaments')}
                className="flex items-center gap-2 text-stone-500 hover:text-stone-300 transition-colors mb-6 group"
            >
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                Volver a Torneos
            </button>

            {/* Header Banner */}
            <div className="relative h-64 md:h-80 w-full rounded-2xl overflow-hidden mb-8 border border-stone-800">
                {tournament.image_url ? (
                    <img src={tournament.image_url} alt={tournament.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-stone-900 to-stone-950 flex items-center justify-center">
                        <TrophyIcon size={64} className="text-stone-800" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/50 to-transparent" />
                <div className="absolute bottom-6 left-8 right-8">
                    <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">{tournament.title}</h1>
                    <div className="flex flex-wrap gap-4 items-center text-stone-300">
                        <div className="flex items-center gap-2 px-3 py-1 bg-black/40 rounded-full backdrop-blur-sm border border-white/10">
                            <Calendar size={16} className="text-gold-500" />
                            <span className="text-sm font-medium">{new Date(tournament.start_date).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-black/40 rounded-full backdrop-blur-sm border border-white/10">
                            <Users size={16} className="text-gold-500" />
                            <span className="text-sm font-medium">{participants.length} / {tournament.max_participants || '∞'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex overflow-x-auto gap-2 mb-8 border-b border-stone-800 pb-2">
                <button
                    onClick={() => setActiveTab('info')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors whitespace-nowrap
                        ${activeTab === 'info' ? 'bg-gold-600/10 text-gold-500 border border-gold-600/20' : 'text-stone-500 hover:text-stone-300'}`}
                >
                    Información
                </button>
                <button
                    onClick={() => setActiveTab('bracket')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors whitespace-nowrap
                        ${activeTab === 'bracket' ? 'bg-gold-600/10 text-gold-500 border border-gold-600/20' : 'text-stone-500 hover:text-stone-300'}`}
                >
                    {tournament.bracket_type === 'round_robin' ? 'Tabla y Partidos' : 'Cuadro (Bracket)'}
                </button>
                <button
                    onClick={() => setActiveTab('moments')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors whitespace-nowrap
                        ${activeTab === 'moments' ? 'bg-gold-600/10 text-gold-500 border border-gold-600/20' : 'text-stone-500 hover:text-stone-300'}`}
                >
                    Momentos ({moments.length})
                </button>
            </div>

            {/* Info Tab */}
            {activeTab === 'info' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-2">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-stone-900/40 border border-stone-800 rounded-2xl p-8">
                            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Shield className="text-gold-500" size={20} /> Descripción
                            </h2>
                            <p className="text-stone-400 whitespace-pre-wrap leading-relaxed">{tournament.description}</p>
                        </div>
                        {tournament.rules && (
                            <div className="bg-stone-900/40 border border-stone-800 rounded-2xl p-8">
                                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <Lock className="text-gold-500" size={20} /> Reglas
                                </h2>
                                <p className="text-stone-400 whitespace-pre-wrap leading-relaxed text-sm">{tournament.rules}</p>
                            </div>
                        )}
                        {(tournament.prizes?.length > 0 || tournament.sponsors?.length > 0) && (
                            <div className="bg-stone-900/40 border border-stone-800 rounded-2xl p-8">
                                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <Gift className="text-gold-500" size={20} /> Premios
                                </h2>
                                <div className="space-y-4">
                                    {tournament.prizes?.map((p: string, i: number) => (
                                        <div key={i} className="flex gap-3 items-center text-stone-300">
                                            <TrophyIcon size={16} className={i === 0 ? 'text-gold-500' : 'text-stone-600'} />
                                            {p}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-8">
                        <div className="bg-stone-900/40 border-2 border-gold-500/20 rounded-2xl p-6 text-center">
                            <h3 className="text-white font-bold mb-6 text-xl">Inscripción</h3>
                            {user ? (
                                isParticipant ? (
                                    <div className="flex flex-col items-center gap-3 py-4">
                                        <CheckCircle className="text-green-500" size={32} />
                                        <p className="text-green-400 font-bold">Ya estás inscrito</p>
                                    </div>
                                ) : tournament.status === 'open' ? (
                                    <button
                                        onClick={handleJoin}
                                        disabled={isJoining}
                                        className="w-full py-4 bg-gold-600 hover:bg-gold-500 text-stone-950 font-black rounded-xl transition-all shadow-xl shadow-gold-900/20 active:scale-95 disabled:opacity-50"
                                    >
                                        {isJoining ? 'Inscribiendo...' : 'INSCRIBIRSE'}
                                    </button>
                                ) : (
                                    <div className="py-4 text-stone-500">Inscripciones cerradas</div>
                                )
                            ) : (
                                <p className="text-stone-400">Inicia sesión para participar.</p>
                            )}
                        </div>

                        <div className="bg-stone-900/40 border border-stone-800 rounded-2xl p-6 h-96 overflow-y-auto">
                            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                                <Users className="text-gold-500" size={18} /> Participantes ({participants.length})
                            </h3>
                            <div className="space-y-2">
                                {participants.map(p => (
                                    <div key={p.user_id} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg">
                                        <img src={p.profiles?.avatar_url || ''} className="w-8 h-8 rounded-full bg-stone-800" />
                                        <span className="text-stone-300 text-sm">{p.profiles?.username}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Bracket / Matches Tab */}
            {activeTab === 'bracket' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 space-y-8">
                    {tournament.bracket_type === 'round_robin' && (
                        <StandingsTable participants={participants} matches={matches} />
                    )}

                    <div className="bg-stone-900/40 border border-stone-800 rounded-2xl p-8">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                <TrophyIcon className="text-gold-500" />
                                {tournament.bracket_type === 'round_robin' ? 'Partidos' : 'Cuadro'}
                            </h2>

                        </div>

                        {tournament.bracket_type === 'round_robin' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {matches.map(match => (
                                    <div key={match.id} className="bg-stone-950 border border-stone-800 p-4 rounded-xl flex flex-col gap-4 relative group">

                                        <div className="flex justify-between items-center">
                                            <span className={`font-bold ${match.winner_id === match.player1_id ? 'text-gold-400' : 'text-stone-300'}`}>
                                                {match.p1?.username}
                                            </span>
                                            <span className="text-stone-600 text-xs font-black">VS</span>
                                            <span className={`font-bold ${match.winner_id === match.player2_id ? 'text-gold-400' : 'text-stone-300'}`}>
                                                {match.p2?.username}
                                            </span>
                                        </div>
                                        {match.result_score ? (
                                            <div className="text-center text-gold-500 font-mono font-bold tracking-wider bg-gold-900/10 py-1 rounded">
                                                {match.result_score}
                                            </div>
                                        ) : (
                                            <div className="text-center text-stone-600 text-xs italic">Pendiente</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <BracketView matches={matches} />
                        )}
                    </div>
                </div>
            )}

            {/* Moments Tab */}
            {activeTab === 'moments' && (
                <div className="animate-in fade-in slide-in-from-bottom-2">
                    {moments.length === 0 ? (
                        <div className="text-center py-20 text-stone-500">
                            <ImageIcon size={48} className="mx-auto mb-4 opacity-50" />
                            <p>No hay momentos destacados aún.</p>
                            <p className="text-sm mt-2">Sube tus clips a la galería general etiquetando este torneo.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {moments.map(moment => (
                                <MomentCard key={moment.id} moment={moment} currentUser={user} />
                            ))}
                        </div>
                    )}
                </div>
            )}




        </div>
    );
};
