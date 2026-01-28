
import React, { useState, useEffect, useRef } from 'react';
import { BuildStep, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { speak, generateStepSpeech, playTick } from '../services/audioService';

interface Props {
  steps: BuildStep[];
  onClose: () => void;
  language: Language;
}

const BuildAssistant: React.FC<Props> = ({ steps, onClose, language }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [gameTime, setGameTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const T = TRANSLATIONS[language].assistant;

  // Cleanup audio on unmount
  useEffect(() => {
      return () => {
          if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      };
  }, []);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setGameTime(prev => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  // Audio Triggers
  useEffect(() => {
      if (!isRunning || !voiceEnabled) return;
      
      const currentStep = steps[currentStepIndex];
      const timeDiff = currentStep.time - gameTime;
      
      // Countdown cues
      if (timeDiff === 10 || timeDiff === 5) {
          playTick();
      }
      
      // Auto-speak next step if we just advanced (manual or auto logic could be added)
  }, [gameTime, isRunning, voiceEnabled, steps, currentStepIndex]);

  // Speak when step changes
  useEffect(() => {
      if (voiceEnabled && isRunning && !isFinished) {
          const text = generateStepSpeech(steps[currentStepIndex], language);
          speak(text, language);
      }
  }, [currentStepIndex, voiceEnabled, isRunning, isFinished, language, steps]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const currentStep = steps[currentStepIndex];
  const nextStep = steps[currentStepIndex + 1];

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      setIsFinished(true);
      setIsRunning(false);
      if (voiceEnabled) speak(language === 'ES' ? "Orden de construcción completada." : "Build order complete.", language);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const timeDiff = gameTime - currentStep.time;
  const isLate = timeDiff > 5;
  const isAhead = timeDiff < -5;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
        
        {/* Header / Timer */}
        <div className="bg-slate-800 p-6 flex justify-between items-center border-b border-slate-700 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${isRunning ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`}></span>
              {T.title}
            </h2>
          </div>
          <div className="flex items-center gap-6">
             <button 
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className={`p-2 rounded-full transition-colors ${voiceEnabled ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-700 text-slate-500'}`}
                title="Toggle Voice Coach"
             >
                {voiceEnabled ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
                )}
             </button>
             <div className="text-right">
                <div className="text-4xl font-mono font-black text-white tracking-widest">
                {formatTime(gameTime)}
                </div>
                <div className="text-xs text-slate-400 font-mono uppercase">{T.gameTime}</div>
             </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-8 text-center flex-1 flex flex-col justify-center items-center relative overflow-y-auto">
          
          {isFinished ? (
            <div className="animate-fade-in">
              <div className="text-6xl mb-4">🏆</div>
              <h3 className="text-3xl font-bold text-white mb-2">{T.complete}</h3>
              <p className="text-slate-400">{T.finalTime}: {formatTime(gameTime)}</p>
            </div>
          ) : (
            <>
              {/* Step Counter */}
              <div className="absolute top-4 left-6 text-xs font-mono text-slate-500">
                {T.step} {currentStepIndex + 1} / {steps.length}
              </div>

              {/* Target Time & Delta */}
              <div className="mb-8 font-mono text-sm">
                 <span className="text-slate-400">{T.target}: {formatTime(currentStep.time)}</span>
                 <span className={`ml-3 font-bold px-2 py-0.5 rounded ${
                   isLate ? 'bg-red-900/50 text-red-400' : isAhead ? 'bg-emerald-900/50 text-emerald-400' : 'bg-slate-800 text-slate-300'
                 }`}>
                   {timeDiff > 0 ? `+${timeDiff}s` : `${timeDiff}s`}
                 </span>
              </div>

              {/* Instruction */}
              <h3 className="text-3xl md:text-5xl font-bold text-white mb-8 leading-tight drop-shadow-lg">
                {currentStep.instruction}
              </h3>

              {/* Resources Required */}
              <div className="flex gap-6 justify-center mb-8 bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                <div className="flex flex-col items-center min-w-[60px]">
                  <span className="text-red-400 font-bold text-2xl">{currentStep.resources.food}</span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">Food</span>
                </div>
                <div className="flex flex-col items-center min-w-[60px]">
                  <span className="text-emerald-400 font-bold text-2xl">{currentStep.resources.wood}</span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">Wood</span>
                </div>
                <div className="flex flex-col items-center min-w-[60px]">
                  <span className="text-yellow-400 font-bold text-2xl">{currentStep.resources.gold}</span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">Gold</span>
                </div>
                <div className="flex flex-col items-center border-l border-slate-600 pl-6 min-w-[60px]">
                  <span className="text-indigo-400 font-bold text-2xl">{currentStep.population}</span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">Pop</span>
                </div>
              </div>

              {/* Next Step Preview */}
              {nextStep && (
                <div className="bg-slate-800/50 rounded-lg p-3 w-full max-w-md border border-slate-700/50 transition-all opacity-60 hover:opacity-100">
                  <span className="text-xs text-slate-500 uppercase font-bold block mb-1">{T.upNext}</span>
                  <div className="text-slate-300 text-sm truncate">
                    {nextStep.instruction}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Controls */}
        <div className="bg-slate-800 p-6 border-t border-slate-700 flex justify-between items-center gap-4 shrink-0">
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white font-medium text-sm transition-colors uppercase tracking-widest text-xs"
          >
            {T.exit}
          </button>

          <div className="flex gap-4 items-center">
             {!isRunning && !isFinished ? (
               <button 
                 onClick={() => { setIsRunning(true); if(voiceEnabled) speak(language === 'ES' ? "Iniciando partida." : "Starting game.", language); }}
                 className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-lg font-bold shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 flex items-center gap-2"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                 {T.start}
               </button>
             ) : (
               <button 
                  onClick={() => setIsRunning(!isRunning)}
                  className={`p-3 rounded-full border ${isRunning ? 'border-yellow-500 text-yellow-500 hover:bg-yellow-500/10' : 'border-emerald-500 text-emerald-500 hover:bg-emerald-500/10'} transition-colors`}
               >
                  {isRunning ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  )}
               </button>
             )}

             <button 
               onClick={handlePrev}
               disabled={currentStepIndex === 0}
               className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white px-4 py-3 rounded-lg font-bold transition-colors"
             >
               {T.prev}
             </button>

             <button 
               onClick={handleNext}
               disabled={isFinished}
               className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-8 py-3 rounded-lg font-bold shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 flex items-center gap-2"
             >
               {isFinished ? T.done : T.next}
               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
             </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BuildAssistant;
