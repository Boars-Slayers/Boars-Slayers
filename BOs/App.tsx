

import React, { useState, useMemo, useEffect, useRef } from 'react';
import ConfigPanel from './components/ConfigPanel';
import ResourceChart from './components/ResourceChart';
import VillagerChart from './components/VillagerChart';
import EfficiencyChart from './components/EfficiencyChart';
import BuildOrderTable from './components/BuildOrderTable';
import ConceptMap from './components/ConceptMap';
import Metrics from './components/Metrics';
import AIQueryPanel from './components/AIQueryPanel';
import TacticalReport from './components/TacticalReport';
import ActiveBonuses from './components/ActiveBonuses';
import ClashTimeline from './components/ClashTimeline';
import RunHistory from './components/RunHistory';
import BuildAssistant from './components/BuildAssistant';
import ProfileModal from './components/ProfileModal';
import DraftModal from './components/DraftModal';
import CivEmblem from './components/CivEmblem';
import MapVisualizer from './components/MapVisualizer';
import { SimulationConfig, Civilization, Difficulty, StrategyFocus, Tightness, TacticalReport as TacticalReportType, MapType, OpponentStrategy, SimulationResult, Language, UserProfile } from './types';
import { runSimulation } from './services/simulationEngine';
import { analyzeStrategicRequest, analyzeSimulationResult, AIAnalysisResult } from './services/aiService';
import { TRANSLATIONS } from './constants';

