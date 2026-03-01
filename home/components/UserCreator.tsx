import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, UserPlus, Loader2, Save } from 'lucide-react';

interface UserCreatorProps {
    onClose: () => void;
    onUserCreated: () => void;
}

export const UserCreator: React.FC<UserCreatorProps> = ({ onClose, onUserCreated }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        steam_id: '',
        role: 'member',
        avatar_url: `https://ui-avatars.com/api/?background=1f1f22&color=d97706&size=256&format=png&name=New+User`
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.username) return;

        setLoading(true);
        try {
            // Generate a random ID for the manual user (since they don't have a Supabase Auth ID yet)
            // Note: In a real app, you might want to create a Suapbase Auth user first, 
            // but for "external" members we can just insert into profiles with a generated UUID if the schema allows.
            // If the schema has a FK to auth.users, this might fail unless we use a specific service role or bypass.
            // Assuming for now we can insert with a generated UUID.

            const { error } = await supabase
                .from('profiles')
                .insert([{
                    id: crypto.randomUUID(),
                    username: formData.username,
                    contact_email: formData.email,
                    steam_id: formData.steam_id,
                    role: formData.role,
                    avatar_url: formData.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.username)}&background=1f1f22&color=d97706&size=256&format=png`,
                }]);

            if (error) throw error;

            onUserCreated();
            onClose();
        } catch (error: any) {
            console.error('Error creating user:', error);
            alert(`Error al crear usuario: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-md bg-stone-900 border border-gold-600/30 rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-stone-800 flex justify-between items-center">
                    <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
                        <UserPlus className="text-gold-500" /> Añadir Miembro Manualmente
                    </h2>
                    <button onClick={onClose} className="text-stone-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">Nombre de Usuario *</label>
                        <input
                            type="text"
                            required
                            value={formData.username}
                            onChange={e => setFormData({ ...formData, username: e.target.value })}
                            className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-white outline-none focus:border-gold-500"
                            placeholder="Nombre Guerrero"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">Email de Contacto</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-white outline-none focus:border-gold-500"
                            placeholder="correo@ejemplo.com"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">Steam ID (64-bit)</label>
                        <input
                            type="text"
                            value={formData.steam_id}
                            onChange={e => setFormData({ ...formData, steam_id: e.target.value })}
                            className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-white outline-none focus:border-gold-500"
                            placeholder="76561198..."
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">Rol Inicial</label>
                        <select
                            value={formData.role}
                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                            className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-white outline-none focus:border-gold-500"
                        >
                            <option value="member">Miembro</option>
                            <option value="admin">Administrador</option>
                            <option value="candidate">Postulante</option>
                        </select>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 border border-stone-800 text-stone-500 font-bold rounded-lg hover:bg-stone-800 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !formData.username}
                            className="flex-1 py-2.5 bg-gold-600 hover:bg-gold-700 disabled:opacity-50 text-black font-bold rounded-lg flex items-center justify-center gap-2 transition-all"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                            Guardar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
