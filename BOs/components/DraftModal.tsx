
import React, { useState, useEffect } from 'react';
import { Civilization, Language, DraftState, DraftMatchup } from '../types';
import { TRANSLATIONS } from '../constants';
import CivEmblem from './CivEmblem';

interface Props {
  onClose: () => void;
  language: Language;
}

// Simple heuristic generator for win rates to avoid heavy API dependency for the matrix
// In a real app, this would come from statsService
const getMockWinRate = (pCiv: Civilization, oCiv: Civilization): number => {
    // Generate a deterministic pseudo-random number based on string codes
    const seed = pCiv.length + oCiv.length + pCiv.charCodeAt(0) + oCiv.charCodeAt(0);
    const rand = Math.sin(seed) * 10000;
    const base = 50 + ((rand - Math.floor(rand)) * 20 - 10); // 40-60% range
    
    // Some hardcoded counters for flavor
    if (pCiv === Civilization.GOTHS && oCiv === Civilization.MAYANS) return 65;
    if (pCiv === Civilization.MAYANS && oCiv === Civilization.GOTHS) return 35;
    if (pCiv === Civilization.FRANKS && oCiv === Civilization.BYZANTINES) return 45; // Camels/Pikes
    if (pCiv === Civilization.BYZANTINES && oCiv === Civilization.FRANKS) return 55;

    return Math.round(base);
};

