
import { Civilization, ResourceType, OpponentStrategy, Language, UnitStats, UnitClass, CivBonus, MapType } from "./types";

// Base gathering rates (Resource/Second) - Raw values from Genie Engine
export const BASE_RATES = {
  SHEEP: 0.33,
  BOAR: 0.41,
  DEER: 0.41,
  BERRIES: 0.31,
  FARM: 0.32,
  WOOD: 0.39,
  GOLD: 0.38,
  STONE: 0.36,
  SHORE_FISH: 0.43
};

export const VILLAGER_SPEED = 0.8; // Tiles/sec
export const BASE_CARRY_CAPACITY = 10;

// Specific Mechanics
export const GURJARA_SHEEP_TRICKLE = 0.08; // Food/sec per sheep garrisoned
export const STRAGGLER_TREE_WOOD = 125;
export const MAX_STRAGGLER_TREES = 3;

export const DECAY_RATES = {
  SHEEP: 0.25,
  BOAR: 0.4,
  DEER: 0.25,
  BERRIES: 0, 
  FARM: 0
};

// Map Resource Definitions (Phase 1)
export const MAP_RESOURCES_CONFIG: Record<MapType, { sheep: number, boar: number, deer: number, berries: number, berryAmount: number }> = {
    [MapType.ARABIA]: { sheep: 8, boar: 2, deer: 3, berries: 6, berryAmount: 125 },
    [MapType.ARENA]: { sheep: 8, boar: 2, deer: 3, berries: 6, berryAmount: 125 }, // Safe berries sometimes
    [MapType.RUNESTONES]: { sheep: 8, boar: 2, deer: 4, berries: 6, berryAmount: 125 },
};

export const BUILD_TIMES: Record<string, number> = {
    'House': 25,
    'Lumber Camp': 35,
    'Mill': 35,
    'Mining Camp': 35,
    'Farm': 15,
    'Dock': 35,
    'Barracks': 50,
    'Archery Range': 50,
    'Stable': 50,
    'Blacksmith': 40,
    'Market': 60,
    'Siege Workshop': 40,
    'Town Center': 150,
    'Watch Tower': 80,
    'Palisade Wall': 6,
    'Stone Wall': 10,
};

export const COSTS = {
  // Units
  VILLAGER: { food: 50, wood: 0, gold: 0 },
  MILITIA: { food: 60, wood: 0, gold: 20 },
  MAN_AT_ARMS: { food: 60, wood: 0, gold: 20 },
  SPEARMAN: { food: 35, wood: 25, gold: 0 },
  EAGLE_SCOUT: { food: 20, wood: 0, gold: 50 },
  ARCHER: { food: 0, wood: 25, gold: 45 },
  SKIRMISHER: { food: 25, wood: 35, gold: 0 },
  SCOUT_CAVALRY: { food: 80, wood: 0, gold: 0 },
  KNIGHT: { food: 60, wood: 0, gold: 75 },
  CAMEL_RIDER: { food: 55, wood: 0, gold: 60 },
  MONK: { food: 0, wood: 0, gold: 100 },
  GALLEY: { food: 0, wood: 90, gold: 30 },
  FIRE_GALLEY: { food: 0, wood: 75, gold: 45 },
  DEMOLITION_RAFT: { food: 0, wood: 70, gold: 50 },

  // Buildings - Economy
  HOUSE: { food: 0, wood: 25, gold: 0 },
  LUMBER_CAMP: { food: 0, wood: 100, gold: 0 },
  MILL: { food: 0, wood: 100, gold: 0 },
  MINING_CAMP: { food: 0, wood: 100, gold: 0 },
  FARM: { food: 0, wood: 60, gold: 0 },
  MARKET: { food: 0, wood: 175, gold: 0 },
  DOCK: { food: 0, wood: 150, gold: 0 },
  TOWN_CENTER: { food: 0, wood: 275, gold: 0, stone: 100 }, 

  // Buildings - Military
  BARRACKS: { food: 0, wood: 175, gold: 0 },
  ARCHERY_RANGE: { food: 0, wood: 175, gold: 0 },
  STABLE: { food: 0, wood: 175, gold: 0 },
  SIEGE_WORKSHOP: { food: 0, wood: 200, gold: 0 },
  BLACKSMITH: { food: 0, wood: 150, gold: 0 },
  MONASTERY: { food: 0, wood: 175, gold: 0 },
  UNIVERSITY: { food: 0, wood: 200, gold: 0 },
  
  // Buildings - Defensive
  WATCH_TOWER: { food: 0, wood: 25, gold: 0, stone: 125 },
  OUTPOST: { food: 0, wood: 25, gold: 0, stone: 5 },
  PALISADE_WALL: { food: 0, wood: 2, gold: 0 },
  PALISADE_GATE: { food: 0, wood: 30, gold: 0 },
  STONE_WALL: { food: 0, wood: 0, gold: 0, stone: 5 },
  STONE_GATE: { food: 0, wood: 0, gold: 0, stone: 30 },
  CASTLE: { food: 0, wood: 0, gold: 0, stone: 650 },
  KREPOST: { food: 0, wood: 0, gold: 0, stone: 350 },
  DONJON: { food: 0, wood: 0, gold: 0, stone: 175 },

  // Techs
  LOOM: { food: 0, wood: 0, gold: 50 },
  FEUDAL_AGE: { food: 500, wood: 0, gold: 0 },
  CASTLE_AGE: { food: 800, wood: 0, gold: 200 },
  IMPERIAL_AGE: { food: 1000, wood: 0, gold: 800 },
  DOUBLE_BIT_AXE: { food: 100, wood: 50, gold: 0 },
  HORSE_COLLAR: { food: 75, wood: 75, gold: 0 },
  WHEELBARROW: { food: 175, wood: 50, gold: 0 },
  TOWN_WATCH: { food: 75, wood: 0, gold: 0 },
};

