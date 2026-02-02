import React, { useEffect, useState } from 'react';
import { supabase, UserProfile, ClanRole } from '../lib/supabase';
import { Check, X, Search, Loader2, UserX, Settings, Crown } from 'lucide-react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

import { BadgeManager } from './BadgeManager';
import { RoleManager } from './RoleManager';
import { TournamentManager } from './TournamentManager';
import { UserBadgeManager } from './UserBadgeManager';
import { ShowmatchManager } from './ShowmatchManager';
import { UserCreator } from './UserCreator';
import { Award, UserPlus } from 'lucide-react';

export const MasterPanel: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'users' | 'badges' | 'roles' | 'tournaments' | 'showmatches'>('users');
    const [filter, setFilter] = useState<'all' | 'candidate' | 'member'>('all');
    const [search, setSearch] = useState('');
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [roles, setRoles] = useState<ClanRole[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingBadgesUser, setEditingBadgesUser] = useState<{ id: string, username: string } | null>(null);
    const [isCreatingUser, setIsCreatingUser] = useState(false);



    const fetchData = async () => {
        setLoading(true);

        // Fetch users with roles and badges
        const { data: usersData, error: usersError } = await supabase
            .from('profiles')
            .select(`
                *,
                user_roles (
                    clan_roles (id, name, color)
                ),
                user_badges (
                    badges (*)
                )
            `)
            .order('created_at', { ascending: false });

        if (!usersError && usersData) {
            const formattedUsers = usersData.map((u: any) => ({
                ...u,
                roles_list: u.user_roles?.map((ur: any) => ur.clan_roles) || [],
                badges_list: u.user_badges?.map((ub: any) => ub.badges) || []
            }));
            setUsers(formattedUsers);
        }

        // Fetch roles
        const { data: rolesData, error: rolesError } = await supabase
            .from('clan_roles')
            .select('*')
            .order('name');

        if (!rolesError && rolesData) {
            setRoles(rolesData);
        }

        setLoading(false);
    };

    useEffect(() => {
        // Refresh when switching to users tab or initially
        if (activeTab === 'users' || activeTab === 'roles') {
            fetchData();
        }
    }, [activeTab]);

    const toggleUserRole = async (userId: string, roleId: string, isAssigned: boolean) => {
        if (isAssigned) {
            // Remove role
            const { error } = await supabase
                .from('user_roles')
                .delete()
                .eq('user_id', userId)
                .eq('role_id', roleId);

            if (!error) {
                setUsers(users.map(u => {
                    if (u.id === userId) {
                        return {
                            ...u,
                            roles_list: (u as any).roles_list.filter((r: any) => r.id !== roleId)
                        };
                    }
                    return u;
                }));
            }
        } else {
            // Add role
            const { error } = await supabase
                .from('user_roles')
                .insert({ user_id: userId, role_id: roleId });

            if (!error) {
                const roleToAdd = roles.find(r => r.id === roleId);
                setUsers(users.map(u => {
                    if (u.id === userId) {
                        return {
                            ...u,
                            roles_list: [...((u as any).roles_list || []), roleToAdd]
                        };
                    }
                    return u;
                }));
            }
        }
    };

    const handlePrimaryRoleUpdate = async (userId: string, newRole: string) => {
        const { error } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId);

        if (!error) {
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
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

    const [fullEditingUser, setFullEditingUser] = useState<UserProfile | null>(null);

    // ... (existing code)

    const handleUpdateUser = async (userId: string, updates: any) => {
        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId);

        if (error) {
            console.error('Error updating user:', error);
            alert('Error al actualizar usuario');
        } else {
            alert('Usuario actualizado correctamente');
            setFullEditingUser(null);
            fetchData();
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


    return (
        <div className="min-h-screen bg-stone-950 text-gray-200">
            <Navbar />

            <main className="max-w-7xl mx-auto px-6 pt-32 pb-12">
                {/* ... (Header code remains same) ... */}
                <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-10 gap-4">
                    <div>
                        <h1 className="text-4xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-gold-500 flex items-center gap-3">
                            <Crown className="text-gold-500" size={40} /> Panel Maestro
                        </h1>
                        <p className="text-stone-400 mt-2">Control total sobre el clan y sus recursos.</p>
                    </div>
                    {/* ... (Tabs code remains same) ... */}
                    <div className="flex bg-stone-900/50 p-1 rounded-lg border border-white/5 overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`px-4 py-2 rounded-md font-medium transition-all ${activeTab === 'users' ? 'bg-purple-900/50 text-white shadow-sm border border-purple-500/30' : 'text-stone-400 hover:text-white'
                                }`}
                        >
                            Usuarios
                        </button>
                        <button
                            onClick={() => setActiveTab('roles')}
                            className={`px-4 py-2 rounded-md font-medium transition-all ${activeTab === 'roles' ? 'bg-purple-900/50 text-white shadow-sm border border-purple-500/30' : 'text-stone-400 hover:text-white'
                                }`}
                        >
                            Roles
                        </button>
                        <button
                            onClick={() => setActiveTab('badges')}
                            className={`px-4 py-2 rounded-md font-medium transition-all ${activeTab === 'badges' ? 'bg-purple-900/50 text-white shadow-sm border border-purple-500/30' : 'text-stone-400 hover:text-white'
                                }`}
                        >
                            Insignias
                        </button>
                        <button
                            onClick={() => setActiveTab('tournaments')}
                            className={`px-4 py-2 rounded-md font-medium transition-all ${activeTab === 'tournaments' ? 'bg-purple-900/50 text-white shadow-sm border border-purple-500/30' : 'text-stone-400 hover:text-white'
                                }`}
                        >
                            Torneos
                        </button>
                        <button
                            onClick={() => setActiveTab('showmatches')}
                            className={`px-4 py-2 rounded-md font-medium transition-all ${activeTab === 'showmatches' ? 'bg-purple-900/50 text-white shadow-sm border border-purple-500/30' : 'text-stone-400 hover:text-white'
                                }`}
                        >
                            Showmatchs
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

                            <button
                                onClick={() => setIsCreatingUser(true)}
                                className="bg-gold-600 hover:bg-gold-700 text-black font-bold px-4 py-3 rounded-xl flex items-center gap-2 transition-colors text-sm whitespace-nowrap"
                            >
                                <UserPlus size={18} /> Añadir Miembro
                            </button>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-20">
                                <Loader2 className="animate-spin text-gold-500" size={40} />
                            </div>
                        ) : (
                            <div className="bg-stone-900 border border-purple-500/20 rounded-2xl overflow-hidden shadow-xl">
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
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {((user as any).roles_list || []).map((r: any) => (
                                                                    <span
                                                                        key={r.id}
                                                                        className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1"
                                                                        style={{
                                                                            backgroundColor: `${r.color}20`,
                                                                            color: r.color,
                                                                            borderColor: `${r.color}50`
                                                                        }}
                                                                    >
                                                                        {r.name}
                                                                        <button
                                                                            onClick={() => toggleUserRole(user.id, r.id, true)}
                                                                            className="hover:scale-125 transition-transform"
                                                                        >
                                                                            <X size={10} />
                                                                        </button>
                                                                    </span>
                                                                ))}
                                                                <div className="relative group/add">
                                                                    <button className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-dashed border-stone-700 text-stone-600 hover:border-stone-500 hover:text-stone-400">
                                                                        + Rol
                                                                    </button>
                                                                    <div className="absolute top-full left-0 mt-1 hidden group-hover/add:block bg-stone-900 border border-stone-800 rounded shadow-2xl z-50 p-1 min-w-[120px]">
                                                                        {roles.filter(r => !((user as any).roles_list || []).some((ur: any) => ur.id === r.id)).map(r => (
                                                                            <button
                                                                                key={r.id}
                                                                                onClick={() => toggleUserRole(user.id, r.id, false)}
                                                                                className="w-full text-left px-2 py-1.5 rounded hover:bg-white/5 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2"
                                                                                style={{ color: r.color }}
                                                                            >
                                                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color }} />
                                                                                {r.name}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-6">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-2 h-2 rounded-full ${user.role === 'candidate' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                                                                <span className="text-sm text-stone-300">{user.role === 'candidate' ? 'Pendiente' : 'Activo'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-6 text-right">
                                                            <div className="flex items-center justify-end gap-2 opacity-100 group-hover:opacity-100 transition-opacity">

                                                                {/* MASTER EDIT BUTTON */}
                                                                <button
                                                                    onClick={() => setFullEditingUser(user)}
                                                                    title="Editar Perfil Completo"
                                                                    className="p-2 ml-2 bg-purple-600/20 text-purple-400 hover:bg-purple-600/40 rounded-lg border border-purple-500/50 transition-colors"
                                                                >
                                                                    <Settings size={18} />
                                                                </button>


                                                                {user.role === 'candidate' ? (
                                                                    <>
                                                                        <button
                                                                            onClick={() => handlePrimaryRoleUpdate(user.id, 'member')}
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
                                                                    <div className="relative group/select">
                                                                    </div>
                                                                )}

                                                                {user.role !== 'candidate' && (
                                                                    <button
                                                                        onClick={() => confirm('¿Revocar membresía y volver a estado de solicitud?') && handlePrimaryRoleUpdate(user.id, 'candidate')}
                                                                        title="Revocar / Degradar"
                                                                        className="p-2 ml-2 bg-stone-800 text-stone-400 hover:bg-red-900/20 hover:text-red-500 rounded-lg transition-colors"
                                                                    >
                                                                        <UserX size={18} />
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => setEditingBadgesUser({ id: user.id, username: user.username })}
                                                                    title="Gestionar Insignias"
                                                                    className="p-2 ml-2 bg-gold-900/20 text-gold-500 hover:bg-gold-900/40 rounded-lg border border-gold-800/50 transition-colors"
                                                                >
                                                                    <Award size={18} />
                                                                </button>
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
                ) : activeTab === 'showmatches' ? (
                    <ShowmatchManager />
                ) : (
                    <BadgeManager />
                )}

                {/* User Badges Modal */}
                {editingBadgesUser && (
                    <UserBadgeManager
                        userId={editingBadgesUser.id}
                        username={editingBadgesUser.username}
                        onClose={() => setEditingBadgesUser(null)}
                    />
                )}

                {/* User Creator Modal */}
                {isCreatingUser && (
                    <UserCreator
                        onClose={() => setIsCreatingUser(false)}
                        onUserCreated={() => fetchData()}
                    />
                )}

                {/* Full User Editor Modal */}
                {fullEditingUser && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <div className="bg-stone-900 border border-purple-500/30 rounded-xl p-6 w-full max-w-md animate-in fade-in zoom-in-95 shadow-[0_0_50px_rgba(168,85,247,0.15)]">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <Crown className="text-purple-500" size={24} /> Editar Guerrero
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Nombre de Batalla</label>
                                    <input
                                        type="text"
                                        defaultValue={fullEditingUser.username}
                                        id="edit-username"
                                        className="w-full bg-stone-950 border border-stone-800 rounded-lg p-3 text-white focus:border-purple-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Avatar URL</label>
                                    <input
                                        type="text"
                                        defaultValue={fullEditingUser.avatar_url}
                                        id="edit-avatar"
                                        className="w-full bg-stone-950 border border-stone-800 rounded-lg p-3 text-white focus:border-purple-500 outline-none text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Rol Principal</label>
                                    <select
                                        defaultValue={fullEditingUser.role}
                                        id="edit-role"
                                        className="w-full bg-stone-950 border border-stone-800 rounded-lg p-3 text-white focus:border-purple-500 outline-none"
                                    >
                                        <option value="member">Miembro</option>
                                        <option value="admin">Admin</option>
                                        <option value="web_master">Web Master</option>
                                        <option value="candidate">Candidato</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Steam ID</label>
                                    <input
                                        type="text"
                                        defaultValue={fullEditingUser.steam_id || ''}
                                        id="edit-steam"
                                        className="w-full bg-stone-950 border border-stone-800 rounded-lg p-3 text-white focus:border-purple-500 outline-none font-mono"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-8">
                                <button
                                    onClick={() => setFullEditingUser(null)}
                                    className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => {
                                        const username = (document.getElementById('edit-username') as HTMLInputElement).value;
                                        const avatar_url = (document.getElementById('edit-avatar') as HTMLInputElement).value;
                                        const role = (document.getElementById('edit-role') as HTMLSelectElement).value;
                                        const steam_id = (document.getElementById('edit-steam') as HTMLInputElement).value;

                                        handleUpdateUser(fullEditingUser.id, { username, avatar_url, role, steam_id });
                                    }}
                                    className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-colors shadow-lg shadow-purple-900/20"
                                >
                                    Guardar Cambios
                                </button>
                            </div>
                        </div>
                    </div>
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
            ? 'bg-purple-900/50 text-white shadow-sm border border-purple-500/30'
            : 'text-stone-400 hover:text-white hover:bg-stone-800/50'
            }`}
    >
        {label}
        {count !== undefined && count > 0 && (
            <span className="bg-gold-600 text-stone-950 text-[10px] font-black px-1.5 rounded-full">{count}</span>
        )}
    </button>
);
