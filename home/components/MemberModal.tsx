import React, { useEffect, useState } from 'react';
import { Member } from '../types';
import { X, Trophy, Crown, TrendingUp, Swords, User, Loader2 } from 'lucide-react';
import { fetchPlayerStats, PlayerStats } from '../lib/aoe';

interface MemberModalProps {
    member: Member;
    onClose: () => void;
    onViewProfile?: () => void;
}

export const MemberModal: React.FC<MemberModalProps> = ({ member, onClose, onViewProfile }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [stats, setStats] = useState<PlayerStats | null>(null);
    const [loadingStats, setLoadingStats] = useState(false);

    useEffect(() => {
        setIsVisible(true);
        // Prevent scrolling when modal is open
        document.body.style.overflow = 'hidden';

        const loadStats = async () => {
            if (member.steamId) {
                setLoadingStats(true);
                const data = await fetchPlayerStats(member.steamId);
                setStats(data);
                setLoadingStats(false);
            }
        };
        loadStats();

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [member.steamId]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for animation
    };

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
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

                <div className="grid grid-cols-1 md:grid-cols-3">
                    {/* Left Column: Avatar & Identity */}
                    <div className="p-8 flex flex-col items-center bg-black/20 md:border-r border-gold-600/20">
                        <div className="relative w-32 h-32 mb-6 group">
                            <div className="absolute inset-0 rounded-full bg-gold-600 blur opacity-20 group-hover:opacity-40 transition-opacity animate-pulse"></div>
                            <img
                                src={member.avatarUrl}
                                alt={member.name}
                                className="relative w-full h-full rounded-full border-4 border-stone-800 object-cover shadow-xl"
                            />
                            <div className="absolute -bottom-2 -right-2 bg-stone-900 rounded-full p-2 border border-gold-600 text-gold-500">
                                {['Leader', 'Admin'].includes(member.role) ? <Crown size={16} /> : <Swords size={16} />}
                            </div>
                        </div>

                        <h2 className="text-2xl font-serif font-bold text-white text-center mb-1">{member.name}</h2>
                        <span className="px-3 py-1 rounded-full bg-gold-900/30 text-gold-400 text-xs uppercase tracking-widest font-bold border border-gold-900/50 mb-6">
                            {member.role}
                        </span>

                        {onViewProfile && (
                            <button
                                onClick={onViewProfile}
                                className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-white rounded border border-gold-600/30 transition-all font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                            >
                                <User size={14} className="text-gold-500" />
                                Ver Perfil
                            </button>
                        )}
                    </div>

                    {/* Right Column: Stats & Details */}
                    <div className="col-span-2 p-8">
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

                        {/* Simulated Match History - Removed fake data */}
                        <div>
                            <p className="text-xs text-stone-500 uppercase tracking-wider mb-3">Últimas Partidas</p>
                            <div className="space-y-2">
                                {stats && stats.streak !== 0 ? (
                                    <div className="flex items-center justify-between p-2 rounded bg-white/5 text-sm">
                                        <span className="text-gray-300">Racha Actual</span>
                                        <span className={`font-mono ${stats.streak < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                            {stats.streak > 0 ? `+${stats.streak} Victorias` : `${stats.streak} Derrotas`}
                                        </span>
                                    </div>
                                ) : (
                                    <p className="text-stone-500 italic text-xs">Sin historial reciente.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