export const UNIT_DATABASE: Record<string, UnitStats> = {
  'Villager': { hp: 25, attack: 3, meleeArmor: 0, pierceArmor: 0, range: 0, los: 4, speed: 0.8, reloadTime: 2.0, trainTime: 25, cost: { food: 50, wood: 0, gold: 0 }, classes: [UnitClass.VILLAGER, UnitClass.MELEE_INFANTRY], attackBonuses: {} },
  'Loom Villager': { hp: 40, attack: 3, meleeArmor: 1, pierceArmor: 2, range: 0, los: 4, speed: 0.8, reloadTime: 2.0, trainTime: 25, cost: { food: 50, wood: 0, gold: 0 }, classes: [UnitClass.VILLAGER, UnitClass.MELEE_INFANTRY], attackBonuses: {} },
  'Militia': { hp: 40, attack: 4, meleeArmor: 0, pierceArmor: 1, range: 0, los: 4, speed: 0.9, reloadTime: 2.0, trainTime: 21, cost: { food: 60, wood: 0, gold: 20 }, classes: [UnitClass.INFANTRY, UnitClass.MELEE_INFANTRY], attackBonuses: {} },
  'Man-at-Arms': { hp: 45, attack: 6, meleeArmor: 0, pierceArmor: 1, range: 0, los: 4, speed: 0.9, reloadTime: 2.0, trainTime: 21, cost: { food: 60, wood: 0, gold: 20 }, classes: [UnitClass.INFANTRY, UnitClass.MELEE_INFANTRY], attackBonuses: { [UnitClass.EAGLE_WARRIOR]: 2, [UnitClass.STANDARD_BUILDING]: 2 } },
  'Spearman': { hp: 45, attack: 3, meleeArmor: 0, pierceArmor: 0, range: 0, los: 4, speed: 1.0, reloadTime: 3.0, trainTime: 22, cost: { food: 35, wood: 25, gold: 0 }, classes: [UnitClass.INFANTRY, UnitClass.SPEARMAN], attackBonuses: { [UnitClass.CAVALRY]: 15, [UnitClass.CAMEL]: 15, [UnitClass.EAGLE_WARRIOR]: 1 } },
  'Eagle Scout': { hp: 50, attack: 4, meleeArmor: 0, pierceArmor: 2, range: 0, los: 6, speed: 1.1, reloadTime: 2.0, trainTime: 60, cost: { food: 20, wood: 0, gold: 50 }, classes: [UnitClass.INFANTRY, UnitClass.EAGLE_WARRIOR], attackBonuses: { [UnitClass.MONK]: 8, [UnitClass.SIEGE]: 3 } },
  'Archer': { hp: 30, attack: 4, meleeArmor: 0, pierceArmor: 0, range: 4, los: 6, speed: 0.96, reloadTime: 2.0, trainTime: 35, cost: { food: 0, wood: 25, gold: 45 }, classes: [UnitClass.ARCHER], attackBonuses: { [UnitClass.SPEARMAN]: 3 } },
  'Skirmisher': { hp: 30, attack: 2, meleeArmor: 0, pierceArmor: 3, range: 4, los: 6, speed: 0.96, reloadTime: 3.0, trainTime: 22, cost: { food: 25, wood: 35, gold: 0 }, classes: [UnitClass.ARCHER, UnitClass.SKIRMISHER], attackBonuses: { [UnitClass.ARCHER]: 3, [UnitClass.SPEARMAN]: 3 } },
  'Scout Cavalry': { hp: 45, attack: 3, meleeArmor: 0, pierceArmor: 2, range: 0, los: 8, speed: 1.2, reloadTime: 2.0, trainTime: 30, cost: { food: 80, wood: 0, gold: 0 }, classes: [UnitClass.CAVALRY, UnitClass.SCOUT_CAVALRY], attackBonuses: { [UnitClass.MONK]: 6 } },
  'Knight': { hp: 100, attack: 10, meleeArmor: 2, pierceArmor: 2, range: 0, los: 4, speed: 1.35, reloadTime: 1.8, trainTime: 30, cost: { food: 60, wood: 0, gold: 75 }, classes: [UnitClass.CAVALRY], attackBonuses: {} },
  'Camel Rider': { hp: 100, attack: 6, meleeArmor: 0, pierceArmor: 0, range: 0, los: 4, speed: 1.45, reloadTime: 2.0, trainTime: 22, cost: { food: 55, wood: 0, gold: 60 }, classes: [UnitClass.CAVALRY, UnitClass.CAMEL], attackBonuses: { [UnitClass.CAVALRY]: 9, [UnitClass.CAMEL]: 5 } },
};

