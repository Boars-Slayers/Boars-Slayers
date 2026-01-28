import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn, LogOut, User, Settings } from 'lucide-react';
import { UserProfile } from '../lib/supabase';

export const AuthStatus: React.FC = () => {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) fetchProfile(session.user.id);
            setLoading(false);
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) fetchProfile(session.user.id);
            else setProfile(null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId: string) => {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        setProfile(data);
    };

    const handleLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'discord',
        });
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    if (loading) return <div className="text-gold-500 text-sm">Cargando...</div>;

    if (!user) {
        return (
            <button
                onClick={handleLogin}
                className="flex items-center gap-2 px-4 py-2 bg-[#5865F2] hover:bg-[#4752c4] text-white rounded-lg font-bold transition-all shadow-lg hover:shadow-indigo-500/30"
            >
                <LogIn size={18} />
                Entrar con Discord
            </button>
        );
    }

    return (
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
                        <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:bg-gold-600/20 hover:text-gold-400 rounded transition-colors text-left">
                            <User size={16} /> Ver Perfil
                        </button>
                        {profile?.role === 'admin' && (
                            <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-emerald-400 hover:bg-emerald-900/20 rounded transition-colors text-left">
                                <Settings size={16} /> Admin Panel
                            </button>
                        )}
                        <div className="h-px bg-stone-800 my-1"></div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-900/20 rounded transition-colors text-left"
                        >
                            <LogOut size={16} /> Cerrar Sesión
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
