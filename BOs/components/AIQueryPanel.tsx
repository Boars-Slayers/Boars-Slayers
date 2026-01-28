import React, { useState } from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface Props {
  onAnalyze: (prompt: string) => Promise<void>;
  isAnalyzing: boolean;
  language: Language;
}

const AIQueryPanel: React.FC<Props> = ({ onAnalyze, isAnalyzing, language }) => {
  const [prompt, setPrompt] = useState('');
  const T = TRANSLATIONS[language].ui;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onAnalyze(prompt);
      setPrompt('');
    }
  };

  return (
    <div className="relative group">
      {/* Golden Glow Effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-700 via-yellow-500 to-yellow-700 rounded-lg opacity-30 group-hover:opacity-50 blur transition duration-500"></div>
      
      <div className="relative bg-stone-900 rounded-lg p-1 border border-stone-600">
          <div className="px-3 py-1 flex items-center justify-between">
              <span className="text-[10px] font-cinzel font-bold text-yellow-600 uppercase tracking-widest">Oracle Command</span>
          </div>
          <form onSubmit={handleSubmit} className="flex items-center">
            <div className="pl-3 text-yellow-600/70">
            {isAnalyzing ? (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
            )}
            </div>
            <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={language === 'ES' ? "Ej: Fast Imp con Turcos en Arena..." : "Ex: Fast Imp with Turks on Arena..."}
                className="flex-1 bg-transparent text-stone-200 text-sm px-3 py-3 outline-none placeholder-stone-600 font-serif-text italic"
                disabled={isAnalyzing}
            />
            <button
                type="submit"
                disabled={isAnalyzing || !prompt.trim()}
                className="px-4 py-2 bg-yellow-900/20 hover:bg-yellow-800/40 text-yellow-600 font-cinzel font-bold text-xs rounded transition-colors uppercase border-l border-stone-800"
            >
                {isAnalyzing ? "..." : "Execute"}
            </button>
        </form>
      </div>
    </div>
  );
};

export default AIQueryPanel;