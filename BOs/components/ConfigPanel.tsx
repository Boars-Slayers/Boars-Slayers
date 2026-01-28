

import React, { useState } from 'react';
import { Civilization, Difficulty, StrategyFocus, SimulationConfig, Tightness, MapType, OpponentStrategy } from '../types';
import { TRANSLATIONS } from '../constants';
import CivEmblem from './CivEmblem';

interface Props {
  config: SimulationConfig;
  onChange: (newConfig: SimulationConfig) => void;
}

const ConfigPanel: React.FC<Props> = ({ config, onChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const T = TRANSLATIONS[config.language].config;

  const handleChange = (field: keyof SimulationConfig, value: any) => {
    onChange({ ...config, [field]: value });
  };

  const SelectInput = ({ label, value, options, onChange, optional = false }: any) => (
    <div className="relative group">
      <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1.5 font-cinzel">{label}</label>
      <div className="relative">
        <select 
          className="w-full bg-stone-900 border border-stone-700 rounded-sm px-3 py-2 text-xs text-stone-300 outline-none appearance-none transition-all focus:border-yellow-600/50 hover:bg-stone-800"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        >
          {optional && <option value="">- None -</option>}
          {options.map((opt: string) => (
            <option key={opt} value={opt} className="bg-stone-950 text-stone-300">{opt}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-stone-500">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </div>
      </div>
    </div>
  );

  return (
    <div className="glass-panel-heavy rounded-lg p-5 shadow-2xl relative overflow-hidden transition-all duration-300 print:hidden">
      
      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-yellow-700/30"></div>
      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-yellow-700/30"></div>
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-yellow-700/30"></div>
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-yellow-700/30"></div>

      <div className="flex items-center justify-between border-b border-yellow-700/20 pb-3 mb-4">
        <div className="flex items-center gap-3">
           <CivEmblem civ={config.civilization} size="sm" />
           <h2 className="text-sm font-cinzel font-bold text-gold uppercase tracking-widest">{T.title}</h2>
        </div>
        
        {/* Current Config Summary */}
        {!isExpanded && (
            <div className="text-[10px] text-stone-500 font-mono text-right leading-tight">
                <span className="text-stone-300 font-bold">{config.civilization}</span><br/>
                <span className="text-yellow-600/80">{config.strategy}</span>
            </div>
        )}
      </div>

      {/* Manual Override Toggle */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full py-1.5 text-[10px] uppercase font-bold tracking-widest text-stone-500 hover:text-stone-300 border border-stone-800 hover:border-stone-600 rounded bg-stone-900 transition-all mb-4 flex items-center justify-center gap-2"
      >
        <span>{isExpanded ? "Hide Manual Override" : "Show Manual Override"}</span>
        {!isExpanded && <span className="w-2 h-2 rounded-full bg-emerald-500/50 animate-pulse"></span>}
      </button>

      {isExpanded && (
        <div className="space-y-4 animate-fade-in bg-black/20 p-3 rounded border border-stone-800/50">
            <SelectInput 
                label={T.civ} 
                value={config.civilization} 
                options={Object.values(Civilization).sort()} 
                onChange={(v: string) => handleChange('civilization', v)} 
            />

            <SelectInput 
                label={T.ally} 
                value={config.allyCivilization} 
                options={Object.values(Civilization).sort()} 
                onChange={(v: string) => handleChange('allyCivilization', v)} 
                optional={true}
            />

            <SelectInput 
                label={T.strategy} 
                value={config.strategy} 
                options={Object.values(StrategyFocus)} 
                onChange={(v: string) => handleChange('strategy', v)} 
            />

            <div className="grid grid-cols-2 gap-4">
                <SelectInput 
                    label={T.difficulty} 
                    value={config.difficulty} 
                    options={Object.values(Difficulty)} 
                    onChange={(v: string) => handleChange('difficulty', v)} 
                />
                <SelectInput 
                    label={T.map} 
                    value={config.mapType} 
                    options={Object.values(MapType)} 
                    onChange={(v: string) => handleChange('mapType', v)} 
                />
            </div>

            <div className="pt-2">
                <div className="flex justify-between items-end mb-2">
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider">{T.pop} ({config.targetPop})</label>
                    <span className="text-[10px] text-stone-600 font-mono">18 - 30</span>
                </div>
                <input 
                type="range" 
                min="18" 
                max="30" 
                value={config.targetPop}
                onChange={(e) => handleChange('targetPop', parseInt(e.target.value))}
                className="w-full h-1.5 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-yellow-600"
                />
            </div>
            
            <div className="border-t border-stone-800 pt-3">
                 <SelectInput 
                    label={T.opponent} 
                    value={config.opponentStrategy} 
                    options={Object.values(OpponentStrategy)} 
                    onChange={(v: string) => handleChange('opponentStrategy', v)} 
                />
            </div>
        </div>
      )}
    </div>
  );
};

export default ConfigPanel;