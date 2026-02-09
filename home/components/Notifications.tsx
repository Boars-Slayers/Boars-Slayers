import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../AuthContext';
import { Bell, Check } from 'lucide-react';

interface Notification {
    id: string;
    user_id: string;
    sender_id: string;
    message_id: string;
    type: 'mention';
    is_read: boolean;
    created_at: string;
    sender?: {
        username: string;
        avatar_url: string | null;
    };
}

export const Notifications: React.FC = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!user) return;

        fetchNotifications();
        const unsubscribe = subscribeToNotifications();

        // Close dropdown when clicking outside
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            unsubscribe();
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [user]);

    const fetchNotifications = async () => {
        if (!user) return;

        const { data } = await supabase
            .from('notifications')
            .select(`
                *,
                sender:profiles!notifications_sender_id_fkey(username, avatar_url)
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20);

        if (data) {
            setNotifications(data);
            setUnreadCount(data.filter((n: Notification) => !n.is_read).length);
        }
    };

    const subscribeToNotifications = () => {
        if (!user) return () => {};

        const channel = supabase
            .channel(`public:notifications:user_id=eq.${user.id}`)
            .on('postgres_changes' as any, { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'notifications', 
                filter: `user_id=eq.${user.id}` 
            }, () => {
                fetchNotifications();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    };

    const markAsRead = async (notificationId: string) => {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId);

        if (!error) {
            setNotifications(prev => 
                prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
    };

    const markAllAsRead = async () => {
        if (!user) return;
        
        const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
        if (unreadIds.length === 0) return;

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .in('id', unreadIds);

        if (!error) {
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        }
    };

    if (!user) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setShowDropdown(!showDropdown)}
                className="relative p-2 text-stone-400 hover:text-white transition-colors"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold border border-stone-900">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {showDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-stone-900 border border-stone-700 rounded-xl shadow-2xl overflow-hidden z-[110] animate-in fade-in slide-in-from-top-2">
                    <div className="p-3 border-b border-stone-800 flex justify-between items-center bg-stone-950">
                        <h3 className="text-xs font-bold text-stone-300 uppercase tracking-wider">Notificaciones</h3>
                        {unreadCount > 0 && (
                            <button 
                                onClick={markAllAsRead}
                                className="text-[10px] text-gold-500 hover:text-gold-400 flex items-center gap-1"
                            >
                                <Check size={12} /> Marcar leídas
                            </button>
                        )}
                    </div>
                    
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-6 text-center text-stone-600 text-xs italic">
                                No tienes notificaciones nuevas
                            </div>
                        ) : (
                            notifications.map(notification => (
                                <div 
                                    key={notification.id}
                                    className={`p-3 border-b border-stone-800 last:border-0 hover:bg-stone-800 transition-colors ${!notification.is_read ? 'bg-stone-800/50' : ''}`}
                                >
                                    <div className="flex gap-3">
                                        <div className="mt-1 shrink-0 w-8 h-8 rounded-full overflow-hidden border border-stone-700 bg-stone-950">
                                            {notification.sender?.avatar_url ? (
                                                <img src={notification.sender.avatar_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-stone-600">
                                                    {notification.sender?.username?.[0]?.toUpperCase() || '?'}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-stone-300">
                                                <span className="font-bold text-white">{notification.sender?.username}</span> te mencionó en el chat
                                            </p>
                                            <p className="text-[10px] text-stone-500 mt-1">
                                                {new Date(notification.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                        {!notification.is_read && (
                                            <button 
                                                onClick={() => markAsRead(notification.id)}
                                                className="self-center p-1 text-gold-500 hover:text-gold-400"
                                                title="Marcar como leída"
                                            >
                                                <div className="w-2 h-2 bg-gold-500 rounded-full"></div>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
