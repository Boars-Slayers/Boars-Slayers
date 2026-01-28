import React, { useState } from 'react';
import { LogIn, LogOut, User, Settings } from 'lucide-react';
import { AdminPanel } from './AdminPanel';
import { ProfileEditor } from './ProfileEditor';
import { useAuth } from '../AuthContext';

export const AuthStatus: React.FC = () => {
    const { user, profile, loading, login, logout, refreshProfile } = useAuth();
    const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    if (loading) return <div className="text-gold-500 text-sm">Cargando...</div>;

    if (!user) {
        return (
            <button
                onClick={login}
                className="flex items-center gap-2 px-4 py-2 bg-[#5865F2] hover:bg-[#4752c4] text-white rounded-lg font-bold transition-all shadow-lg hover:shadow-indigo-500/30"
            >
                <LogIn size={18} />
                Entrar con Discord
            </button>
        );
    }

    return (
        <>
            <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                    <p className="text-gray-200 font-bold text-sm tracking-wide">{profile?.username || user.email}</p>
                    <p className="text-xs uppercase tracking-widest text-gold-500 font-bold">
                        {profile?.role === 'admin' ? 'Fundador' : profile?.role === 'member' ? 'Guerrero' : 'Recluta'}
                    </p>
                </div>

                <div className="relative group">
                    <img
                        src={profile?.avatar_url || user.user_metadata?.avatar_url}
                        alt="Avatar"
                        className="w-10 h-10 rounded-full border-2 border-gold-600 cursor-pointer"
                    />
                    {/* Dropdown Menu */}
                    <div className="absolute right-0 mt-2 w-48 bg-stone-900 border border-gold-700/30 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                        <div className="p-2 space-y-1">
                            <button
                                onClick={() => setIsProfileOpen(true)}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:bg-gold-600/20 hover:text-gold-400 rounded transition-colors text-left"
                            >
                                <User size={16} /> Ver Perfil
                            </button>
                            {profile?.role === 'admin' && (
                                <button
                                    onClick={() => setIsAdminPanelOpen(true)}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-emerald-400 hover:bg-emerald-900/20 rounded transition-colors text-left"
                                >
                                    <Settings size={16} /> Admin Panel
                                </button>
                            )}
                            <div className="h-px bg-stone-800 my-1"></div>
                            <button
                                onClick={logout}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-900/20 rounded transition-colors text-left"
                            >
                                <LogOut size={16} /> Cerrar Sesión
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {isAdminPanelOpen && (
                <AdminPanel onClose={() => setIsAdminPanelOpen(false)} />
            )}

            {isProfileOpen && profile && (
                <ProfileEditor
                    profile={profile}
                    onClose={() => setIsProfileOpen(false)}
                    onUpdate={refreshProfile}
                />
            )}
        </>
    );
};
