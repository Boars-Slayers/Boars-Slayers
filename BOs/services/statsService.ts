import { Civilization, MapType, StrategyFocus, MetaStats, OpponentStrategy } from "../types";

// This service mocks an API call to a stats provider like AoE2Insights or AoECompanion
// In a real app, this would use fetch() to hit an endpoint.

const META_TIERS = {
    S: { min: 54, max: 60 },
    A: { min: 51, max: 54 },
    B: { min: 48, max: 51 },
    C: { min: 45, max: 48 },
    D: { min: 35, max: 45 }
};

// Hardcoded knowledge base of the current meta (Simulated Patch Data)
const CIV_STRENGTHS: Partial<Record<Civilization, Partial<Record<MapType, number>>>> = {
    [Civilization.FRANKS]: { [MapType.ARABIA]: 56, [MapType.ARENA]: 48, [MapType.RUNESTONES]: 55 },
    [Civilization.MAYANS]: { [MapType.ARABIA]: 54, [MapType.ARENA]: 52, [MapType.RUNESTONES]: 53 },
    [Civilization.CHINESE]: { [MapType.ARABIA]: 47, [MapType.ARENA]: 49, [MapType.RUNESTONES]: 48 }, // Hard to play, lower WR for avg player
    [Civilization.TURKS]: { [MapType.ARABIA]: 45, [MapType.ARENA]: 58, [MapType.RUNESTONES]: 44 },
    [Civilization.BOHEMIANS]: { [MapType.ARABIA]: 44, [MapType.ARENA]: 56, [MapType.RUNESTONES]: 45 },
    [Civilization.HUNS]: { [MapType.ARABIA]: 53, [MapType.ARENA]: 42, [MapType.RUNESTONES]: 52 },
    [Civilization.MONGOLS]: { [MapType.ARABIA]: 52, [MapType.ARENA]: 45, [MapType.RUNESTONES]: 51 },
    [Civilization.PORTUGUESE]: { [MapType.ARABIA]: 50, [MapType.ARENA]: 54, [MapType.RUNESTONES]: 50 },
    [Civilization.GURJARAS]: { [MapType.ARABIA]: 55, [MapType.ARENA]: 49, [MapType.RUNESTONES]: 54 },
    [Civilization.BYZANTINES]: { [MapType.ARABIA]: 48, [MapType.ARENA]: 53, [MapType.RUNESTONES]: 49 },
    // Defaults for others handled in logic
};

// Modifiers based on Strategy vs Map
const STRATEGY_MODIFIERS: Record<StrategyFocus, Partial<Record<MapType, number>>> = {
    [StrategyFocus.SCOUTS]: { [MapType.ARABIA]: 2, [MapType.ARENA]: -5, [MapType.RUNESTONES]: 2 },
    [StrategyFocus.ARCHERS]: { [MapType.ARABIA]: 1, [MapType.ARENA]: -2, [MapType.RUNESTONES]: 1 },
    [StrategyFocus.FAST_CASTLE]: { [MapType.ARABIA]: -4, [MapType.ARENA]: 4, [MapType.RUNESTONES]: -3 },
    [StrategyFocus.MAN_AT_ARMS]: { [MapType.ARABIA]: 1, [MapType.ARENA]: -3, [MapType.RUNESTONES]: 1 },
    [StrategyFocus.DRUSH_FC]: { [MapType.ARABIA]: -1, [MapType.ARENA]: 2, [MapType.RUNESTONES]: -1 },
};

export const fetchGlobalMetaStats = async (
    civ: Civilization,
    map: MapType,
    strategy: StrategyFocus,
    opponentStrategy: OpponentStrategy
): Promise<MetaStats> => {
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600));

    // 1. Base Win Rate for Civ on Map
    let baseWinRate = 50;
    const civData = CIV_STRENGTHS[civ]; 
    
    if (civData && civData[map]) {
        baseWinRate = civData[map]!;
    } else {
        // Random variance for generic civs not in hardcoded list
        baseWinRate = 49 + (Math.random() * 2); 
    }

    // 2. Apply Strategy Modifier
    const stratMod = STRATEGY_MODIFIERS[strategy]?.[map] || 0;
    let finalWinRate = baseWinRate + stratMod;

    // 3. Opponent Matchup Swing (Simplified)
    if (opponentStrategy !== OpponentStrategy.PASSIVE) {
        // Meta logic: Aggression usually beats Greed on Open maps
        if (map === MapType.ARABIA && strategy === StrategyFocus.FAST_CASTLE) {
             finalWinRate -= 3;
        }
    }

    // Clamp
    finalWinRate = Math.min(65, Math.max(35, finalWinRate));
    finalWinRate = Math.round(finalWinRate * 10) / 10;

    // Determine Tier
    let tier: MetaStats['tier'] = 'B';
    if (finalWinRate >= META_TIERS.S.min) tier = 'S';
    else if (finalWinRate >= META_TIERS.A.min) tier = 'A';
    else if (finalWinRate >= META_TIERS.B.min) tier = 'B';
    else if (finalWinRate >= META_TIERS.C.min) tier = 'C';
    else tier = 'D';

    return {
        winRate: finalWinRate,
        pickRate: Math.round(Math.random() * 10) + 2, // Simulated pick rate 2-12%
        tier,
        sampleSize: Math.floor(Math.random() * 5000) + 1000,
        trending: Math.random() > 0.5 ? 'UP' : Math.random() > 0.5 ? 'DOWN' : 'STABLE'
    };
};