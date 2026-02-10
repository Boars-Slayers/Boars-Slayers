import React, { useState } from 'react';
import { supabase, UserProfile } from '../lib/supabase';
import { AlertTriangle, Save, Loader2, Link as LinkIcon, ExternalLink, ShieldCheck } from 'lucide-react';

interface ProfileFixModalProps {
    profile: UserProfile;
    onSuccess: () => void;
}

export const ProfileFixModal: React.FC<ProfileFixModalProps> = ({ profile, onSuccess }) => {
    const [aoeUrl, setAoeUrl] = useState('');
    const [aoeCompanionId, setAoeCompanionId] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSave = async () => {
        if (!aoeCompanionId) {
            setError('Por favor, ingresa tu ID numérico de AoE2 Companion.');
            return;
        }

        try {
            setSaving(true);
            setError(null);

            // Extract AoE Profile ID from URL if provided (optional now, but good to have)
            let extractedProfileId = null;
            if (aoeUrl.includes('/user/')) {
                const profileIdMatch = aoeUrl.match(/\/user\/(\d+)/);
                extractedProfileId = profileIdMatch ? profileIdMatch[1] : null;
            }

            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    aoe_insights_url: aoeUrl || null,
                    aoe_profile_id: extractedProfileId,
                    aoe_companion_id: aoeCompanionId,
                    requires_profile_fix: false // Clear the flag
                })
                .eq('id', profile.id);

            if (updateError) throw updateError;

            onSuccess();
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Error al actualizar el perfil');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-950/90 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="relative w-full max-w-lg bg-stone-900 border border-amber-500/30 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.1)] overflow-hidden">
                <div className="bg-amber-500/10 p-8 border-b border-amber-500/20">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="bg-amber-500/20 p-3 rounded-xl border border-amber-500/50">
                            <AlertTriangle className="text-amber-500" size={32} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-serif font-bold text-white tracking-wide uppercase">Llamado a las Armas</h2>
                            <p className="text-amber-200/70 text-sm font-medium">Actualización obligatoria de perfil</p>
                        </div>
                    </div>
                    <p className="text-stone-300 leading-relaxed text-sm italic">
                        "Un guerrero sin registros es una sombra en el campo de batalla. Necesitamos vincular tus estadísticas de AoE2 Companion correctamente."
                    </p>
                </div>

                <div className="p-8 space-y-6">
                    <div className="space-y-4">
                        {/* AoE Companion ID (Mandatory) */}
                        <div className="bg-stone-950/50 border border-gold-600/30 rounded-xl p-4">
                            <label className="flex items-center gap-2 text-[10px] font-black text-gold-500 uppercase tracking-widest mb-3 px-1">
                                <ShieldCheck size={12} /> AoE Companion ID (Numérico)
                            </label>
                            <input
                                type="text"
                                value={aoeCompanionId}
                                onChange={(e) => setAoeCompanionId(e.target.value)}
                                className="w-full bg-stone-900 border border-gold-600/30 rounded-lg p-3 text-white focus:border-gold-500 outline-none transition-all text-xs mb-2 font-mono"
                                placeholder="Ej: 10383990"
                            />
                            <div className="flex items-center justify-between px-1">
                                <p className="text-[10px] text-stone-500 italic">
                                    Encuéntralo en tu URL de aoe2companion.com
                                </p>
                                <a
                                    href="https://aoe2companion.com/"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[10px] text-gold-500 hover:text-gold-400 font-bold flex items-center gap-1 transition-colors"
                                >
                                    Buscar ID <ExternalLink size={10} />
                                </a>
                            </div>
                        </div>

                        {/* AoE Insights URL (Optional) */}
                        <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 opacity-70 focus-within:opacity-100 transition-opacity">
                            <label className="flex items-center gap-2 text-[10px] font-black text-stone-500 uppercase tracking-widest mb-3 px-1">
                                <LinkIcon size={12} /> AoE Insights URL (Opcional)
                            </label>
                            <input
                                type="text"
                                value={aoeUrl}
                                onChange={(e) => setAoeUrl(e.target.value)}
                                className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2 text-white/50 focus:text-white focus:border-stone-600 outline-none transition-all text-xs"
                                placeholder="https://www.aoe2insights.com/user/..."
                            />
                        </div>

                        {error && (
                            <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-xl text-red-200 text-xs font-medium">
                                {error}
                            </div>
                        )}
                    </div>

                    <div className="pt-2">
                        <button
                            onClick={handleSave}
                            disabled={saving || !aoeCompanionId}
                            className="w-full py-4 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-black uppercase tracking-widest rounded-xl shadow-lg shadow-amber-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 group"
                        >
                            {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} className="group-hover:scale-110 transition-transform" />}
                            Vincular Guerrero
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
