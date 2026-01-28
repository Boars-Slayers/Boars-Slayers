import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Moment } from '../types';
import { ImageIcon, Loader2 } from 'lucide-react';
import { MomentCard } from './Moments/MomentCard';
import { useAuth } from '../AuthContext';

export const MomentsPage: React.FC = () => {
    const [moments, setMoments] = useState<Moment[]>([]);
    const [loading, setLoading] = useState(true);
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
                            <MomentCard key={moment.id} moment={moment} currentUser={user} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};
