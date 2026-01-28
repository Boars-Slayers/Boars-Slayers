import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { MessageSquare, ArrowLeft, Send, Clock, User, Trash2 } from 'lucide-react';
import { useAuth } from '../../AuthContext';

interface Comment {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    user: {
        username: string;
        avatar_url: string;
        role: string;
    };
}

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
}

export const DebateDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user, profile } = useAuth();
    const [debate, setDebate] = useState<Debate | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (id) {
            fetchDebate();
            fetchComments();
            subscribeToComments();
        }
    }, [id]);

    const fetchDebate = async () => {
        const { data } = await supabase
            .from('debates')
            .select('*, user:profiles(username, avatar_url, role)')
            .eq('id', id)
            .single();
        if (data) setDebate(data as any);
        setLoading(false);
    };

    const fetchComments = async () => {
        const { data } = await supabase
            .from('debate_comments')
            .select('*, user:profiles(username, avatar_url, role)')
            .eq('debate_id', id)
            .order('created_at', { ascending: true });
        if (data) setComments(data as any);
    };

    const subscribeToComments = () => {
        const channel = supabase
            .channel(`debate_comments:${id}`)
            .on('postgres_changes' as any, { event: '*', table: 'debate_comments', filter: `debate_id=eq.${id}` }, () => {
                fetchComments();
            })
            .subscribe();
        return () => supabase.removeChannel(channel);
    };

    const handleSendComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newComment.trim()) return;

        setSending(true);
        const { error } = await supabase
            .from('debate_comments')
            .insert({
                debate_id: id,
                user_id: user.id,
                content: newComment.trim()
            });

        if (error) {
            console.error('Error sending comment:', error);
            alert('Error al enviar comentario');
        } else {
            setNewComment('');
        }
        setSending(false);
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!confirm('¿Borrar comentario?')) return;
        await supabase.from('debate_comments').delete().eq('id', commentId);
    };

    if (loading) return <div className="min-h-screen bg-stone-950 flex items-center justify-center text-gold-500">Cargando...</div>;
    if (!debate) return <div className="min-h-screen bg-stone-950 flex items-center justify-center text-white">Debate no encontrado</div>;

    return (
        <div className="min-h-screen bg-stone-950 py-12 px-6">
            <div className="max-w-4xl mx-auto">
                <Link to="/comunidad/debates" className="inline-flex items-center gap-2 text-stone-500 hover:text-gold-500 mb-8 transition-colors">
                    <ArrowLeft size={18} /> Volver a Debates
                </Link>

                {/* Main Post */}
                <article className="bg-stone-900 border border-gold-600/20 rounded-2xl p-8 mb-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold-600 to-transparent opacity-50"></div>

                    <header className="mb-8 border-b border-stone-800 pb-6">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="px-3 py-1 rounded-full bg-stone-950 border border-stone-800 text-stone-400 text-xs font-bold uppercase tracking-widest">
                                {debate.category}
                            </span>
                            <span className="text-stone-600 text-xs flex items-center gap-1">
                                <Clock size={12} />
                                {new Date(debate.created_at).toLocaleDateString()}
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-serif font-black text-white mb-6 leading-tight">
                            {debate.title}
                        </h1>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3">
                                {debate.user?.avatar_url ? (
                                    <img src={debate.user.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-stone-800" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center border-2 border-stone-700"><User size={20} /></div>
                                )}
                                <div>
                                    <p className={`font-bold text-sm ${debate.user?.role === 'admin' ? 'text-gold-500' : 'text-stone-300'}`}>
                                        {debate.user?.username || 'Desconocido'}
                                    </p>
                                    <p className="text-xs text-stone-500 uppercase tracking-wider">{debate.user?.role}</p>
                                </div>
                            </div>
                        </div>
                    </header>

                    <div className="prose prose-invert prose-gold max-w-none">
                        <p className="text-stone-300 text-lg leading-relaxed whitespace-pre-wrap">{debate.content}</p>
                    </div>
                </article>

                {/* Comments Section */}
                <div className="space-y-6">
                    <h3 className="text-xl font-serif font-bold text-white flex items-center gap-2 mb-6">
                        <MessageSquare className="text-stone-500" />
                        Comentarios <span className="text-stone-600 text-sm bg-stone-900 px-2 py-1 rounded-full">{comments.length}</span>
                    </h3>

                    {comments.map(comment => (
                        <div key={comment.id} className={`flex gap-4 p-6 rounded-xl border ${comment.user_id === debate.user_id ? 'bg-stone-900/50 border-gold-900/20' : 'bg-stone-900 border-stone-800'}`}>
                            <div className="shrink-0">
                                {comment.user?.avatar_url ? (
                                    <img src={comment.user.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center"><User size={16} /></div>
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className={`font-bold text-sm ${comment.user?.role === 'admin' ? 'text-gold-500' : 'text-white'}`}>
                                            {comment.user?.username}
                                        </span>
                                        {comment.user_id === debate.user_id && (
                                            <span className="text-[10px] bg-gold-600 text-stone-950 px-1.5 py-0.5 rounded font-black uppercase">OP</span>
                                        )}
                                        <span className="text-xs text-stone-600">
                                            {new Date(comment.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                    {(user?.id === comment.user_id || profile?.role === 'admin') && (
                                        <button onClick={() => handleDeleteComment(comment.id)} className="text-stone-600 hover:text-red-500 transition-colors">
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                                <p className="text-stone-300 whitespace-pre-wrap">{comment.content}</p>
                            </div>
                        </div>
                    ))}

                    {/* Comment Form */}
                    {profile && profile.role !== 'candidate' ? (
                        <form onSubmit={handleSendComment} className="mt-8 bg-stone-900 p-6 rounded-xl border border-stone-800 sticky bottom-6 shadow-2xl">
                            <h4 className="text-sm font-bold text-stone-400 uppercase tracking-widest mb-4">Tu Respuesta</h4>
                            <div className="flex gap-4">
                                <textarea
                                    value={newComment}
                                    onChange={e => setNewComment(e.target.value)}
                                    placeholder="Escribe tu opinión..."
                                    className="flex-1 bg-stone-950 border border-stone-800 rounded-xl p-4 text-white focus:border-gold-600 outline-none h-24 resize-none transition-all"
                                    required
                                />
                                <button
                                    type="submit"
                                    disabled={sending || !newComment.trim()}
                                    className="px-6 bg-gold-600 hover:bg-gold-500 text-stone-950 font-bold rounded-xl flex flex-col items-center justify-center gap-1 disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
                                >
                                    <Send size={20} />
                                    <span className="text-[10px] uppercase">Enviar</span>
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="p-6 bg-stone-900/50 border border-stone-800 rounded-xl text-center text-stone-500 italic">
                            Debes ser miembro del clan para participar en los debates.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