export const BUILDING_TREE: any = {
    'Archery Range': ['Barracks'],
    'Stable': ['Barracks'],
    'Blacksmith': ['Barracks', 'Archery Range', 'Stable'],
    'Market': ['Mill'],
    'Siege Workshop': ['Blacksmith'],
};

export const TEAM_BONUSES: Partial<Record<Civilization, string>> = {
  [Civilization.AZTECS]: "Relics generate +33% gold",
  [Civilization.BENGALIS]: "Trade units yield 10% food in addition to gold",
  [Civilization.BERBERS]: "Genitour available in Archery Range",
  [Civilization.BOHEMIANS]: "Markets work 80% faster",
  [Civilization.BRITONS]: "Archery Ranges work 20% faster",
  [Civilization.BULGARIANS]: "Blacksmiths work 80% faster",
  [Civilization.BURGUNDIANS]: "Relics generate both Gold and Food",
  [Civilization.BURMESE]: "Relics are visible on the map",
  [Civilization.BYZANTINES]: "Monks heal 100% faster",
  [Civilization.CELTS]: "Siege Workshops work 20% faster",
  [Civilization.CHINESE]: "Farms provide +45 food",
  [Civilization.CUMANS]: "Palisade Walls have +50% HP",
  [Civilization.DRAVIDIANS]: "Docks provide +5 population space",
  [Civilization.ETHIOPIANS]: "Towers and Outposts have +3 LOS",
  [Civilization.FRANKS]: "Knights +2 LOS",
  [Civilization.GOTHS]: "Barracks work 20% faster",
  [Civilization.GURJARAS]: "Camels and Elephant Archers created 25% faster",
  [Civilization.HINDUSTANIS]: "Camel units +2 bonus attack vs buildings",
  [Civilization.HUNS]: "Stables work 20% faster",
  [Civilization.INCAS]: "Farms built 100% faster",
  [Civilization.ITALIANS]: "Condottiero available in Barracks",
  [Civilization.JAPANESE]: "Galleys +50% LOS",
  [Civilization.KHMER]: "Scorpions +1 range",
  [Civilization.KOREANS]: "Mangonels minimum range reduced",
  [Civilization.LITHUANIANS]: "Monasteries work 20% faster",
  [Civilization.MAGYARS]: "Foot archers +2 LOS",
  [Civilization.MALAYS]: "Docks 100% vision",
  [Civilization.MALIANS]: "University researches 80% faster",
  [Civilization.MAYANS]: "Walls cost -50%",
  [Civilization.MONGOLS]: "Scout Cavalry +2 LOS",
  [Civilization.PERSIANS]: "Knights +2 bonus attack vs Archers",
  [Civilization.POLES]: "Scout Cavalry +1 bonus attack vs Archers",
  [Civilization.PORTUGUESE]: "Technologies research 30% faster in Imperial Age",
  [Civilization.ROMANS]: "Scorpions fire 33% faster",
  [Civilization.SARACENS]: "Foot archers +2 attack vs buildings",
  [Civilization.SICILIANS]: "Transport ships +5 carry capacity and +10 armor",
  [Civilization.SLAVS]: "Military buildings provide +5 population",
  [Civilization.SPANISH]: "Trade units generate +25% gold",
  [Civilization.TATARS]: "Cavalry Archers +2 LOS",
  [Civilization.TEUTONS]: "Units resist conversion",
  [Civilization.TURKS]: "Gunpowder units created 25% faster",
  [Civilization.VIETNAMESE]: "Imperial Skirmisher upgrade available",
  [Civilization.VIKINGS]: "Docks cost -15%",
  [Civilization.GENERIC]: "No Team Bonus"
};

