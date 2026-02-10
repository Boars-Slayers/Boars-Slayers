import React, { useEffect, useState } from 'react';
import { Member } from '../types';
import { X, Trophy, Crown, TrendingUp, Swords, User, Loader2, Settings, Save } from 'lucide-react';
import { fetchPlayerStats, PlayerStats } from '../lib/aoe';
import { supabase } from '../lib/supabase';
import { useAuth } from '../AuthContext';
import { Moment } from '../types';
import { MomentCard } from './Moments/MomentCard';
import { UploadMomentModal } from './Moments/UploadMomentModal';
import { ImageIcon } from 'lucide-react';


interface MemberModalProps {
    member: Member;
    onClose: () => void;
    onViewProfile?: () => void;
}

export const MemberModal: React.FC<MemberModalProps> = ({ member, onClose, onViewProfile }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [stats, setStats] = useState<PlayerStats | null>(null);
    const [loadingStats, setLoadingStats] = useState(false);
    const { user: currentUser } = useAuth();
    const [moments, setMoments] = useState<Moment[]>([]);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [userBadges, setUserBadges] = useState<{ id: string, image_url: string, description: string }[]>([]);


    useEffect(() => {
        setIsVisible(true);
        // Prevent scrolling when modal is open
        document.body.style.overflow = 'hidden';

        const loadStats = async () => {
            if (member.steamId) {
                setLoadingStats(true);
                const data = await fetchPlayerStats(member.steamId, member.aoeCompanionId || '');
                setStats(data);
                setLoadingStats(false);
            }
        };
        loadStats();
        fetchMoments();

        if (member.badges) {
            setUserBadges(member.badges);
        } else {
            fetchUserBadges();
        }


        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [member.steamId]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for animation
    };

    const fetchMoments = async () => {
        try {
            // Fetch moments uploaded by the user
            const { data: uploadedMoments } = await supabase
                .from('moments')
                .select('*')
                .eq('user_id', member.id)
                .order('created_at', { ascending: false });

            // Fetch moments where the user is tagged
            const { data: taggedData } = await supabase
                .from('moment_tags')
                .select('moment_id')
                .eq('user_id', member.id);

            let allMoments = uploadedMoments || [];

            if (taggedData && taggedData.length > 0) {
                const momentIds = taggedData.map(t => t.moment_id);
                const { data: taggedMoments } = await supabase
                    .from('moments')
                    .select('*')
                    .in('id', momentIds)
                    .order('created_at', { ascending: false });

                if (taggedMoments) {
                    // Merge and deduplicate
                    const combined = [...allMoments, ...taggedMoments];
                    const uniqueMap = new Map();
                    combined.forEach(m => uniqueMap.set(m.id, m));
                    allMoments = Array.from(uniqueMap.values()).sort((a, b) =>
                        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    );
                }
            }

            setMoments(allMoments);

        } catch (error) {
            console.error('Error fetching moments:', error);
        }
    };

    const fetchUserBadges = async () => {
        try {
            const { data } = await supabase
                .from('user_badges')
                .select('badge_id, badges(id, image_url, description)')
                .eq('user_id', member.id);

            if (data) {
                const formattedBadges = data.map((item: any) => item.badges);
                setUserBadges(formattedBadges);
            }
        } catch (error) {
            console.error('Error fetching user badges:', error);
        }
    };


    // Web Master / Editing State
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(member.name);
    const [editRole, setEditRole] = useState(member.role);
    const [editAvatar, setEditAvatar] = useState(member.avatarUrl);
    const [saving, setSaving] = useState(false);

    const isWebMaster = currentUser?.app_role === 'web_master' || currentUser?.role === 'web_master'; // Check both for compatibility

    // Available roles
    const availableRoles = ['member', 'candidate', 'admin'];
    if (isWebMaster) {
        availableRoles.push('web_master');
    }

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            const updates: any = {
                username: editName,
                role: editRole,
                avatar_url: editAvatar
            };

            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', member.id);

            if (error) throw error;

            setIsEditing(false);
            // Optional: Refresh parent or local state if needed. 
            // Ideally we should call a prop onUpdate, but for now we rely on re-opening or context updates.
            alert('Perfil actualizado correctamente');
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Error al actualizar el perfil');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal Content */}
            <div
                className={`relative w-full max-w-2xl bg-stone-900 border border-gold-600/30 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(217,119,6,0.15)] transform transition-all duration-300 ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-10'}`}
            >
                {/* Background Decoration */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-gold-900/20 to-transparent pointer-events-none" />

                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 p-2 text-stone-400 hover:text-white hover:bg-white/10 rounded-full transition-colors z-10"
                >
                    <X size={24} />
                </button>

                {/* Web Master Edit Button */}
                {isWebMaster && !isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-gold-900/50 text-gold-500 border border-gold-600/30 rounded-lg hover:bg-gold-900 cursor-pointer z-10 text-xs font-bold uppercase tracking-wider"
                    >
                        <Settings size={14} /> Editar (Web Master)
                    </button>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3">
                    {/* Left Column: Avatar & Identity */}
                    <div className="p-8 flex flex-col items-center bg-black/20 md:border-r border-gold-600/20">

                        {/* Avatar */}
                        <div className="relative w-32 h-32 mb-6 group">
                            <div className="absolute inset-0 rounded-full bg-gold-600 blur opacity-20 group-hover:opacity-40 transition-opacity animate-pulse"></div>
                            <img
                                src={isEditing ? editAvatar : member.avatarUrl}
                                alt={member.name}
                                className="relative w-full h-full rounded-full border-4 border-stone-800 object-cover shadow-xl"
                            />
                            {!isEditing && (
                                <div className="absolute -bottom-2 -right-2 bg-stone-900 rounded-full p-2 border border-gold-600 text-gold-500">
                                    {['Leader', 'Admin', 'web_master'].includes(member.role) ? <Crown size={16} /> : <Swords size={16} />}
                                </div>
                            )}
                        </div>

                        {/* Edit Mode Inputs */}
                        {isEditing ? (
                            <div className="w-full space-y-3 mb-6">
                                <div>
                                    <label className="text-[10px] text-stone-500 uppercase font-bold">Nombre</label>
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={e => setEditName(e.target.value)}
                                        className="w-full bg-stone-950 border border-stone-700 rounded p-1.5 text-white text-sm text-center focus:border-gold-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-stone-500 uppercase font-bold">Avatar URL</label>
                                    <input
                                        type="text"
                                        value={editAvatar}
                                        onChange={e => setEditAvatar(e.target.value)}
                                        className="w-full bg-stone-950 border border-stone-700 rounded p-1.5 text-white text-xs text-center focus:border-gold-500 outline-none" // truncate removed for editing
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-stone-500 uppercase font-bold">Rol</label>
                                    <select
                                        value={editRole}
                                        onChange={e => setEditRole(e.target.value)}
                                        className="w-full bg-stone-950 border border-stone-700 rounded p-1.5 text-white text-sm text-center focus:border-gold-500 outline-none"
                                    >
                                        {availableRoles.map(r => (
                                            <option key={r} value={r}>{r.toUpperCase().replace('_', ' ')}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex gap-2 justify-center mt-2">
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="p-1.5 text-red-400 hover:bg-red-900/20 rounded"
                                    >
                                        <X size={16} />
                                    </button>
                                    <button
                                        onClick={handleSaveProfile}
                                        disabled={saving}
                                        className="p-1.5 text-green-400 hover:bg-green-900/20 rounded font-bold flex items-center gap-1"
                                    >
                                        <Save size={16} /> {saving ? '...' : ''}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <h2 className="text-2xl font-serif font-bold text-white text-center mb-1">{member.name}</h2>

                                <div className="flex flex-wrap justify-center gap-1.5 mb-6">
                                    {member.roles && member.roles.length > 0 ? (
                                        member.roles.map((r, i) => (
                                            <span
                                                key={i}
                                                className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-widest font-bold border"
                                                style={{
                                                    backgroundColor: `${r.color}20`,
                                                    color: r.color,
                                                    borderColor: `${r.color}40`
                                                }}
                                            >
                                                {r.name}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="px-3 py-1 rounded-full bg-gold-900/30 text-gold-400 text-xs uppercase tracking-widest font-bold border border-gold-900/50">
                                            {member.role.replace('_', ' ')}
                                        </span>
                                    )}
                                </div>
                            </>
                        )}

                        {!isEditing && onViewProfile && (
                            <button
                                onClick={onViewProfile}
                                className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-white rounded border border-gold-600/30 transition-all font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                            >
                                <User size={14} className="text-gold-500" />
                                Ver Perfil
                            </button>
                        )}

                        {/* Badges Sub-section */}
                        <div className="mt-8 w-full">
                            <h4 className="text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold mb-3 border-b border-stone-800 pb-2">Condecoraciones</h4>
                            <div className="flex flex-wrap gap-2 justify-center">
                                {userBadges.length > 0 ? (
                                    userBadges.map(badge => (
                                        <div key={badge.id} className="group/badge relative" title={badge.description}>
                                            <img
                                                src={badge.image_url}
                                                alt="Badge"
                                                className="w-10 h-10 rounded shadow-lg border border-gold-600/30 hover:border-gold-500 transition-all transform hover:scale-110"
                                            />
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-[10px] rounded opacity-0 group-hover/badge:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20 border border-gold-600/50">
                                                {badge.description}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-[10px] text-stone-600 italic">Sin insignias aún</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Stats & Details */}
                    <div className="col-span-2 p-8 overflow-y-auto max-h-[60vh]">
                        <h3 className="text-lg font-serif text-gray-300 mb-6 flex items-center gap-2">
                            <TrendingUp size={20} className="text-gold-500" />
                            Estadísticas de Batalla
                        </h3>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-stone-800/50 p-4 rounded-lg border border-stone-700/50">
                                <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">ELO (1v1)</p>
                                <p className="text-2xl font-bold text-white font-mono">
                                    {loadingStats ? <Loader2 className="animate-spin h-6 w-6" /> : (stats?.elo1v1 || '--')}
                                </p>
                            </div>
                            <div className="bg-stone-800/50 p-4 rounded-lg border border-stone-700/50">
                                <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">Win Rate</p>
                                <p className="text-2xl font-bold text-white font-mono">
                                    {loadingStats ? '...' : (stats?.winRate1v1 ? `${stats.winRate1v1}%` : '--')}
                                </p>
                            </div>
                            <div className="bg-stone-800/50 p-4 rounded-lg border border-stone-700/50">
                                <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">Civilización</p>
                                <p className="text-xl font-bold text-gold-400">{member.favoriteCiv || 'Random'}</p>
                            </div>
                            <div className="bg-stone-800/50 p-4 rounded-lg border border-stone-700/50">
                                <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">ELO (TG)</p>
                                <div className="flex items-center gap-2 text-white">
                                    <Trophy size={16} className="text-yellow-600" />
                                    <span className="font-bold">{loadingStats ? '...' : (stats?.eloTG || '--')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Moments Section - Now inside the right column or spanning full if preferred */}
                        <div className="mt-8 pt-6 border-t border-stone-800/50">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-serif text-gray-300 flex items-center gap-2">
                                    <ImageIcon size={20} className="text-gold-500" />
                                    Momentos
                                </h3>
                                {currentUser && currentUser.id === member.id && (
                                    <button
                                        onClick={() => setIsUploadModalOpen(true)}
                                        className="text-xs bg-gold-600/20 hover:bg-gold-600/40 text-gold-400 px-3 py-1 rounded border border-gold-600/30 transition-colors"
                                    >
                                        Subir Momento
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {moments.length > 0 ? (
                                    moments.map(moment => (
                                        <MomentCard key={moment.id} moment={moment} currentUser={currentUser} />
                                    ))
                                ) : (
                                    <div className="col-span-full text-center py-8 bg-black/20 rounded-lg border border-stone-800 border-dashed">
                                        <p className="text-stone-500 text-sm italic">Aún no hay momentos épicos.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {currentUser && (
                    <UploadMomentModal
                        isOpen={isUploadModalOpen}
                        onClose={() => setIsUploadModalOpen(false)}
                        onUploadComplete={fetchMoments}
                        currentUserId={currentUser.id}
                    />
                )}
            </div>
        </div>
    );
};
