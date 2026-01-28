
import React, { useState, useEffect, useRef } from 'react';
import { BuildStep, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface Props {
  steps: any[]; // Extended BuildStep
  language: Language;
  currentTime?: number;
}

const BuildOrderTable: React.FC<Props> = ({ steps, language, currentTime }) => {
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRowRef = useRef<HTMLTableRowElement>(null);
  const T = TRANSLATIONS[language].table;

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleCopy = () => {
    const text = steps.map(s => `[${formatTime(s.time)}] Pop ${s.population}: ${s.instruction}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Auto-scroll to active row
  useEffect(() => {
      if (activeRowRef.current && scrollRef.current) {
          activeRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
  }, [currentTime]);

  // --- ICONS ---
  const ResourceIcon = ({ instruction, type }: { instruction: string, type: string }) => {
     const text = instruction.toLowerCase();
     let colorClass = "text-stone-400";
     let icon = null;

     if (text.match(/sheep|oveja/i)) {
         colorClass = "text-white";
         icon = <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>;
     } else if (text.match(/boar|jabalí/i)) {
         colorClass = "text-red-500";
         icon = <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 10c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2z"/>;
     } else if (text.match(/berr|baya/i)) {
         colorClass = "text-pink-400";
         icon = <><circle cx="8" cy="10" r="3"/><circle cx="16" cy="10" r="3"/><circle cx="12" cy="16" r="3"/></>;
     } else if (text.match(/wood|madera|lumber|maderero/i)) {
         colorClass = "text-emerald-500";
         icon = <path d="M19.36 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 000 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.64-4.96z"/>;
     } else if (text.match(/gold|oro|mining|minero/i)) {
         colorClass = "text-yellow-400";
         icon = <><circle cx="12" cy="12" r="6" strokeWidth="2" stroke="currentColor" fill="none"/><path d="M12 2L2 22h20L12 2z" opacity="0.3"/></>;
     } else if (text.match(/stone|piedra/i)) {
         colorClass = "text-stone-400";
         icon = <><rect x="4" y="4" width="7" height="7" /><rect x="13" y="13" width="7" height="7" /><rect x="13" y="4" width="7" height="7" /><rect x="4" y="13" width="7" height="7" /></>;
     } else if (text.match(/build|construir/i)) {
         colorClass = "text-blue-400";
         icon = <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>;
     } else if (text.match(/loom|telar|feudal|castle|castillos/i)) {
         colorClass = "text-purple-400";
         icon = <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2-1-2-1-2 1 2 1zm0 2l-5-2.5-5 2.5L12 22l10-9-5-2.5-5 2.5z"/>;
     }

     if (!icon) return <div className="w-5 h-5 rounded-full bg-white/10"></div>;

     return (
         <div className={`w-8 h-8 flex items-center justify-center bg-stone-800 rounded border border-stone-600 ${colorClass}`}>
             <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">{icon}</svg>
         </div>
     );
  };

  // --- GROUPING LOGIC ---
  interface GroupedStep {
      id: number;
      popTotal: string; // Range e.g. "12-14"
      instruction: string;
      type: string;
      vilRange: string; // Range of Villagers e.g. "4-6" or empty for notes
      time: number;
      allocation: { food: number, wood: number, gold: number, stone: number };
      isAgeUp: boolean;
      isNote: boolean;
  }
  
  const groupedSteps: GroupedStep[] = [];
  let currentGroup: GroupedStep | null = null;
  let lastVilAllocation = { food: 0, wood: 0, gold: 0, stone: 0 };
  
  steps.forEach((step, idx) => {
      // Clean instruction for comparison
      const cleanInstruction = step.instruction.replace(/\(\d+\s+vills\)/, '').trim();
      const isAgeUp = cleanInstruction.toLowerCase().includes("feudal") || cleanInstruction.toLowerCase().includes("castle");
      const isNote = step.type !== 'create'; // Create types are explicit Villager assignments

      // Update last known allocation if present in step
      if (step.villagerAllocation) {
          lastVilAllocation = { 
              food: step.villagerAllocation.food || 0,
              wood: step.villagerAllocation.wood || 0,
              gold: step.villagerAllocation.gold || 0,
              stone: 0
          };
      }

      // Special handling for First Step (Start Game) -> Force Note style
      const isStartGame = idx === 0;

      // Group if sequential Creates have identical instruction
      const canGroup = (step.type === 'create' && !isStartGame);
      const prevCanGroup = currentGroup && (currentGroup.type === 'create' && !currentGroup.isNote);
      const sameInstruction = currentGroup && currentGroup.instruction.replace(/\(\d+\s+vills\)/, '').trim() === cleanInstruction;

      if (currentGroup && canGroup && prevCanGroup && sameInstruction) {
          // Update existing group range
          // Vill Index = Pop - 1 (Assuming 1 Scout)
          const currentVilIndex = step.population - 1; 
          
          // Parse start of range
          const startVil = parseInt(currentGroup.vilRange.split('-')[0]);
          currentGroup.vilRange = `${startVil}-${currentVilIndex}`;
          
          // Update Pop Range
          const startPop = parseInt(currentGroup.popTotal.split('-')[0]);
          currentGroup.popTotal = `${startPop}-${step.population}`;
          
          currentGroup.time = step.time; 
          currentGroup.allocation = { ...lastVilAllocation };
      } else {
          // Push old group
          if (currentGroup) groupedSteps.push(currentGroup);
          
          // Determine Villager Index label
          let vilLabel = "";
          if (step.type === 'create' && !isStartGame) {
              vilLabel = (step.population - 1).toString();
          }
          
          // Start new
          currentGroup = {
              id: idx,
              popTotal: step.population.toString(),
              instruction: step.instruction,
              type: step.type,
              vilRange: vilLabel,
              time: step.time,
              allocation: { ...lastVilAllocation },
              isAgeUp,
              isNote: isNote || isStartGame
          };
      }
  });
  if (currentGroup) groupedSteps.push(currentGroup);

  // Find active group for scrolling
  let activeGroupIndex = -1;
  if (currentTime !== undefined) {
      for (let i = groupedSteps.length - 1; i >= 0; i--) {
          const group = groupedSteps[i];
          if (group.time <= currentTime) {
              activeGroupIndex = i;
              break;
          }
      }
  }

  const getRowStyle = (group: GroupedStep, isActive: boolean) => {
      if (isActive) return "bg-yellow-900/40 border-l-4 border-yellow-500";
      if (group.isAgeUp) return "bg-purple-900/20 border-b border-purple-900/50";
      if (group.isNote) return "bg-[#1c1917] border-b border-stone-800"; // Slightly lighter for Notes
      return "bg-[#0c0a09]"; // Very dark for standard villager rows
  };

  return (
    <div className="w-full h-full flex flex-col font-sans text-sm bg-[#0c0a09] rounded-lg overflow-hidden border border-stone-800 shadow-2xl">
      {/* Table Header */}
      <div className="flex justify-between items-center px-4 py-3 bg-[#1c1917] border-b border-yellow-700/30">
        <h3 className="text-gold font-cinzel font-bold tracking-wider text-lg">{T.title}</h3>
        <button 
          onClick={handleCopy}
          className="text-[10px] font-bold uppercase text-stone-500 hover:text-gold transition-colors tracking-widest border border-stone-700 hover:border-gold px-3 py-1 rounded-sm"
        >
          {copied ? T.copied : T.copy}
        </button>
      </div>

      <div className="overflow-y-auto custom-scrollbar flex-1 relative" ref={scrollRef}>
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10 bg-[#292524] text-stone-400 text-[10px] uppercase font-bold tracking-wider shadow-md">
            <tr>
              <th className="px-2 py-3 text-center w-12 border-b-2 border-stone-600 bg-[#292524]">NO.</th>
              <th className="px-2 py-3 text-center w-10 border-b-2 border-stone-600 bg-[#292524]"></th> 
              <th className="px-3 py-3 text-left border-b-2 border-stone-600 bg-[#292524]">Task / Note</th>
              <th className="px-1 py-3 text-center border-b-2 border-stone-600 w-8 bg-[#292524] text-emerald-500" title="Wood">W</th>
              <th className="px-1 py-3 text-center border-b-2 border-stone-600 w-8 bg-[#292524] text-red-500" title="Food">F</th>
              <th className="px-1 py-3 text-center border-b-2 border-stone-600 w-8 bg-[#292524] text-yellow-500" title="Gold">G</th>
              <th className="px-1 py-3 text-center border-b-2 border-stone-600 w-8 bg-[#292524] text-stone-400" title="Stone">S</th>
              <th className="px-2 py-3 text-center w-14 border-b-2 border-stone-600 bg-[#292524]">Pop</th>
              <th className="px-2 py-3 text-center w-14 border-b-2 border-stone-600 bg-[#292524]">Time</th>
            </tr>
          </thead>
          <tbody className="text-sm font-medium">
            {groupedSteps.map((group, idx) => {
              const isActive = idx === activeGroupIndex;
              
              // Parse Instruction
              let displayTask = group.instruction;
              let displayNote = "";
              if (displayTask.includes('(')) {
                  const parts = displayTask.split('(');
                  displayTask = parts[0].trim();
                  displayNote = parts[1].replace(')', '').trim();
              }

              return (
                <tr 
                  key={idx} 
                  ref={isActive ? activeRowRef : null}
                  className={`group transition-colors border-b border-stone-800/30 ${getRowStyle(group, isActive)} hover:bg-white/5`}
                >
                  {/* NO. (Villager Index) - Only for Vil Rows */}
                  <td className="px-2 py-3 text-center font-bold text-lg text-stone-300 border-r border-stone-800/50">
                    {!group.isNote && group.vilRange}
                  </td>

                  {/* ICON */}
                  <td className="px-2 py-3 flex justify-center items-center">
                     <ResourceIcon instruction={group.instruction} type={group.type} />
                  </td>

                  {/* TASK / NOTE */}
                  <td className="px-3 py-3 border-r border-stone-800/50">
                     <span className={`font-bold block ${isActive ? 'text-yellow-200' : (group.isNote ? 'text-stone-400 italic' : 'text-stone-200')}`}>
                           {displayTask}
                     </span>
                     {displayNote && <span className="text-xs text-stone-500 block italic">{displayNote}</span>}
                  </td>
                  
                  {/* ALLOCATION COLUMNS */}
                  <td className="px-1 py-3 text-center text-xs font-mono text-emerald-600 font-bold border-r border-stone-800/50 bg-black/10">
                     {group.allocation.wood > 0 ? group.allocation.wood : '-'}
                  </td>
                  <td className="px-1 py-3 text-center text-xs font-mono text-red-600 font-bold border-r border-stone-800/50 bg-black/10">
                     {group.allocation.food > 0 ? group.allocation.food : '-'}
                  </td>
                  <td className="px-1 py-3 text-center text-xs font-mono text-yellow-600 font-bold border-r border-stone-800/50 bg-black/10">
                     {group.allocation.gold > 0 ? group.allocation.gold : '-'}
                  </td>
                  <td className="px-1 py-3 text-center text-xs font-mono text-stone-500 font-bold border-r border-stone-800/50 bg-black/10">
                     {group.allocation.stone > 0 ? group.allocation.stone : '-'}
                  </td>

                  {/* POP (Total) */}
                  <td className="px-2 py-3 text-center font-bold text-stone-400 text-xs border-r border-stone-800/50 bg-black/20">
                    {group.popTotal}
                  </td>

                  {/* TIME */}
                  <td className="px-2 py-3 text-center font-mono text-stone-500 text-xs bg-black/20">
                    {formatTime(group.time)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BuildOrderTable;
