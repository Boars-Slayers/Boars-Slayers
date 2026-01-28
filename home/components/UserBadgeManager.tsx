import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Badge } from '../types';
import { X, Award, Plus, Check, Loader2 } from 'lucide-react';

interface UserBadgeManagerProps {
    userId: string;
    username: string;
    onClose: () => void;
}

export const UserBadgeManager: React.FC<UserBadgeManagerProps> = ({ userId, username, onClose }) => {
    const [allBadges, setAllBadges] = useState<Badge[]>([]);
    const [userBadgeIds, setUserBadgeIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            // Fetch all available badges
            const { data: badgesData } = await supabase
                .from('badges')
                .select('*')
                .order('created_at', { ascending: false });

            if (badgesData) setAllBadges(badgesData);

            // Fetch current user's badges
            const { data: userBadgesData } = await supabase
                .from('user_badges')
                .select('badge_id')
                .eq('user_id', userId);

            if (userBadgesData) {
                setUserBadgeIds(userBadgesData.map(ub => ub.badge_id));
            }

            setLoading(false);
        };

        fetchData();
    }, [userId]);

    const toggleBadge = async (badgeId: string) => {
        setSaving(badgeId);
        const isAssigned = userBadgeIds.includes(badgeId);

        try {
            if (isAssigned) {
                // Remove badge
                const { error } = await supabase
                    .from('user_badges')
                    .delete()
                    .eq('user_id', userId)
                    .eq('badge_id', badgeId);

                if (error) throw error;
                setUserBadgeIds(prev => prev.filter(id => id !== badgeId));
            } else {
                // Add badge
                const { error } = await supabase
                    .from('user_badges')
                    .insert({ user_id: userId, badge_id: badgeId });

                if (error) throw error;
                setUserBadgeIds(prev => [...prev, badgeId]);
            }
        } catch (error) {
            console.error('Error toggling badge:', error);
            alert('Error al actualizar insignias');
        } finally {
            setSaving(null);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />

            <div className="relative w-full max-w-lg bg-stone-900 border border-gold-600/30 rounded-2xl overflow-hidden shadow-2xl overflow-y-auto max-h-[90vh]">
                <div className="p-6 border-b border-stone-800 flex justify-between items-center bg-stone-950/50">
                    <div className="flex items-center gap-3">
                        <Award className="text-gold-500" />
                        <div>
                            <h3 className="text-xl font-serif font-bold text-white">Insignias de Guerrero</h3>
                            <p className="text-xs text-stone-500 uppercase tracking-widest">{username}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-stone-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="flex flex-col items-center py-20 gap-4">
                            <Loader2 className="animate-spin text-gold-500" size={32} />
                            <p className="text-stone-500 italic">Consultando los registros del clan...</p>
                        </div>
                    ) : allBadges.length === 0 ? (
                        <div className="text-center py-12 px-6">
                            <p className="text-stone-500 italic mb-4">No hay insignias creadas en el sistema.</p>
                            <p className="text-xs text-stone-600">Ve a la pestaña "Insignias" para crear la primera.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
                            {allBadges.map((badge) => {
                                const isAssigned = userBadgeIds.includes(badge.id);
                                return (
                                    <button
                                        key={badge.id}
                                        onClick={() => toggleBadge(badge.id)}
                                        disabled={saving === badge.id}
                                        className={`flex items-center gap-4 p-4 rounded-xl border transition-all text-left group ${isAssigned
                                                ? 'bg-gold-600/10 border-gold-600/50 hover:bg-gold-600/20'
                                                : 'bg-stone-950 border-stone-800 hover:border-stone-700 hover:bg-stone-900'
                                            }`}
                                    >
                                        <div className={`w-12 h-12 rounded-lg overflow-hidden border shrink-0 ${isAssigned ? 'border-gold-500/50' : 'border-stone-800'
                                            }`}>
                                            <img src={badge.image_url} alt="Badge" className="w-full h-full object-cover" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium transition-colors ${isAssigned ? 'text-white' : 'text-stone-400 group-hover:text-stone-200'
                                                }`}>
                                                {badge.description}
                                            </p>
                                        </div>

                                        <div className={`shrink-0 transition-opacity ${saving === badge.id ? 'opacity-100' : ''}`}>
                                            {saving === badge.id ? (
                                                <Loader2 className="animate-spin text-gold-500" size={20} />
                                            ) : isAssigned ? (
                                                <Check className="text-gold-500" size={20} />
                                            ) : (
                                                <Plus className="text-stone-600 group-hover:text-stone-400" size={20} />
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-stone-800 bg-stone-950/30">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-stone-800 hover:bg-stone-700 text-white rounded-xl transition-all font-bold text-sm uppercase tracking-widest"
                    >
                        Cerrar Gestión
                    </button>
                </div>
            </div>
        </div>
    );
};
