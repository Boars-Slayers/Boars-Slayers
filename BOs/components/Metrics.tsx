
import React from 'react';
import { SimulationResult, ResourceType } from '../types';
import { TRANSLATIONS } from '../constants';
import { Language } from '../types';

interface Props {
  result: SimulationResult;
  baseline?: SimulationResult | null;
  onGetReport: () => void;
  isGeneratingReport: boolean;
  language: Language;
}

const Metrics: React.FC<Props> = ({ result, baseline, onGetReport, isGeneratingReport, language }) => {
  const T = TRANSLATIONS[language].metrics;

  const MetricCard = ({ label, value, subValue, type = 'neutral', icon }: any) => {
    let borderColor = "border-stone-700";
    let textColor = "text-stone-200";
    
    if (type === 'good') { borderColor = "border-emerald-600/50"; textColor = "text-emerald-400"; }
    if (type === 'warn') { borderColor = "border-yellow-600/50"; textColor = "text-yellow-400"; }
    if (type === 'danger') { borderColor = "border-red-600/50"; textColor = "text-red-400"; }
    if (type === 'info') { borderColor = "border-blue-600/50"; textColor = "text-blue-400"; }

    return (
        <div className={`relative bg-stone-900 border ${borderColor} p-3 flex flex-col justify-between group hover:bg-stone-800 transition-colors shadow-lg`}>
            {/* Corner Accent */}
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-stone-600 group-hover:border-yellow-600"></div>

            <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-cinzel font-bold tracking-widest text-stone-500 uppercase">{label}</span>
                {icon}
            </div>
            <div>
                <div className={`text-2xl font-serif-text font-bold tracking-tight ${textColor}`}>{value}</div>
                {subValue && <div className="text-[10px] text-stone-500 font-mono mt-0.5 italic">{subValue}</div>}
            </div>
        </div>
    );
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Auto Correction Notice */}
      {result.optimizationLog && result.optimizationLog.length > 0 && (
          <div className="w-full bg-indigo-900/30 border border-indigo-500/30 px-3 py-1.5 rounded flex items-center gap-2 animate-fade-in">
              <svg className="w-3 h-3 text-indigo-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/></svg>
              <span className="text-[10px] font-mono text-indigo-200">
                  Engine Auto-Fix: {result.optimizationLog[0]}
              </span>
          </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard 
          label={T.efficiency}
          value={`${result.efficiencyScore}%`}
          type={result.efficiencyScore > 90 ? 'good' : result.efficiencyScore > 75 ? 'warn' : 'danger'}
          icon={<svg className="w-4 h-4 text-stone-500" viewBox="0 0 20 20" fill="currentColor"><path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z"></path><path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"></path></svg>}
        />

        {result.theoreticalCastleTime !== "N/A" ? (
          <MetricCard 
              label={T.castleArrival}
              value={result.theoreticalCastleTime}
              subValue={T.fcOptimized}
              type="info"
              icon={<svg className="w-4 h-4 text-stone-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 9a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zm7-9a1 1 0 011 1v1h1a1 1 0 010 2h-1v1a1 1 0 01-2 0V6h-1a1 1 0 010-2h1V3a1 1 0 011-1zm0 9a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" clipRule="evenodd"></path></svg>}
          />
        ) : (
          <MetricCard 
              label={T.friction}
              value={`${result.stats.idleTime}s`}
              subValue={T.foodShortage}
              type={result.stats.idleTime < 20 ? 'neutral' : 'danger'}
              icon={<svg className="w-4 h-4 text-stone-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd"></path></svg>}
          />
        )}

        {result.sustainabilityStats ? (
            <MetricCard 
              label={`${T.postAge}`}
              value={result.sustainabilityStats.sustainableCount}
              subValue={`Prod: ${result.sustainabilityStats.unitName}`}
              type="neutral"
              icon={<svg className="w-4 h-4 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
            />
        ) : (
          <MetricCard 
              label={T.survival}
              value={`${result.survivalRating}%`}
              subValue={T.vsOpponent}
              type={result.survivalRating > 50 ? 'good' : 'danger'}
              icon={<svg className="w-4 h-4 text-stone-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd"></path></svg>}
          />
        )}

        <button 
          onClick={onGetReport}
          disabled={isGeneratingReport}
          className="group relative overflow-hidden bg-stone-900 border border-stone-700 hover:border-yellow-600 transition-colors flex flex-col items-center justify-center p-3 cursor-pointer shadow-lg"
        >
          {isGeneratingReport ? (
              <svg className="animate-spin h-6 w-6 text-yellow-600 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
          ) : (
              <>
                  <div className="p-2 rounded-full bg-stone-800 group-hover:bg-yellow-700 transition-colors mb-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-stone-400 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                  </div>
                  <span className="text-[10px] font-bold font-cinzel uppercase tracking-wider text-stone-400 group-hover:text-yellow-500">
                      {T.reportBtn}
                  </span>
              </>
          )}
        </button>

      </div>
    </div>
  );
};

export default Metrics;