export const COUNTER_MATRIX: Record<UnitClass, UnitClass[]> = {
    [UnitClass.INFANTRY]: [UnitClass.ARCHER, UnitClass.SCORPION],
    [UnitClass.ARCHER]: [UnitClass.SKIRMISHER, UnitClass.SIEGE, UnitClass.CAVALRY, UnitClass.EAGLE_WARRIOR],
    [UnitClass.CAVALRY]: [UnitClass.SPEARMAN, UnitClass.CAMEL, UnitClass.MONK],
    [UnitClass.SIEGE]: [UnitClass.MELEE_INFANTRY, UnitClass.CAVALRY, UnitClass.EAGLE_WARRIOR],
    [UnitClass.GUNPOWDER]: [UnitClass.SKIRMISHER, UnitClass.CONDOTTIERO],
    [UnitClass.MONK]: [UnitClass.SCOUT_CAVALRY, UnitClass.EAGLE_WARRIOR, UnitClass.ARCHER],
    [UnitClass.SHIP]: [UnitClass.FIRE_SHIP],
    [UnitClass.UNIQUE]: [], 
    [UnitClass.VILLAGER]: [UnitClass.MELEE_INFANTRY, UnitClass.CAVALRY, UnitClass.ARCHER],
    [UnitClass.BUILDING]: [UnitClass.SIEGE, UnitClass.INFANTRY],
    [UnitClass.STANDARD_BUILDING]: [],
    [UnitClass.EAGLE_WARRIOR]: [UnitClass.MELEE_INFANTRY, UnitClass.GUNPOWDER],
    [UnitClass.CAMEL]: [UnitClass.SPEARMAN, UnitClass.MONK],
    [UnitClass.RAM]: [UnitClass.MELEE_INFANTRY],
    [UnitClass.CAVALRY_ARCHER]: [UnitClass.SKIRMISHER, UnitClass.CAMEL],
    [UnitClass.MELEE_INFANTRY]: [UnitClass.ARCHER],
    [UnitClass.CONDOTTIERO]: [],
    [UnitClass.FIRE_SHIP]: [UnitClass.DEMOLITION_SHIP],
    [UnitClass.DEMOLITION_SHIP]: [UnitClass.GALLEY],
    [UnitClass.WALL_GATE]: [UnitClass.SIEGE],
    [UnitClass.SPEARMAN]: [UnitClass.ARCHER, UnitClass.SKIRMISHER, UnitClass.INFANTRY],
    [UnitClass.SKIRMISHER]: [UnitClass.CAVALRY, UnitClass.SIEGE],
    [UnitClass.SCORPION]: [UnitClass.CAVALRY, UnitClass.SIEGE],
    [UnitClass.SCOUT_CAVALRY]: [UnitClass.SPEARMAN]
} as any;

