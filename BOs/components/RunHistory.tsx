
import React from 'react';
import { SimulationResult, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface Props {
  currentResult: SimulationResult;
  baselineResult: SimulationResult | null;
  onSetBaseline: (result: SimulationResult | null) => void;
  language: Language;
}

const RunHistory: React.FC<Props> = ({ currentResult, baselineResult, onSetBaseline, language }) => {
  const T = TRANSLATIONS[language].history;

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 mb-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        </div>
        <div>
           <h3 className="text-sm font-bold text-slate-200">{T.title}</h3>
           <p className="text-xs text-slate-500">
             {baselineResult ? (
                 <>{T.compare} <span className="text-emerald-400 font-mono">{baselineResult.configName}</span></>
             ) : (
                 T.setBase
             )}
           </p>
        </div>
      </div>
      
      <div className="flex gap-2">
         {baselineResult ? (
            <button 
                onClick={() => onSetBaseline(null)}
                className="px-3 py-1.5 text-xs text-slate-400 border border-slate-700 rounded hover:bg-slate-800 transition-colors"
            >
                {T.clearBtn}
            </button>
         ) : (
            <button 
                onClick={() => onSetBaseline(currentResult)}
                className="px-3 py-1.5 text-xs font-bold text-indigo-100 bg-indigo-600 rounded hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20"
            >
                {T.setBtn}
            </button>
         )}
      </div>
    </div>
  );
};

export default RunHistory;
