
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Civilization, Difficulty, StrategyFocus, Tightness, SimulationConfig, SimulationResult, TacticalReport, UnitClass, UserProfile } from "../types";
import { COUNTER_MATRIX, TEAM_BONUSES, UNIT_DATABASE } from "../constants";
import { fetchGlobalMetaStats } from "./statsService";

export interface AIAnalysisResult {
  config: Partial<SimulationConfig>;
  explanation: string;
  counterStrategy?: string;
}

const civOptions = Object.values(Civilization).join(', ');
const strategyOptions = Object.values(StrategyFocus).join(', ');
const difficultyOptions = Object.values(Difficulty).join(', ');
const tightnessOptions = Object.values(Tightness).join(', ');

// Helper to serialize the Counter Matrix for the AI Context
const getCounterContext = () => {
    return JSON.stringify(COUNTER_MATRIX);
};

// Helper to get Team Bonuses Context
const getTeamBonusContext = () => {
    return JSON.stringify(TEAM_BONUSES);
};

// --- LOGIC: INTERNAL COMBAT MATH CALCULATOR ---
const calculateCombatMath = (strategy: StrategyFocus, opponentStrategy: string) => {
    // 1. Identify Player Unit
    let playerUnit = 'Villager';
    let pClass = UnitClass.VILLAGER;
    if (strategy === StrategyFocus.ARCHERS) { playerUnit = 'Archer'; pClass = UnitClass.ARCHER; }
    else if (strategy === StrategyFocus.SCOUTS) { playerUnit = 'Scout Cavalry'; pClass = UnitClass.CAVALRY; }
    else if (strategy === StrategyFocus.MAN_AT_ARMS) { playerUnit = 'Man-at-Arms'; pClass = UnitClass.INFANTRY; }
    else if (strategy === StrategyFocus.FAST_CASTLE) { playerUnit = 'Knight'; pClass = UnitClass.CAVALRY; }

    // 2. Identify Opponent Unit (Guess)
    let oppUnit = 'Villager';
    let oppClass = UnitClass.VILLAGER;
    if (opponentStrategy.includes("Archers")) { oppUnit = 'Archer'; oppClass = UnitClass.ARCHER; }
    else if (opponentStrategy.includes("Scouts")) { oppUnit = 'Scout Cavalry'; oppClass = UnitClass.CAVALRY; }
    else if (opponentStrategy.includes("Drush")) { oppUnit = 'Militia'; oppClass = UnitClass.INFANTRY; }
    
    // 3. Check Counter Matrix
    const counters = COUNTER_MATRIX[pClass] || [];
    const isCountered = counters.includes(oppClass);
    
    // Inverse Check
    const oppCounters = COUNTER_MATRIX[oppClass] || [];
    const countersOpp = oppCounters.includes(pClass);

    let winRate = 50;
    let advantage = "Neutral";

    if (countersOpp) {
        winRate = 75;
        advantage = "Strong Advantage";
    } else if (isCountered) {
        winRate = 25;
        advantage = "Hard Countered";
    }

    return {
        playerUnit,
        opponentUnitGuess: oppUnit,
        winRate,
        advantage
    };
};


