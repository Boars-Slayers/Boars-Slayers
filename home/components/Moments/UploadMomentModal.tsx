import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Upload, Users, Loader2 } from 'lucide-react';
import { Member } from '../../types';

interface UploadMomentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUploadComplete: () => void;
    currentUserId: string;
}

export const UploadMomentModal: React.FC<UploadMomentModalProps> = ({ isOpen, onClose, onUploadComplete, currentUserId }) => {
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [description, setDescription] = useState('');
    const [uploading, setUploading] = useState(false);
    const [availableMembers, setAvailableMembers] = useState<Member[]>([]);
    const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
    const [showTagInput, setShowTagInput] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchMembers();
        }
    }, [isOpen]);

    const fetchMembers = async () => {
        const { data } = await supabase
            .from('profiles')
            .select('id, username, avatar_url, role');

        if (data) {
            const members: Member[] = data.map(u => ({
                id: u.id,
                name: u.username,
                role: u.role,
                avatarUrl: u.avatar_url
            }));
            setAvailableMembers(members.filter(m => m.id !== currentUserId));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
        }
    };

    const toggleMemberSelection = (memberId: string) => {
        if (selectedMemberIds.includes(memberId)) {
            setSelectedMemberIds(prev => prev.filter(id => id !== memberId));
        } else {
            setSelectedMemberIds(prev => [...prev, memberId]);
        }
    };

    const handleUpload = async () => {
        if (!file || !currentUserId) return;

        try {
            setUploading(true);

            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${currentUserId}/${fileName}`;

            // 1. Upload file
            const { error: uploadError } = await supabase.storage
                .from('moments')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('moments')
                .getPublicUrl(filePath);

            const mediaType = file.type.startsWith('video') ? 'video' : 'image';

            // 3. Insert Moment Record
            const { data: momentData, error: insertError } = await supabase
                .from('moments')
                .insert({
                    user_id: currentUserId,
                    media_url: publicUrl,
                    media_type: mediaType,
                    description: description
                })
                .select()
                .single();

            if (insertError) throw insertError;

            // 4. Insert Tags
            if (selectedMemberIds.length > 0 && momentData) {
                const tagInserts = selectedMemberIds.map(taggedId => ({
                    moment_id: momentData.id,
                    user_id: taggedId
                }));

                const { error: tagError } = await supabase
                    .from('moment_tags')
                    .insert(tagInserts);

                if (tagError) throw tagError;
            }

            onUploadComplete();
            onClose();
            // Reset state
            setFile(null);
            setPreviewUrl(null);
            setDescription('');
            setSelectedMemberIds([]);

        } catch (error) {
            console.error('Error uploading moment:', error);
            alert('Error uploading moment. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-lg bg-stone-900 border border-gold-600/30 rounded-2xl overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-stone-800 flex justify-between items-center">
                    <h2 className="text-xl font-serif font-bold text-white">Subir Momento</h2>
                    <button onClick={onClose} className="text-stone-400 hover:text-white"><X size={24} /></button>
                </div>

                <div className="p-6 space-y-6">
                    {/* File Upload Area */}
                    <div className="w-full">
                        {!previewUrl ? (
                            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-stone-700 border-dashed rounded-lg cursor-pointer hover:bg-stone-800/50 transition-colors">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-10 h-10 mb-3 text-gold-500" />
                                    <p className="mb-2 text-sm text-stone-300"><span className="font-semibold">Click para subir</span> o arrastra un archivo</p>
                                    <p className="text-xs text-stone-500">Imágenes (PNG, JPG) o Video (MP4)</p>
                                </div>
                                <input type="file" className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
                            </label>
                        ) : (
                            <div className="relative w-full h-48 bg-black rounded-lg overflow-hidden flex items-center justify-center group">
                                {file?.type.startsWith('video') ? (
                                    <video src={previewUrl} className="max-h-full max-w-full" controls />
                                ) : (
                                    <img src={previewUrl} alt="Preview" className="max-h-full max-w-full object-contain" />
                                )}
                                <button
                                    onClick={() => { setFile(null); setPreviewUrl(null); }}
                                    className="absolute top-2 right-2 p-1 bg-red-500/80 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-stone-400 mb-2">Descripción</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-2 bg-stone-800 border border-stone-700 rounded-lg focus:border-gold-500 focus:outline-none text-white text-sm"
                            rows={3}
                            placeholder="Describe este momento épico..."
                        />
                    </div>

                    {/* Tagging */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-medium text-stone-400">Etiquetar Miembros</label>
                            <button
                                onClick={() => setShowTagInput(!showTagInput)}
                                className="text-xs text-gold-500 hover:text-gold-400 flex items-center gap-1"
                            >
                                <Users size={12} />
                                {showTagInput ? 'Ocultar' : 'Seleccionar'}
                            </button>
                        </div>

                        {(showTagInput || selectedMemberIds.length > 0) && (
                            <div className="max-h-32 overflow-y-auto bg-stone-800/50 rounded-lg p-2 border border-stone-700">
                                {availableMembers.map(member => (
                                    <div
                                        key={member.id}
                                        onClick={() => toggleMemberSelection(member.id)}
                                        className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${selectedMemberIds.includes(member.id) ? 'bg-gold-900/30 border border-gold-600/30' : 'hover:bg-stone-800'}`}
                                    >
                                        <div className={`w-4 h-4 rounded-full border ${selectedMemberIds.includes(member.id) ? 'bg-gold-500 border-gold-500' : 'border-stone-500'}`}></div>
                                        <img src={member.avatarUrl} alt={member.name} className="w-6 h-6 rounded-full object-cover" />
                                        <span className={`text-sm ${selectedMemberIds.includes(member.id) ? 'text-gold-400' : 'text-stone-300'}`}>{member.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 border-t border-stone-800 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-stone-400 hover:text-white text-sm font-medium transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        className="px-6 py-2 bg-gold-600 hover:bg-gold-500 text-black font-bold text-sm rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {uploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                        {uploading ? 'Subiendo...' : 'Publicar Momento'}
                    </button>
                </div>
            </div>
        </div>
    );
};
