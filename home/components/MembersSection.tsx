import React, { useState } from 'react';
import { CLAN_MEMBERS } from '../constants';
import { MemberCard } from './MemberCard';
import { MemberModal } from './MemberModal';
import { Member } from '../types';

export const MembersSection: React.FC = () => {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {CLAN_MEMBERS.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              onClick={(m) => setSelectedMember(m)}
            />
          ))}
        </div>
      </div>

      {/* Member Modal Integration */}
      {selectedMember && (
        <MemberModal
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </section>
  );
};