import React, { useState, useEffect } from 'react';
import { Moment, Member } from '../../types';
import { supabase } from '../../lib/supabase';
import { Tag, Calendar } from 'lucide-react';

interface MomentCardProps {
    moment: Moment;
    currentUser: any; // Context auth user
}

export const MomentCard: React.FC<MomentCardProps> = ({ moment }) => {
    const [taggedUsers, setTaggedUsers] = useState<Member[]>([]);

    useEffect(() => {
        const fetchTags = async () => {
            try {
                // Get tags for this moment
                const { data: tagData } = await supabase
                    .from('moment_tags')
                    .select('*')
                    .eq('moment_id', moment.id);

                if (tagData) {
                    // Fetch user details for each tag
                    const userIds = tagData.map(t => t.user_id);
                    if (userIds.length > 0) {
                        const { data: usersData } = await supabase
                            .from('profiles')
                            .select('id, username, avatar_url, role')
                            .in('id', userIds);

                        if (usersData) {
                            // Map profile config to Member type structure if needed, or just use as is
                            // Assuming simple mapping for display
                            const members: Member[] = usersData.map(u => ({
                                id: u.id,
                                name: u.username,
                                role: u.role,
                                avatarUrl: u.avatar_url
                            }));
                            setTaggedUsers(members);
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching moment details:", error);
            } finally {
                // Done loading
            }
        };

        fetchTags();
    }, [moment.id]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="bg-stone-900/80 border border-gold-600/20 rounded-xl overflow-hidden shadow-lg hover:border-gold-600/40 transition-all group">
            <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                {moment.media_type === 'video' ? (
                    <video
                        src={moment.media_url}
                        controls
                        className="w-full h-full object-contain"
                    />
                ) : (
                    <img
                        src={moment.media_url}
                        alt="Moment"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                )}
            </div>

            <div className="p-4">
                {moment.description && (
                    <p className="text-gray-200 mb-3 text-sm font-serif italic">"{moment.description}"</p>
                )}

                <div className="flex flex-wrap gap-2 mb-3">
                    {taggedUsers.map(user => (
                        <div key={user.id} className="flex items-center gap-1 bg-stone-800 px-2 py-1 rounded-full text-xs text-gold-400 border border-stone-700">
                            <Tag size={10} />
                            <span>{user.name}</span>
                        </div>
                    ))}
                </div>

                <div className="flex items-center justify-between text-xs text-stone-500 pt-3 border-t border-stone-800">
                    <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        <span>{formatDate(moment.created_at)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
