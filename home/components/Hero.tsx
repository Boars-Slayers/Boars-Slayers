import React from 'react';
import { ChevronDown } from 'lucide-react';

interface HeroProps {
  onJoinClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onJoinClick }) => {
  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">

      {/* Background Pattern - simulating a dark map texture */}
      <div className="absolute inset-0 bg-stone-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-stone-800/20 via-stone-950 to-stone-950"></div>
        {/* Grid pattern overlay */}
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>
      </div>

      {/* Vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-stone-950/80 via-transparent to-stone-950 pointer-events-none"></div>

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gold-600/30 bg-gold-900/10 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-xs uppercase tracking-widest text-gold-500 font-semibold">Reclutando Ahora</span>
        </div>

        <h1 className="font-serif font-black text-5xl md:text-7xl lg:text-8xl text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 mb-6 drop-shadow-xl">
          BOARS <br className="md:hidden" /> <span className="text-transparent bg-clip-text bg-gradient-to-b from-gold-400 to-gold-700">SLAYERS</span>
        </h1>

        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-sans">
          Cazamos juntos, ganamos juntos. Un clan de élite de Age of Empires II DE forjado en la batalla y unido por la estrategia.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={onJoinClick}
            className="px-8 py-4 bg-wood-800 hover:bg-wood-900 text-gray-200 font-bold uppercase tracking-wider rounded border border-stone-600 hover:border-gold-600 transition-all min-w-[200px]"
          >
            Unirse al Clan
          </button>
          <a
            href="https://discord.gg/KAPgH82f"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 bg-gradient-to-b from-gold-500 to-gold-700 hover:from-gold-400 hover:to-gold-600 text-stone-950 font-bold uppercase tracking-wider rounded border border-gold-400 shadow-[0_0_20px_rgba(217,119,6,0.2)] hover:shadow-[0_0_30px_rgba(217,119,6,0.4)] transition-all min-w-[200px] inline-block text-center"
          >
            Unirse a Discord
          </a>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-gold-600/50">
        <ChevronDown size={32} />
      </div>
    </section>
  );
};