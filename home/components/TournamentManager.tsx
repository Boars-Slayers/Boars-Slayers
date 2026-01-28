import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Tournament } from '../types';
import { Trophy, Calendar, Users, Plus, Edit2, Trash2, Save } from 'lucide-react';

export const TournamentManager: React.FC = () => {
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentTournament, setCurrentTournament] = useState<Partial<Tournament>>({});

    useEffect(() => {
        fetchTournaments();
    }, []);

    const fetchTournaments = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('tournaments')
            .select('*')
            .order('start_date', { ascending: false });

        if (error) {
            console.error('Error fetching tournaments:', error);
        } else {
            setTournaments(data || []);
        }
        setLoading(false);
    };

    const handleEdit = (tournament: Tournament) => {
        setCurrentTournament(tournament);
        setIsEditing(true);
    };

    const handleCreate = () => {
        setCurrentTournament({
            title: '',
            description: '',
            start_date: new Date().toISOString().split('T')[0],
            is_public: false,
            status: 'draft',
            max_participants: 8,
            bracket_type: 'single_elimination'
        });
        setIsEditing(true);
    };

    const handleSave = async () => {
        try {
            if (!currentTournament.title) {
                alert('El título es obligatorio');
                return;
            }

            const isNew = !currentTournament.id;
            let result;

            // Get current user ID for created_by field if new
            const { data: { user } } = await supabase.auth.getUser();

            if (isNew) {
                result = await supabase
                    .from('tournaments')
                    .insert([{
                        ...currentTournament,
                        created_by: user?.id
                    }])
                    .select();
            } else {
                result = await supabase
                    .from('tournaments')
                    .update(currentTournament)
                    .eq('id', currentTournament.id)
                    .select();
            }

            if (result.error) throw result.error;

            setIsEditing(false);
            fetchTournaments();
        } catch (error) {
            console.error('Error saving tournament:', error);
            alert('Error al guardar el torneo. Revisa la consola para más detalles.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este torneo? Esta acción no se puede deshacer.')) return;

        try {
            const { error } = await supabase
                .from('tournaments')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setTournaments(tournaments.filter(t => t.id !== id));
        } catch (error) {
            console.error('Error deleting tournament:', error);
            alert('Error al eliminar el torneo');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Trophy className="text-gold-500" /> Gestión de Torneos
                </h2>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-gold-600 hover:bg-gold-500 text-stone-950 font-bold rounded-lg transition-colors"
                >
                    <Plus size={20} /> Nuevo Torneo
                </button>
            </div>

            {isEditing ? (
                <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 animate-in fade-in slide-in-from-bottom-4">
                    <h3 className="text-xl font-bold text-white mb-6">
                        {currentTournament.id ? 'Editar Torneo' : 'Nuevo Torneo'}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-full">
                            <label className="block text-sm font-medium text-stone-400 mb-1">Título</label>
                            <input
                                type="text"
                                value={currentTournament.title || ''}
                                onChange={e => setCurrentTournament({ ...currentTournament, title: e.target.value })}
                                className="w-full bg-stone-950 border border-stone-800 rounded-lg p-3 text-white focus:border-gold-500 outline-none"
                                placeholder="Copa Boars Slayers Invierno"
                            />
                        </div>

                        <div className="col-span-full">
                            <label className="block text-sm font-medium text-stone-400 mb-1">Descripción</label>
                            <textarea
                                value={currentTournament.description || ''}
                                onChange={e => setCurrentTournament({ ...currentTournament, description: e.target.value })}
                                className="w-full bg-stone-950 border border-stone-800 rounded-lg p-3 text-white focus:border-gold-500 outline-none h-32"
                                placeholder="Detalles del torneo..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-stone-400 mb-1">Fecha de Inicio</label>
                            <input
                                type="datetime-local"
                                value={currentTournament.start_date ? new Date(currentTournament.start_date).toISOString().slice(0, 16) : ''}
                                onChange={e => setCurrentTournament({ ...currentTournament, start_date: new Date(e.target.value).toISOString() })}
                                className="w-full bg-stone-950 border border-stone-800 rounded-lg p-3 text-white focus:border-gold-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-stone-400 mb-1">Estado</label>
                            <select
                                value={currentTournament.status || 'draft'}
                                onChange={e => setCurrentTournament({ ...currentTournament, status: e.target.value as any })}
                                className="w-full bg-stone-950 border border-stone-800 rounded-lg p-3 text-white focus:border-gold-500 outline-none"
                            >
                                <option value="draft">Borrador</option>
                                <option value="open">Inscripciones Abiertas</option>
                                <option value="ongoing">En Curso</option>
                                <option value="completed">Finalizado</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-stone-400 mb-1">Máximo de Participantes</label>
                            <input
                                type="number"
                                value={currentTournament.max_participants || 0}
                                onChange={e => setCurrentTournament({ ...currentTournament, max_participants: parseInt(e.target.value) })}
                                className="w-full bg-stone-950 border border-stone-800 rounded-lg p-3 text-white focus:border-gold-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-stone-400 mb-1">Tipo de Bracket</label>
                            <select
                                value={currentTournament.bracket_type || 'single_elimination'}
                                onChange={e => setCurrentTournament({ ...currentTournament, bracket_type: e.target.value })}
                                className="w-full bg-stone-950 border border-stone-800 rounded-lg p-3 text-white focus:border-gold-500 outline-none"
                            >
                                <option value="single_elimination">Eliminación Directa</option>
                                <option value="double_elimination">Doble Eliminación</option>
                                <option value="round_robin">Liga (Todos contra Todos)</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-3 py-2">
                            <input
                                type="checkbox"
                                id="is_public"
                                checked={currentTournament.is_public || false}
                                onChange={e => setCurrentTournament({ ...currentTournament, is_public: e.target.checked })}
                                className="w-5 h-5 rounded border-stone-700 bg-stone-900 text-gold-600 focus:ring-gold-500"
                            />
                            <label htmlFor="is_public" className="text-sm font-medium text-stone-300">
                                Visible públicamente (incluso sin loguearse)
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-8 border-t border-stone-800 pt-6">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 px-6 py-2 bg-gold-600 hover:bg-gold-500 text-stone-950 font-bold rounded-lg transition-colors"
                        >
                            <Save size={18} /> Guardar Cambios
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {tournaments.length === 0 && !loading ? (
                        <div className="text-center py-12 bg-stone-900/50 rounded-lg border border-stone-800 border-dashed">
                            <Trophy className="mx-auto text-stone-700 mb-4" size={48} />
                            <p className="text-stone-500">No hay torneos creados aún.</p>
                        </div>
                    ) : (
                        tournaments.map(tournament => (
                            <div
                                key={tournament.id}
                                className="bg-stone-900/60 border border-stone-800 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-gold-500/30 transition-colors"
                            >
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="text-lg font-bold text-white">{tournament.title}</h3>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border
                                            ${tournament.status === 'open' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                                tournament.status === 'ongoing' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                                    tournament.status === 'completed' ? 'bg-stone-700 text-stone-400 border-stone-600' :
                                                        'bg-yellow-500/20 text-yellow-500 border-yellow-500/30'}
                                        `}>
                                            {tournament.status === 'open' ? 'Abierto' :
                                                tournament.status === 'ongoing' ? 'En Curso' :
                                                    tournament.status === 'completed' ? 'Finalizado' : 'Borrador'}
                                        </span>
                                        {tournament.is_public && (
                                            <span className="text-[10px] bg-stone-800 text-stone-400 px-2 py-0.5 rounded border border-stone-700">Público</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-stone-500">
                                        <div className="flex items-center gap-1">
                                            <Calendar size={14} />
                                            {new Date(tournament.start_date).toLocaleDateString()}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Users size={14} />
                                            Max: {tournament.max_participants}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleEdit(tournament)}
                                        className="p-2 bg-stone-800 text-stone-400 hover:text-white hover:bg-stone-700 rounded-lg transition-colors"
                                        title="Editar"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(tournament.id)}
                                        className="p-2 bg-stone-800 text-stone-400 hover:text-red-500 hover:bg-stone-700 rounded-lg transition-colors"
                                        title="Eliminar"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};
