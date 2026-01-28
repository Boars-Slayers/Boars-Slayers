import React, { useState } from 'react';
import { supabase, UserProfile } from '../lib/supabase';
import { X, ExternalLink, Shield, Send, CheckCircle2 } from 'lucide-react';

interface JoinModalProps {
    user: any;
    profile: UserProfile | null;
    onClose: () => void;
    onSuccess: () => void;
}

export const JoinModal: React.FC<JoinModalProps> = ({ user, profile, onClose, onSuccess }) => {
    const [steamId, setSteamId] = useState(profile?.steam_id || '');
    const [aoeUrl, setAoeUrl] = useState(profile?.aoe_insights_url || '');
    const [reason, setReason] = useState(profile?.reason || '');
    const [accepted, setAccepted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!accepted) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    steam_id: steamId,
                    aoe_insights_url: aoeUrl,
                    reason: reason,
                    accepted_rules: true,
                    role: 'candidate' // Ensure they are back to candidate for review
                })
                .eq('id', user.id);

            if (error) throw error;
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl overflow-y-auto">
            <div className="bg-stone-900 border border-gold-600/30 rounded-2xl max-w-2xl w-full flex flex-col my-8">
                <div className="p-6 border-b border-gold-600/20 flex justify-between items-center bg-black/20">
                    <div className="flex items-center gap-3">
                        <Shield className="text-gold-500" />
                        <h2 className="text-xl font-serif font-bold text-white tracking-wide">Unirse a Boars Slayers</h2>
                    </div>
                    <button onClick={onClose} className="text-stone-500 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gold-500 uppercase tracking-widest px-1">Steam ID (Requisito)</label>
                            <input
                                required
                                type="text"
                                value={steamId}
                                onChange={(e) => setSteamId(e.target.value)}
                                placeholder="7656119XXXXXXXX"
                                className="w-full bg-stone-800 border border-stone-700 rounded-lg p-3 text-white focus:border-gold-600 outline-none transition-all"
                            />
                            <p className="text-[10px] text-stone-500">Para conectar estadísticas de AOE2.net</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gold-500 uppercase tracking-widest px-1">AOE Insights URL (Requisito)</label>
                            <input
                                required
                                type="url"
                                value={aoeUrl}
                                onChange={(e) => setAoeUrl(e.target.value)}
                                placeholder="https://aoeinsights.com/user/..."
                                className="w-full bg-stone-800 border border-stone-700 rounded-lg p-3 text-white focus:border-gold-600 outline-none transition-all"
                            />
                            <a href="https://www.aoeinsights.com/" target="_blank" rel="noreferrer" className="text-[10px] text-gold-600 flex items-center gap-1 hover:underline">
                                Buscar mi perfil <ExternalLink size={10} />
                            </a>
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
                            className="w-full bg-stone-800 border border-stone-700 rounded-lg p-3 text-white focus:border-gold-600 outline-none transition-all resize-none"
                        />
                    </div>

                    <div className="p-4 bg-black/40 border border-stone-700 rounded-xl space-y-4">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <Shield size={16} className="text-gold-600" /> Normas del Clan
                        </h3>
                        <div className="text-xs text-stone-400 space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                            <p>1. Respeto absoluto a todos los miembros.</p>
                            <p>2. Participación activa en el Discord del clan.</p>
                            <p>3. Nada de toxicidad en partidas públicas o del clan.</p>
                            <p>4. No se permite el uso de trampas (hacks/cheats).</p>
                            <p>5. Ayudar a los miembros menos experimentados.</p>
                        </div>
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={accepted}
                                    onChange={(e) => setAccepted(e.target.checked)}
                                    className="peer hidden"
                                />
                                <div className="w-5 h-5 border-2 border-stone-600 rounded peer-checked:bg-gold-600 peer-checked:border-gold-600 transition-all flex items-center justify-center text-stone-900">
                                    {accepted && <Send size={12} />}
                                </div>
                            </div>
                            <span className="text-sm text-stone-300 group-hover:text-white transition-colors">He leído y acepto las normas del clan.</span>
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !accepted}
                        className="w-full py-4 bg-gradient-to-r from-gold-600 to-gold-700 hover:from-gold-500 hover:to-gold-600 text-stone-900 font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-gold-900/20 disabled:opacity-50"
                    >
                        {loading ? "Procesando Alistamiento..." : "Enviar Solicitud de Alistamiento"}
                    </button>
                </form>
            </div>
        </div>
    );
};
