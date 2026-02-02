import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Save, Trophy, Upload, File } from 'lucide-react';

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
    const [recordingUrl, setRecordingUrl] = useState('');
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (existingMatch) {
                setPlayer1Id(existingMatch.player1_id);
                setPlayer2Id(existingMatch.player2_id || '');
                setWinnerId(existingMatch.winner_id || '');
                setScore(existingMatch.result_score || '');
                setRecordingUrl(existingMatch.replay_url || '');
            } else {
                setPlayer1Id('');
                setPlayer2Id('');
                setWinnerId('');
                setScore('');
                setRecordingUrl('');
            }
        }
    }, [isOpen, existingMatch]);

    if (!isOpen) return null;

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${tournamentId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('replays')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('replays')
                .getPublicUrl(fileName);

            setRecordingUrl(publicUrl);
        } catch (error) {
            console.error('Error uploading replay:', error);
            alert('Error al subir la partida grabada');
        } finally {
            setUploading(false);
        }
    };

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
                replay_url: recordingUrl || null,
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
                                disabled={!!existingMatch}
                                className={`w-full bg-stone-950 border border-stone-800 rounded-lg p-2 text-white focus:border-gold-500 outline-none ${existingMatch ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <option value="">Seleccionar</option>
                                {participants.map(p => (
                                    <option key={p.user_id} value={p.user_id}>{p.user?.username || 'Usuario Desconocido'}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Jugador 2</label>
                            <select
                                value={player2Id}
                                onChange={e => setPlayer2Id(e.target.value)}
                                disabled={!!existingMatch}
                                className={`w-full bg-stone-950 border border-stone-800 rounded-lg p-2 text-white focus:border-gold-500 outline-none ${existingMatch ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <option value="">Seleccionar (o BYE)</option>
                                {participants.map(p => (
                                    <option key={p.user_id} value={p.user_id}>{p.user?.username || 'Usuario Desconocido'}</option>
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
                                    {player1Id && <option value={player1Id}>{participants.find(p => p.user_id === player1Id)?.user?.username}</option>}
                                    {player2Id && <option value={player2Id}>{participants.find(p => p.user_id === player2Id)?.user?.username}</option>}
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

                        {/* Replay Upload */}
                        <div className="pt-4 border-t border-stone-800 mt-4">
                            <h4 className="text-sm font-medium text-stone-300 mb-3 flex items-center gap-2">
                                <File size={16} className="text-gold-500" />
                                Partida Grabada (Rec)
                            </h4>
                            <div className="flex items-center gap-3">
                                {recordingUrl ? (
                                    <div className="flex-1 bg-stone-950 border border-stone-800 rounded-lg p-2.5 flex items-center justify-between">
                                        <span className="text-xs text-green-500 font-bold truncate">Archivo subido correctamente</span>
                                        <button onClick={() => setRecordingUrl('')} className="text-stone-500 hover:text-red-500">
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex-1 relative">
                                        <input
                                            type="file"
                                            onChange={handleFileUpload}
                                            disabled={uploading}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                        />
                                        <div className="bg-stone-950 border border-stone-800 rounded-lg p-2.5 flex items-center justify-center gap-2 text-stone-400 hover:text-white transition-colors">
                                            {uploading ? (
                                                <span className="text-xs animate-pulse">Subiendo...</span>
                                            ) : (
                                                <>
                                                    <Upload size={16} />
                                                    <span className="text-xs font-medium">Subir archivo (.zip, .aoe2record)</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
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
