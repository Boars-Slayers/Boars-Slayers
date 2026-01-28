

export enum Civilization {
  AZTECS = 'Aztecs',
  BENGALIS = 'Bengalis',
  BERBERS = 'Berbers',
  BOHEMIANS = 'Bohemians',
  BRITONS = 'Britons',
  BULGARIANS = 'Bulgarians',
  BURGUNDIANS = 'Burgundians',
  BURMESE = 'Burmese',
  BYZANTINES = 'Byzantines',
  CELTS = 'Celts',
  CHINESE = 'Chinese',
  CUMANS = 'Cumans',
  DRAVIDIANS = 'Dravidians',
  ETHIOPIANS = 'Ethiopians',
  FRANKS = 'Franks',
  GOTHS = 'Goths',
  GURJARAS = 'Gurjaras',
  HINDUSTANIS = 'Hindustanis',
  HUNS = 'Huns',
  INCAS = 'Incas',
  ITALIANS = 'Italians',
  JAPANESE = 'Japanese',
  KHMER = 'Khmer',
  KOREANS = 'Koreans',
  LITHUANIANS = 'Lithuanians',
  MAGYARS = 'Magyars',
  MALAYS = 'Malays',
  MALIANS = 'Malians',
  MAYANS = 'Mayans',
  MONGOLS = 'Mongols',
  PERSIANS = 'Persians',
  POLES = 'Poles',
  PORTUGUESE = 'Portuguese',
  ROMANS = 'Romans',
  SARACENS = 'Saracens',
  SICILIANS = 'Sicilians',
  SLAVS = 'Slavs',
  SPANISH = 'Spanish',
  TATARS = 'Tatars',
  TEUTONS = 'Teutons',
  TURKS = 'Turks',
  VIETNAMESE = 'Vietnamese',
  VIKINGS = 'Vikings',
  GENERIC = 'Generic',
}

export enum ResourceType {
  FOOD = 'food',
  WOOD = 'wood',
  GOLD = 'gold',
  STONE = 'stone',
}

export enum StrategyFocus {
  SCOUTS = 'Scouts Rush',
  ARCHERS = 'Archers Flush',
  FAST_CASTLE = 'Fast Castle',
  MAN_AT_ARMS = 'Man-at-Arms',
  DRUSH_FC = 'Drush FC',
}

export enum OpponentStrategy {
  PASSIVE = 'Passive / Boom',
  DRUSH = 'Drush (Dark Age Rush)',
  MAN_AT_ARMS = 'Man-at-Arms Rush',
  SCOUTS = 'Scouts Rush',
  ARCHERS = 'Archers Rush',
}

export enum Difficulty {
  BEGINNER = 'Beginner (Low APM)', 
  INTERMEDIATE = 'Intermediate',
  ADVANCED = 'Advanced (Perfect Micro)', 
}

export enum Tightness {
  GREEDY = 'Greedy (Max Eco)',
  STANDARD = 'Standard',
  SAFE = 'Safe (Early Loom/Walls)',
}

export enum MapType {
  ARABIA = 'Arabia (Open)',
  ARENA = 'Arena (Closed)',
  RUNESTONES = 'Runestones (Hybrid)',
}

export type Language = 'ES' | 'EN';

export enum UnitClass {
  INFANTRY = 'Infantry',
  ARCHER = 'Archer',
  CAVALRY = 'Cavalry',
  SIEGE = 'Siege',
  GUNPOWDER = 'Gunpowder',
  MONK = 'Monk',
  SHIP = 'Ship',
  UNIQUE = 'Unique Unit',
  VILLAGER = 'Villager',
  BUILDING = 'Building',
  STANDARD_BUILDING = 'Standard Building',
  EAGLE_WARRIOR = 'Eagle Warrior',
  CAMEL = 'Camel',
  RAM = 'Ram',
  CAVALRY_ARCHER = 'Cavalry Archer',
  MELEE_INFANTRY = 'Melee Infantry',
  CONDOTTIERO = 'Condottiero',
  FIRE_SHIP = 'Fire Ship',
  GALLEY = 'Galley',
  DEMOLITION_SHIP = 'Demolition Ship',
  WALL_GATE = 'Wall/Gate',
  SPEARMAN = 'Spearman',
  SKIRMISHER = 'Skirmisher',
  SCORPION = 'Scorpion',
  SCOUT_CAVALRY = 'Scout Cavalry'
}

export interface UnitStats {
  hp: number;
  attack: number;
  meleeArmor: number;
  pierceArmor: number;
  range: number;
  los: number;
  speed: number;
  reloadTime: number;
  trainTime: number;
  cost: { food: number; wood: number; gold: number; stone?: number };
  classes: UnitClass[];
  attackBonuses: Partial<Record<UnitClass, number>>; 
}

export interface SimulationConfig {
  civilization: Civilization;
  allyCivilization?: Civilization; // New: Team Game Synergy
  difficulty: Difficulty;
  tightness: Tightness;
  strategy: StrategyFocus;
  opponentStrategy: OpponentStrategy;
  targetPop: number;
  useStragglerTrees: boolean;
  lureDeer: boolean;
  mapType: MapType;
  language: Language;
}

