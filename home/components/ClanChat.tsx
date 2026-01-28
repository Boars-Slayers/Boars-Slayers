import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { ChatMessage } from '../types';
import { useAuth } from '../AuthContext';
import { MessageSquare, Send, Minimize2, Loader2, User } from 'lucide-react';

export const ClanChat: React.FC = () => {
    const { profile, user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const isMember = profile && profile.role !== 'candidate';

    useEffect(() => {
        if (isOpen && isMember) {
            fetchMessages();
            subscribeToMessages();
        }
    }, [isOpen, isMember]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchMessages = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('clan_messages')
            .select('*, user:profiles(username, avatar_url)')
            .order('created_at', { ascending: false })
            .limit(50);

        if (data) {
            setMessages(data.reverse());
        }
        setLoading(false);
    };

    const subscribeToMessages = () => {
        const channel = supabase
            .channel('public:clan_messages')
            .on('postgres_changes' as any, { event: 'INSERT', table: 'clan_messages' }, async (payload: any) => {
                const { data: userData } = await supabase
                    .from('profiles')
                    .select('username, avatar_url')
                    .eq('id', payload.new.user_id)
                    .single();

                const fullMessage = { ...payload.new, user: userData } as ChatMessage;
                setMessages(prev => [...prev, fullMessage]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || !isMember) return;

        setSending(true);
        const { error } = await supabase
            .from('clan_messages')
            .insert([{
                user_id: user.id,
                content: newMessage.trim(),
                type: 'text'
            }]);

        if (!error) {
            setNewMessage('');
        } else {
            console.error('Error sending message:', error);
        }
        setSending(false);
    };

    if (!isMember) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
            {isOpen ? (
                <div className="w-80 md:w-96 h-[500px] bg-stone-900 border border-gold-600/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                    <div className="p-4 bg-stone-950 border-b border-stone-800 flex justify-between items-center bg-gradient-to-r from-stone-950 to-stone-900">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <h3 className="font-serif font-bold text-white text-sm tracking-widest uppercase">Chat del Clan</h3>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setIsOpen(false)} className="p-1.5 text-stone-500 hover:text-white transition-colors">
                                <Minimize2 size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                        {loading && messages.length === 0 ? (
                            <div className="h-full flex items-center justify-center">
                                <Loader2 size={24} className="text-gold-500 animate-spin opacity-20" />
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-6">
                                <MessageSquare size={32} className="text-stone-800 mb-2" />
                                <p className="text-stone-600 text-xs italic font-serif">El silencio impera en el salón...</p>
                            </div>
                        ) : (
                            messages.map((msg) => (
                                <div key={msg.id} className={`flex gap-3 ${msg.user_id === user?.id ? 'flex-row-reverse' : ''}`}>
                                    <div className="shrink-0 w-8 h-8 rounded-full overflow-hidden border border-stone-800 bg-stone-950">
                                        {msg.user?.avatar_url ? (
                                            <img src={msg.user.avatar_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-stone-700 bg-stone-900"><User size={14} /></div>
                                        )}
                                    </div>
                                    <div className={`max-w-[75%] flex flex-col ${msg.user_id === user?.id ? 'items-end' : ''}`}>
                                        <span className="text-[10px] text-stone-500 mb-1 px-1 font-bold">
                                            {msg.user?.username || 'Guerrero'} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <div className={`p-3 rounded-2xl text-sm ${msg.user_id === user?.id
                                            ? 'bg-gold-600 text-black font-medium rounded-tr-none shadow-lg shadow-gold-600/10'
                                            : 'bg-stone-800 text-stone-200 rounded-tl-none border border-stone-700'
                                            }`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={handleSendMessage} className="p-4 bg-stone-950 border-t border-stone-800">
                        <div className="relative">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={e => setNewMessage(e.target.value)}
                                placeholder="Escribe un mensaje..."
                                className="w-full bg-stone-900 border border-stone-800 rounded-xl py-3 pl-4 pr-12 text-sm text-white outline-none focus:border-gold-600 transition-all placeholder:text-stone-600"
                            />
                            <button
                                type="submit"
                                disabled={sending || !newMessage.trim()}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gold-500 hover:text-gold-400 disabled:opacity-30 transition-colors"
                            >
                                {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <button
                    onClick={() => setIsOpen(true)}
                    className="group relative bg-gold-600 hover:bg-gold-500 text-black p-4 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95"
                >
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-stone-950 rounded-full hidden group-hover:block animate-bounce"></div>
                    <MessageSquare size={24} />
                    <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-stone-900 border border-gold-600/30 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all pointer-events-none shadow-xl">
                        Chat del Clan
                    </span>
                </button>
            )}
        </div>
    );
};
