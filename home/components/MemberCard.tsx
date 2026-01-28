import React from 'react';
import { Member } from '../types';
import { Sword } from 'lucide-react';

interface MemberCardProps {
  member: Member;
  onClick: (member: Member) => void;
}

export const MemberCard: React.FC<MemberCardProps> = ({ member, onClick }) => {
  if (!member) return null;

  return (
    <div
      onClick={() => onClick(member)}
      className="group relative bg-wood-900/50 backdrop-blur-sm border border-gold-700/30 rounded-xl overflow-hidden hover:border-gold-500 hover:shadow-[0_0_15px_rgba(217,119,6,0.3)] transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
    >
      {/* Decorative Corner */}
      <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-gold-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="p-6 flex flex-col items-center">
        {/* Avatar Container */}
        <div className="relative w-24 h-24 mb-4">
          <div className="absolute inset-0 rounded-full bg-gold-600 blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
          <img
            src={member.avatarUrl}
            alt={member.name}
            className="relative w-full h-full rounded-full border-2 border-gold-600/50 object-cover group-hover:border-gold-400 transition-colors"
          />
          <div className="absolute -bottom-1 -right-1 bg-stone-900 rounded-full p-1 border border-gold-600">
            <Sword size={14} className="text-gold-500" />
          </div>
        </div>

        {/* Name & Role */}
        <h3 className="text-xl font-serif font-bold text-gray-100 text-center mb-1 group-hover:text-gold-400 transition-colors">
          {member.name}
        </h3>
        <span className="text-xs uppercase tracking-widest text-stone-500 font-semibold">
          {member.role}
        </span>
      </div>

      {/* Card Footer Decoration */}
      <div className="h-1 w-full bg-gradient-to-r from-transparent via-gold-700/50 to-transparent mt-2" />
    </div>
  );
};