export const OPPONENT_TIMINGS: Record<OpponentStrategy, number> = {
  [OpponentStrategy.PASSIVE]: 9999,
  [OpponentStrategy.DRUSH]: 600, // 10:00
  [OpponentStrategy.MAN_AT_ARMS]: 660, // 11:00
  [OpponentStrategy.SCOUTS]: 720, // 12:00
  [OpponentStrategy.ARCHERS]: 840, // 14:00
};

export const INSTRUCTION_MAP = {
  START_GAME: { ES: "Inicio de Partida", EN: "Start Game" },
  GARRISON_SHEEP: { ES: "Guarnecer Ovejas (Trickle)", EN: "Garrison Sheep (Trickle)" },
  FORAGE: { ES: "Forrajear Bayas", EN: "Forage Berries" },
  RESEARCH_LOOM: { ES: "Investigar Telar", EN: "Research Loom" },
  LURE_BOAR: { ES: "Cazar Jabalí", EN: "Lure Boar" },
  LURE_BOAR_GURJARA: { ES: "Cazar Jabalí (Sin Guarnecer)", EN: "Lure Boar (No Garrison)" },
  TRANSITION_BERRIES: { ES: "Transición a Bayas", EN: "Transition to Berries" },
  STRAGGLERS_DEPLETED: { ES: "Árboles Sueltos Agotados", EN: "Stragglers Depleted" },
  BUILD_LUMBER: { ES: "Construir Camp. Maderero", EN: "Build Lumber Camp" },
  BUILD_MILL: { ES: "Construir Molino", EN: "Build Mill" },
  BUILD_MINING: { ES: "Construir Camp. Minero", EN: "Build Mining Camp" },
  BUILD_BARRACKS: { ES: "Construir Cuartel", EN: "Build Barracks" },
  BUILD_MARKET: { ES: "Construir Mercado", EN: "Build Market" },
  BUILD_BLACKSMITH: { ES: "Construir Herrería", EN: "Build Blacksmith" },
  FEUDAL_COMPLETE: { ES: "Edad Feudal Completa", EN: "Feudal Age Complete" },
  CLICK_CASTLE: { ES: "Click a Edad de los Castillos", EN: "Click Castle Age" },
  DB_AXE: { ES: "Hacha de Doble Filo", EN: "Double-Bit Axe" },
  HORSE_COLLAR: { ES: "Collera", EN: "Horse Collar" },
  CLICK_FEUDAL: { ES: "Click a Edad Feudal", EN: "Click Feudal Age" },
  CREATE_VILL: { ES: "Crear Aldeano", EN: "Create Villager" },
  BUILD_HOUSE: { ES: "Construir Casa", EN: "Build House" },
  
  // New specific assignments
  GATHER_SHEEP: { ES: "Ovejas", EN: "Sheep" },
  GATHER_WOOD: { ES: "Madera", EN: "Wood" },
  GATHER_GOLD: { ES: "Oro", EN: "Gold" },
  GATHER_STONE: { ES: "Piedra", EN: "Stone" },
  GATHER_BERRIES: { ES: "Bayas", EN: "Berries" },
  GATHER_BOAR: { ES: "Jabalí", EN: "Boar" },
  GATHER_DEER: { ES: "Ciervo", EN: "Deer" },
  GATHER_FARM: { ES: "Granja", EN: "Farm" },
  BUILDER: { ES: "Constructor", EN: "Builder" },

  SELL_WOOD: { ES: "Vender Madera", EN: "Sell Wood" },
  SELL_STONE: { ES: "Vender Piedra", EN: "Sell Stone" },
  BUY_FOOD: { ES: "Comprar Alimento", EN: "Buy Food" },
};

