import React, { useState, useEffect } from 'react';
import { supabase, UserProfile } from '../lib/supabase';
import { UserCheck, UserX, Shield, Clock, RefreshCw, ExternalLink, Mail, Phone } from 'lucide-react';

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
        const candidate = candidates.find(c => c.id === id);
        if (!candidate) return;

        setActioningId(id);
        const { error } = await supabase
            .from('profiles')
            .update({ role: 'member' })
            .eq('id', id);

        if (!error) {
            // Trigger Welcome Email
            try {
                await fetch('/api/send_email.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'MEMBER_APPROVED',
                        data: {
                            username: candidate.username,
                            email: candidate.contact_email
                        }
                    })
                });
            } catch (err) {
                console.error("Failed to send welcome email", err);
            }

            // Prompt Admin to send WhatsApp
            if (candidate.phone_number) {
                const cleanPhone = candidate.phone_number.replace(/\D/g, '');
                const text = `¡Hola ${candidate.username}! Bienvenido a Boars Slayers. Tu solicitud ha sido aprobada. Por favor únete al grupo: https://chat.whatsapp.com/Dz0jyXt0SDX3Me12g3zBkk`;
                window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
            }

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
                                    className="flex flex-col p-4 bg-white/5 border border-white/5 rounded-xl hover:border-gold-600/30 transition-all group"
                                >
                                    <div className="flex flex-col sm:flex-row items-center justify-between mb-4">
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
                                                Aprobar
                                            </button>
                                        </div>
                                    </div>

                                    {/* Recruitment Details */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 p-4 bg-black/40 rounded-lg border border-white/5">
                                        <div className="space-y-2">
                                            <p className="text-[10px] text-gold-500 uppercase tracking-widest font-bold">Contacto</p>
                                            <div className="flex flex-col gap-1 text-xs">
                                                <div className="flex items-center gap-2 text-stone-300">
                                                    <Mail size={12} className="text-stone-500" />
                                                    <span>{candidate.contact_email || 'No email'}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-stone-300">
                                                    <Phone size={12} className="text-stone-500" />
                                                    <span>{candidate.phone_number || 'No phone'}</span>
                                                </div>
                                            </div>

                                            <p className="text-[10px] text-gold-500 uppercase tracking-widest font-bold mt-3">Identidad de Batalla</p>
                                            <div className="flex flex-wrap gap-2 text-xs">
                                                <span className="px-2 py-1 bg-stone-800 rounded border border-stone-700 text-stone-300">
                                                    Steam: {candidate.steam_id || 'N/A'}
                                                </span>
                                                {candidate.aoe_insights_url && (
                                                    <a
                                                        href={candidate.aoe_insights_url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="px-2 py-1 bg-stone-800 rounded border border-stone-700 text-gold-400 hover:border-gold-500 flex items-center gap-1 transition-colors"
                                                    >
                                                        AOE Insights <ExternalLink size={10} />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[10px] text-gold-500 uppercase tracking-widest font-bold">Por qué quiere unirse</p>
                                            <p className="text-xs text-stone-300 italic leading-relaxed">
                                                "{candidate.reason || 'No proporcionado'}"
                                            </p>
                                        </div>
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
