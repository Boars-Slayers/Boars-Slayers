import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Tournament } from '../types';
import { Trophy, Calendar, Users, Plus, Edit2, Trash2, Save, Image as ImageIcon, Upload, X, Settings } from 'lucide-react';
import { MatchModal } from './tournaments/MatchModal';

export const TournamentManager: React.FC = () => {
    const [uploading, setUploading] = useState(false);
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentTournament, setCurrentTournament] = useState<Partial<Tournament>>({});
    const [participants, setParticipants] = useState<any[]>([]);
    const [allProfiles, setAllProfiles] = useState<any[]>([]);
    const [memberSearch, setMemberSearch] = useState('');
    const [participantLoading, setParticipantLoading] = useState(false);

    // Match management state
    const [matches, setMatches] = useState<any[]>([]);
    const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
    const [matches, setMatches] = useState<any[]>([]);
    const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
    const [editingMatch, setEditingMatch] = useState<any>(null);

    // Admin management state
    const [admins, setAdmins] = useState<any[]>([]);
    const [adminSearch, setAdminSearch] = useState('');

    useEffect(() => {
        fetchTournaments();
    }, []);

    useEffect(() => {
        if (isEditing && currentTournament.id) {
            fetchParticipants(currentTournament.id);
            fetchParticipants(currentTournament.id);
            fetchMatches(currentTournament.id);
            fetchAdmins(currentTournament.id);
            fetchProfiles();
        }
    }, [isEditing, currentTournament.id]);

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

    const fetchParticipants = async (tournamentId: string) => {
        setParticipantLoading(true);
        const { data, error } = await supabase
            .from('tournament_participants')
            .select('*, user:profiles(id, username, avatar_url)')
            .eq('tournament_id', tournamentId);

        if (error) {
            console.error('Error fetching participants:', error);
        } else {
            setParticipants(data || []);
        }
        setParticipantLoading(false);
    };

    const fetchProfiles = async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .neq('role', 'candidate');

        if (error) {
            console.error('Error fetching profiles:', error);
        } else {
            setAllProfiles(data || []);
        }
    };

    const fetchMatches = async (tournamentId: string) => {
        const { data, error } = await supabase
            .from('matches')
            .select('*, p1:profiles!player1_id(username), p2:profiles!player2_id(username), winner:profiles!winner_id(username)')
            .eq('tournament_id', tournamentId)
            .order('round', { ascending: true })
            .order('match_number', { ascending: true });

        if (error) {
            console.error('Error fetching matches:', error);
        } else {
            setMatches(data || []);
        }
    };

    const fetchAdmins = async (tournamentId: string) => {
        const { data, error } = await supabase
            .from('tournament_admins')
            .select('*, user:profiles(id, username, avatar_url)')
            .eq('tournament_id', tournamentId);

        if (error) {
            console.error('Error fetching admins:', error);
        } else {
            setAdmins(data || []);
        }
    };

    const addParticipant = async (user_id: string) => {
        if (!currentTournament.id) return;

        const { error } = await supabase
            .from('tournament_participants')
            .insert([{
                tournament_id: currentTournament.id,
                user_id,
                status: 'approved'
            }]);

        if (error) {
            if (error.code === '23505') {
                alert('Este usuario ya está en el torneo');
            } else {
                console.error('Error adding participant:', error);
                alert('Error al agregar el participante');
            }
        } else {
            fetchParticipants(currentTournament.id);
            setMemberSearch('');
        }
    };

    const removeParticipant = async (participantId: string) => {
        if (!confirm('¿Quitar a este participante?')) return;

        const { error } = await supabase
            .from('tournament_participants')
            .delete()
            .eq('id', participantId);

        if (error) {
            console.error('Error removing participant:', error);
            alert('Error al eliminar el participante');
        } else {
            setParticipants(participants.filter(p => p.id !== participantId));
        }
    };

    const addAdmin = async (user_id: string) => {
        if (!currentTournament.id) return;

        const { error } = await supabase
            .from('tournament_admins')
            .insert([{
                tournament_id: currentTournament.id,
                user_id
            }]);

        if (error) {
            console.error('Error adding admin:', error);
            alert('Error al agregar el administrador');
        } else {
            fetchAdmins(currentTournament.id);
            setAdminSearch('');
        }
    };

    const removeAdmin = async (adminId: string) => {
        if (!confirm('¿Quitar permisos de administrador a este usuario?')) return;

        const { error } = await supabase
            .from('tournament_admins')
            .delete()
            .eq('id', adminId);

        if (error) {
            console.error('Error removing admin:', error);
            alert('Error al eliminar el administrador');
        } else {
            setAdmins(admins.filter(a => a.id !== adminId));
        }
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

                        {/* Manual Participant Management - Only for existing tournaments */}
                        {currentTournament.id && (
                            <div className="col-span-full mt-12 pt-8 border-t border-stone-800">
                                <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                    <Users size={20} className="text-gold-500" />
                                    Gestión de Participantes ({participants.length}/{currentTournament.max_participants})
                                </h4>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Participant List */}
                                    <div className="space-y-4">
                                        <p className="text-sm font-medium text-stone-400 mb-2 uppercase tracking-widest text-[10px]">Participantes Actuales</p>
                                        <div className="bg-stone-950 border border-stone-800 rounded-xl overflow-hidden min-h-[100px]">
                                            {participantLoading ? (
                                                <div className="p-8 text-center text-stone-600 italic">Cargando...</div>
                                            ) : participants.length === 0 ? (
                                                <div className="p-8 text-center text-stone-600 italic text-sm">No hay participantes inscritos</div>
                                            ) : (
                                                <div className="divide-y divide-stone-900">
                                                    {participants.map((p) => (
                                                        <div key={p.id} className="flex items-center justify-between p-3 group hover:bg-stone-900/50 transition-colors">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full overflow-hidden border border-stone-800 bg-stone-900">
                                                                    {p.user?.avatar_url ? (
                                                                        <img src={p.user.avatar_url} alt="" className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center text-stone-700 font-bold text-xs">?</div>
                                                                    )}
                                                                </div>
                                                                <span className="text-sm font-medium text-stone-200">{p.user?.username}</span>
                                                            </div>
                                                            <button
                                                                onClick={() => removeParticipant(p.id)}
                                                                className="opacity-0 group-hover:opacity-100 p-1.5 text-stone-500 hover:text-red-500 hover:bg-red-500/10 rounded transition-all"
                                                                title="Eliminar participante"
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Add Participant Search */}
                                    <div className="space-y-4">
                                        <p className="text-sm font-medium text-stone-400 mb-2 uppercase tracking-widest text-[10px]">Agregar Invitado</p>
                                        <div className="relative group">
                                            <input
                                                type="text"
                                                value={memberSearch}
                                                onChange={e => setMemberSearch(e.target.value)}
                                                placeholder="Buscar miembro del clan..."
                                                className="w-full bg-stone-950 border border-stone-800 rounded-lg p-3 text-white focus:border-gold-500 outline-none text-sm peer"
                                            />
                                            {/* Show dropdown on focus or if input exists */}
                                            <div className="hidden peer-focus:block hover:block absolute top-full left-0 right-0 mt-2 bg-stone-900 border border-stone-800 rounded-xl shadow-2xl overflow-hidden z-20 max-h-48 overflow-y-auto">
                                                {allProfiles
                                                    .filter(u => u.username.toLowerCase().includes(memberSearch.toLowerCase()))
                                                    .filter(u => !participants.some(p => p.user_id === u.id))
                                                    .slice(0, 10)
                                                    .map(u => (
                                                        <button
                                                            key={u.id}
                                                            onClick={() => addParticipant(u.id)}
                                                            onMouseDown={(e) => e.preventDefault()} // Prevent focus loss
                                                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-stone-800 text-stone-300 text-sm transition-colors text-left"
                                                        >
                                                            <div className="w-6 h-6 rounded-full overflow-hidden border border-stone-700 flex-shrink-0">
                                                                {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-stone-800" />}
                                                            </div>
                                                            {u.username}
                                                            <Plus size={14} className="ml-auto text-gold-500" />
                                                        </button>
                                                    ))
                                                }
                                                {allProfiles.length > 0 && allProfiles.filter(u => u.username.toLowerCase().includes(memberSearch.toLowerCase()) && !participants.some(p => p.user_id === u.id)).length === 0 && (
                                                    <div className="p-4 text-center text-stone-600 text-xs italic">No se encontraron miembros para invitar</div>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-stone-600 mt-3 italic leading-relaxed">
                                                Busca a un miembro para agregarlo directamente. Los participantes agregados manualmente aparecerán con estado "Aprobado".
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Admin Management - Only for existing tournaments */}
                        {currentTournament.id && (
                            <div className="col-span-full mt-12 pt-8 border-t border-stone-800">
                                <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                    <Users size={20} className="text-gold-500" />
                                    Gestión de Administradores ({admins.length})
                                </h4>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Admin List */}
                                    <div className="space-y-4">
                                        <p className="text-sm font-medium text-stone-400 mb-2 uppercase tracking-widest text-[10px]">Administradores Actuales</p>
                                        <div className="bg-stone-950 border border-stone-800 rounded-xl overflow-hidden min-h-[100px]">
                                            {admins.length === 0 ? (
                                                <div className="p-8 text-center text-stone-600 italic text-sm">No hay administradores designados</div>
                                            ) : (
                                                <div className="divide-y divide-stone-900">
                                                    {admins.map((a) => (
                                                        <div key={a.id} className="flex items-center justify-between p-3 group hover:bg-stone-900/50 transition-colors">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full overflow-hidden border border-stone-800 bg-stone-900">
                                                                    {a.user?.avatar_url ? (
                                                                        <img src={a.user.avatar_url} alt="" className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center text-stone-700 font-bold text-xs">?</div>
                                                                    )}
                                                                </div>
                                                                <span className="text-sm font-medium text-stone-200">{a.user?.username}</span>
                                                            </div>
                                                            <button
                                                                onClick={() => removeAdmin(a.id)}
                                                                className="opacity-0 group-hover:opacity-100 p-1.5 text-stone-500 hover:text-red-500 hover:bg-red-500/10 rounded transition-all"
                                                                title="Eliminar administrador"
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Add Admin Search */}
                                    <div className="space-y-4">
                                        <p className="text-sm font-medium text-stone-400 mb-2 uppercase tracking-widest text-[10px]">Agregar Administrador</p>
                                        <div className="relative group">
                                            <input
                                                type="text"
                                                value={adminSearch}
                                                onChange={e => setAdminSearch(e.target.value)}
                                                placeholder="Buscar miembro para hacer admin..."
                                                className="w-full bg-stone-950 border border-stone-800 rounded-lg p-3 text-white focus:border-gold-500 outline-none text-sm peer"
                                            />
                                            {/* Show dropdown on focus (simulated with CSS/Logic) or if having input */}
                                            <div className="hidden peer-focus:block hover:block absolute top-full left-0 right-0 mt-2 bg-stone-900 border border-stone-800 rounded-xl shadow-2xl overflow-hidden z-20 max-h-48 overflow-y-auto">
                                                {allProfiles
                                                    .filter(u => u.username.toLowerCase().includes(adminSearch.toLowerCase()))
                                                    .filter(u => !admins.some(a => a.user_id === u.id))
                                                    .slice(0, 10)
                                                    .map(u => (
                                                        <button
                                                            key={u.id}
                                                            onClick={() => addAdmin(u.id)} // Correction here from addParticipant to addAdmin
                                                            onMouseDown={(e) => e.preventDefault()} // Prevent blur before click
                                                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-stone-800 text-stone-300 text-sm transition-colors text-left"
                                                        >
                                                            <div className="w-6 h-6 rounded-full overflow-hidden border border-stone-700 flex-shrink-0">
                                                                {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-stone-800" />}
                                                            </div>
                                                            {u.username}
                                                            <Plus size={14} className="ml-auto text-gold-500" />
                                                        </button>
                                                    ))
                                                }
                                                {allProfiles.length > 0 && allProfiles.filter(u => u.username.toLowerCase().includes(adminSearch.toLowerCase()) && !admins.some(a => a.user_id === u.id)).length === 0 && (
                                                    <div className="p-4 text-center text-stone-600 text-xs italic">No se encontraron miembros</div>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-stone-600 mt-3 italic leading-relaxed">
                                                Los administradores podrán editar el torneo y gestionar los partidos.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Match Management - Only for existing tournaments */}
                        {currentTournament.id && (
                            <div className="col-span-full mt-12 pt-8 border-t border-stone-800">
                                <div className="flex justify-between items-center mb-6">
                                    <h4 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Trophy size={20} className="text-gold-500" />
                                        Gestión de Partidos ({matches.length})
                                    </h4>
                                    <button
                                        onClick={() => {
                                            setEditingMatch(null);
                                            setIsMatchModalOpen(true);
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 bg-gold-600/10 text-gold-500 border border-gold-500/20 rounded-lg hover:bg-gold-600/20 transition-colors text-sm font-bold uppercase tracking-wider"
                                    >
                                        <Plus size={16} /> Agregar Partido
                                    </button>
                                </div>

                                <div className="bg-stone-950 border border-stone-800 rounded-xl overflow-hidden">
                                    {matches.length === 0 ? (
                                        <div className="p-8 text-center text-stone-600 italic text-sm">
                                            No hay partidos registrados. Haz clic en "Agregar Partido" para crear uno.
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-stone-900">
                                            {matches.map((match) => (
                                                <div key={match.id} className="flex items-center justify-between p-4 group hover:bg-stone-900/50 transition-colors">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-1">
                                                            <span className="text-xs font-bold text-stone-600 uppercase tracking-wider">
                                                                Ronda {match.round} - Partido {match.match_number}
                                                            </span>
                                                            {match.status === 'completed' && (
                                                                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded text-[10px] font-bold uppercase tracking-wider">
                                                                    Finalizado
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className={`font-bold ${match.winner_id === match.player1_id ? 'text-gold-400' : 'text-stone-300'}`}>
                                                                {match.p1?.username || 'TBD'}
                                                            </span>
                                                            <span className="text-stone-600 text-xs font-black">VS</span>
                                                            <span className={`font-bold ${match.winner_id === match.player2_id ? 'text-gold-400' : 'text-stone-300'}`}>
                                                                {match.p2?.username || 'TBD'}
                                                            </span>
                                                            {match.result_score && (
                                                                <span className="ml-3 text-gold-500 font-mono font-bold tracking-wider bg-gold-900/10 px-2 py-0.5 rounded">
                                                                    {match.result_score}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => {
                                                                setEditingMatch(match);
                                                                setIsMatchModalOpen(true);
                                                            }}
                                                            className="p-1.5 text-stone-500 hover:text-gold-500 hover:bg-gold-500/10 rounded transition-all"
                                                            title="Editar partido"
                                                        >
                                                            <Settings size={16} />
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                if (!confirm('¿Eliminar este partido?')) return;
                                                                const { error } = await supabase
                                                                    .from('matches')
                                                                    .delete()
                                                                    .eq('id', match.id);
                                                                if (error) {
                                                                    console.error('Error deleting match:', error);
                                                                    alert('Error al eliminar el partido');
                                                                } else {
                                                                    fetchMatches(currentTournament.id!);
                                                                }
                                                            }}
                                                            className="p-1.5 text-stone-500 hover:text-red-500 hover:bg-red-500/10 rounded transition-all"
                                                            title="Eliminar partido"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <p className="text-[10px] text-stone-600 mt-3 italic leading-relaxed">
                                    Aquí puedes agregar partidos pasados con sus resultados, o partidos futuros sin resultado. Los partidos se mostrarán en la página pública del torneo.
                                </p>
                            </div>
                        )}
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
            )
            }

            {/* Match Modal */}
            <MatchModal
                isOpen={isMatchModalOpen}
                onClose={() => setIsMatchModalOpen(false)}
                onSave={() => {
                    if (currentTournament.id) {
                        fetchMatches(currentTournament.id);
                    }
                }}
                tournamentId={currentTournament.id || ''}
                participants={participants}
                existingMatch={editingMatch}
                round={1}
            />
        </div>
    );
};