export interface OptimizationDNA {
  riskProfile: 'SAFE' | 'BALANCED' | 'GREEDY'; // How close to 0 resources we run
  loomTiming: 'EARLY' | 'LATE' | 'SKIP';
  useStragglersAggressively: boolean;
  forceDropOffs: boolean;
  openingBuildOrder: 'STANDARD' | 'MILL_FIRST'; 
  boarTiming: 'EARLY' | 'STANDARD' | 'LATE'; 
}

export interface BuildStep {
  time: number; // Seconds from start (Start Time)
  endTime?: number; // Seconds (Completion Time)
  population: number;
  instruction: string;
  type: 'create' | 'build' | 'research' | 'move' | 'gathering_switch' | 'train';
  note?: string;
  resources: {
    food: number;
    wood: number;
    gold: number;
  };
  villagerAllocation?: {
    food: number;
    wood: number;
    gold: number;
    builders: number;
  };
}

export interface ResourcePoint {
  time: number;
  food: number;
  wood: number;
  gold: number;
  totalGathered: number;
  villagerAllocation: {
    food: number;
    wood: number;
    gold: number;
    builders: number;
  };
}

export interface EfficiencyPoint {
  time: number;
  foodEfficiency: number; // 0.0 to 1.0
  woodEfficiency: number; // 0.0 to 1.0
  woodLineDepth: number; // Tiles
}

export interface SimulationResult {
  id: string;
  timestamp: number;
  configName: string;
  steps: BuildStep[];
  resourceCurve: ResourcePoint[];
  efficiencyHistory: EfficiencyPoint[];
  efficiencyScore: number;
  theoreticalFeudalTime: string;
  theoreticalCastleTime: string; 
  frictionFactor: number;
  stats: {
    decayedFood: number;
    woodLineDepth: number;
    idleTime: number;
  };
  survivalRating: number; // 0-100
  activeBonuses: string[]; 
  sustainabilityStats?: {
    unitName: string;
    sustainableCount: number; 
    limitingResource: ResourceType;
    incomePerMin: { food: number; wood: number; gold: number };
  };
  optimizationLog?: string[]; // New: Log of self-corrections
  dnaUsed?: OptimizationDNA; // The DNA that won
}

export interface MetaStats {
  winRate: number; // 0-100
  pickRate: number; // 0-100
  tier: 'S' | 'A' | 'B' | 'C' | 'D';
  sampleSize: number;
  trending: 'UP' | 'DOWN' | 'STABLE';
}

export interface UserCivStats {
    civ: Civilization;
    winRate: number;
    gamesPlayed: number;
}

export interface UserProfile {
    name: string;
    elo: number;
    avatarUrl?: string; // Placeholder or URL
    topCivs: UserCivStats[];
    weakCivs: UserCivStats[];
}

export interface TacticalReport {
  grade: string; // S, A, B, C, D
  summary: string;
  metaComparison: {
    metric: string;
    userValue: string;
    metaValue: string;
    status: 'AHEAD' | 'ON_TRACK' | 'BEHIND';
  }[];
  tips: string[];
  combatAnalysis?: {
    playerUnit: string;
    opponentUnitGuess: string;
    winRate: number; // 0-100
    advantage: string;
  };
  globalMeta?: MetaStats; // New field for real-world stats
}

export interface CivBonus {
  // Start
  extraStartFood?: number;
  extraStartWood?: number;
  extraStartGold?: number;
  extraStartStone?: number;
  extraStartVills?: number; // Add to base 3
  
  // Mechanics
  popSpaceAdd?: number; // Add to base 5 (TC). Chinese +5 -> 10.
  noHousesNeeded?: boolean; // Huns
  freeLoom?: boolean; // Vikings
  instantLoom?: boolean; // Goths
  spawnUnit?: string; // Incas "Llama"
  
  // Eco
  gatherMultiplier?: Partial<Record<string, number>>; // Keyed by source name e.g. SHEEP, WOOD
  carryCapacityAdd?: number;
  millTrickle?: boolean;
  noDropOff?: boolean; // Khmer
  resourceYieldMultiplier?: number; // Mayan bonus
  
  // Techs/Age
  freeTechs?: string[]; // "Double-Bit Axe", "Horse Collar", "Wheelbarrow", "Loom", "Gold Mining"
  ageUpCostMultiplier?: number; // Italians
  ageUpSpeedMultiplier?: number; // Malay
  ageUpRewards?: { // Rewards upon reaching the age
     feudal?: { food?: number; wood?: number; gold?: number; stone?: number; vills?: number };
     castle?: { food?: number; wood?: number; gold?: number; stone?: number; vills?: number };
  };
  discount?: { // Flat or % discounts
    [key: string]: { food?: number; wood?: number; gold?: number; stone?: number } // key: "Villager", "Stable", "Archery Range"
  }
}

// --- DRAFT SIMULATOR TYPES ---

export interface DraftMatchup {
  playerCiv: Civilization;
  opponentCiv: Civilization;
  winRate: number; // From perspective of player (e.g. 55%)
  confidence: number; // 0-1
}

export interface DraftState {
  playerPool: Civilization[];
  opponentPool: Civilization[];
  bans: { player: Civilization[], opponent: Civilization[] };
  picks: { player: Civilization[], opponent: Civilization[] };
  phase: 'SETUP' | 'BAN' | 'PICK' | 'COMPLETE';
  turn: 'PLAYER' | 'OPPONENT';
}