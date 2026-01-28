import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Moment } from '../types';
import { ImageIcon, Loader2, X } from 'lucide-react';
import { MomentCard } from './Moments/MomentCard';
import { useAuth } from '../AuthContext';

export const MomentsPage: React.FC = () => {
    const [moments, setMoments] = useState<Moment[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMoment, setSelectedMoment] = useState<Moment | null>(null);
    const { user } = useAuth();

    useEffect(() => {
        fetchMoments();
    }, []);

    const fetchMoments = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('moments')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setMoments(data);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-stone-950 text-gray-200">
            <main className="max-w-7xl mx-auto px-6 pt-32 pb-12">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-serif font-bold text-white mb-4 flex items-center justify-center gap-3">
                        <ImageIcon className="text-gold-500" /> Galería de Momentos
                    </h1>
                    <div className="h-1 w-24 bg-gold-600 mx-auto rounded-full mb-6"></div>
                    <p className="text-stone-400 max-w-2xl mx-auto italic font-serif">
                        Capturas y videos de nuestras batallas más memorables, traiciones y victorias legendarias.
                    </p>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center py-20">
                        <Loader2 size={48} className="text-gold-500 animate-spin opacity-20" />
                        <p className="text-stone-500 mt-4 font-serif italic uppercase tracking-widest text-xs">Revelando recuerdos...</p>
                    </div>
                ) : moments.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed border-stone-800 rounded-3xl">
                        <p className="text-stone-500 font-serif italic text-lg">Aún no hay momentos inmortales en esta galería...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {moments.map((moment) => (
                            <MomentCard
                                key={moment.id}
                                moment={moment}
                                currentUser={user}
                                onClick={() => setSelectedMoment(moment)}
                            />
                        ))}
                    </div>
                )}
            </main>

            {/* Media Modal */}
            {selectedMoment && (
                <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex flex-col animate-in fade-in duration-200">
                    <button
                        onClick={() => setSelectedMoment(null)}
                        className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-white/20 rounded-full text-white transition-colors"
                    >
                        <X size={32} />
                    </button>

                    <div className="flex-1 flex items-center justify-center p-4 overflow-hidden" onClick={() => setSelectedMoment(null)}>
                        <div className="relative max-w-full max-h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
                            {selectedMoment.media_type === 'video' ? (
                                <video
                                    src={selectedMoment.media_url}
                                    controls
                                    autoPlay
                                    className="max-w-full max-h-[90vh] rounded-lg shadow-2xl border border-white/10"
                                />
                            ) : (
                                <img
                                    src={selectedMoment.media_url}
                                    alt="Full view"
                                    className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl border border-white/10"
                                />
                            )}

                            {selectedMoment.description && (
                                <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
                                    <p className="inline-block bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-serif italic border border-white/10 shadow-lg">
                                        "{selectedMoment.description}"
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
