import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Tournament } from '../../types';
import { useNavigate } from 'react-router-dom';
import { Loader, Calendar, Users, Trophy } from 'lucide-react';

export const TournamentList: React.FC = () => {
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchTournaments();
    }, []);

    const fetchTournaments = async () => {
        try {
            const { data, error } = await supabase
                .from('tournaments')
                .select('*')
                .order('start_date', { ascending: true });

            if (error) throw error;
            setTournaments(data || []);
        } catch (error) {
            console.error('Error fetching tournaments:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader className="animate-spin text-gold-500" size={40} />
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-20 px-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
                <div>
                    <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-100 mb-4">
                        Torneos <span className="text-gold-500">Boars Slayers</span>
                    </h1>
                    <p className="text-stone-400 max-w-2xl text-lg">
                        Participa en nuestros torneos competitivos y demuestra tu habilidad.
                        Desde torneos internos hasta copas abiertas.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tournaments.length === 0 ? (
                    <div className="col-span-full text-center py-20 bg-stone-900/50 rounded-lg border border-stone-800">
                        <Trophy className="mx-auto text-stone-600 mb-4" size={48} />
                        <p className="text-xl text-stone-400 font-serif">No hay torneos activos en este momento.</p>
                    </div>
                ) : (
                    tournaments.map((tournament) => (
                        <div
                            key={tournament.id}
                            onClick={() => navigate(`/tournaments/${tournament.id}`)}
                            className="group bg-stone-900/40 border border-stone-800 rounded-xl overflow-hidden hover:border-gold-500/50 transition-all duration-300 cursor-pointer hover:shadow-2xl hover:shadow-gold-900/10"
                        >
                            <div className="h-40 relative group-hover:h-48 transition-all duration-500">
                                {tournament.image_url ? (
                                    <img
                                        src={tournament.image_url}
                                        alt={tournament.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-stone-800 to-stone-900 flex items-center justify-center">
                                        <Trophy className="text-stone-700 group-hover:text-gold-500/30 transition-colors duration-500" size={64} />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent opacity-60" />
                                <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border z-10
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

                            <div className="p-6">
                                <h3 className="text-xl font-bold text-gray-100 mb-2 group-hover:text-gold-400 transition-colors">
                                    {tournament.title}
                                </h3>
                                <p className="text-sm text-stone-400 line-clamp-2 mb-6 h-10">
                                    {tournament.description}
                                </p>

                                <div className="flex items-center justify-between text-sm text-stone-500 border-t border-stone-800 pt-4">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={16} />
                                        <span>{new Date(tournament.start_date).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Users size={16} />
                                        <span>{tournament.max_participants ? `Max: ${tournament.max_participants}` : 'Sin límite'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
