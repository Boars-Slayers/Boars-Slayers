
import React, { useMemo } from 'react';
import { BuildStep, Language } from '../types';

interface Props {
  steps: BuildStep[];
  language: Language;
}

interface Phase {
    id: number;
    title: string;
    resourceType: 'FOOD' | 'WOOD' | 'GOLD' | 'STONE' | 'MIXED';
    vills: number; // Count of vills assigned in this block
    steps: BuildStep[];
    startTime: number;
    endTime: number;
    startPop: number;
    endPop: number;
}

const ConceptMap: React.FC<Props> = ({ steps, language }) => {
  const isEs = language === 'ES';

  const phases = useMemo(() => {
    const groups: Phase[] = [];
    let currentPhase: Phase | null = null;

    steps.forEach((step, idx) => {
        if (idx === 0) return; // Skip initial state

        // Determine resource focus from instruction
        let resType: Phase['resourceType'] = 'MIXED';
        const txt = step.instruction.toLowerCase();
        
        if (txt.includes('sheep') || txt.includes('oveja') || txt.includes('boar') || txt.includes('jabalí') || txt.includes('berr') || txt.includes('baya') || txt.includes('deer') || txt.includes('ciervo') || txt.includes('farm') || txt.includes('granja')) {
            resType = 'FOOD';
        } else if (txt.includes('wood') || txt.includes('madera') || txt.includes('lumber')) {
            resType = 'WOOD';
        } else if (txt.includes('gold') || txt.includes('oro') || txt.includes('mining')) {
            resType = 'GOLD';
        }

        // Logic to start new phase or append
        const isCreate = step.type === 'create';
        const isBuild = step.type === 'build';
        const isResearch = step.type === 'research';

        // Start new phase if:
        // 1. It's a create step AND the resource type implies a shift (e.g. from Sheep to Wood)
        // 2. Or currentPhase is null
        
        const shouldSplit = currentPhase && isCreate && currentPhase.resourceType !== 'MIXED' && resType !== 'MIXED' && resType !== currentPhase.resourceType;

        if (!currentPhase || shouldSplit) {
            if (currentPhase) groups.push(currentPhase);
            
            let title = isEs ? "Fase Inicial" : "Initial Phase";
            if (resType === 'FOOD') title = isEs ? "Producción de Alimento" : "Food Production";
            if (resType === 'WOOD') title = isEs ? "Línea de Madera" : "Woodline Setup";
            if (resType === 'GOLD') title = isEs ? "Minería de Oro" : "Gold Mining";
            
            currentPhase = {
                id: groups.length,
                title,
                resourceType: resType,
                vills: 0,
                steps: [],
                startTime: step.time,
                endTime: step.time,
                startPop: step.population,
                endPop: step.population
            };
        }

        if (currentPhase) {
            currentPhase.steps.push(step);
            currentPhase.endTime = Math.max(currentPhase.endTime, step.endTime || step.time);
            currentPhase.endPop = step.population;
            if (step.type === 'create') currentPhase.vills++;
        }
    });

    if (currentPhase) groups.push(currentPhase);
    return groups;
  }, [steps, isEs]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getTypeColor = (type: string) => {
      switch(type) {
          case 'FOOD': return 'border-red-500/50 bg-red-900/10';
          case 'WOOD': return 'border-emerald-500/50 bg-emerald-900/10';
          case 'GOLD': return 'border-yellow-500/50 bg-yellow-900/10';
          default: return 'border-stone-500/50 bg-stone-900/10';
      }
  };

  return (
    <div className="w-full h-full bg-[#0c0a09] overflow-x-auto overflow-y-hidden custom-scrollbar p-6 flex items-start gap-4">
       {phases.map((phase) => (
           <div key={phase.id} className={`shrink-0 w-80 rounded-xl border-2 ${getTypeColor(phase.resourceType)} backdrop-blur-sm shadow-xl flex flex-col relative`}>
               {/* Header */}
               <div className="p-4 border-b border-white/10 bg-black/20">
                   <div className="flex justify-between items-center mb-1">
                       <span className="text-[10px] font-bold font-mono text-white/50 uppercase tracking-widest">
                           {formatTime(phase.startTime)} - {formatTime(phase.endTime)}
                       </span>
                       <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-bold text-white">
                           Pop {phase.startPop}-{phase.endPop}
                       </span>
                   </div>
                   <h3 className="text-lg font-bold text-white font-serif tracking-wide">{phase.title}</h3>
                   {phase.vills > 0 && (
                       <p className="text-xs text-stone-400 mt-1">
                           {isEs ? `Asignar ${phase.vills} aldeanos` : `Assign ${phase.vills} villagers`}
                       </p>
                   )}
               </div>

               {/* Steps */}
               <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
                   {phase.steps.map((step, idx) => {
                       const isBuild = step.type === 'build';
                       
                       // Simplified Instruction Display
                       let display = step.instruction;
                       let note = "";
                       if (display.includes("->")) {
                           const parts = display.split("->");
                           display = parts[1].trim();
                           note = parts[0].trim(); // Source
                       }

                       return (
                           <div key={idx} className={`relative p-3 rounded border ${isBuild ? 'bg-indigo-900/20 border-indigo-500/40' : 'bg-stone-800/50 border-stone-700/30'}`}>
                               {/* Connection Line */}
                               {idx < phase.steps.length - 1 && (
                                   <div className="absolute left-1/2 bottom-[-16px] w-px h-4 bg-white/10 -translate-x-1/2 z-0"></div>
                               )}
                               
                               <div className="flex justify-between items-start z-10 relative">
                                    <div className="flex-1">
                                        {note && <div className="text-[9px] text-stone-500 uppercase font-bold mb-1">{note}</div>}
                                        <div className={`text-sm font-bold ${isBuild ? 'text-indigo-200' : 'text-stone-200'}`}>{display}</div>
                                        {step.type === 'research' && (
                                            <div className="mt-1 text-xs text-purple-400 font-mono">Research Complete</div>
                                        )}
                                    </div>
                                    <div className="text-right pl-2">
                                        <div className="text-[10px] font-mono text-stone-500">{formatTime(step.time)}</div>
                                        {isBuild && step.endTime && (
                                            <div className="text-[9px] font-mono text-indigo-400 mt-1">
                                                Done: {formatTime(step.endTime)}
                                            </div>
                                        )}
                                    </div>
                               </div>
                               
                               {/* Resource Cost Indicator */}
                               {(step.resources.food < 0 || step.resources.wood < 0) && ( // Heuristic check (logic doesn't store cost in step but we know it consumes)
                                   <div className="mt-2 flex gap-2 text-[10px] text-stone-400">
                                       {/* Placeholder for cost if needed */}
                                   </div>
                               )}
                           </div>
                       );
                   })}
               </div>
           </div>
       ))}
       
       {/* End Marker */}
       <div className="shrink-0 w-12 h-full flex items-center justify-center opacity-20">
           <div className="w-1 h-full bg-gradient-to-b from-transparent via-white to-transparent"></div>
       </div>
    </div>
  );
};

export default ConceptMap;