export const analyzeStrategicRequest = async (userPrompt: string, language: 'ES' | 'EN'): Promise<AIAnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelId = 'gemini-2.5-flash';
  
  const langInstruction = language === 'ES' 
    ? "Provide the 'explanation' and 'counterStrategy' fields strictly in Spanish." 
    : "Provide the 'explanation' and 'counterStrategy' fields strictly in English.";

  const systemInstruction = `
    You are the Strategy Director for an Advanced AoE2 Simulation Engine.
    
    ENGINE CAPABILITIES (DO NOT MICRO-MANAGE THESE):
    - The Engine uses Goal-Oriented Action Planning (GOAP).
    - It AUTOMATICALLY handles farming transitions, woodline depth, and military production queues.
    - It balances economy dynamically based on the 'Strategy' and 'Tightness' you select.
    
    YOUR ROLE:
    Interpret the user's strategic INTENT and map it to the optimal high-level configuration.

    The Engine requires specific Enum values. Map the user's intent to these exact values:
    - Civilizations: ${civOptions}
    - Strategies: ${strategyOptions}
    - Difficulty: ${difficultyOptions}
    - Tightness: ${tightnessOptions}

    KNOWLEDGE BASE INJECTION:
    1. **Counter Matrix**: Use this to recommend strategies against opponents. 
       ${getCounterContext()}
    2. **Team Bonuses**: Consider these when the user mentions team games.
       ${getTeamBonusContext()}
    
    INSTRUCTIONS:
    1. **Strategy Matching**: 
       - "Red Phosphoru" / "Turk Fast Imp" -> 'FAST_CASTLE' (closest engine equivalent).
       - "Flush" -> 'ARCHERS' or 'SCOUTS'.
    2. **Population Optimization**: 
       - If the user asks for "26 pop archers", suggest a tighter pop (e.g., 22) in 'targetPop' for efficiency, unless they explicitly say "Safe".
       - Standard Meta: Scouts (20-21), Archers (21-23), FC (25-28).
    3. **Explanation**: Briefly explain WHY you chose this config. E.g. "I've configured the engine for a 21-pop Scouts opening to exploit the Mongol hunting bonus."
    4. **Counter Strategy**: If the user asks about a matchup, provide strategic advice.

    ${langInstruction}
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      config: {
        type: Type.OBJECT,
        properties: {
          civilization: { type: Type.STRING, enum: Object.values(Civilization) },
          difficulty: { type: Type.STRING, enum: Object.values(Difficulty) },
          tightness: { type: Type.STRING, enum: Object.values(Tightness) },
          strategy: { type: Type.STRING, enum: Object.values(StrategyFocus) },
          targetPop: { type: Type.INTEGER },
          useStragglerTrees: { type: Type.BOOLEAN },
          lureDeer: { type: Type.BOOLEAN },
        },
        required: ['civilization', 'strategy', 'targetPop']
      },
      explanation: { type: Type.STRING },
      counterStrategy: { type: Type.STRING }
    },
    required: ['config', 'explanation']
  };

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.3, 
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as AIAnalysisResult;
    }
    throw new Error("No response text from AI");
  } catch (error) {
    console.error("AI Service Error:", error);
    // Fallback or rethrow
    throw error;
  }
};

export const analyzeSimulationResult = async (result: SimulationResult, config: SimulationConfig, userProfile?: UserProfile | null): Promise<TacticalReport> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelId = 'gemini-2.5-flash';
  const language = config.language;

  // 1. Calculate Theoretical Combat Math (Internal)
  const combatMath = calculateCombatMath(config.strategy, config.opponentStrategy);

  // 2. Fetch Global Meta Data (External/Simulated API)
  const metaStats = await fetchGlobalMetaStats(config.civilization, config.mapType, config.strategy, config.opponentStrategy);

  const langInstruction = language === 'ES' 
    ? "Provide the 'summary' and 'tips' strictly in Spanish." 
    : "Provide the 'summary' and 'tips' strictly in English.";

  let playerContext = "";
  if (userProfile) {
      const civStat = userProfile.topCivs.find(c => c.civ === config.civilization) || userProfile.weakCivs.find(c => c.civ === config.civilization);
      playerContext = `
        COMMANDER PROFILE ACTIVE: ${userProfile.name} (ELO: ${userProfile.elo})
        User Win Rate with ${config.civilization}: ${civStat ? civStat.winRate + '%' : 'Unknown (No Data)'}
        Global Meta Win Rate with ${config.civilization}: ${metaStats.winRate}%

        INSTRUCTION: Compare the User's personal performance vs the Global Meta.
        - If User WR < Meta WR: Warn them they are underperforming with this civ compared to the average.
        - If User WR > Meta WR: Praise them for defying the odds.
        - Adjust tips based on their ELO (Low ELO = Focus on Eco/Idle Time. High ELO = Focus on timings).
      `;
  }

  const systemInstruction = `
    You are a highly critical Age of Empires II esports coach reviewing an autonomous engine run.
    
    Telemetry:
    - Strategy: ${config.strategy}
    - Civ: ${config.civilization}
    - Feudal Time: ${result.theoreticalFeudalTime}
    - Idle TC Time: ${result.stats.idleTime}s (Critical Metric)
    - Auto-Corrections made by Engine: ${JSON.stringify(result.optimizationLog)}
    
    Combat Analysis (Theoretical):
    - Player Unit: ${combatMath.playerUnit}
    - Advantage: ${combatMath.advantage}
    
    Global Meta Data (Real World Stats):
    - Win Rate: ${metaStats.winRate}% (Tier ${metaStats.tier})
    - Trend: ${metaStats.trending}
    
    ${playerContext}

    Output a structured report:
    1. Grade: S (Perfect), A (Competitive), B (Viable), C (Weak), D (Fail).
    2. Summary: Commentary on the engine's allocation AND the meta viability. If Win Rate is low (<48%) but execution is perfect, warn the user that the Civ/Strat combo is risky despite good execution. Include User Profile nuances if available.
    3. Meta Comparison: Compare key metrics vs Pro Standard.
    4. Tips: 3 specific actionable tips.

    ${langInstruction}
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      grade: { type: Type.STRING, enum: ["S", "A", "B", "C", "D", "F"] },
      summary: { type: Type.STRING },
      metaComparison: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            metric: { type: Type.STRING },
            userValue: { type: Type.STRING },
            metaValue: { type: Type.STRING },
            status: { type: Type.STRING, enum: ["AHEAD", "ON_TRACK", "BEHIND"] }
          },
          required: ["metric", "userValue", "metaValue", "status"]
        }
      },
      tips: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    },
    required: ["grade", "summary", "metaComparison", "tips"]
  };

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `Analyze this run: ${JSON.stringify(result.stats)}`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.4,
      },
    });

    if (response.text) {
      const parsed = JSON.parse(response.text) as TacticalReport;
      // Inject Math & Meta into result
      parsed.combatAnalysis = combatMath;
      parsed.globalMeta = metaStats;
      return parsed;
    }
    throw new Error("No report generated");
  } catch (error) {
    console.error("AI Analysis Error:", error);
    throw error;
  }
}