export const TRANSLATIONS = {
  ES: {
    header: {
      title: "CODEX DE CONSTRUCCIÓN AOE II",
      subtitle: "OPTIMIZADOR DE ESTRATEGIA EN TIEMPO REAL",
      export: "EXPORTAR PDF",
    },
    config: {
      title: "CONFIGURACIÓN DE BATALLA",
      civ: "CIVILIZACIÓN",
      ally: "ALIADO (TEAM BONUS)",
      strategy: "ESTRATEGIA",
      difficulty: "DIFICULTAD DE MICRO",
      map: "TIPO DE MAPA",
      pop: "POBLACIÓN OBJETIVO",
      opponent: "ESTRATEGIA OPONENTE",
    },
    charts: {
      food: "Alimento",
      wood: "Madera",
      gold: "Oro",
      builders: "Constructores",
    },
    table: {
      title: "ORDEN DE CONSTRUCCIÓN",
      copied: "¡COPIADO!",
      copy: "COPIAR AL PORTAPAPELES",
    },
    metrics: {
      efficiency: "EFICIENCIA",
      castleArrival: "LLEGADA A CASTILLOS",
      fcOptimized: "Optimizado para FC",
      friction: "FRICCIÓN DE TIEMPO",
      foodShortage: "Debido a falta de alimento",
      postAge: "SOSTENIBILIDAD",
      survival: "ÍNDICE DE SUPERVIVENCIA",
      vsOpponent: "vs Estrategia Oponente",
      reportBtn: "INFORME TÁCTICO",
    },
    report: {
      title: "INFORME TÁCTICO",
      eval: "EVALUACIÓN DE DESEMPEÑO DE IA",
      grade: "GRADO",
      metric: "MÉTRICA",
      result: "RESULTADO",
      pro: "META PRO",
      verdict: "VEREDICTO",
      tips: "CONSEJOS TÁCTICOS",
      close: "CERRAR INFORME",
    },
    bonuses: {
      title: "BONIFICACIONES ACTIVAS",
    },
    timeline: {
      title: "LÍNEA DE TIEMPO DE ENFRENTAMIENTO",
      attackHit: "ATAQUE ENEMIGO",
      safe: "SEGURO POR",
      before: "ANTES DEL ATAQUE",
      danger: "PELIGRO",
      tooSlow: "MUY LENTO",
    },
    history: {
      title: "HISTORIAL DE EJECUCIÓN",
      compare: "Comparando con",
      setBase: "Establecer como referencia para comparar",
      clearBtn: "Limpiar Comparación",
      setBtn: "Fijar Referencia",
    },
    assistant: {
      title: "ASISTENTE DE VOZ",
      gameTime: "TIEMPO DE JUEGO",
      complete: "¡ORDEN COMPLETADO!",
      finalTime: "Tiempo Final",
      step: "PASO",
      target: "Objetivo",
      upNext: "A CONTINUACIÓN",
      exit: "SALIR",
      start: "INICIAR",
      prev: "ANTERIOR",
      done: "LISTO",
      next: "SIGUIENTE",
    },
    ui: {
        factoryReset: "RESTABLECER FÁBRICA",
        share: "COMPARTIR ESTRATEGIA",
        shareCopied: "ENLACE COPIADO",
        warRoom: "SALA DE GUERRA",
        cinemaMode: "MODO CINE",
        playback: "REPRODUCIR",
        pause: "PAUSAR",
    },
    draft: {
        title: "SIMULADOR DE DRAFT",
        subtitle: "ANÁLISIS DE PICK & BAN",
        playerPool: "TU POOL DE CIVS",
        oppPool: "POOL DEL OPONENTE",
        matrix: "MATRIZ DE VENTAJAS",
        recommendation: "CONSEJO DEL COACH",
        banPhase: "FASE DE BANEO",
        pickPhase: "FASE DE SELECCIÓN",
        banned: "BANEADO",
        picked: "SELECCIONADO",
        reset: "REINICIAR DRAFT"
    }
  },
  EN: {
    header: {
      title: "AOE II BUILD CODEX",
      subtitle: "REAL-TIME STRATEGY OPTIMIZER",
      export: "EXPORT PDF",
    },
    config: {
      title: "BATTLE CONFIGURATION",
      civ: "CIVILIZATION",
      ally: "ALLY (TEAM BONUS)",
      strategy: "STRATEGY",
      difficulty: "MICRO DIFFICULTY",
      map: "MAP TYPE",
      pop: "TARGET POPULATION",
      opponent: "OPPONENT STRATEGY",
    },
    charts: {
      food: "Food",
      wood: "Wood",
      gold: "Gold",
      builders: "Builders",
    },
    table: {
      title: "BUILD ORDER",
      copied: "COPIED!",
      copy: "COPY TO CLIPBOARD",
    },
    metrics: {
      efficiency: "EFFICIENCY",
      castleArrival: "CASTLE ARRIVAL",
      fcOptimized: "FC Optimized",
      friction: "TIME FRICTION",
      foodShortage: "Due to food shortage",
      postAge: "SUSTAINABILITY",
      survival: "SURVIVAL RATING",
      vsOpponent: "vs Opponent Strategy",
      reportBtn: "TACTICAL REPORT",
    },
    report: {
      title: "TACTICAL REPORT",
      eval: "AI PERFORMANCE EVALUATION",
      grade: "GRADE",
      metric: "METRIC",
      result: "RESULT",
      pro: "PRO META",
      verdict: "VERDICT",
      tips: "TACTICAL TIPS",
      close: "CLOSE REPORT",
    },
    bonuses: {
      title: "ACTIVE BONUSES",
    },
    timeline: {
      title: "CLASH TIMELINE",
      attackHit: "ENEMY ATTACK",
      safe: "SAFE BY",
      before: "BEFORE ATTACK",
      danger: "DANGER",
      tooSlow: "TOO SLOW",
    },
    history: {
      title: "RUN HISTORY",
      compare: "Comparing with",
      setBase: "Set as baseline to compare",
      clearBtn: "Clear Comparison",
      setBtn: "Set Baseline",
    },
    assistant: {
      title: "VOICE ASSISTANT",
      gameTime: "GAME TIME",
      complete: "ORDER COMPLETE!",
      finalTime: "Final Time",
      step: "STEP",
      target: "Target",
      upNext: "UP NEXT",
      exit: "EXIT",
      start: "START",
      prev: "PREV",
      done: "DONE",
      next: "NEXT",
    },
    ui: {
        factoryReset: "FACTORY RESET",
        share: "SHARE STRATEGY",
        shareCopied: "LINK COPIED",
        warRoom: "WAR ROOM",
        cinemaMode: "CINEMA MODE",
        playback: "PLAYBACK",
        pause: "PAUSE",
    },
    draft: {
        title: "DRAFT SIMULATOR",
        subtitle: "PICK & BAN ANALYSIS",
        playerPool: "YOUR CIV POOL",
        oppPool: "OPPONENT CIV POOL",
        matrix: "ADVANTAGE MATRIX",
        recommendation: "COACH ADVICE",
        banPhase: "BAN PHASE",
        pickPhase: "PICK PHASE",
        banned: "BANNED",
        picked: "PICKED",
        reset: "RESET DRAFT"
    }
  },
};

