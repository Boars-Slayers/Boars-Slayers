
import React, { useState } from 'react';
import { UserProfile, Language } from '../types';
import { fetchUserProfile } from '../services/userStatsService';
import { TRANSLATIONS } from '../constants';

interface Props {
  onClose: () => void;
  onProfileLoaded: (profile: UserProfile) => void;
  language: Language;
}

const ProfileModal: React.FC<Props> = ({ onClose, onProfileLoaded, language }) => {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const T = TRANSLATIONS[language].ui;

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;

    setLoading(true);
    setError('');

    try {
      const profile = await fetchUserProfile(identifier);
      if (profile) {
        onProfileLoaded(profile);
        onClose();
      } else {
        setError('Profile not found.');
      }
    } catch (err) {
      setError('Connection Error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-stone-900 border border-yellow-700/50 rounded-lg shadow-2xl w-full max-w-md overflow-hidden relative animate-fade-in-up">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-stone-900 to-stone-800 p-5 border-b border-yellow-800/30 flex justify-between items-center">
          <h2 className="text-lg font-cinzel font-bold text-gold uppercase tracking-widest flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            Commander Login
          </h2>
          <button onClick={onClose} className="text-stone-500 hover:text-stone-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-sm text-stone-400 mb-4 font-serif-text italic">
            {language === 'ES' 
                ? "Conecta tu perfil de AoE II para que la IA personalice sus consejos basándose en tus estadísticas reales." 
                : "Connect your AoE II Profile to let AI personalize advice based on your actual stats."}
          </p>
          
          <form onSubmit={handleFetch} className="space-y-4">
            <div>
               <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Steam ID / Username</label>
               <input 
                 type="text" 
                 value={identifier}
                 onChange={(e) => setIdentifier(e.target.value)}
                 placeholder="e.g. TheViper, Hera..."
                 className="w-full bg-stone-950 border border-stone-700 rounded p-3 text-stone-200 outline-none focus:border-yellow-600 transition-colors"
                 autoFocus
               />
            </div>
            
            {error && <p className="text-xs text-red-400 font-bold">{error}</p>}

            <button 
              type="submit" 
              disabled={loading || !identifier.trim()}
              className="w-full bg-yellow-900/30 hover:bg-yellow-800/50 border border-yellow-700/50 text-gold font-cinzel font-bold py-3 rounded uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {loading ? (
                 <>
                   <svg className="animate-spin h-4 w-4 text-gold" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Syncing...
                 </>
              ) : (
                 "Link Profile"
              )}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-stone-800 text-center">
            <p className="text-[10px] text-stone-600">
               Powered by AoE II Insights (Simulated for Demo)
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProfileModal;
