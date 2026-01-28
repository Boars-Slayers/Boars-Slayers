import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Save, Trophy } from 'lucide-react';

interface MatchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    tournamentId: string;
    participants: any[]; // Tournament participants with profiles
    existingMatch?: any; // If editing
    round?: number;
}

export const MatchModal: React.FC<MatchModalProps> = ({ isOpen, onClose, onSave, tournamentId, participants, existingMatch, round }) => {
    const [player1Id, setPlayer1Id] = useState('');
    const [player2Id, setPlayer2Id] = useState('');
    const [winnerId, setWinnerId] = useState('');
    const [score, setScore] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (existingMatch) {
                setPlayer1Id(existingMatch.player1_id);
                setPlayer2Id(existingMatch.player2_id || '');
                setWinnerId(existingMatch.winner_id || '');
                setScore(existingMatch.result_score || '');
            } else {
                setPlayer1Id('');
                setPlayer2Id('');
                setWinnerId('');
                setScore('');
            }
        }
    }, [isOpen, existingMatch]);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!player1Id) {
            alert('Debes seleccionar al menos el Jugador 1');
            return;
        }

        setLoading(true);
        try {
            const matchData = {
                tournament_id: tournamentId,
                player1_id: player1Id,
                player2_id: player2Id || null,
                winner_id: winnerId || null,
                result_score: score || null,
                // If it's a new match, use the passed round, otherwise keep existing
                round: existingMatch ? existingMatch.round : (round || 1),
                status: winnerId ? 'completed' : 'scheduled'
            };

            if (existingMatch) {
                const { error } = await supabase
                    .from('matches')
                    .update(matchData)
                    .eq('id', existingMatch.id);
                if (error) throw error;
            } else {
                // Get max match number for this round to append
                const { count } = await supabase
                    .from('matches')
                    .select('*', { count: 'exact', head: true })
                    .eq('tournament_id', tournamentId)
                    .eq('round', round || 1);

                const { error } = await supabase
                    .from('matches')
                    .insert({
                        ...matchData,
                        match_number: (count || 0) + 1
                    });
                if (error) throw error;
            }

            onSave();
            onClose();
        } catch (error) {
            console.error('Error saving match:', error);
            alert('Error al guardar el partido');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Trophy className="text-gold-500" size={20} />
                        {existingMatch ? 'Editar Partido' : 'Nuevo Partido'}
                    </h3>
                    <button onClick={onClose} className="text-stone-500 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Players */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Jugador 1</label>
                            <select
                                value={player1Id}
                                onChange={e => setPlayer1Id(e.target.value)}
                                className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2 text-white focus:border-gold-500 outline-none"
                            >
                                <option value="">Seleccionar</option>
                                {participants.map(p => (
                                    <option key={p.user_id} value={p.user_id}>{p.profiles?.username}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Jugador 2</label>
                            <select
                                value={player2Id}
                                onChange={e => setPlayer2Id(e.target.value)}
                                className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2 text-white focus:border-gold-500 outline-none"
                            >
                                <option value="">Seleccionar (o BYE)</option>
                                {participants.map(p => (
                                    <option key={p.user_id} value={p.user_id}>{p.profiles?.username}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Result (Only if editing or setting result) */}
                    <div className="pt-4 border-t border-stone-800">
                        <h4 className="text-sm font-medium text-stone-300 mb-3">Resultado</h4>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Ganador</label>
                                <select
                                    value={winnerId}
                                    onChange={e => setWinnerId(e.target.value)}
                                    className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2 text-white focus:border-gold-500 outline-none"
                                >
                                    <option value="">Pendiente</option>
                                    {player1Id && <option value={player1Id}>{participants.find(p => p.user_id === player1Id)?.profiles?.username}</option>}
                                    {player2Id && <option value={player2Id}>{participants.find(p => p.user_id === player2Id)?.profiles?.username}</option>}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Score (Ej: 2-0)</label>
                                <input
                                    type="text"
                                    value={score}
                                    onChange={e => setScore(e.target.value)}
                                    placeholder="0-0"
                                    className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2 text-white focus:border-gold-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2 bg-gold-600 hover:bg-gold-500 text-stone-950 font-bold rounded-lg transition-colors disabled:opacity-50"
                    >
                        <Save size={18} /> {loading ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>
            </div>
        </div>
    );
};