// --- HELPER FUNCTIONS ---

export const getCivBonus = (civ: Civilization): CivBonus => {
    const bonus: CivBonus = {};
    switch (civ) {
        case Civilization.BRITONS:
            bonus.gatherMultiplier = { 'SHEEP': 1.25 };
            break;
        case Civilization.FRANKS:
            bonus.gatherMultiplier = { 'BERRIES': 1.15 };
            bonus.freeTechs = ['Horse Collar', 'Heavy Plow', 'Crop Rotation'];
            break;
        case Civilization.CELTS:
            bonus.gatherMultiplier = { 'WOOD': 1.15 };
            break;
        case Civilization.GURJARAS:
            bonus.millTrickle = true;
            bonus.extraStartFood = 0;
            break;
        case Civilization.CHINESE:
            bonus.extraStartVills = 3;
            bonus.extraStartFood = -200;
            bonus.extraStartWood = -50;
            bonus.popSpaceAdd = 5;
            break;
        case Civilization.MAYANS:
            bonus.extraStartVills = 1;
            bonus.extraStartFood = -50;
            bonus.resourceYieldMultiplier = 1.15; // Resources last 15% longer
            break;
        case Civilization.PERSIANS:
            bonus.extraStartFood = 50;
            bonus.extraStartWood = 50;
            break;
        case Civilization.LITHUANIANS:
            bonus.extraStartFood = 150;
            break;
        case Civilization.MONGOLS:
             bonus.gatherMultiplier = { 'BOAR': 1.4, 'DEER': 1.4 }; // Hunters work 40% faster
             break;
        case Civilization.JAPANESE:
             bonus.discount = { 'Lumber Camp': { wood: 0.5 }, 'Mining Camp': { wood: 0.5 }, 'Mill': { wood: 0.5 } };
             break;
        case Civilization.GOTHS:
             bonus.instantLoom = true;
             break;
        case Civilization.TEUTONS:
             bonus.discount = { 'Farm': { wood: 0.6 } };
             break;
        case Civilization.KHMER:
             bonus.noDropOff = true;
             break;
        case Civilization.HUNS:
             bonus.noHousesNeeded = true;
             bonus.extraStartWood = -100;
             break;
        case Civilization.MALAYS:
             bonus.ageUpSpeedMultiplier = 1.66;
             break;
        case Civilization.ITALIANS:
             bonus.ageUpCostMultiplier = 0.85;
             break;
        case Civilization.INCAS:
             bonus.spawnUnit = "Llama";
             bonus.popSpaceAdd = 5;
             break;
        case Civilization.VIKINGS:
             bonus.freeTechs = ['Wheelbarrow', 'Hand Cart'];
             break;
        case Civilization.AZTECS:
             bonus.carryCapacityAdd = 3;
             bonus.extraStartGold = 50;
             break;
        case Civilization.ETHIOPIANS:
             bonus.ageUpRewards = { feudal: { food: 100, gold: 100 }, castle: { food: 100, gold: 100 } };
             break;
        case Civilization.TURKS:
             bonus.gatherMultiplier = { 'GOLD': 1.20 };
             break;
    }
    return bonus;
};

