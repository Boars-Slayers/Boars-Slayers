import React, { useState, useEffect } from 'react';
import { supabase, UserProfile } from '../lib/supabase';
import { MemberCard } from './MemberCard';
import { MemberModal } from './MemberModal';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const MembersSection: React.FC = () => {
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<UserProfile | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMembers = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .neq('role', 'candidate')
        .order('role', { ascending: true }); // Admin first (A-Z)

      if (data) setMembers(data);
      setLoading(false);
    };
    fetchMembers();
  }, []);

  const handleMemberClick = (m: UserProfile) => {
    // Optionally open modal or just navigate
    // Let's open modal for quick view as before, but the modal will have a "Ver Perfil Completo" button
    setSelectedMember(m);
  };

  return (
    <section id="members" className="py-24 bg-stone-900 relative">
      {/* Decorative divider */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gold-700/30 to-transparent"></div>

      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="font-serif font-bold text-4xl text-gray-100 mb-4">
            <span className="text-gold-500">Nuestros</span> Guerreros
          </h2>
          <div className="h-1 w-24 bg-gold-600 mx-auto rounded-full mb-6"></div>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Desde los expertos en Rush de castillos hasta los maestros de la economía. Conoce a quienes llevan el estandarte.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-20">
            <Loader2 size={40} className="text-gold-500 animate-spin opacity-20" />
            <p className="text-stone-500 mt-4 font-serif italic text-sm">Reuniendo al ejército...</p>
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-stone-800 rounded-2xl">
            <p className="text-stone-500 font-serif italic">Aún no hay guerreros registrados bajo este estandarte...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {members.map((m) => (
              <MemberCard
                key={m.id}
                member={{
                  id: m.id,
                  name: m.username,
                  role: m.role.charAt(0).toUpperCase() + m.role.slice(1),
                  avatarUrl: m.avatar_url,
                  favoriteCiv: m.favorite_civ,
                  steamId: m.steam_id
                }}
                onClick={() => handleMemberClick(m)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Member Modal Integration */}
      {selectedMember && (
        <MemberModal
          member={{
            id: selectedMember.id,
            name: selectedMember.username,
            role: selectedMember.role.charAt(0).toUpperCase() + selectedMember.role.slice(1),
            avatarUrl: selectedMember.avatar_url,
            favoriteCiv: selectedMember.favorite_civ,
            steamId: selectedMember.steam_id
          }}
          onViewProfile={() => {
            navigate(`/user/${selectedMember.username}`);
            setSelectedMember(null);
          }}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </section>
  );
};