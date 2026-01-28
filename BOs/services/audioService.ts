
import { Language, BuildStep } from "../types";

export const speak = (text: string, language: Language) => {
  if (!('speechSynthesis' in window)) return;

  // Cancel previous utterances
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.1; // Slightly faster for urgency
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  // Select Voice
  const voices = window.speechSynthesis.getVoices();
  const langCode = language === 'ES' ? 'es' : 'en';
  
  // Try to find a specific Google or Microsoft voice for better quality
  const preferredVoice = voices.find(v => 
    v.lang.startsWith(langCode) && (v.name.includes('Google') || v.name.includes('Microsoft'))
  );
  
  const fallbackVoice = voices.find(v => v.lang.startsWith(langCode));

  if (preferredVoice) utterance.voice = preferredVoice;
  else if (fallbackVoice) utterance.voice = fallbackVoice;

  window.speechSynthesis.speak(utterance);
};

export const generateStepSpeech = (step: BuildStep, language: Language): string => {
  // Transform technical step text into natural command
  const isEs = language === 'ES';
  
  const popText = isEs ? `Población ${step.population}.` : `Population ${step.population}.`;
  
  // Clean instruction (remove parenthetical notes for speech)
  let cleanInstruction = step.instruction.replace(/\(.*\)/, '').trim();

  // Custom phrasing map
  if (step.type === 'create') {
      cleanInstruction = isEs ? `Crear aldeano. ${cleanInstruction}` : `Create Villager. ${cleanInstruction}`;
  }
  if (step.type === 'research') {
      cleanInstruction = isEs ? `Investigar ${cleanInstruction} ahora.` : `Research ${cleanInstruction} now.`;
  }
  if (step.type === 'build') {
     // e.g. "Build House" -> "Build a House"
     cleanInstruction = isEs ? `Construir: ${cleanInstruction}` : `Build: ${cleanInstruction}`;
  }

  return `${popText} ${cleanInstruction}`;
};

export const playTick = () => {
    // Simple oscilator beep for countdown
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
};
