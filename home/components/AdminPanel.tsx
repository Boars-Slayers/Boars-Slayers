import React, { useEffect, useState } from 'react';
import { supabase, UserProfile, ClanRole } from '../lib/supabase';
import { Shield, Check, X, Search, Loader2, UserX, Settings } from 'lucide-react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

import { BadgeManager } from './BadgeManager';
import { RoleManager } from './RoleManager';
import { TournamentManager } from './TournamentManager';

export const AdminPanel: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'users' | 'badges' | 'roles' | 'tournaments'>('users');
    const [filter, setFilter] = useState<'all' | 'candidate' | 'member'>('all');
    const [search, setSearch] = useState('');
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [roles, setRoles] = useState<ClanRole[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);

        // Fetch users
        const { data: usersData, error: usersError } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (!usersError && usersData) {
            setUsers(usersData);
        }

        // Fetch roles (if table exists)
        const { data: rolesData, error: rolesError } = await supabase
            .from('clan_roles')
            .select('*')
            .order('name');

        if (!rolesError && rolesData) {
            setRoles(rolesData);
        } else if (rolesError) {
            console.warn("Could not fetch roles (maybe table doesn't exist yet)", rolesError);
        }

        setLoading(false);
    };

    useEffect(() => {
        // Refresh when switching to users tab or initially
        if (activeTab === 'users' || activeTab === 'roles') {
            fetchData();
        }
    }, [activeTab]);

    const handleRoleUpdate = async (userId: string, newRole: string) => {
        const { error } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId);

        if (!error) {
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        } else {
            console.error('Error updating role:', error);
            alert('Error al actualizar el rol');
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('¿Estás seguro de querer eliminar a este usuario? Esta acción no se puede deshacer.')) return;

        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', userId);

        if (!error) {
            setUsers(users.filter(u => u.id !== userId));
        } else {
            console.error('Error deleting user:', error);
            alert('Error al eliminar usuario');
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesType = filter === 'all' ||
            (filter === 'candidate' && user.role === 'candidate') ||
            (filter === 'member' && user.role !== 'candidate');

        const matchesSearch = user.username?.toLowerCase().includes(search.toLowerCase()) ||
            user.steam_id?.includes(search) ||
            user.discord_id?.includes(search);
        return matchesType && matchesSearch;
    });

    const getRoleColor = (roleName: string) => {
        const role = roles.find(r => r.name === roleName);
        return role ? role.color : '#78716c'; // Default stone-500
    };

    return (
        <div className="min-h-screen bg-stone-950 text-gray-200">
            <Navbar />

            <main className="max-w-7xl mx-auto px-6 pt-32 pb-12">
                <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-10 gap-4">
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-white flex items-center gap-3">
                            <Shield className="text-gold-500" /> Panel de Administración
                        </h1>
                        <p className="text-stone-400 mt-2">Gestiona el clan y sus recursos.</p>
                    </div>

                    {/* Main Tabs */}
                    <div className="flex bg-stone-900/50 p-1 rounded-lg border border-white/5">
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`px-4 py-2 rounded-md font-medium transition-all ${activeTab === 'users' ? 'bg-stone-800 text-white shadow-sm' : 'text-stone-400 hover:text-white'
                                }`}
                        >
                            Usuarios
                        </button>
                        <button
                            onClick={() => setActiveTab('roles')}
                            className={`px-4 py-2 rounded-md font-medium transition-all ${activeTab === 'roles' ? 'bg-stone-800 text-white shadow-sm' : 'text-stone-400 hover:text-white'
                                }`}
                        >
                            Roles
                        </button>
                        <button
                            onClick={() => setActiveTab('badges')}
                            className={`px-4 py-2 rounded-md font-medium transition-all ${activeTab === 'badges' ? 'bg-stone-800 text-white shadow-sm' : 'text-stone-400 hover:text-white'
                                }`}
                        >
                            Insignias
                        </button>
                        <button
                            onClick={() => setActiveTab('tournaments')}
                            className={`px-4 py-2 rounded-md font-medium transition-all ${activeTab === 'tournaments' ? 'bg-stone-800 text-white shadow-sm' : 'text-stone-400 hover:text-white'
                                }`}
                        >
                            Torneos
                        </button>
                    </div>
                </div>

                {activeTab === 'users' ? (
                    <>
                        {/* Users Filter Bar */}
                        <div className="flex flex-col md:flex-row gap-4 mb-8 justify-between">
                            <div className="flex gap-2 bg-stone-900/50 p-1 rounded-lg border border-white/5 w-fit">
                                <FilterButton active={filter === 'all'} onClick={() => setFilter('all')} label="Todos" />
                                <FilterButton active={filter === 'candidate'} onClick={() => setFilter('candidate')} label="Solicitudes" count={users.filter(u => u.role === 'candidate').length} />
                                <FilterButton active={filter === 'member'} onClick={() => setFilter('member')} label="Miembros" />
                            </div>

                            <div className="relative w-full md:w-96">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500" size={20} />
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre, Steam ID..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full bg-stone-900 border border-stone-800 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-gold-600/50 focus:border-gold-600 outline-none transition-all placeholder:text-stone-600"
                                />
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-20">
                                <Loader2 className="animate-spin text-gold-500" size={40} />
                            </div>
                        ) : (
                            <div className="bg-stone-900 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-stone-950/50 text-stone-400 text-xs uppercase tracking-widest border-b border-stone-800">
                                                <th className="p-6 font-medium">Guerrero</th>
                                                <th className="p-6 font-medium">Steam ID</th>
                                                <th className="p-6 font-medium">Rol Actual</th>
                                                <th className="p-6 font-medium">Estado</th>
                                                <th className="p-6 font-medium text-right">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-stone-800">
                                            {filteredUsers.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="p-8 text-center text-stone-500 italic">
                                                        No se encontraron registros.
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredUsers.map((user) => (
                                                    <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                                                        <td className="p-6">
                                                            <div className="flex items-center gap-4">
                                                                <img src={user.avatar_url} alt={user.username} className="w-10 h-10 rounded-full bg-stone-800 object-cover" />
                                                                <div>
                                                                    <div className="font-bold text-white">{user.username}</div>
                                                                    <div className="text-xs text-stone-500">{new Date(user.created_at).toLocaleDateString()}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-6 font-mono text-sm text-stone-400">
                                                            {user.steam_id || <span className="text-stone-600 italic">No vinculada</span>}
                                                        </td>
                                                        <td className="p-6">
                                                            <span
                                                                className="px-2 py-1 rounded text-xs font-bold uppercase tracking-wider border"
                                                                style={{
                                                                    backgroundColor: `${getRoleColor(user.role)}30`, // 30 hex = ~20% opacity
                                                                    color: getRoleColor(user.role),
                                                                    borderColor: `${getRoleColor(user.role)}50`
                                                                }}
                                                            >
                                                                {user.role}
                                                            </span>
                                                        </td>
                                                        <td className="p-6">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-2 h-2 rounded-full ${user.role === 'candidate' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                                                                <span className="text-sm text-stone-300">{user.role === 'candidate' ? 'Pendiente' : 'Activo'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-6 text-right">
                                                            <div className="flex items-center justify-end gap-2 opacity-100 group-hover:opacity-100 transition-opacity">
                                                                {user.role === 'candidate' ? (
                                                                    <>
                                                                        <button
                                                                            onClick={() => handleRoleUpdate(user.id, 'member')}
                                                                            title="Aceptar en el clan"
                                                                            className="p-2 bg-emerald-900/20 text-emerald-500 hover:bg-emerald-900/40 rounded-lg border border-emerald-800/50 transition-colors"
                                                                        >
                                                                            <Check size={18} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteUser(user.id)}
                                                                            title="Rechazar solicitud"
                                                                            className="p-2 bg-red-900/20 text-red-500 hover:bg-red-900/40 rounded-lg border border-red-800/50 transition-colors"
                                                                        >
                                                                            <X size={18} />
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    // Role Selector for Approved Members
                                                                    <div className="relative group/select">
                                                                        <select
                                                                            value={user.role}
                                                                            onChange={(e) => handleRoleUpdate(user.id, e.target.value)}
                                                                            className="appearance-none bg-stone-950 text-stone-300 border border-stone-800 rounded-lg py-1.5 pl-3 pr-8 text-sm focus:border-gold-600 focus:ring-1 focus:ring-gold-600 outline-none cursor-pointer hover:bg-stone-900"
                                                                        >
                                                                            {roles.map(r => (
                                                                                <option key={r.id} value={r.name}>{r.name.charAt(0).toUpperCase() + r.name.slice(1)}</option>
                                                                            ))}
                                                                            {/* Fallback if user has a role not in db yet */}
                                                                            {!roles.find(r => r.name === user.role) && <option value={user.role}>{user.role}</option>}
                                                                        </select>
                                                                        <Settings size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-500 pointer-events-none" />
                                                                    </div>
                                                                )}

                                                                {user.role !== 'candidate' && (
                                                                    <button
                                                                        onClick={() => confirm('¿Revocar membresía y volver a estado de solicitud?') && handleRoleUpdate(user.id, 'candidate')}
                                                                        title="Revocar / Degradar"
                                                                        className="p-2 ml-2 bg-stone-800 text-stone-400 hover:bg-red-900/20 hover:text-red-500 rounded-lg transition-colors"
                                                                    >
                                                                        <UserX size={18} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                ) : activeTab === 'roles' ? (
                    <RoleManager />
                ) : activeTab === 'tournaments' ? (
                    <TournamentManager />
                ) : (
                    <BadgeManager />
                )}
            </main>
            <Footer />
        </div>
    );
};

const FilterButton: React.FC<{ active: boolean; onClick: () => void; label: string; count?: number }> = ({ active, onClick, label, count }) => (
    <button
        onClick={onClick}
        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${active
            ? 'bg-stone-800 text-white shadow-sm'
            : 'text-stone-400 hover:text-white hover:bg-stone-800/50'
            }`}
    >
        {label}
        {count !== undefined && count > 0 && (
            <span className="bg-gold-600 text-stone-950 text-[10px] font-black px-1.5 rounded-full">{count}</span>
        )}
    </button>
);
