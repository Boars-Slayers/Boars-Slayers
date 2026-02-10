import React, { useEffect, useState } from 'react';
import { supabase, UserProfile, ClanRole } from '../lib/supabase';
import { Check, X, Search, Loader2, Settings, Crown } from 'lucide-react';
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
        if (activeTab === 'users' || activeTab === 'roles') {
            fetchData();
        }
    }, [activeTab]);

    const toggleUserRole = async (userId: string, roleId: string, isAssigned: boolean) => {
        if (isAssigned) {
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



    const [fullEditingUser, setFullEditingUser] = useState<UserProfile | null>(null);

    const handleUpdateUser = async (userId: string, updates: any) => {
        const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
        if (error) {
            console.error(error);
            alert('Error al actualizar');
        } else {
            alert('Actualizado');
            setFullEditingUser(null);
            fetchData();
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesType = filter === 'all' || (filter === 'candidate' && user.role === 'candidate') || (filter === 'member' && user.role !== 'candidate');
        const matchesSearch = user.username?.toLowerCase().includes(search.toLowerCase()) || user.steam_id?.includes(search) || user.discord_id?.includes(search);
        return matchesType && matchesSearch;
    });

    return (
        <div className="min-h-screen bg-stone-950 text-gray-200">
            <Navbar />
            <main className="max-w-7xl mx-auto px-6 pt-32 pb-12">
                <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-10 gap-4">
                    <div>
                        <h1 className="text-4xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-gold-500 flex items-center gap-3">
                            <Crown className="text-gold-500" size={40} /> Panel Maestro
                        </h1>
                    </div>
                    <div className="flex bg-stone-900/50 p-1 rounded-lg border border-white/5 overflow-x-auto">
                        <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-md font-medium transition-all ${activeTab === 'users' ? 'bg-purple-900/50 text-white border border-purple-500/30' : 'text-stone-400 hover:text-white'}`}>Usuarios</button>
                        <button onClick={() => setActiveTab('roles')} className={`px-4 py-2 rounded-md font-medium transition-all ${activeTab === 'roles' ? 'bg-purple-900/50 text-white border border-purple-500/30' : 'text-stone-400 hover:text-white'}`}>Roles</button>
                        <button onClick={() => setActiveTab('badges')} className={`px-4 py-2 rounded-md font-medium transition-all ${activeTab === 'badges' ? 'bg-purple-900/50 text-white border border-purple-500/30' : 'text-stone-400 hover:text-white'}`}>Insignias</button>
                        <button onClick={() => setActiveTab('tournaments')} className={`px-4 py-2 rounded-md font-medium transition-all ${activeTab === 'tournaments' ? 'bg-purple-900/50 text-white border border-purple-500/30' : 'text-stone-400 hover:text-white'}`}>Torneos</button>
                        <button onClick={() => setActiveTab('showmatches')} className={`px-4 py-2 rounded-md font-medium transition-all ${activeTab === 'showmatches' ? 'bg-purple-900/50 text-white border border-purple-500/30' : 'text-stone-400 hover:text-white'}`}>Showmatchs</button>
                    </div>
                </div>

                {activeTab === 'users' ? (
                    <>
                        <div className="flex flex-col md:flex-row gap-4 mb-8 justify-between">
                            <div className="flex gap-2 bg-stone-900/50 p-1 rounded-lg border border-white/5 w-fit">
                                <FilterButton active={filter === 'all'} onClick={() => setFilter('all')} label="Todos" />
                                <FilterButton active={filter === 'candidate'} onClick={() => setFilter('candidate')} label="Solicitudes" count={users.filter(u => u.role === 'candidate').length} />
                                <FilterButton active={filter === 'member'} onClick={() => setFilter('member')} label="Miembros" />
                            </div>
                            <div className="relative w-full md:w-96">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500" size={20} />
                                <input type="text" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-stone-900 border border-stone-800 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-gold-600/50 outline-none" />
                            </div>
                            <button onClick={() => setIsCreatingUser(true)} className="bg-gold-600 hover:bg-gold-700 text-black font-bold px-4 py-3 rounded-xl flex items-center gap-2 transition-colors text-sm"><UserPlus size={18} /> Añadir Miembro</button>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gold-500" size={40} /></div>
                        ) : (
                            <div className="bg-stone-900 border border-purple-500/20 rounded-2xl overflow-hidden shadow-xl">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-stone-950/50 text-stone-400 text-xs uppercase tracking-widest border-b border-stone-800">
                                                <th className="p-6">Guerrero</th>
                                                <th className="p-6">IDs</th>
                                                <th className="p-6">Roles</th>
                                                <th className="p-6">Estado</th>
                                                <th className="p-6 text-right">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-stone-800">
                                            {filteredUsers.map((user) => (
                                                <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                                                    <td className="p-6">
                                                        <div className="flex items-center gap-4">
                                                            <img src={user.avatar_url} className="w-10 h-10 rounded-full bg-stone-800 object-cover" />
                                                            <div>
                                                                <div className="font-bold text-white">{user.username}</div>
                                                                <div className="text-[10px] text-stone-500">{user.discord_id}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-6 font-mono text-[10px] space-y-1">
                                                        <div className="text-stone-400 flex items-center gap-1"><span className="text-gold-500">Companion:</span> {user.aoe_companion_id || '---'}</div>
                                                        <div className="text-stone-500 flex items-center gap-1"><span>Steam:</span> {user.steam_id || '---'}</div>
                                                    </td>
                                                    <td className="p-6">
                                                        <div className="flex flex-wrap gap-1">
                                                            {((user as any).roles_list || []).map((r: any) => (
                                                                <span key={r.id} className="px-2 py-0.5 rounded text-[10px] font-bold uppercase border flex items-center gap-1" style={{ backgroundColor: `${r.color}20`, color: r.color, borderColor: `${r.color}50` }}>
                                                                    {r.name} <button onClick={() => toggleUserRole(user.id, r.id, true)}><X size={10} /></button>
                                                                </span>
                                                            ))}
                                                            <div className="group/add relative">
                                                                <button className="px-2 py-0.5 rounded text-[10px] font-bold border border-dashed border-stone-700 text-stone-600 hover:text-stone-400">+ Rol</button>
                                                                <div className="absolute top-full left-0 mt-1 hidden group-hover/add:block bg-stone-900 border border-stone-800 rounded z-50 p-1 min-w-[120px]">
                                                                    {roles.filter(r => !((user as any).roles_list || []).some((ur: any) => ur.id === r.id)).map(r => (
                                                                        <button key={r.id} onClick={() => toggleUserRole(user.id, r.id, false)} className="w-full text-left px-2 py-1.5 rounded hover:bg-white/5 text-[10px] font-bold uppercase flex items-center gap-2" style={{ color: r.color }}>{r.name}</button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-6">
                                                        <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${user.role === 'candidate' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                                                            {user.role === 'candidate' ? 'Pendiente' : 'Activo'}
                                                        </span>
                                                    </td>
                                                    <td className="p-6 text-right space-x-2">
                                                        <button onClick={() => setFullEditingUser(user)} className="p-2 bg-purple-600/20 text-purple-400 hover:bg-purple-600/40 rounded-lg border border-purple-500/30 transition-all"><Settings size={18} /></button>
                                                        {user.role === 'candidate' && <button onClick={() => handlePrimaryRoleUpdate(user.id, 'member')} className="p-2 bg-emerald-900/20 text-emerald-500 hover:bg-emerald-900/40 rounded-lg border border-emerald-800/30"><Check size={18} /></button>}
                                                        <button onClick={() => setEditingBadgesUser({ id: user.id, username: user.username })} className="p-2 bg-gold-900/20 text-gold-500 hover:bg-gold-900/40 rounded-lg border border-gold-800/30"><Award size={18} /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                ) : activeTab === 'roles' ? <RoleManager /> : activeTab === 'tournaments' ? <TournamentManager /> : activeTab === 'showmatches' ? <ShowmatchManager /> : <BadgeManager />}

                {fullEditingUser && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <div className="bg-stone-900 border border-purple-500/30 rounded-xl p-6 w-full max-w-md shadow-2xl overflow-y-auto max-h-[90vh]">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Settings className="text-purple-500" /> Editar Guerrero</h3>
                            <div className="space-y-4">
                                <InputField label="Nombre" id="edit-username" val={fullEditingUser.username} />
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField label="Companion ID" id="edit-companion-id" val={fullEditingUser.aoe_companion_id || ''} placeholder="10383990" highlight />
                                    <InputField label="Steam ID" id="edit-steam" val={fullEditingUser.steam_id || ''} />
                                </div>
                                <InputField label="Insights URL" id="edit-aoe-url" val={fullEditingUser.aoe_insights_url || ''} />
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Rol Web</label>
                                    <select id="edit-role" defaultValue={fullEditingUser.role} className="w-full bg-stone-950 border border-stone-800 rounded-lg p-3 text-white">
                                        <option value="member">Miembro</option>
                                        <option value="admin">Admin</option>
                                        <option value="web_master">Web Master</option>
                                        <option value="candidate">Candidato</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-8">
                                <button onClick={() => setFullEditingUser(null)} className="px-4 py-2 text-stone-400">Cancelar</button>
                                <button
                                    onClick={() => {
                                        const username = (document.getElementById('edit-username') as HTMLInputElement).value;
                                        const role = (document.getElementById('edit-role') as HTMLSelectElement).value;
                                        const steam_id = (document.getElementById('edit-steam') as HTMLInputElement).value;
                                        const aoe_companion_id = (document.getElementById('edit-companion-id') as HTMLInputElement).value;
                                        const aoe_insights_url = (document.getElementById('edit-aoe-url') as HTMLInputElement).value;
                                        handleUpdateUser(fullEditingUser.id, { username, role, steam_id, aoe_companion_id: aoe_companion_id || null, aoe_insights_url: aoe_insights_url || null });
                                    }}
                                    className="px-6 py-2 bg-purple-600 rounded-lg font-bold"
                                >Guardar</button>
                            </div>
                        </div>
                    </div>
                )}

                {editingBadgesUser && <UserBadgeManager userId={editingBadgesUser.id} username={editingBadgesUser.username} onClose={() => setEditingBadgesUser(null)} />}
                {isCreatingUser && <UserCreator onClose={() => setIsCreatingUser(false)} onUserCreated={fetchData} />}
            </main>
            <Footer />
        </div>
    );
};

const InputField: React.FC<{ label: string; id: string; val: string; placeholder?: string; highlight?: boolean }> = ({ label, id, val, placeholder, highlight }) => (
    <div>
        <label className={`block text-[10px] font-black uppercase mb-1 ${highlight ? 'text-gold-500' : 'text-stone-500'}`}>{label}</label>
        <input type="text" id={id} defaultValue={val} placeholder={placeholder} className="w-full bg-stone-950 border border-stone-800 rounded-lg p-3 text-white text-xs font-mono outline-none focus:border-purple-500" />
    </div>
);

const FilterButton: React.FC<{ active: boolean; onClick: () => void; label: string; count?: number }> = ({ active, onClick, label, count }) => (
    <button onClick={onClick} className={`px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 ${active ? 'bg-purple-900/50 text-white border border-purple-500/30' : 'text-stone-400 hover:text-white'}`}>
        {label} {count !== undefined && count > 0 && <span className="bg-gold-600 text-stone-950 text-[10px] font-black px-1.5 rounded-full">{count}</span>}
    </button>
);
