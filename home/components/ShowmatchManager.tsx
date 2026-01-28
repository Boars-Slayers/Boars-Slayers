import React, { useState, useEffect } from 'react';
import { supabase, UserProfile } from '../lib/supabase';
import { Showmatch } from '../types';
import { Plus, Swords, Calendar, Trash2, Play, CheckCircle } from 'lucide-react';

export const ShowmatchManager: React.FC = () => {
    const [matches, setMatches] = useState<Showmatch[]>([]);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [isCreating, setIsCreating] = useState(false);

    const [newMatch, setNewMatch] = useState<Partial<Showmatch>>({
        title: '',
        status: 'scheduled',
        scheduled_time: new Date().toISOString().slice(0, 16),
        stream_url: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const [mRes, uRes] = await Promise.all([
            supabase.from('showmatches').select('*, p1:profiles!player1_id(username), p2:profiles!player2_id(username)').order('scheduled_time', { ascending: false }),
            supabase.from('profiles').select('*').neq('role', 'candidate')
        ]);

        if (mRes.data) setMatches(mRes.data);
        if (uRes.data) setUsers(uRes.data);
    };

    const handleCreate = async () => {
        if (!newMatch.title) return;
        const { error } = await supabase.from('showmatches').insert(newMatch);
        if (!error) {
            setIsCreating(false);
            setNewMatch({ title: '', status: 'scheduled', scheduled_time: new Date().toISOString().slice(0, 16), stream_url: '' });
            fetchData();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar este showmatch?')) return;
        const { error } = await supabase.from('showmatches').delete().eq('id', id);
        if (!error) fetchData();
    };

    const handleUpdateStatus = async (id: string, status: string) => {
        const { error } = await supabase.from('showmatches').update({ status }).eq('id', id);
        if (!error) fetchData();
    };

    const handleSetWinner = async (matchId: string, winnerId: string, score: string) => {
        const { error } = await supabase.from('showmatches').update({
            winner_id: winnerId,
            result_score: score,
            status: 'completed'
        }).eq('id', matchId);
        if (!error) fetchData();
    };

    return (
        <div className="bg-stone-900 border border-white/5 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-serif text-white flex items-center gap-2">
                    <Swords className="text-gold-500" /> Gestión de Showmatchs
                </h2>
                <button
                    onClick={() => setIsCreating(true)}
                    className="bg-gold-600 hover:bg-gold-700 text-black font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm"
                >
                    <Plus size={18} /> Nuevo Showmatch
                </button>
            </div>

            {isCreating && (
                <div className="mb-8 p-6 bg-stone-950/50 rounded-xl border border-gold-600/20 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-full">
                            <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">Título del Encuentro</label>
                            <input
                                type="text"
                                value={newMatch.title}
                                onChange={e => setNewMatch({ ...newMatch, title: e.target.value })}
                                className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-white outline-none focus:border-gold-500"
                                placeholder="Ej: El Duelo de los Titanes"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">Jugador 1 (Clan)</label>
                            <select
                                value={newMatch.player1_id || ''}
                                onChange={e => setNewMatch({ ...newMatch, player1_id: e.target.value || undefined })}
                                className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-white outline-none focus:border-gold-500"
                            >
                                <option value="">--- Seleccionar ---</option>
                                {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">o Nombre Externo P1</label>
                            <input
                                type="text"
                                value={newMatch.p1_name || ''}
                                onChange={e => setNewMatch({ ...newMatch, p1_name: e.target.value })}
                                className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-white outline-none focus:border-gold-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">Jugador 2 (Clan)</label>
                            <select
                                value={newMatch.player2_id || ''}
                                onChange={e => setNewMatch({ ...newMatch, player2_id: e.target.value || undefined })}
                                className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-white outline-none focus:border-gold-500"
                            >
                                <option value="">--- Seleccionar ---</option>
                                {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">o Nombre Externo P2</label>
                            <input
                                type="text"
                                value={newMatch.p2_name || ''}
                                onChange={e => setNewMatch({ ...newMatch, p2_name: e.target.value })}
                                className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-white outline-none focus:border-gold-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">Fecha y Hora</label>
                            <input
                                type="datetime-local"
                                value={newMatch.scheduled_time}
                                onChange={e => setNewMatch({ ...newMatch, scheduled_time: e.target.value })}
                                className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-white outline-none focus:border-gold-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">Link Transmisión</label>
                            <input
                                type="url"
                                value={newMatch.stream_url || ''}
                                onChange={e => setNewMatch({ ...newMatch, stream_url: e.target.value })}
                                className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-white outline-none focus:border-gold-500"
                                placeholder="https://twitch.tv/..."
                            />
                        </div>
                    </div>
                    <div className="flex gap-3 justify-end pt-4">
                        <button onClick={() => setIsCreating(false)} className="px-4 py-2 text-stone-500 hover:text-white transition-colors">Cancelar</button>
                        <button onClick={handleCreate} className="px-6 py-2 bg-gold-600 text-black font-bold rounded-lg hover:bg-gold-700 transition-colors">Crear Encuentro</button>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {matches.map(match => (
                    <div key={match.id} className="bg-stone-800/30 border border-stone-800 rounded-xl p-6 hover:bg-stone-800 transition-colors">
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-white font-bold">{match.title}</span>
                                    <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded border
                                        ${match.status === 'live' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                            match.status === 'completed' ? 'bg-stone-950 text-stone-500 border-stone-800' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}
                                    `}>{match.status}</span>
                                </div>
                                <div className="text-xs text-stone-500 flex items-center gap-4">
                                    <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(match.scheduled_time).toLocaleDateString()}</span>
                                    <span className="flex items-center gap-1 font-bold text-stone-300">
                                        {(match as any).p1?.username || match.p1_name || 'TBD'} vs {(match as any).p2?.username || match.p2_name || 'TBD'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {match.status !== 'completed' && (
                                    <>
                                        {match.status === 'scheduled' && (
                                            <button onClick={() => handleUpdateStatus(match.id, 'live')} className="p-2 text-red-500 hover:bg-red-500/10 rounded" title="Poner en Vivo"><Play size={18} fill="currentColor" /></button>
                                        )}
                                        {match.status === 'live' && (
                                            <button onClick={() => handleUpdateStatus(match.id, 'scheduled')} className="p-2 text-stone-500 hover:bg-stone-800 rounded" title="Volver a Programado"><Calendar size={18} /></button>
                                        )}
                                        <button
                                            onClick={() => {
                                                const score = prompt('Resultado final (ej: 3-2)');
                                                const winStr = prompt('¿Quién ganó? (1 o 2)');
                                                if (score && winStr) {
                                                    const winId = winStr === '1' ? match.player1_id : match.player2_id;
                                                    handleSetWinner(match.id, winId || '', score);
                                                }
                                            }}
                                            className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded"
                                            title="Finalizar y Setear Ganador"
                                        ><CheckCircle size={18} /></button>
                                    </>
                                )}
                                <button onClick={() => handleDelete(match.id)} className="p-2 text-stone-600 hover:text-red-500 rounded"><Trash2 size={18} /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
