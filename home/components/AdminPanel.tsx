import React, { useState, useEffect } from 'react';
import { supabase, UserProfile } from '../lib/supabase';
import { UserCheck, UserX, Shield, Clock, RefreshCw } from 'lucide-react';

interface AdminPanelProps {
    onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
    const [candidates, setCandidates] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [actioningId, setActioningId] = useState<string | null>(null);

    const fetchCandidates = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'candidate')
            .order('created_at', { ascending: false });

        if (!error) setCandidates(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchCandidates();
    }, []);

    const handleApprove = async (id: string) => {
        setActioningId(id);
        const { error } = await supabase
            .from('profiles')
            .update({ role: 'member' })
            .eq('id', id);

        if (!error) {
            setCandidates(candidates.filter(c => c.id !== id));
        }
        setActioningId(null);
    };

    const handleReject = async (id: string) => {
        setActioningId(id);
        // Para simplificar, simplemente eliminamos el perfil si se rechaza
        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', id);

        if (!error) {
            setCandidates(candidates.filter(c => c.id !== id));
        }
        setActioningId(null);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />

            {/* Content */}
            <div className="relative w-full max-w-4xl bg-stone-900 border border-gold-600/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                {/* Header */}
                <div className="p-6 border-b border-gold-600/20 bg-black/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gold-600/20 rounded-lg text-gold-500">
                            <Shield size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-serif font-bold text-white tracking-wide">Cuartel de Reclutamiento</h2>
                            <p className="text-xs text-stone-500 uppercase tracking-widest">Panel de Administración de Miembros</p>
                        </div>
                    </div>
                    <button
                        onClick={fetchCandidates}
                        className="p-2 text-stone-400 hover:text-gold-500 transition-colors"
                        title="Refrescar lista"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-stone-500">
                            <RefreshCw size={40} className="animate-spin mb-4 opacity-20" />
                            <p>Buscando nuevos reclutas...</p>
                        </div>
                    ) : candidates.length === 0 ? (
                        <div className="text-center py-20 border-2 border-dashed border-stone-800 rounded-xl">
                            <Clock size={48} className="mx-auto text-stone-600 mb-4" />
                            <p className="text-stone-400 font-serif text-lg italic">No hay nuevos aspirantes esperando en las puertas...</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {candidates.map((candidate) => (
                                <div
                                    key={candidate.id}
                                    className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl hover:border-gold-600/30 transition-all group"
                                >
                                    <div className="flex items-center gap-4 mb-4 sm:mb-0">
                                        <div className="relative">
                                            <img
                                                src={candidate.avatar_url}
                                                alt={candidate.username}
                                                className="w-14 h-14 rounded-full border-2 border-stone-700 group-hover:border-gold-600 transition-colors"
                                            />
                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gray-500 rounded-full border-2 border-stone-900" title="Candidate status"></div>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white text-lg">{candidate.username}</h4>
                                            <p className="text-xs font-mono text-stone-500">{candidate.id.split('-')[0]}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            disabled={actioningId === candidate.id}
                                            onClick={() => handleReject(candidate.id)}
                                            className="flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors border border-transparent hover:border-red-400/30 text-sm font-bold uppercase tracking-wider disabled:opacity-50"
                                        >
                                            <UserX size={18} />
                                            Rechazar
                                        </button>
                                        <button
                                            disabled={actioningId === candidate.id}
                                            onClick={() => handleApprove(candidate.id)}
                                            className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all shadow-lg shadow-emerald-900/20 text-sm font-bold uppercase tracking-wider disabled:opacity-50"
                                        >
                                            <UserCheck size={18} />
                                            Aprobar Miembro
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-black/40 text-center border-t border-white/5">
                    <button
                        onClick={onClose}
                        className="text-stone-500 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest"
                    >
                        Cerrar Panel
                    </button>
                </div>
            </div>
        </div>
    );
};