const DraftModal: React.FC<Props> = ({ onClose, language }) => {
  const T = TRANSLATIONS[language].draft;

  // Default Pools
  const [playerPool, setPlayerPool] = useState<Civilization[]>([
      Civilization.FRANKS, Civilization.MAYANS, Civilization.BRITONS, Civilization.MAGYARS, Civilization.LITHUANIANS
  ]);
  const [opponentPool, setOpponentPool] = useState<Civilization[]>([
      Civilization.CHINESE, Civilization.VIKINGS, Civilization.AZTECS, Civilization.HINDUSTANIS, Civilization.GURJARAS
  ]);

  const [state, setState] = useState<DraftState>({
      playerPool: [],
      opponentPool: [],
      bans: { player: [], opponent: [] },
      picks: { player: [], opponent: [] },
      phase: 'BAN',
      turn: 'PLAYER'
  });

  const [heatmap, setHeatmap] = useState<DraftMatchup[]>([]);
  const [advice, setAdvice] = useState<string>("");

  // Init Heatmap
  useEffect(() => {
      const matrix: DraftMatchup[] = [];
      playerPool.forEach(p => {
          opponentPool.forEach(o => {
              matrix.push({
                  playerCiv: p,
                  opponentCiv: o,
                  winRate: getMockWinRate(p, o),
                  confidence: 0.8
              });
          });
      });
      setHeatmap(matrix);
      generateAdvice();
  }, [playerPool, opponentPool, state]);

  const generateAdvice = () => {
      if (state.phase === 'BAN') {
          // Find opponent civ with highest avg winrate against my pool
          let bestBan = opponentPool[0];
          let maxThreat = 0;
          
          opponentPool.forEach(o => {
             if (state.bans.opponent.includes(o) || state.picks.opponent.includes(o)) return;
             
             // Avg win rate of this opponent civ vs all my remaining civs
             const relevantMatchups = heatmap.filter(m => m.opponentCiv === o && !state.bans.player.includes(m.playerCiv));
             const avgWR = relevantMatchups.reduce((sum, m) => sum + (100 - m.winRate), 0) / relevantMatchups.length; // Opponent WR perspective
             
             if (avgWR > maxThreat) {
                 maxThreat = avgWR;
                 bestBan = o;
             }
          });
          
          setAdvice(language === 'ES' 
             ? `Sugerencia de Ban: ${bestBan} (Amenaza ${Math.round(maxThreat)}%)` 
             : `Suggested Ban: ${bestBan} (Threat ${Math.round(maxThreat)}%)`);
      } else if (state.phase === 'PICK') {
          // Find my civ with highest lowest-matchup (Maximin)
           let bestPick = playerPool[0];
           let maxMinWR = 0;

           playerPool.forEach(p => {
               if (state.bans.player.includes(p) || state.picks.player.includes(p)) return;
               
               // Worst case scenario for this pick against remaining opponent pool
               const relevantMatchups = heatmap.filter(m => m.playerCiv === p && !state.bans.opponent.includes(m.opponentCiv));
               const minWR = Math.min(...relevantMatchups.map(m => m.winRate));
               
               if (minWR > maxMinWR) {
                   maxMinWR = minWR;
                   bestPick = p;
               }
           });
           setAdvice(language === 'ES' 
             ? `Pick Seguro: ${bestPick} (Piso de WR ${maxMinWR}%)` 
             : `Safe Pick: ${bestPick} (WR Floor ${maxMinWR}%)`);
      }
  };

  const handleCivClick = (civ: Civilization, side: 'PLAYER' | 'OPPONENT') => {
      if (state.phase === 'COMPLETE') return;

      // Logic for Draft Flow
      const newState = { ...state };
      
      if (state.phase === 'BAN') {
          if (state.turn === 'PLAYER' && side === 'OPPONENT') {
               if (newState.bans.player.includes(civ)) return;
               newState.bans.player.push(civ); // Player bans opponent civ
               newState.turn = 'OPPONENT';
          } 
          else if (state.turn === 'OPPONENT' && side === 'PLAYER') {
               if (newState.bans.opponent.includes(civ)) return;
               newState.bans.opponent.push(civ); // Opponent bans player civ
               newState.turn = 'PLAYER';
               if (newState.bans.player.length >= 1) newState.phase = 'PICK'; // Simple 1 ban 1 pick logic for demo
          }
      } else if (state.phase === 'PICK') {
          if (state.turn === 'PLAYER' && side === 'PLAYER') {
               if (newState.bans.player.includes(civ) || newState.picks.player.includes(civ)) return;
               newState.picks.player.push(civ);
               newState.turn = 'OPPONENT';
          } 
          else if (state.turn === 'OPPONENT' && side === 'OPPONENT') {
               if (newState.bans.opponent.includes(civ) || newState.picks.opponent.includes(civ)) return;
               newState.picks.opponent.push(civ);
               newState.turn = 'PLAYER';
               if (newState.picks.player.length >= 1) newState.phase = 'COMPLETE';
          }
      }
      
      setState(newState);
  };

  const getCivStatus = (civ: Civilization, side: 'PLAYER' | 'OPPONENT') => {
      if (side === 'PLAYER') {
          if (state.bans.opponent.includes(civ)) return 'BANNED';
          if (state.picks.player.includes(civ)) return 'PICKED';
      } else {
          if (state.bans.player.includes(civ)) return 'BANNED';
          if (state.picks.opponent.includes(civ)) return 'PICKED';
      }
      return 'AVAILABLE';
  };

  const getCellColor = (wr: number) => {
      if (wr >= 60) return 'bg-emerald-500/80 text-white';
      if (wr >= 53) return 'bg-emerald-500/40 text-emerald-100';
      if (wr >= 47) return 'bg-yellow-500/20 text-yellow-100';
      if (wr >= 40) return 'bg-red-500/40 text-red-100';
      return 'bg-red-500/80 text-white';
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-stone-900 border border-yellow-700 w-full max-w-6xl h-[90vh] flex flex-col rounded-lg shadow-2xl relative animate-fade-in-up">
        
        {/* Header */}
        <div className="bg-stone-800 p-4 border-b border-yellow-700/50 flex justify-between items-center shrink-0">
            <div>
                <h2 className="text-2xl font-cinzel font-bold text-gold">{T.title}</h2>
                <span className="text-xs text-stone-400 uppercase tracking-widest">{T.subtitle}</span>
            </div>
            <div className="flex items-center gap-4">
                 <div className="bg-black/40 border border-yellow-600/30 px-4 py-2 rounded text-sm text-yellow-500 font-mono">
                    {state.phase === 'COMPLETE' ? "DRAFT COMPLETE" : `${state.phase} PHASE - ${state.turn}'S TURN`}
                 </div>
                 <button onClick={onClose} className="text-stone-400 hover:text-white">✕</button>
            </div>
        </div>

        {/* Main Content Grid */}
        <div className="flex-1 overflow-hidden grid grid-cols-12">
            
            {/* Player Pool */}
            <div className="col-span-2 bg-stone-950/50 border-r border-stone-800 p-4 overflow-y-auto">
                <h3 className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-4">{T.playerPool}</h3>
                <div className="space-y-3">
                    {playerPool.map(civ => {
                        const status = getCivStatus(civ, 'PLAYER');
                        return (
                            <div 
                                key={civ}
                                onClick={() => handleCivClick(civ, 'PLAYER')}
                                className={`
                                    flex items-center gap-3 p-2 rounded cursor-pointer border transition-all
                                    ${status === 'PICKED' ? 'bg-emerald-900/50 border-emerald-500 ring-1 ring-emerald-500' : ''}
                                    ${status === 'BANNED' ? 'bg-red-900/20 border-red-900 opacity-50 grayscale' : ''}
                                    ${status === 'AVAILABLE' ? 'bg-stone-900 border-stone-700 hover:border-emerald-500/50 hover:bg-stone-800' : ''}
                                `}
                            >
                                <CivEmblem civ={civ} size="sm" />
                                <span className="text-sm font-bold text-stone-300">{civ}</span>
                                {status === 'BANNED' && <span className="ml-auto text-[10px] text-red-500 font-bold">BAN</span>}
                                {status === 'PICKED' && <span className="ml-auto text-[10px] text-emerald-500 font-bold">PICK</span>}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Matrix (Heatmap) */}
            <div className="col-span-8 p-6 overflow-auto bg-stone-900 flex flex-col">
                
                {/* AI Advice Banner */}
                <div className="mb-6 bg-indigo-900/20 border-l-4 border-indigo-500 p-4 rounded shadow-lg">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">{T.recommendation}</span>
                    <p className="text-lg text-indigo-100 font-serif-text italic">"{advice}"</p>
                </div>

                <div className="flex-1 overflow-auto">
                    <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 text-center">{T.matrix} (Win Rate %)</h3>
                    <div className="grid" style={{ gridTemplateColumns: `auto repeat(${opponentPool.length}, 1fr)` }}>
                         {/* Header Row */}
                         <div className="p-2"></div>
                         {opponentPool.map(o => (
                             <div key={o} className="p-2 flex flex-col items-center justify-end">
                                 <CivEmblem civ={o} size="sm" />
                                 <span className="text-[10px] text-stone-500 mt-1 rotate-45 origin-left translate-y-2">{o.substring(0,3)}</span>
                             </div>
                         ))}

                         {/* Rows */}
                         {playerPool.map(p => (
                             <React.Fragment key={p}>
                                 <div className="p-2 flex items-center justify-end gap-2">
                                     <span className="text-[10px] text-stone-500 uppercase">{p}</span>
                                     <CivEmblem civ={p} size="sm" />
                                 </div>
                                 {opponentPool.map(o => {
                                     const match = heatmap.find(m => m.playerCiv === p && m.opponentCiv === o);
                                     const wr = match?.winRate || 50;
                                     const pStatus = getCivStatus(p, 'PLAYER');
                                     const oStatus = getCivStatus(o, 'OPPONENT');
                                     const isDimmed = pStatus === 'BANNED' || oStatus === 'BANNED';

                                     return (
                                         <div 
                                            key={`${p}-${o}`} 
                                            className={`
                                                m-0.5 rounded flex items-center justify-center text-xs font-bold h-10 transition-all relative group
                                                ${getCellColor(wr)}
                                                ${isDimmed ? 'opacity-20 grayscale' : 'opacity-100'}
                                            `}
                                         >
                                             {wr}%
                                             {/* Tooltip */}
                                             <div className="absolute bottom-full mb-2 bg-black text-white text-[10px] p-2 rounded hidden group-hover:block whitespace-nowrap z-50 pointer-events-none">
                                                 {p} vs {o}: {wr}% WR
                                             </div>
                                         </div>
                                     );
                                 })}
                             </React.Fragment>
                         ))}
                    </div>
                </div>
            </div>

            {/* Opponent Pool */}
            <div className="col-span-2 bg-stone-950/50 border-l border-stone-800 p-4 overflow-y-auto">
                <h3 className="text-xs font-bold text-red-500 uppercase tracking-wider mb-4">{T.oppPool}</h3>
                <div className="space-y-3">
                    {opponentPool.map(civ => {
                        const status = getCivStatus(civ, 'OPPONENT');
                        return (
                            <div 
                                key={civ}
                                onClick={() => handleCivClick(civ, 'OPPONENT')}
                                className={`
                                    flex items-center gap-3 p-2 rounded cursor-pointer border transition-all
                                    ${status === 'PICKED' ? 'bg-red-900/50 border-red-500 ring-1 ring-red-500' : ''}
                                    ${status === 'BANNED' ? 'bg-red-900/20 border-red-900 opacity-50 grayscale' : ''}
                                    ${status === 'AVAILABLE' ? 'bg-stone-900 border-stone-700 hover:border-red-500/50 hover:bg-stone-800' : ''}
                                `}
                            >
                                <CivEmblem civ={civ} size="sm" />
                                <span className="text-sm font-bold text-stone-300">{civ}</span>
                                {status === 'BANNED' && <span className="ml-auto text-[10px] text-red-500 font-bold">BAN</span>}
                                {status === 'PICKED' && <span className="ml-auto text-[10px] text-emerald-500 font-bold">PICK</span>}
                            </div>
                        );
                    })}
                </div>
            </div>

        </div>

        {/* Footer Controls */}
        <div className="bg-stone-800 p-4 border-t border-stone-700 flex justify-end">
            <button 
                onClick={() => {
                    setState({
                        playerPool: [],
                        opponentPool: [],
                        bans: { player: [], opponent: [] },
                        picks: { player: [], opponent: [] },
                        phase: 'BAN',
                        turn: 'PLAYER'
                    });
                }}
                className="px-4 py-2 text-xs font-bold text-stone-400 hover:text-white border border-stone-600 rounded uppercase"
            >
                {T.reset}
            </button>
        </div>

      </div>
    </div>
  );
};

export default DraftModal;
