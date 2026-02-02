import React from 'react';
import { useAuth } from '../AuthContext';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { Trophy, TrendingUp, Swords, Calendar } from 'lucide-react';

export const MemberPanel: React.FC = () => {
    const { profile } = useAuth();

    return (
        <div className="min-h-screen bg-stone-950 text-gray-200">
            <Navbar />

            <main className="max-w-7xl mx-auto px-6 pt-32 pb-12">
                <div className="mb-10">
                    <h1 className="text-3xl font-serif font-bold text-white flex items-center gap-3">
                        <Swords className="text-gold-500" /> Panel de Miembro
                    </h1>
                    <p className="text-stone-400 mt-2">Bienvenido, <span className="text-gold-400 font-bold">{profile?.username}</span>. Aquí tienes un resumen de tu actividad.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Stats Card */}
                    <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 shadow-lg">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <TrendingUp className="text-green-500" size={20} /> Mis Estadísticas
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b border-stone-800 pb-2">
                                <span className="text-stone-400 text-sm">ELO 1v1</span>
                                <span className="font-mono font-bold text-lg text-white">--</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-stone-800 pb-2">
                                <span className="text-stone-400 text-sm">Win Rate</span>
                                <span className="font-mono font-bold text-lg text-white">--%</span>
                            </div>
                            <div className="pt-2 text-center">
                                <p className="text-xs text-stone-500 italic">Próximamente más detalles...</p>
                            </div>
                        </div>
                    </div>

                    {/* Active Tournaments */}
                    <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 shadow-lg">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Trophy className="text-gold-500" size={20} /> Torneos Activos
                        </h3>
                        <div className="flex flex-col items-center justify-center py-8 text-stone-500 border border-dashed border-stone-800 rounded-lg">
                            <p className="text-sm">No estás inscrito en torneos activos.</p>
                        </div>
                    </div>

                    {/* Next Matches */}
                    <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 shadow-lg">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Calendar className="text-blue-400" size={20} /> Próximos Partidos
                        </h3>
                        <div className="flex flex-col items-center justify-center py-8 text-stone-500 border border-dashed border-stone-800 rounded-lg">
                            <p className="text-sm">No tienes partidos programados.</p>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};
