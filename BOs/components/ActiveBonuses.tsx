
import React from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface Props {
  bonuses: string[];
  language: Language;
}

const ActiveBonuses: React.FC<Props> = ({ bonuses, language }) => {
  const T = TRANSLATIONS[language].bonuses;
  if (bonuses.length === 0) return null;

  return (
    <div className="bg-slate-900 border border-slate-700 p-4 rounded-lg">
      <h4 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
        </svg>
        {T.title}
      </h4>
      <div className="flex flex-wrap gap-2">
        {bonuses.map((bonus, idx) => (
          <span 
            key={idx} 
            className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-slate-300 font-mono shadow-sm"
          >
            {bonus}
          </span>
        ))}
      </div>
    </div>
  );
};

export default ActiveBonuses;
