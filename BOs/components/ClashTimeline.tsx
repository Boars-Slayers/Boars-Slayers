
import React from 'react';
import { SimulationResult, OpponentStrategy, Language } from '../types';
import { OPPONENT_TIMINGS, TRANSLATIONS } from '../constants';

interface Props {
  result: SimulationResult;
  opponentStrategy: OpponentStrategy;
  language: Language;
}

const ClashTimeline: React.FC<Props> = ({ result, opponentStrategy, language }) => {
  const T = TRANSLATIONS[language].timeline;

  const parseTime = (timeStr: string) => {
    if (timeStr === "N/A") return 0;
    const [m, s] = timeStr.split(':').map(Number);
    return m * 60 + s;
  };

  const feudalTime = parseTime(result.theoreticalFeudalTime);
  const castleTime = parseTime(result.theoreticalCastleTime);
  const opponentTime = OPPONENT_TIMINGS[opponentStrategy] || 1200;

  // Max scale time: either opponent hit or castle time + buffer
  const maxTime = Math.max(opponentTime, castleTime || feudalTime) + 120;
  
  const getPercent = (time: number) => Math.min(100, Math.max(0, (time / maxTime) * 100));

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (opponentStrategy === OpponentStrategy.PASSIVE) return null;

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 shadow-xl mb-6">
      <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center justify-between">
        <span>{T.title}</span>
        <span className="text-xs font-mono bg-slate-800 px-2 py-1 rounded text-slate-400">
           {opponentStrategy} ({formatTime(opponentTime)})
        </span>
      </h3>
      
      <div className="relative h-12 w-full bg-slate-800 rounded-full mt-6 mb-2">
        {/* Progress Bar Background Grid */}
        <div className="absolute inset-0 flex justify-between px-2">
           {[0, 25, 50, 75, 100].map(p => (
               <div key={p} className="h-full border-r border-slate-700 w-0"></div>
           ))}
        </div>

        {/* User Feudal */}
        {feudalTime > 0 && (
          <div 
            className="absolute top-1/2 -translate-y-1/2 h-8 w-2 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.6)] z-20 group cursor-help"
            style={{ left: `${getPercent(feudalTime)}%` }}
          >
             <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
               Feudal Age ({formatTime(feudalTime)})
             </div>
          </div>
        )}

        {/* User Castle */}
        {castleTime > 0 && (
          <div 
            className="absolute top-1/2 -translate-y-1/2 h-8 w-2 bg-purple-500 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.6)] z-20 group cursor-help"
            style={{ left: `${getPercent(castleTime)}%` }}
          >
             <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
               Castle Age ({formatTime(castleTime)})
             </div>
          </div>
        )}

        {/* Opponent Attack */}
        <div 
            className="absolute top-1/2 -translate-y-1/2 h-10 w-2 bg-rose-500 rounded-full shadow-[0_0_20px_rgba(244,63,94,0.8)] z-30 group cursor-help animate-pulse"
            style={{ left: `${getPercent(opponentTime)}%` }}
        >
             <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-rose-600 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap">
               {T.attackHit} ({formatTime(opponentTime)})
             </div>
        </div>

        {/* Safe Zone Indicator */}
        {feudalTime < opponentTime && (
            <div 
                className="absolute top-1/2 -translate-y-1/2 h-2 bg-emerald-500/30 z-10 rounded-l-full"
                style={{ left: `${getPercent(feudalTime)}%`, width: `${getPercent(opponentTime) - getPercent(feudalTime)}%` }}
            ></div>
        )}
      </div>

      <div className="text-center mt-6 text-xs text-slate-500">
         {feudalTime < opponentTime ? (
             <span className="text-emerald-400 font-bold">{T.safe} {formatTime(opponentTime - feudalTime)} {T.before}</span>
         ) : (
             <span className="text-rose-400 font-bold">{T.danger} {formatTime(feudalTime - opponentTime)} {T.tooSlow}</span>
         )}
      </div>
    </div>
  );
};

export default ClashTimeline;
