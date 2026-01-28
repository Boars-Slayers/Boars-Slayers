import React, { useState, useEffect } from 'react';
import { supabase, UserProfile } from '../lib/supabase';
import { X, Camera, Save, Loader2, User, FileText } from 'lucide-react';
import { ImageCropper } from './ImageCropper';

interface ProfileEditorProps {
    profile: UserProfile;
    onClose: () => void;
    onUpdate: () => void;
}

export const ProfileEditor: React.FC<ProfileEditorProps> = ({ profile, onClose, onUpdate }) => {
    const [username, setUsername] = useState(profile.username || '');
    const [bio, setBio] = useState(profile.bio || '');
    const [favoriteCiv, setFavoriteCiv] = useState(profile.favorite_civ || '');
    const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '');
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const [tempImageSrc, setTempImageSrc] = useState<string | null>(null);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.addEventListener('load', () => setTempImageSrc(reader.result?.toString() || null));
            reader.readAsDataURL(file);
            // Reset value so same file can be selected again
            event.target.value = '';
        }
    };

    const handleCropComplete = async (blob: Blob) => {
        try {
            setUploading(true);
            setTempImageSrc(null); // Hide cropper immediately or keep it? Better hide.

            const fileName = `${profile.id}-${Math.random()}.jpg`; // Always JPG from cropper
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, blob, {
                    contentType: 'image/jpeg'
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            setAvatarUrl(publicUrl);
        } catch (error: any) {
            console.error(error);
            alert(error.message || 'Error al subir la imagen');
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const { error } = await supabase
                .from('profiles')
                .update({
                    username,
                    bio,
                    favorite_civ: favoriteCiv,
                    avatar_url: avatarUrl,
                })
                .eq('id', profile.id);

            if (error) throw error;

            onUpdate();
            setIsVisible(false);
            setTimeout(onClose, 300);
        } catch (error: any) {
            alert(error.message);
        } finally {
            setSaving(false);
        }
    };

    const closeWithAnimation = () => {
        setIsVisible(false);
        setTimeout(onClose, 300);
    };

    return (
        <div className={`fixed inset-0 z-[70] flex items-center justify-center p-4 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={closeWithAnimation} />

            {/* Image Cropper Overlay */}
            {tempImageSrc && (
                <ImageCropper
                    imageSrc={tempImageSrc}
                    onCancel={() => setTempImageSrc(null)}
                    onCropComplete={handleCropComplete}
                />
            )}

            <div className={`relative w-full max-w-md bg-stone-900 border border-gold-600/30 rounded-2xl shadow-2xl transform transition-all duration-300 ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-10'}`}>
                {/* ... header ... */}
                <div className="p-6 border-b border-gold-600/20 flex justify-between items-center bg-black/20">
                    <h2 className="text-xl font-serif font-bold text-white tracking-wide">Editar Perfil</h2>
                    <button onClick={closeWithAnimation} className="text-stone-500 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gold-600/50 shadow-lg">
                                <img src={avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                                {uploading && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                        <Loader2 size={24} className="text-gold-500 animate-spin" />
                                    </div>
                                )}
                            </div>
                            <label className="absolute bottom-0 right-0 p-2 bg-gold-600 hover:bg-gold-500 text-stone-900 rounded-full cursor-pointer transition-all shadow-md group-hover:scale-110">
                                <Camera size={16} />
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileSelect} disabled={uploading} />
                            </label>
                        </div>
                        <p className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">Cambiar Estandarte</p>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="flex items-center gap-2 text-xs font-bold text-gold-500 uppercase tracking-widest px-1">
                                <User size={12} /> Nombre de Guerrero
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-stone-800 border border-stone-700 rounded-lg p-3 text-white focus:border-gold-600 outline-none transition-all font-medium"
                                placeholder="Tu nombre..."
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="flex items-center gap-2 text-xs font-bold text-gold-500 uppercase tracking-widest px-1">
                                <FileText size={12} /> Civilización de Honor
                            </label>
                            <input
                                type="text"
                                value={favoriteCiv}
                                onChange={(e) => setFavoriteCiv(e.target.value)}
                                className="w-full bg-stone-800 border border-stone-700 rounded-lg p-3 text-white focus:border-gold-600 outline-none transition-all font-medium text-sm"
                                placeholder="Ej: Mongoles, Bizantinos..."
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="flex items-center gap-2 text-xs font-bold text-gold-500 uppercase tracking-widest px-1">
                                <FileText size={12} /> Crónica (Descripción)
                            </label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                rows={3}
                                className="w-full bg-stone-800 border border-stone-700 rounded-lg p-3 text-white focus:border-gold-600 outline-none transition-all font-medium resize-none text-sm"
                                placeholder="Cuéntanos tu historia en el campo de batalla..."
                            />
                        </div>
                    </div>

                    {/* Save Button */}
                    <button
                        onClick={handleSave}
                        disabled={saving || uploading}
                        className="w-full py-4 bg-gradient-to-r from-gold-600 to-gold-700 hover:from-gold-500 hover:to-gold-600 text-stone-900 font-bold rounded-xl shadow-lg shadow-gold-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                        Guardar Cambios
                    </button>
                </div>
            </div>
        </div>
    );
};
