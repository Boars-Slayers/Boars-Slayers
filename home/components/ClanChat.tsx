import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { ChatMessage } from '../types';
import { useAuth } from '../AuthContext';
import { MessageSquare, Send, Minimize2, Loader2, User, Trophy, Sword, Film, AtSign, Image as ImageIcon, Smile } from 'lucide-react';

interface Suggestion {
    id: string;
    label: string;
    type: 'member' | 'category';
    icon?: React.ReactNode;
}

const CATEGORIES: Suggestion[] = [
    { id: 'torneos', label: 'Torneos', type: 'category', icon: <Trophy size={14} /> },
    { id: 'showmatch', label: 'Showmatch', type: 'category', icon: <Sword size={14} /> },
    { id: 'momentos', label: 'Momentos', type: 'category', icon: <Film size={14} /> },
];

export const ClanChat: React.FC = () => {
    const { profile, user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [members, setMembers] = useState<Suggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestionIndex, setSuggestionIndex] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reactions: Map<messageId, Reaction[]>
    interface ReactionGroup { emoji: string; count: number; userIds: string[]; }
    const [reactions, setReactions] = useState<Record<string, ReactionGroup[]>>({});
    const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);

    const isMember = profile && profile.role !== 'candidate';

    useEffect(() => {
        if (isOpen && isMember) {
            fetchMessages();
            fetchMembers();
            fetchReactions();
            const unsubscribeMessages = subscribeToMessages();
            const unsubscribeReactions = subscribeToReactions();
            return () => {
                unsubscribeMessages();
                unsubscribeReactions();
            };
        }
    }, [isOpen, isMember]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchMembers = async () => {
        const { data } = await supabase
            .from('profiles')
            .select('id, username')
            .neq('role', 'candidate');

        if (data) {
            setMembers(data.map(m => ({
                id: m.id,
                label: m.username,
                type: 'member',
                icon: <AtSign size={14} />
            })));
        }
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

    const fetchReactions = async () => {
        const { data } = await supabase.from('message_reactions').select('*');
        if (data) {
            const grouped: Record<string, ReactionGroup[]> = {};
            data.forEach((r: any) => {
                if (!grouped[r.message_id]) grouped[r.message_id] = [];
                const existing = grouped[r.message_id].find(g => g.emoji === r.emoji);
                if (existing) {
                    existing.count++;
                    existing.userIds.push(r.user_id);
                } else {
                    grouped[r.message_id].push({ emoji: r.emoji, count: 1, userIds: [r.user_id] });
                }
            });
            setReactions(grouped);
        }
    };

    const subscribeToReactions = () => {
        const channel = supabase
            .channel('public:message_reactions')
            .on('postgres_changes' as any, { event: '*', table: 'message_reactions' }, () => {
                fetchReactions(); // Simple re-fetch for now ensures consistency
            })
            .subscribe();
        return () => supabase.removeChannel(channel);
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
                setMessages(prev => {
                    if (prev.some(m => m.id === fullMessage.id)) return prev;
                    return [...prev, fullMessage];
                });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setNewMessage(value);

        const textBeforeCursor = value.substring(0, e.target.selectionStart!);
        const lastWord = textBeforeCursor.split(/\s/).pop() || '';

        if (lastWord.startsWith('@')) {
            const query = lastWord.slice(1).toLowerCase();
            const filtered = members.filter(m => m.label.toLowerCase().includes(query));
            setSuggestions(filtered);
            setShowSuggestions(filtered.length > 0);
            setSuggestionIndex(0);
        } else if (lastWord.startsWith('/')) {
            const query = lastWord.slice(1).toLowerCase();
            const filtered = CATEGORIES.filter(c => c.label.toLowerCase().includes(query));
            setSuggestions(filtered);
            setShowSuggestions(filtered.length > 0);
            setSuggestionIndex(0);
        } else {
            setShowSuggestions(false);
        }
    };

    const applySuggestion = (suggestion: Suggestion) => {
        const cursorPosition = inputRef.current?.selectionStart || 0;
        const textBeforeCursor = newMessage.substring(0, cursorPosition);
        const textAfterCursor = newMessage.substring(cursorPosition);
        const words = textBeforeCursor.split(/\s/);
        words.pop(); // Remove the partial mention/command

        const prefix = suggestion.type === 'member' ? '@' : '/';
        const updatedBefore = [...words, `${prefix}${suggestion.label}`].join(' ') + ' ';

        setNewMessage(updatedBefore + textAfterCursor);
        setShowSuggestions(false);
        inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (showSuggestions) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSuggestionIndex(prev => (prev + 1) % suggestions.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSuggestionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                applySuggestion(suggestions[suggestionIndex]);
            } else if (e.key === 'Escape') {
                setShowSuggestions(false);
            }
        }
    };

    const toggleReaction = async (messageId: string, emoji: string) => {
        if (!user) return;

        // Optimistic update
        const currentReactions = reactions[messageId] || [];
        const existingGroup = currentReactions.find(g => g.emoji === emoji);
        const hasReacted = existingGroup?.userIds.includes(user.id);

        if (hasReacted) {
            const { error } = await supabase
                .from('message_reactions')
                .delete()
                .eq('message_id', messageId)
                .eq('user_id', user.id)
                .eq('emoji', emoji);
        } else {
            const { error } = await supabase
                .from('message_reactions')
                .insert({ message_id: messageId, user_id: user.id, emoji });
        }
        setShowEmojiPicker(null);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setSending(true);
        try {
            const compressedFile = await compressImage(file);
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;

            const { error: uploadError } = await supabase.storage
                .from('chat-images')
                .upload(fileName, compressedFile);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('chat-images')
                .getPublicUrl(fileName);

            await supabase
                .from('clan_messages')
                .insert([{
                    user_id: user.id,
                    content: publicUrl,
                    type: 'image'
                }]);

        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Error al subir imagen');
        } finally {
            setSending(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || !isMember) return;

        const content = newMessage.trim();
        setNewMessage(''); // Clear immediately for UX
        setSending(true);

        const { data, error } = await supabase
            .from('clan_messages')
            .insert([{
                user_id: user.id,
                content,
                type: 'text'
            }])
            .select('*, user:profiles(username, avatar_url)')
            .single();

        if (error) {
            console.error('Error sending message:', error);
            setNewMessage(content); // Restore on error
        } else if (data) {
            // Optimistically add the message if it's not already there from subscription
            setMessages(prev => {
                if (prev.some(m => m.id === data.id)) return prev;
                return [...prev, data];
            });
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
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <span className={`text-[10px] text-stone-500 font-bold ${msg.user_id === user?.id ? 'order-2' : ''}`}>
                                                {msg.user?.username || 'Guerrero'}
                                            </span>
                                            <span className="text-[9px] text-stone-600 font-medium">
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className={`p-3 rounded-2xl text-sm ${msg.user_id === user?.id
                                            ? 'bg-gold-600 text-black font-medium rounded-tr-none shadow-lg shadow-gold-600/10'
                                            : 'bg-stone-800 text-stone-100 rounded-tl-none border border-stone-700'
                                            }`}>
                                            {msg.type === 'image' ? (
                                                <a href={msg.content} target="_blank" rel="noopener noreferrer">
                                                    <img src={msg.content} alt="Compartida" className="max-w-[200px] rounded-lg border border-white/10" />
                                                </a>
                                            ) : (
                                                msg.content.split(/(@\w+|\/\w+)/).map((part, i) => {
                                                    if (part.startsWith('@')) {
                                                        return <span key={i} className="text-blue-400 font-bold hover:underline cursor-pointer">{part}</span>;
                                                    }
                                                    if (part.startsWith('/')) {
                                                        return <span key={i} className="text-gold-400 font-bold italic hover:underline cursor-pointer">{part}</span>;
                                                    }
                                                    return part;
                                                })
                                            )}
                                        </div>

                                        {/* Reactions */}
                                        <div className={`flex flex-wrap gap-1 mt-1 ${msg.user_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                                            {(reactions[msg.id] || []).map((reaction, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => toggleReaction(msg.id, reaction.emoji)}
                                                    className={`px-1.5 py-0.5 rounded-full text-[10px] flex items-center gap-1 border transition-all ${reaction.userIds.includes(user?.id || '')
                                                        ? 'bg-gold-600/20 border-gold-600 text-gold-400'
                                                        : 'bg-stone-800 border-stone-700 text-stone-400 hover:bg-stone-700'
                                                        }`}
                                                >
                                                    <span>{reaction.emoji}</span>
                                                    <span className="font-bold">{reaction.count}</span>
                                                </button>
                                            ))}
                                            <div className="relative">
                                                <button
                                                    onClick={() => setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id)}
                                                    className="p-0.5 text-stone-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Smile size={12} />
                                                </button>
                                                {showEmojiPicker === msg.id && (
                                                    <div className="absolute bottom-full mb-1 left-0 bg-stone-900 border border-stone-700 p-1 rounded-lg flex gap-1 shadow-xl z-50">
                                                        {['👍', '❤️', '😂', '😮', '😢', '🔥', '⚔️'].map(emoji => (
                                                            <button
                                                                key={emoji}
                                                                onClick={() => toggleReaction(msg.id, emoji)}
                                                                className="hover:bg-white/10 p-1 rounded text-lg leading-none"
                                                            >
                                                                {emoji}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="px-4 relative">
                        {showSuggestions && (
                            <div className="absolute bottom-full left-4 right-4 mb-2 bg-stone-800 border border-gold-600/30 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                                {suggestions.map((s, i) => (
                                    <button
                                        key={s.id}
                                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${i === suggestionIndex ? 'bg-gold-600 text-black font-medium' : 'text-stone-300 hover:bg-stone-700'}`}
                                        onClick={() => applySuggestion(s)}
                                    >
                                        <span className={i === suggestionIndex ? 'text-black' : 'text-gold-500'}>
                                            {s.icon}
                                        </span>
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleSendMessage} className="p-4 bg-stone-950 border-t border-stone-800">
                        <div className="relative flex gap-2 items-center">
                            <input
                                type="file"
                                ref={fileInputRef}
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2 text-stone-500 hover:text-white transition-colors"
                            >
                                <ImageIcon size={20} />
                            </button>
                            <input
                                ref={inputRef}
                                type="text"
                                value={newMessage}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                placeholder="Habla o menciona con @..."
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

const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                const MAX_HEIGHT = 800;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error('Canvas to Blob failed'));
                }, 'image/jpeg', 0.7); // 70% quality, JPEG
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};
