import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Badge } from '../types';
import { Plus, Trash2, Upload, Loader2, Image as ImageIcon } from 'lucide-react';

export const BadgeManager: React.FC = () => {
    const [badges, setBadges] = useState<Badge[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Form state
    const [description, setDescription] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const fetchBadges = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('badges')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setBadges(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchBadges();
    }, []);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleCreateBadge = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!imageFile || !description) return;

        setUploading(true);

        try {
            // 1. Upload image
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('badges')
                .upload(filePath, imageFile);

            if (uploadError) throw uploadError;

            // 2. Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('badges')
                .getPublicUrl(filePath);

            // 3. Create database record
            const { data, error: dbError } = await supabase
                .from('badges')
                .insert([
                    {
                        image_url: publicUrl,
                        description: description,
                    }
                ])
                .select();

            if (dbError) throw dbError;

            // 4. Update state
            if (data) {
                setBadges([data[0], ...badges]);
                setDescription('');
                setImageFile(null);
                setImagePreview(null);
            }

        } catch (error) {
            console.error('Error creating badge:', error);
            alert('Error al crear la insignia. Asegúrate de haber ejecutado los scripts de base de datos.');
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteBadge = async (id: string, imageUrl: string) => {
        if (!confirm('¿Estás seguro de eliminar esta insignia?')) return;

        try {
            // 1. Delete database record
            const { error: dbError } = await supabase
                .from('badges')
                .delete()
                .eq('id', id);

            if (dbError) throw dbError;

            // 2. Delete image from storage (optional cleanup)
            // Extract filename from URL
            const fileName = imageUrl.split('/').pop();
            if (fileName) {
                await supabase.storage
                    .from('badges')
                    .remove([fileName]);
            }

            setBadges(badges.filter(b => b.id !== id));

        } catch (error) {
            console.error('Error deleting badge:', error);
            alert('Error al eliminar la insignia');
        }
    };

    return (
        <div className="space-y-8">
            <div className="grid md:grid-cols-3 gap-8">
                {/* Create Form */}
                <div className="md:col-span-1">
                    <div className="bg-stone-900 border border-white/5 rounded-xl p-6 sticky top-24">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <Plus className="text-gold-500" size={20} />
                            Nueva Insignia
                        </h3>

                        <form onSubmit={handleCreateBadge} className="space-y-4">
                            {/* Image Upload Area */}
                            <div className="relative group">
                                <label className="block w-full aspect-square rounded-xl bg-stone-950 border-2 border-dashed border-stone-800 hover:border-gold-500/50 transition-colors cursor-pointer flex flex-col items-center justify-center relative overflow-hidden">
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center p-4">
                                            <Upload className="mx-auto text-stone-600 mb-2 group-hover:text-gold-500 transition-colors" size={32} />
                                            <span className="text-sm text-stone-500 group-hover:text-stone-300">Subir imagen</span>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            {/* Description Input */}
                            <div>
                                <label className="block text-xs font-mono text-stone-500 mb-1">DESCRIPCIÓN</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="¿De qué trata esta insignia?"
                                    className="w-full bg-stone-950 border border-stone-800 rounded-lg p-3 text-white placeholder:text-stone-700 focus:border-gold-600 focus:ring-1 focus:ring-gold-600 outline-none h-24 resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={uploading || !imageFile || !description}
                                className="w-full bg-gold-600 hover:bg-gold-500 text-stone-950 font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {uploading ? <Loader2 className="animate-spin" size={20} /> : 'Crear Insignia'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Badges Grid */}
                <div className="md:col-span-2">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <ImageIcon className="text-stone-500" size={20} />
                        Insignias Existentes
                    </h3>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="animate-spin text-gold-500" size={40} />
                        </div>
                    ) : badges.length === 0 ? (
                        <div className="bg-stone-900/50 border border-white/5 rounded-xl p-12 text-center text-stone-500">
                            No hay insignias creadas aún usinge el formulario.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {badges.map((badge) => (
                                <div key={badge.id} className="bg-stone-900 border border-white/5 rounded-xl p-4 flex gap-4 group hover:border-white/10 transition-colors">
                                    <div className="w-20 h-20 shrink-0 bg-stone-950 rounded-lg overflow-hidden border border-stone-800">
                                        <img src={badge.image_url} alt="Badge" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-stone-300 text-sm line-clamp-3 mb-2">{badge.description}</p>
                                        <div className="flex items-center justify-between mt-auto">
                                            <span className="text-[10px] text-stone-600 font-mono">
                                                {new Date(badge.created_at).toLocaleDateString()}
                                            </span>
                                            <button
                                                onClick={() => handleDeleteBadge(badge.id, badge.image_url)}
                                                className="text-stone-600 hover:text-red-500 transition-colors p-1"
                                                title="Eliminar insignia"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