const App: React.FC = () => {
  // Load initial state with robust validation
  const [config, setConfig] = useState<SimulationConfig>(() => {
    const defaultConfig: SimulationConfig = {
      civilization: Civilization.GENERIC,
      difficulty: Difficulty.ADVANCED,
      tightness: Tightness.STANDARD,
      strategy: StrategyFocus.SCOUTS,
      opponentStrategy: OpponentStrategy.PASSIVE,
      targetPop: 21,
      useStragglerTrees: true,
      lureDeer: true,
      mapType: MapType.ARABIA,
      language: 'ES'
    };

    try {
        // 1. Try URL Hash (Share)
        if (typeof window !== 'undefined' && window.location.hash.startsWith('#build=')) {
            const encoded = window.location.hash.replace('#build=', '');
            const decoded = JSON.parse(atob(encoded));
            // Validate basic structure
            if (decoded && decoded.civilization && Object.values(Civilization).includes(decoded.civilization)) {
                 return { ...defaultConfig, ...decoded, language: 'ES' };
            }
        }

        // 2. Try Local Storage
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('aoe2_optimizer_config');
            if (saved) {
              const parsed = JSON.parse(saved);
              // Validate Critical Enums to prevent crash in CivEmblem or Engine
              if (parsed.civilization && Object.values(Civilization).includes(parsed.civilization)) {
                  return { ...defaultConfig, ...parsed, language: parsed.language || 'ES' };
              }
            }
        }
    } catch (e) {
        console.error("Failed to load config, reverting to default:", e);
    }
    
    return defaultConfig;
  });

  const [aiState, setAiState] = useState<{
    loading: boolean;
    result: AIAnalysisResult | null;
    error: string | null;
  }>({ loading: false, result: null, error: null });

  const [reportState, setReportState] = useState<{
    loading: boolean;
    data: TacticalReportType | null;
  }>({ loading: false, data: null });

  const [baselineResult, setBaselineResult] = useState<SimulationResult | null>(null);
  const [activeTab, setActiveTab] = useState<'visuals' | 'steps' | 'map'>('visuals');
  const [chartType, setChartType] = useState<'resources' | 'villagers' | 'efficiency'>('resources');
  const [showAssistant, setShowAssistant] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  
  // Phase 10: Interactive Timeline
  const [playbackTime, setPlaybackTime] = useState<number>(0);

  // Phase 12: Playback Engine & Cinema Mode
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [cinemaMode, setCinemaMode] = useState(false);
  const playbackRef = useRef<number | null>(null);

  // Persist config
  useEffect(() => {
    try {
      localStorage.setItem('aoe2_optimizer_config', JSON.stringify(config));
    } catch (e) {
      console.error("Failed to save config", e);
    }
  }, [config]);

  // Run Simulation
  const result = useMemo(() => {
    return runSimulation(config);
  }, [config]);

  const maxTime = result.resourceCurve[result.resourceCurve.length - 1]?.time || 1200;

  // Update playback time when result changes (reset to end)
  useEffect(() => {
      if (result) {
          setPlaybackTime(maxTime);
          setIsPlaying(false);
      }
  }, [result.id]);

  // Playback Loop
  useEffect(() => {
    if (isPlaying) {
      playbackRef.current = window.setInterval(() => {
        setPlaybackTime(prev => {
          if (prev >= maxTime) {
            setIsPlaying(false);
            return maxTime;
          }
          return Math.min(maxTime, prev + (1 * playbackSpeed));
        });
      }, 50); // 20fps update
    } else if (playbackRef.current) {
      clearInterval(playbackRef.current);
    }
    return () => {
      if (playbackRef.current) clearInterval(playbackRef.current);
    };
  }, [isPlaying, playbackSpeed, maxTime]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if input focused
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(p => !p);
      }
      if (e.code === 'ArrowLeft') {
        e.preventDefault();
        setPlaybackTime(t => Math.max(0, t - 10));
      }
      if (e.code === 'ArrowRight') {
        e.preventDefault();
        setPlaybackTime(t => Math.min(maxTime, t + 10));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [maxTime]);

  // Clear report when configuration changes
  useEffect(() => {
    if (reportState.data) {
      setReportState({ loading: false, data: null });
    }
  }, [config, reportState.data]);

  const handleAIAnalyze = async (prompt: string) => {
    setAiState({ loading: true, result: null, error: null });
    try {
      const analysis = await analyzeStrategicRequest(prompt, config.language);
      setConfig(prev => ({ ...prev, ...analysis.config }));
      setAiState({ loading: false, result: analysis, error: null });
    } catch (err) {
      setAiState({ loading: false, result: null, error: "AI Error. Try again." });
    }
  };

  const handleGetReport = async () => {
    if (!result) return;
    setReportState({ loading: true, data: null });
    try {
        const report = await analyzeSimulationResult(result, config, userProfile);
        setReportState({ loading: false, data: report });
    } catch (e) {
        setReportState({ loading: false, data: null });
    }
  };

  const handleShare = () => {
      const json = JSON.stringify(config);
      const encoded = btoa(json);
      const url = `${window.location.origin}${window.location.pathname}#build=${encoded}`;
      navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
  };

  const toggleLanguage = () => {
    setConfig(prev => ({ ...prev, language: prev.language === 'ES' ? 'EN' : 'ES' }));
  };

  const getWoodGatheredApproximation = (time: number) => {
      const point = result.efficiencyHistory.find(p => p.time >= time);
      return point ? (point.woodLineDepth * point.woodLineDepth * 500) : 0; 
  };

  const T = TRANSLATIONS[config.language];

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen font-sans pb-12 print:pb-0 transition-all duration-500">
      
      {/* Navbar - Hidden in Cinema Mode */}
      <nav className={`sticky top-0 z-50 glass-panel-heavy border-b-0 border-b-yellow-900 px-6 py-4 flex items-center justify-between mb-6 print:hidden transition-all duration-500 ${cinemaMode ? '-translate-y-full opacity-0 absolute w-full' : 'translate-y-0 opacity-100'}`}>
        <div className="flex items-center gap-4">
          <CivEmblem civ={config.civilization} size="md" />
          <div>
            <h1 className="text-xl font-cinzel font-bold text-gold tracking-wide leading-none">{T.header.title}</h1>
            <span className="text-[10px] text-stone-500 uppercase tracking-[0.2em]">{T.header.subtitle}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
           
           {/* Profile Button */}
           <button 
             onClick={() => setShowProfileModal(true)}
             className={`flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs font-bold border transition-colors uppercase ${userProfile ? 'bg-indigo-900/40 border-indigo-500 text-indigo-300' : 'bg-stone-900 border-stone-700 text-stone-400 hover:text-gold hover:border-yellow-700'}`}
           >
             {userProfile ? (
                 <>
                   <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                   <span>{userProfile.name}</span>
                 </>
             ) : (
                 <>
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                   <span>Login</span>
                 </>
             )}
           </button>

           <div className="h-6 w-px bg-stone-700 mx-1"></div>

           {/* War Room (Draft) Button */}
           <button 
             onClick={() => setShowDraftModal(true)}
             className="px-3 py-1.5 bg-red-900/20 border border-red-900/50 hover:bg-red-900/40 hover:border-red-600 rounded-sm text-xs font-bold text-red-400 transition-colors uppercase flex items-center gap-1 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
           >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7 2a1 1 0 011 1v1h3a1 1 0 110 2H9.578a18.89 18.89 0 01-.224-2.386A8 8 0 002.492 12L3 12.5A.5.5 0 003.5 13h12a.5.5 0 00.5-.5l.5-.5a8 8 0 00-7.086-7.886A18.89 18.89 0 019.578 2H12a1 1 0 011-1H7zM3 14a1 1 0 011-1h12a1 1 0 011 1v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2z" />
              </svg>
              {T.ui.warRoom}
           </button>

           <button onClick={handleShare} className="px-3 py-1.5 border border-stone-700 bg-stone-900 rounded-sm text-xs font-bold text-emerald-500 hover:text-emerald-400 hover:border-emerald-600 transition-colors uppercase flex items-center gap-1">
              {shareCopied ? (
                 <span>{T.ui.shareCopied}</span>
              ) : (
                 <>
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                   {T.ui.share}
                 </>
              )}
           </button>

           <button onClick={toggleLanguage} className="px-3 py-1.5 border border-stone-700 bg-stone-900 rounded-sm text-xs font-bold text-stone-400 hover:text-gold hover:border-yellow-700 transition-colors uppercase">
              {config.language === 'ES' ? 'ESP' : 'ENG'}
           </button>
           <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-1.5 bg-yellow-900/20 hover:bg-yellow-800/30 border border-yellow-700/30 hover:border-yellow-600 rounded-sm text-xs font-bold text-yellow-600 transition-all group uppercase tracking-wider">
              <span>{T.header.export}</span>
           </button>
        </div>
      </nav>

      <main className="max-w-[1800px] mx-auto px-4 sm:px-6 relative z-10 transition-all duration-500">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: COMMAND CENTER (Sticky) - Hides in Cinema Mode */}
          <div className={`lg:col-span-4 space-y-6 lg:sticky lg:top-28 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto custom-scrollbar pr-1 print:hidden transition-all duration-500 ${cinemaMode ? 'w-0 opacity-0 overflow-hidden lg:col-span-0' : 'opacity-100'}`}>
            
            {/* AI Assistant */}
            <div className="animate-fade-in">
               <AIQueryPanel onAnalyze={handleAIAnalyze} isAnalyzing={aiState.loading} language={config.language} />
            </div>

            {aiState.result && (
              <div className="bg-stone-900/80 border border-yellow-900/50 rounded p-4 animate-fade-in relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-yellow-700"></div>
                <div className="pl-3">
                    <p className="text-sm text-stone-300 font-serif-text italic">"{aiState.result.explanation}"</p>
                    {aiState.result.counterStrategy && (
                      <div className="mt-3 pt-2 border-t border-stone-800">
                        <span className="text-[10px] font-bold text-yellow-600 uppercase tracking-widest block mb-1">Strategic Advice</span>
                        <p className="text-xs text-stone-400">{aiState.result.counterStrategy}</p>
                      </div>
                    )}
                </div>
              </div>
            )}

            {/* Config Panel */}
            <ConfigPanel config={config} onChange={setConfig} />

            {/* Run History */}
            <RunHistory 
                currentResult={result} 
                baselineResult={baselineResult} 
                onSetBaseline={setBaselineResult}
                language={config.language} 
            />

            {/* Reset */}
            <div className="text-center pt-4 opacity-50 hover:opacity-100 transition-opacity">
              <button 
                onClick={() => { if(confirm("Reset Codex?")) { localStorage.removeItem('aoe2_optimizer_config'); window.location.hash = ""; window.location.reload(); } }}
                className="text-[10px] text-red-900/50 hover:text-red-500 font-cinzel font-bold uppercase tracking-widest"
              >
                {T.ui.factoryReset}
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: VISUALIZATION & DATA */}
          <div className={`space-y-6 transition-all duration-500 ${cinemaMode ? 'lg:col-span-12' : 'lg:col-span-8'}`}>
            
            {/* HUD: Metrics Cards - Hidden in Cinema Mode */}
            <div className={`break-inside-avoid transition-all duration-500 ${cinemaMode ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`}>
               <Metrics 
                    result={result} 
                    baseline={baselineResult}
                    onGetReport={handleGetReport} 
                    isGeneratingReport={reportState.loading}
                    language={config.language} 
                />
            </div>

            {/* Report Overlay */}
            {reportState.data && (
                <div className="break-before animate-fade-in-up">
                    <TacticalReport 
                        report={reportState.data} 
                        onClose={() => setReportState({ loading: false, data: null })}
                        language={config.language}
                    />
                </div>
            )}

            {/* Main Content Tabs */}
            <div className={`glass-panel border-0 border-t border-yellow-900/30 rounded-lg overflow-hidden shadow-2xl bg-black print:bg-white print:border-none print:shadow-none transition-all duration-500 ${cinemaMode ? 'h-[90vh]' : ''}`}>
               <div className="flex bg-stone-900 border-b border-stone-800 print:hidden relative">
                  <button 
                    onClick={() => setActiveTab('visuals')}
                    className={`flex-1 py-4 text-xs font-bold font-cinzel uppercase tracking-widest transition-all ${activeTab === 'visuals' ? 'bg-stone-800 text-gold border-b-2 border-yellow-600' : 'text-stone-500 hover:text-stone-300 hover:bg-stone-800/50'}`}
                  >
                    Telemetry
                  </button>
                  <button 
                    onClick={() => setActiveTab('map')}
                    className={`flex-1 py-4 text-xs font-bold font-cinzel uppercase tracking-widest transition-all ${activeTab === 'map' ? 'bg-stone-800 text-gold border-b-2 border-yellow-600' : 'text-stone-500 hover:text-stone-300 hover:bg-stone-800/50'}`}
                  >
                    Concept Map (New)
                  </button>
                  <button 
                    onClick={() => setActiveTab('steps')}
                    className={`flex-1 py-4 text-xs font-bold font-cinzel uppercase tracking-widest transition-all ${activeTab === 'steps' ? 'bg-stone-800 text-gold border-b-2 border-yellow-600' : 'text-stone-500 hover:text-stone-300 hover:bg-stone-800/50'}`}
                  >
                    Codex Table
                  </button>

                  {/* Cinema Mode Toggle */}
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <button 
                        onClick={() => setCinemaMode(!cinemaMode)}
                        className="p-2 text-stone-500 hover:text-gold transition-colors"
                        title={T.ui.cinemaMode}
                      >
                         {cinemaMode ? (
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" /></svg>
                         ) : (
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" /></svg>
                         )}
                      </button>
                  </div>
               </div>

               <div className={`relative bg-stone-950 print:bg-white print:min-h-0 transition-all duration-500 ${cinemaMode ? 'h-full flex flex-col' : 'min-h-[600px]'}`}>
                 
                 {/* VISUALS TAB */}
                 {activeTab === 'visuals' && (
                    <div className={`p-4 space-y-6 animate-fade-in print:hidden ${cinemaMode ? 'flex-1 grid grid-cols-2 gap-6' : ''}`}>
                       <div className={`${cinemaMode ? 'col-span-1 h-full' : 'grid grid-cols-1 md:grid-cols-3 gap-4'}`}>
                           {/* MAP TACTICIAN */}
                           <div className={`${cinemaMode ? 'h-full' : 'col-span-1 h-[250px]'} relative group`}>
                                <div className="absolute -top-3 left-2 z-10">
                                     <span className="bg-stone-900 border border-stone-700 px-2 py-0.5 text-[10px] font-bold text-emerald-500 uppercase tracking-wider shadow-md">
                                        Map Tactician (Live)
                                     </span>
                                </div>
                                <MapVisualizer 
                                    mapType={config.mapType} 
                                    civ={config.civilization} 
                                    woodLineDepth={result.stats.woodLineDepth} 
                                    currentTime={playbackTime}
                                    totalWoodGatheredAtTime={getWoodGatheredApproximation(playbackTime)}
                                    steps={result.steps}
                                />
                           </div>

                           {/* CHARTS CONTAINER */}
                           <div className={`${cinemaMode ? 'col-span-1 h-full' : 'col-span-2 h-[250px]'} bg-stone-900/30 rounded border border-stone-800 p-2 relative`}>
                               <div className="absolute top-2 right-2 z-10 flex gap-1">
                                    {(['resources', 'villagers', 'efficiency'] as const).map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => setChartType(t)}
                                            className={`px-2 py-1 rounded-sm text-[8px] uppercase font-bold tracking-wide transition-all border ${chartType === t ? 'bg-yellow-900/30 text-gold border-yellow-700' : 'bg-transparent text-stone-600 border-stone-800 hover:border-stone-600'}`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                               </div>
                                {chartType === 'resources' && <ResourceChart data={result.resourceCurve} baselineData={baselineResult?.resourceCurve} language={config.language} currentTime={playbackTime} />}
                                {chartType === 'villagers' && <VillagerChart data={result.resourceCurve} language={config.language} />}
                                {chartType === 'efficiency' && <EfficiencyChart data={result.efficiencyHistory} language={config.language} />}
                           </div>
                       </div>
                       
                       {/* Expanded Content for Cinema Mode */}
                       {cinemaMode && (
                           <div className="space-y-6 h-full overflow-y-auto custom-scrollbar p-2">
                               <BuildOrderTable steps={result.steps} language={config.language} currentTime={playbackTime} />
                               <ActiveBonuses bonuses={result.activeBonuses} language={config.language} />
                           </div>
                       )}

                       {!cinemaMode && (
                         <>
                            <div className="pt-6 border-t border-stone-800">
                                <ClashTimeline result={result} opponentStrategy={config.opponentStrategy} language={config.language} />
                            </div>
                            <ActiveBonuses bonuses={result.activeBonuses} language={config.language} />
                         </>
                       )}
                    </div>
                 )}
                 
                 {/* CONCEPT MAP TAB */}
                 {activeTab === 'map' && (
                     <div className="w-full h-full animate-fade-in absolute inset-0">
                         <ConceptMap steps={result.steps} language={config.language} />
                     </div>
                 )}

                 {/* STEPS TAB */}
                 {activeTab === 'steps' && (
                   <div className={`relative animate-fade-in flex flex-col print:h-auto print:block ${cinemaMode ? 'h-full' : 'h-[800px]'}`}>
                      <div className="absolute top-4 right-6 z-20 print:hidden">
                        <button 
                          onClick={() => setShowAssistant(true)}
                          className="bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 border border-emerald-600/50 text-xs font-bold px-4 py-2 rounded shadow-lg flex items-center gap-2 transition-transform hover:scale-105"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          {T.assistant.title}
                        </button>
                      </div>
                      <div className="print:block hidden mb-4 p-4 border-b border-black">
                           <h1 className="text-2xl font-bold font-serif text-black">{result.configName}</h1>
                           <div className="flex gap-4 text-xs font-mono mt-2">
                               <span>Pop: {config.targetPop}</span>
                               <span>Map: {config.mapType}</span>
                               {config.allyCivilization && <span>Ally: {config.allyCivilization}</span>}
                           </div>
                      </div>
                      <BuildOrderTable steps={result.steps} language={config.language} currentTime={playbackTime} />
                   </div>
                 )}
                 
                 {/* INTERACTIVE TIMELINE SLIDER (GLOBAL) */}
                 <div className="sticky bottom-0 bg-stone-900 border-t border-yellow-900/30 p-4 print:hidden z-30">
                     <div className="flex items-center gap-4">
                         
                         {/* Play/Pause Button */}
                         <button 
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="w-8 h-8 flex items-center justify-center bg-yellow-900/50 hover:bg-yellow-800/80 text-gold rounded-full transition-all"
                            title="Play/Pause (Space)"
                         >
                             {isPlaying ? (
                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                             ) : (
                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                             )}
                         </button>

                         {/* Speed Controls */}
                         <div className="flex bg-stone-800 rounded-sm overflow-hidden">
                             {[1, 5, 10].map(speed => (
                                 <button
                                    key={speed}
                                    onClick={() => setPlaybackSpeed(speed)}
                                    className={`px-2 py-0.5 text-[10px] font-bold ${playbackSpeed === speed ? 'bg-yellow-800 text-white' : 'text-stone-500 hover:text-stone-300'}`}
                                 >
                                     {speed}x
                                 </button>
                             ))}
                         </div>

                         <span className="text-[10px] font-bold text-yellow-600 font-cinzel uppercase tracking-widest hidden sm:block">Timeline</span>
                         
                         <input 
                            type="range"
                            min="0"
                            max={maxTime}
                            value={playbackTime}
                            onChange={(e) => { setPlaybackTime(Number(e.target.value)); setIsPlaying(false); }}
                            className="flex-1 h-1.5 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-yellow-500 hover:accent-yellow-400"
                         />
                         <span className="text-xs font-mono text-stone-300 w-12 text-right">{formatTime(playbackTime)}</span>
                     </div>
                 </div>

               </div>
            </div>

          </div>
        </div>
        
        {/* Full Screen Assistant Modal */}
        {showAssistant && (
           <BuildAssistant steps={result.steps} onClose={() => setShowAssistant(false)} language={config.language} />
        )}

        {/* Profile Modal */}
        {showProfileModal && (
            <ProfileModal 
                onClose={() => setShowProfileModal(false)}
                onProfileLoaded={setUserProfile}
                language={config.language}
            />
        )}

        {/* Draft Modal */}
        {showDraftModal && (
            <DraftModal
                onClose={() => setShowDraftModal(false)}
                language={config.language}
            />
        )}
      </main>
    </div>
  );
};

export default App;