import React, { useState, useEffect } from 'react';
import { supabase, ClanRole } from '../lib/supabase';
import { Plus, Trash, Shield, RefreshCw } from 'lucide-react';

export const RoleManager: React.FC = () => {
    const [roles, setRoles] = useState<ClanRole[]>([]);
    const [loading, setLoading] = useState(true);
    const [newRoleName, setNewRoleName] = useState('');
    const [newRoleColor, setNewRoleColor] = useState('#f59e0b');

    const fetchRoles = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('clan_roles').select('*').order('created_at');
        if (data) setRoles(data);
        if (error) console.error('Error fetching roles:', error);
        setLoading(false);
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    const handleCreateRole = async () => {
        if (!newRoleName.trim()) return;
        setLoading(true);
        const { error } = await supabase.from('clan_roles').insert([
            { name: newRoleName.toLowerCase(), color: newRoleColor }
        ]);

        if (!error) {
            setNewRoleName('');
            fetchRoles();
        } else {
            console.error(error);
            alert('Error creating role. Make sure the name is unique.');
            setLoading(false);
        }
    };

    const handleDeleteRole = async (id: string, name: string) => {
        if (['admin', 'member', 'candidate'].includes(name)) {
            alert('No puedes eliminar roles del sistema.');
            return;
        }
        if (!confirm(`¿Eliminar rol "${name}"? Los usuarios con este rol podrían quedar sin acceso.`)) return;

        setLoading(true);
        const { error } = await supabase.from('clan_roles').delete().eq('id', id);
        if (!error) {
            fetchRoles();
        } else {
            console.error(error);
            alert('Error al eliminar rol');
            setLoading(false);
        }
    };

    return (
        <div className="bg-stone-900 border border-white/5 rounded-2xl p-6">
            <h2 className="text-xl font-serif text-white mb-6 flex items-center gap-2">
                <Shield className="text-gold-500" /> Gestión de Roles
            </h2>

            <div className="flex flex-wrap gap-4 mb-8 bg-stone-950/50 p-4 rounded-xl border border-stone-800">
                <input
                    type="text"
                    placeholder="Nuevo Rol (ej: Veterano)"
                    value={newRoleName}
                    onChange={e => setNewRoleName(e.target.value)}
                    className="bg-stone-800 text-white px-4 py-2 rounded-lg border border-stone-700 focus:border-gold-500 outline-none flex-1 min-w-[200px]"
                />
                <div className="flex items-center gap-2">
                    <span className="text-stone-400 text-sm">Color:</span>
                    <input
                        type="color"
                        value={newRoleColor}
                        onChange={e => setNewRoleColor(e.target.value)}
                        className="h-10 w-14 bg-transparent cursor-pointer rounded-lg border border-stone-700 p-1"
                    />
                </div>
                <button
                    onClick={handleCreateRole}
                    disabled={loading}
                    className="bg-gold-600 hover:bg-gold-700 disabled:opacity-50 text-black font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                    {loading ? <RefreshCw className="animate-spin" size={18} /> : <Plus size={18} />}
                    Crear
                </button>
            </div>

            <div className="space-y-2">
                {roles.length === 0 && !loading && (
                    <p className="text-stone-500 italic text-center py-4">No hay roles definidos (Ejecuta el script SQL).</p>
                )}

                {roles.map(role => (
                    <div key={role.id} className="flex items-center justify-between p-4 bg-stone-800/50 rounded-lg border border-stone-800 hover:bg-stone-800 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full shadow-lg border border-white/10" style={{ backgroundColor: role.color }} />
                            <span className="font-mono text-lg text-white capitalize">{role.name}</span>
                        </div>
                        {['admin', 'member', 'candidate'].includes(role.name) ? (
                            <span className="text-[10px] text-stone-500 uppercase tracking-widest px-2 py-1 bg-stone-950 rounded border border-stone-800 font-bold">Sistema</span>
                        ) : (
                            <button
                                onClick={() => handleDeleteRole(role.id, role.name)}
                                className="text-stone-500 hover:text-red-500 hover:bg-red-900/10 p-2 rounded transition-colors"
                                title="Eliminar Rol"
                            >
                                <Trash size={18} />
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
