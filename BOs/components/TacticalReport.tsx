
import React from 'react';
import { TacticalReport as ReportType, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface Props {
  report: ReportType;
  onClose: () => void;
  language: Language;
}

const TacticalReport: React.FC<Props> = ({ report, onClose, language }) => {
  const T = TRANSLATIONS[language].report;

  const getGradeColor = (grade: string) => {
    if (grade === 'S') return 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]';
    if (grade === 'A') return 'text-green-400';
    if (grade === 'B') return 'text-blue-400';
    return 'text-red-400';
  };

  const getStatusColor = (status: string) => {
    if (status === 'AHEAD') return 'text-green-400';
    if (status === 'ON_TRACK') return 'text-blue-400';
    return 'text-red-400';
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 shadow-2xl animate-fade-in relative overflow-hidden">
      {/* Background FX */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>
      
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {T.title}
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">{T.eval}</p>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-500 uppercase tracking-widest block">{T.grade}</span>
          <span className={`text-4xl font-black ${getGradeColor(report.grade)}`}>{report.grade}</span>
        </div>
      </div>

      <div className="space-y-6 relative z-10">
        
        {/* GRID: COMBAT & GLOBAL META */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* COMBAT SIMULATION */}
            {report.combatAnalysis && (
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 p-4 rounded-lg flex items-center justify-between shadow-inner">
                    <div>
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        Theoretical Matchup
                    </h3>
                    <div className="flex flex-col gap-0.5 text-sm">
                            <span className="text-emerald-400 font-bold">{report.combatAnalysis.playerUnit}</span> 
                            <span className="text-[10px] text-slate-600 uppercase font-bold">VS</span> 
                            <span className="text-red-400 font-bold">{report.combatAnalysis.opponentUnitGuess}</span>
                    </div>
                    <div className={`text-xs font-bold mt-2 ${report.combatAnalysis.winRate > 50 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {report.combatAnalysis.advantage.toUpperCase()}
                    </div>
                    </div>
                    <div className="relative w-16 h-16 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90">
                            <circle cx="32" cy="32" r="28" stroke="#1e293b" strokeWidth="4" fill="none" />
                            <circle cx="32" cy="32" r="28" stroke={report.combatAnalysis.winRate > 50 ? "#10b981" : "#ef4444"} strokeWidth="4" fill="none" strokeDasharray={`${report.combatAnalysis.winRate * 1.75} 175`} />
                        </svg>
                        <span className="absolute text-xs font-bold text-slate-300">{report.combatAnalysis.winRate}%</span>
                    </div>
                </div>
            )}

            {/* GLOBAL META PERFORMANCE */}
            {report.globalMeta && (
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 p-4 rounded-lg shadow-inner">
                     <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center justify-between">
                         <span className="flex items-center gap-1">
                             <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                             Global Meta Performance
                         </span>
                         <span className={`px-1.5 py-0.5 rounded text-[10px] border ${report.globalMeta.tier === 'S' || report.globalMeta.tier === 'A' ? 'border-yellow-600 text-yellow-500 bg-yellow-900/20' : 'border-slate-600 text-slate-400'}`}>
                             TIER {report.globalMeta.tier}
                         </span>
                     </h3>
                     
                     <div className="flex items-end justify-between mb-1">
                         <span className="text-2xl font-black text-slate-200">{report.globalMeta.winRate}%</span>
                         <span className="text-[10px] text-slate-500 mb-1">Win Rate</span>
                     </div>
                     
                     <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden mb-2">
                         <div 
                            className={`h-full rounded-full ${report.globalMeta.winRate >= 50 ? 'bg-indigo-500' : 'bg-rose-500'}`} 
                            style={{ width: `${report.globalMeta.winRate}%` }}
                         ></div>
                     </div>
                     
                     <div className="flex justify-between text-[10px] font-mono text-slate-500">
                         <span>Sample: {report.globalMeta.sampleSize}</span>
                         <span className={report.globalMeta.trending === 'UP' ? 'text-green-500' : report.globalMeta.trending === 'DOWN' ? 'text-red-500' : 'text-slate-500'}>
                             Trend: {report.globalMeta.trending}
                         </span>
                     </div>
                </div>
            )}
        </div>

        {/* Summary */}
        <div className="bg-slate-950/50 p-4 rounded border border-slate-800">
          <p className="text-sm text-slate-300 italic">"{report.summary}"</p>
        </div>

        {/* Comparison Table */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Meta Benchmarks</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 text-xs">
                  <th className="pb-2">{T.metric}</th>
                  <th className="pb-2">{T.result}</th>
                  <th className="pb-2">{T.pro}</th>
                  <th className="pb-2 text-right">{T.verdict}</th>
                </tr>
              </thead>
              <tbody>
                {report.metaComparison.map((item, idx) => (
                  <tr key={idx} className="border-b border-slate-800/50">
                    <td className="py-2 text-slate-300">{item.metric}</td>
                    <td className="py-2 font-mono text-indigo-300">{item.userValue}</td>
                    <td className="py-2 font-mono text-slate-500">{item.metaValue}</td>
                    <td className={`py-2 text-right font-bold text-xs ${getStatusColor(item.status)}`}>
                      {item.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tips */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">{T.tips}</h3>
          <ul className="space-y-2">
            {report.tips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-indigo-500 mt-1">➤</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <button 
        onClick={onClose}
        className="mt-6 w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold rounded transition-colors"
      >
        {T.close}
      </button>
    </div>
  );
};

export default TacticalReport;