export const getCivDescription = (civ: Civilization): string[] => {
    const bonus = getCivBonus(civ);
    const desc: string[] = [];
    if (bonus.extraStartVills) desc.push(`+${bonus.extraStartVills} Villagers`);
    if (bonus.gatherMultiplier) {
        Object.entries(bonus.gatherMultiplier).forEach(([k, v]) => desc.push(`${k} gather rate x${v}`));
    }
    if (bonus.freeTechs) desc.push(`Free: ${bonus.freeTechs.join(', ')}`);
    if (bonus.discount) desc.push("Building/Unit Discounts");
    if (bonus.millTrickle) desc.push("Garrison Sheep in Mill");
    if (bonus.resourceYieldMultiplier) desc.push("Resources last 15% longer");
    return desc;
};

export const getStartingResources = (civ: Civilization) => {
    let food = 200;
    let wood = 200;
    let gold = 100;
    let stone = 200;
    
    const bonus = getCivBonus(civ);
    if (bonus.extraStartFood) food += bonus.extraStartFood;
    if (bonus.extraStartWood) wood += bonus.extraStartWood;
    if (bonus.extraStartGold) gold += bonus.extraStartGold;
    if (bonus.extraStartStone) stone += bonus.extraStartStone;

    return { food, wood, gold, stone };
};

export const getCarryCapacity = (civ: Civilization) => {
    let base = BASE_CARRY_CAPACITY;
    const bonus = getCivBonus(civ);
    if (bonus.carryCapacityAdd) base += bonus.carryCapacityAdd;
    return base;
};

export const getWalkingMultiplier = (civ: Civilization) => {
    return 1.0; 
};

export const getGatherRateMultiplier = (civ: Civilization, resourceType: string) => {
    const bonus = getCivBonus(civ);
    if (bonus.gatherMultiplier && bonus.gatherMultiplier[resourceType]) {
        return bonus.gatherMultiplier[resourceType]!;
    }
    return 1.0;
};
