import React from 'react';
import { Logo } from './Logo';
import { Twitter, Youtube, Twitch } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-stone-950 border-t border-wood-900 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
          
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-3">
              <Logo className="w-10 h-10 grayscale hover:grayscale-0 transition-all duration-500" />
              <span className="font-serif font-bold text-xl text-gray-300">BOARS SLAYERS</span>
            </div>
            <p className="text-stone-500 text-sm max-w-xs text-center md:text-left">
              Dominando el mapa, un jabalí a la vez. Age of Empires II Definitive Edition.
            </p>
          </div>

          <div className="flex gap-6">
            {[Twitter, Youtube, Twitch].map((Icon, index) => (
              <a 
                key={index} 
                href="#" 
                className="w-10 h-10 rounded-full bg-wood-900 flex items-center justify-center text-gray-400 hover:text-gold-500 hover:bg-wood-800 transition-all border border-stone-800 hover:border-gold-700"
              >
                <Icon size={20} />
              </a>
            ))}
          </div>
        </div>

        <div className="border-t border-stone-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-stone-600 text-sm">
          <p>&copy; {new Date().getFullYear()} Boars Slayers Clan. Todos los derechos reservados.</p>
          <p>Wololo.</p>
        </div>
      </div>
    </footer>
  );
};