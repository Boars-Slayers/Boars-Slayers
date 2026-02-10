import React, { useState } from 'react';
import { supabase, UserProfile } from '../lib/supabase';
import { X, ExternalLink, Shield, CheckCircle2 } from 'lucide-react';
import { syncPlayerStats } from '../lib/aoe';

interface JoinModalProps {
    user: any | null;
    profile: UserProfile | null;
    onClose: () => void;
    onSuccess: () => void;
    onLogin?: () => void;
}

export const JoinModal: React.FC<JoinModalProps> = ({ user, profile, onClose, onSuccess, onLogin }) => {
    const [steamId, setSteamId] = useState(profile?.steam_id || '');
    const [aoeUrl, setAoeUrl] = useState(profile?.aoe_insights_url || '');
    const [aoeCompanionId, setAoeCompanionId] = useState(profile?.aoe_companion_id || '');
    const [email, setEmail] = useState(profile?.contact_email || user?.email || '');

    const [reason, setReason] = useState(profile?.reason || '');
    const [accepted, setAccepted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleLoginClick = () => {
        // Set flag so we reopen this modal when they come back
        localStorage.setItem('joining_clan', 'true');
        if (onLogin) onLogin();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!accepted || !user) return; // double check user exists

        setLoading(true);
        try {
            // Extract AoE Profile ID from URL
            const profileIdMatch = aoeUrl.match(/\/user\/(\d+)/);
            const extractedProfileId = profileIdMatch ? profileIdMatch[1] : null;

            const { error } = await supabase
                .from('profiles')
                .update({
                    steam_id: steamId,
                    aoe_insights_url: aoeUrl,
                    aoe_profile_id: extractedProfileId,
                    aoe_companion_id: aoeCompanionId,
                    contact_email: email,

                    reason: reason,
                    accepted_rules: true,
                    role: 'candidate'
                })
                .eq('id', user.id);

            if (error) throw error;

            // Sync stats immediately using Companion ID
            if (aoeCompanionId) {
                try {
                    await syncPlayerStats(user.id, steamId, aoeCompanionId);
                } catch (err) {
                    console.error('Failed to sync stats on registration:', err);
                }
            }

            // Send notification email to admin
            try {
                await fetch('/api/send_email.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'NEW_APPLICATION',
                        data: {
                            username: profile?.username || 'Unknown',
                            email: email,
                            reason: reason
                        }
                    })
                });
            } catch (err) {
                console.error('Failed to send notification email', err);
            }

            setSubmitted(true);
            onSuccess();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
                <div className="bg-stone-900 border border-gold-600/30 p-8 rounded-2xl max-w-md w-full text-center space-y-6">
                    <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 size={48} />
                    </div>
                    <h2 className="text-2xl font-serif font-bold text-white">¡Solicitud Enviada!</h2>
                    <p className="text-stone-400">
                        Tu solicitud está siendo procesada y será atendida por algún admin del grupo. ¡Pronto recibirás noticias, guerrero!
                    </p>
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-gold-600 hover:bg-gold-500 text-stone-900 font-bold rounded-lg transition-colors"
                    >
                        Entendido
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
            {/* Backdrop with blur */}
            <div className="fixed inset-0 bg-black/90 backdrop-blur-xl transition-opacity" onClick={onClose} />

            {/* Modal Container */}
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                <div
                    className="relative transform overflow-hidden rounded-2xl bg-stone-900 border border-gold-600/30 text-left shadow-2xl transition-all sm:my-8 w-full max-w-2xl"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-6 border-b border-gold-600/20 flex justify-between items-center bg-black/20">
                        <div className="flex items-center gap-3">
                            <Shield className="text-gold-500" />
                            <h2 className="text-xl font-serif font-bold text-white tracking-wide">Unirse a Boars Slayers</h2>
                        </div>
                        <button onClick={onClose} className="text-stone-500 hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    {!user ? (
                        <div className="p-8 flex flex-col items-center text-center space-y-6">
                            <div className="w-16 h-16 rounded-full bg-[#5865F2]/20 flex items-center justify-center mb-2">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="#5865F2" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09c-.01-.02-.04-.03-.07-.03c-1.5.26-2.93.71-4.27 1.33c-.01 0-.02.01-.03.02c-2.72 4.07-3.47 8.03-3.1 11.95c0 .02.01.04.03.05c1.8 1.32 3.53 2.12 5.2 2.65c.03.01.06 0 .07-.02c.4-.55.76-1.13 1.07-1.74c.02-.04 0-.08-.04-.09c-.57-.22-1.11-.48-1.64-.78c-.04-.02-.04-.08.01-.11c.11-.08.22-.17.33-.25c.02-.02.05-.02.07-.01c3.44 1.57 7.15 1.57 10.55 0c.02-.01.05-.01.07.01c.11.09.22.17.33.26c.04.03.04.09-.01.11c-.52.31-1.07.56-1.64.78c-.04.01-.05.06-.04.09c.32.61.68 1.19 1.07 1.74c.03.01.06.02.09.01c1.72-.53 3.45-1.33 5.25-2.65c.02-.01.03-.03.03-.05c.44-4.53-.73-8.46-3.1-11.95c-.01-.01-.02-.02-.04-.02zM8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.84 2.12-1.89 2.12zm6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.83 2.12-1.89 2.12z" />
                                </svg>
                            </div>

                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">Paso 1: Conexión</h3>
                                <p className="text-gray-400 max-w-md mx-auto">
                                    Para unirte al clan, primero necesitamos vincular tu cuenta de Discord. Esto nos ayuda a gestionar los roles y permisos.
                                </p>
                            </div>

                            <button
                                onClick={handleLoginClick}
                                className="px-8 py-3 bg-[#5865F2] hover:bg-[#4752c4] text-white font-bold rounded-xl transition-all shadow-lg shadow-[#5865F2]/20 flex items-center gap-3 transform hover:-translate-y-1"
                            >
                                Identificarse con Discord
                            </button>

                            <p className="text-xs text-stone-600 mt-4">
                                Serás redirigido para autenticarte y volverás aquí automáticamente.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gold-500 uppercase tracking-widest px-1">Steam ID (Requisito)</label>
                                    <input
                                        required
                                        type="text"
                                        value={steamId}
                                        onChange={(e) => setSteamId(e.target.value)}
                                        placeholder="7656119XXXXXXXX"
                                        className="w-full bg-stone-800/50 border border-stone-700/50 rounded-lg p-3 text-white focus:border-gold-600 focus:bg-stone-800 outline-none transition-all placeholder:text-stone-600"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gold-500 uppercase tracking-widest px-1 flex items-center gap-1">
                                        AoE Companion ID <span className="text-red-500 font-bold">*</span>
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        value={aoeCompanionId}
                                        onChange={(e) => setAoeCompanionId(e.target.value)}
                                        placeholder="ID numérico (ej: 10383990)"
                                        className="w-full bg-stone-800 border border-gold-600/20 rounded-lg p-3 text-white focus:border-gold-600 outline-none transition-all placeholder:text-stone-600 text-sm font-mono"
                                    />
                                    <a href="https://aoe2companion.com/" target="_blank" rel="noreferrer" className="text-[10px] text-gold-600 flex items-center gap-1 hover:underline">
                                        Buscar mi ID en Companion <ExternalLink size={10} />
                                    </a>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gold-500 uppercase tracking-widest px-1">AoE Insights URL</label>
                                    <input
                                        type="url"
                                        value={aoeUrl}
                                        onChange={(e) => setAoeUrl(e.target.value)}
                                        placeholder="https://aoeinsights.com/user/..."
                                        className="w-full bg-stone-800/50 border border-stone-700/50 rounded-lg p-3 text-white focus:border-gold-600 focus:bg-stone-800 outline-none transition-all placeholder:text-stone-600 text-xs"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gold-500 uppercase tracking-widest px-1">Correo Electrónico</label>
                                    <input
                                        required
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="tu@email.com"
                                        className="w-full bg-stone-800/50 border border-stone-700/50 rounded-lg p-3 text-white focus:border-gold-600 focus:bg-stone-800 outline-none transition-all placeholder:text-stone-600"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gold-500 uppercase tracking-widest px-1">¿Por qué juegas al Age of Empires?</label>
                                <textarea
                                    required
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    rows={4}
                                    placeholder="Cuéntanos qué te motiva y qué buscas en el clan..."
                                    className="w-full bg-stone-800/50 border border-stone-700/50 rounded-lg p-3 text-white focus:border-gold-600 focus:bg-stone-800 outline-none transition-all resize-none placeholder:text-stone-600"
                                />
                            </div>

                            <div className="p-4 bg-black/40 border border-stone-700/50 rounded-xl space-y-4">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <Shield size={16} className="text-gold-600" /> Normas del Clan
                                </h3>
                                <div className="text-xs text-stone-400 space-y-2">
                                    <p>1. Respeto absoluto a todos los miembros.</p>
                                    <p>2. Participación activa en el Discord del clan.</p>
                                    <p>3. Nada de toxicidad.</p>
                                </div>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={accepted}
                                        onChange={(e) => setAccepted(e.target.checked)}
                                        className="peer hidden"
                                    />
                                    <div className="w-5 h-5 border-2 border-stone-600 rounded peer-checked:bg-gold-600 peer-checked:border-gold-600 transition-all" />
                                    <span className="text-sm text-stone-300 group-hover:text-white">Acepto las normas.</span>
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !accepted}
                                className="w-full py-4 bg-gradient-to-r from-gold-600 to-gold-700 text-stone-900 font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-gold-900/20 disabled:opacity-50 flex items-center justify-center gap-2 group"
                            >
                                {loading ? "Procesando Alistamiento..." : "Enviar Solicitud"}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
