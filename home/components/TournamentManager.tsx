import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Tournament } from '../types';
import { Trophy, Calendar, Users, Plus, Edit2, Trash2, Save, Image as ImageIcon, Upload, X } from 'lucide-react';

export const TournamentManager: React.FC = () => {
    const [uploading, setUploading] = useState(false);
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

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        setUploading(true);

        try {
            const file = e.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `tournament-banners/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('tournaments')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('tournaments')
                .getPublicUrl(filePath);

            setCurrentTournament({ ...currentTournament, image_url: publicUrl });
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Error al subir la imagen');
        } finally {
            setUploading(false);
        }
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
            bracket_type: 'single_elimination',
            sponsors: [],
            prizes: []
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

                        <div className="col-span-full">
                            <label className="block text-sm font-medium text-stone-400 mb-2">Imagen del Torneo (Banner)</label>
                            <div className="flex items-center gap-6">
                                {currentTournament.image_url ? (
                                    <div className="relative w-48 h-24 rounded-lg overflow-hidden border border-stone-800">
                                        <img src={currentTournament.image_url} alt="Banner" className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => setCurrentTournament({ ...currentTournament, image_url: undefined })}
                                            className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full hover:bg-red-600 transition-colors"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="w-48 h-24 flex flex-col items-center justify-center border-2 border-dashed border-stone-800 rounded-lg cursor-pointer hover:border-gold-500/50 hover:bg-stone-900/50 transition-all">
                                        {uploading ? <ImageIcon className="animate-pulse text-gold-500" /> : <Upload className="text-stone-600" />}
                                        <span className="text-[10px] text-stone-600 mt-2 font-bold uppercase tracking-wider">Subir Banner</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                                    </label>
                                )}
                                <div className="flex-1">
                                    <p className="text-xs text-stone-500 leading-relaxed italic">Esta imagen aparecerá en la cabecera del torneo y en el listado principal. Se recomienda una relación de aspecto 2:1.</p>
                                </div>
                            </div>
                        </div>

                        {/* Sponsors & Prizes */}
                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-stone-400">Patrocinadores</label>
                            <div className="space-y-2">
                                {(currentTournament.sponsors || []).map((s, i) => (
                                    <div key={i} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={s}
                                            onChange={e => {
                                                const newSponsors = [...(currentTournament.sponsors || [])];
                                                newSponsors[i] = e.target.value;
                                                setCurrentTournament({ ...currentTournament, sponsors: newSponsors });
                                            }}
                                            className="flex-1 bg-stone-950 border border-stone-800 rounded-lg p-2 text-white text-sm outline-none focus:border-gold-500"
                                        />
                                        <button
                                            onClick={() => {
                                                const newSponsors = (currentTournament.sponsors || []).filter((_, idx) => idx !== i);
                                                setCurrentTournament({ ...currentTournament, sponsors: newSponsors });
                                            }}
                                            className="p-2 text-stone-500 hover:text-red-500"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={() => setCurrentTournament({ ...currentTournament, sponsors: [...(currentTournament.sponsors || []), ''] })}
                                    className="text-xs text-gold-500 hover:text-gold-400 font-bold uppercase tracking-widest flex items-center gap-1"
                                >
                                    <Plus size={14} /> Agregar Patrocinador
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-stone-400">Premios</label>
                            <div className="space-y-2">
                                {(currentTournament.prizes || []).map((p, i) => (
                                    <div key={i} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={p}
                                            onChange={e => {
                                                const newPrizes = [...(currentTournament.prizes || [])];
                                                newPrizes[i] = e.target.value;
                                                setCurrentTournament({ ...currentTournament, prizes: newPrizes });
                                            }}
                                            className="flex-1 bg-stone-950 border border-stone-800 rounded-lg p-2 text-white text-sm outline-none focus:border-gold-500"
                                            placeholder={i === 0 ? "1er Lugar: $100" : i === 1 ? "2do Lugar: $50" : "Premio"}
                                        />
                                        <button
                                            onClick={() => {
                                                const newPrizes = (currentTournament.prizes || []).filter((_, idx) => idx !== i);
                                                setCurrentTournament({ ...currentTournament, prizes: newPrizes });
                                            }}
                                            className="p-2 text-stone-500 hover:text-red-500"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={() => setCurrentTournament({ ...currentTournament, prizes: [...(currentTournament.prizes || []), ''] })}
                                    className="text-xs text-gold-500 hover:text-gold-400 font-bold uppercase tracking-widest flex items-center gap-1"
                                >
                                    <Plus size={14} /> Agregar Premio
                                </button>
                            </div>
                        </div>

                        <div className="col-span-full flex items-center gap-3 py-4 border-t border-stone-800 mt-4">
                            <input
                                type="checkbox"
                                id="is_public"
                                checked={currentTournament.is_public || false}
                                onChange={e => setCurrentTournament({ ...currentTournament, is_public: e.target.checked })}
                                className="w-5 h-5 rounded border-stone-700 bg-stone-900 text-gold-600 focus:ring-gold-500 cursor-pointer"
                            />
                            <label htmlFor="is_public" className="text-sm font-medium text-stone-300 cursor-pointer">
                                Visible públicamente (incluso sin estar logueado)
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
                                <div className="flex items-center gap-4 flex-1">
                                    {tournament.image_url && (
                                        <img src={tournament.image_url} alt="" className="w-16 h-10 object-cover rounded border border-stone-800 flex-shrink-0" />
                                    )}
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
