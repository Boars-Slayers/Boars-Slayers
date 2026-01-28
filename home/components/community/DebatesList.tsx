import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { MessageSquare, Plus, Search, Filter, Loader2, User, Clock, MessageCircle } from 'lucide-react';
import { useAuth } from '../../AuthContext';

interface Debate {
    id: string;
    title: string;
    content: string;
    category: string;
    created_at: string;
    user_id: string;
    user: {
        username: string;
        avatar_url: string;
        role: string;
    };
    comments: { count: number }[];
}

export const DebatesList: React.FC = () => {
    const { user, profile } = useAuth();
    const [debates, setDebates] = useState<Debate[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // New Debate Form State
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [newCategory, setNewCategory] = useState('general');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchDebates();
    }, []);

    const fetchDebates = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('debates')
            .select(`
                *,
                user:profiles(username, avatar_url, role),
                comments:debate_comments(count)
            `)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setDebates(data as any);
        }
        setLoading(false);
    };

    const handleCreateDebate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newTitle.trim() || !newContent.trim()) return;

        setCreating(true);
        const { error } = await supabase
            .from('debates')
            .insert({
                title: newTitle,
                content: newContent,
                category: newCategory,
                user_id: user.id
            });

        if (error) {
            console.error('Error creating debate:', error);
            alert('Error al crear el debate');
        } else {
            setIsCreateModalOpen(false);
            setNewTitle('');
            setNewContent('');
            fetchDebates();
        }
        setCreating(false);
    };

    const filteredDebates = debates.filter(debate => {
        const matchesSearch = debate.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            debate.content.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'all' || debate.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const categories = ['general', 'estrategia', 'balance', 'off-topic'];

    return (
        <div className="max-w-7xl mx-auto px-6 py-12">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-12 gap-6">
                <div>
                    <h1 className="text-4xl font-serif font-black text-white flex items-center gap-3 mb-2">
                        <MessageSquare className="text-gold-500" size={32} /> Ágora del Clan
                    </h1>
                    <p className="text-stone-400">Debate estrategias, discute el meta y comparte sabiduría.</p>
                </div>

                {profile && profile.role !== 'candidate' && (
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-gold-600 hover:bg-gold-500 text-stone-950 font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-all shadow-lg hover:scale-105 active:scale-95"
                    >
                        <Plus size={20} /> Iniciar Debate
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="md:col-span-2 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar discusiones..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-stone-900 border border-stone-800 rounded-xl py-3 pl-12 pr-4 text-white focus:border-gold-600 outline-none transition-colors placeholder:text-stone-600"
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500" size={20} />
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="w-full bg-stone-900 border border-stone-800 rounded-xl py-3 pl-12 pr-4 text-white focus:border-gold-600 outline-none appearance-none cursor-pointer"
                    >
                        <option value="all">Todas las Categorías</option>
                        {categories.map(c => (
                            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Debate Grid */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-gold-500" size={40} />
                </div>
            ) : filteredDebates.length === 0 ? (
                <div className="text-center py-20 bg-stone-900/50 rounded-2xl border border-white/5 border-dashed">
                    <MessageCircle className="mx-auto text-stone-700 mb-4" size={48} />
                    <p className="text-stone-500 italic">No hay debates activos. ¡Sé el primero en hablar!</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredDebates.map(debate => (
                        <Link
                            key={debate.id}
                            to={`/comunidad/debates/${debate.id}`}
                            className="bg-stone-900 border border-stone-800 hover:border-gold-600/50 p-6 rounded-xl transition-all hover:bg-stone-800/80 group flex flex-col md:flex-row gap-6 items-start md:items-center"
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border border-stone-700 text-stone-400 bg-stone-950">
                                        {debate.category}
                                    </span>
                                    <span className="text-xs text-stone-500 flex items-center gap-1">
                                        <Clock size={12} />
                                        {new Date(debate.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-gold-500 transition-colors">
                                    {debate.title}
                                </h3>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-2">
                                        {debate.user?.avatar_url ? (
                                            <img src={debate.user.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-5 h-5 rounded-full bg-stone-800 flex items-center justify-center"><User size={10} /></div>
                                        )}
                                        <span className="text-sm text-stone-300 font-medium">{debate.user?.username || 'Desconocido'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-center h-full px-6 border-l border-stone-800">
                                <div className="text-center">
                                    <span className="block text-2xl font-black text-stone-300 group-hover:text-gold-500 transition-colors">
                                        {debate.comments[0]?.count || 0}
                                    </span>
                                    <span className="text-[10px] uppercase text-stone-600 font-bold">Respuestas</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
                        <div className="p-6 bg-stone-950 border-b border-stone-800 flex justify-between items-center">
                            <h3 className="font-serif font-bold text-xl text-white">Nuevo Debate</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-stone-500 hover:text-white"><Plus size={24} className="rotate-45" /></button>
                        </div>
                        <form onSubmit={handleCreateDebate} className="p-6 space-y-6">
                            <div>
                                <label className="block text-xs font-bold uppercase text-stone-500 mb-2">Título</label>
                                <input
                                    type="text"
                                    value={newTitle}
                                    onChange={e => setNewTitle(e.target.value)}
                                    placeholder="¿Mamelucos OP?"
                                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-4 text-white focus:border-gold-600 outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-stone-500 mb-2">Categoría</label>
                                <div className="flex flex-wrap gap-2">
                                    {categories.map(c => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setNewCategory(c)}
                                            className={`px-4 py-2 rounded-lg text-sm font-bold uppercase transition-colors border ${newCategory === c
                                                    ? 'bg-gold-600 text-black border-gold-600'
                                                    : 'bg-stone-950 text-stone-400 border-stone-800 hover:border-stone-600'
                                                }`}
                                        >
                                            {c}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-stone-500 mb-2">Contenido</label>
                                <textarea
                                    value={newContent}
                                    onChange={e => setNewContent(e.target.value)}
                                    placeholder="Expresa tu opinión..."
                                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-4 text-white focus:border-gold-600 outline-none h-40 resize-none"
                                    required
                                />
                            </div>

                            <div className="flex justify-end gap-4 pt-4 border-t border-stone-800">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-6 py-3 rounded-xl font-bold text-stone-400 hover:text-white"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="bg-gold-600 hover:bg-gold-500 text-stone-950 font-bold px-8 py-3 rounded-xl disabled:opacity-50"
                                >
                                    {creating ? 'Publicando...' : 'Publicar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
