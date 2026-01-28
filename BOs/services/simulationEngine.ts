

import { 
  SimulationConfig, 
  SimulationResult, 
  BuildStep, 
  ResourcePoint, 
  EfficiencyPoint,
  Civilization,
  StrategyFocus,
  Difficulty,
  MapType,
  ResourceType,
  Language,
  UnitClass,
  Tightness,
  OptimizationDNA
} from "../types";
import { 
  BASE_RATES, 
  VILLAGER_SPEED, 
  COSTS, 
  getCarryCapacity, 
  getWalkingMultiplier, 
  getGatherRateMultiplier,
  getStartingResources,
  getCivBonus,
  getCivDescription,
  DECAY_RATES,
  GURJARA_SHEEP_TRICKLE,
  STRAGGLER_TREE_WOOD,
  MAX_STRAGGLER_TREES,
  UNIT_DATABASE,
  INSTRUCTION_MAP,
  BUILDING_TREE,
  TEAM_BONUSES,
  MAP_RESOURCES_CONFIG,
  BUILD_TIMES // Added Constant
} from "../constants";

// Helper for translation
const tr = (lang: Language, key: keyof typeof INSTRUCTION_MAP, suffix: string = '') => {
  return INSTRUCTION_MAP[key][lang] + suffix;
};

// --- CONSTRUCTION PHYSICS ---
const calculateBuildTime = (baseTime: number, builders: number): number => {
    if (builders <= 0) return baseTime;
    if (builders === 1) return baseTime;
    const rateMultiplier = (3 * builders) / (builders + 2);
    return baseTime / rateMultiplier;
};

// Helper for dynamic costs
const getCost = (civ: Civilization, building: keyof typeof COSTS) => {
    const base = COSTS[building];
    const bonus = getCivBonus(civ);
    
    if (bonus.discount && bonus.discount[building]) {
        const d = bonus.discount[building];
        return {
            food: base.food * (d?.food ?? 1),
            wood: base.wood * (d?.wood ?? 1),
            gold: base.gold * (d?.gold ?? 1)
        };
    }
    
    if (building === 'FEUDAL_AGE' || building === 'CASTLE_AGE') {
        if (bonus.ageUpCostMultiplier) {
            return {
                food: base.food * bonus.ageUpCostMultiplier,
                wood: base.wood * bonus.ageUpCostMultiplier,
                gold: base.gold * bonus.ageUpCostMultiplier
            };
        }
    }

    return base;
};

const getAverageFarmDistance = (farmCount: number): number => {
    if (farmCount <= 0) return 0;
    let totalDist = 0;
    const layer1 = Math.min(farmCount, 8);
    totalDist += layer1 * 1.5;
    if (farmCount > 8) {
        const layer2 = Math.min(farmCount - 8, 8);
        totalDist += layer2 * 2.5;
    }
    if (farmCount > 16) {
        const layer3 = farmCount - 16;
        totalDist += layer3 * 4.0;
    }
    return totalDist / farmCount;
};

// --- STRATEGIC PLANNING (BACKWARD SCHEDULING) ---

interface BuildingGoal {
    name: string;
    cost: { food: number, wood: number, gold: number, stone?: number };
    priority: number; // Higher is more urgent
    requiredForAgeUp: boolean;
}

const getNextStrategicBuildings = (
    strategy: StrategyFocus, 
    buildings: Record<string, number>, 
    civ: Civilization, 
    pop: number,
    targetPop: number,
    techs: { feudal: boolean, castle: boolean }
): BuildingGoal[] => {
    const goals: BuildingGoal[] = [];

    // 1. Eco Infrastructure (Always needed)
    if (buildings.LumberCamp === 0) {
        goals.push({ name: 'Lumber Camp', cost: getCost(civ, 'LUMBER_CAMP'), priority: 100, requiredForAgeUp: true });
    }
    if (buildings.Mill === 0) {
        // Mill is high priority if we are doing Scouts or taking berries
        const millPriority = (strategy === StrategyFocus.SCOUTS || strategy === StrategyFocus.ARCHERS) ? 90 : 50;
        goals.push({ name: 'Mill', cost: getCost(civ, 'MILL'), priority: millPriority, requiredForAgeUp: true });
    }
    if (buildings.MiningCamp === 0 && (strategy === StrategyFocus.ARCHERS || strategy === StrategyFocus.FAST_CASTLE || strategy === StrategyFocus.MAN_AT_ARMS)) {
        // Gold mining camp timing
        const priority = strategy === StrategyFocus.MAN_AT_ARMS ? 95 : 80;
        goals.push({ name: 'Mining Camp', cost: getCost(civ, 'MINING_CAMP'), priority: priority, requiredForAgeUp: false });
    }

    // 2. Military Infrastructure (Strategy Dependent)
    
    // BARRACKS
    // MAA: Needs Barracks EARLY (Dark Age)
    // Scouts: Needs Barracks to unlock Stable (Transition)
    // Archers: Needs Barracks to unlock Range (Transition)
    if (buildings.Barracks === 0) {
        if (strategy === StrategyFocus.MAN_AT_ARMS) {
            goals.push({ name: 'Barracks', cost: getCost(civ, 'BARRACKS'), priority: 90, requiredForAgeUp: false }); // High priority in Dark Age
        } else {
            // For Scouts/Archers, we need it before Feudal completes
            // Priority scales as we get closer to Feudal click or if we are clicking up
            const priority = (pop >= targetPop - 3) ? 85 : 40;
            goals.push({ name: 'Barracks', cost: getCost(civ, 'BARRACKS'), priority, requiredForAgeUp: false });
        }
    }

    // RANGES / STABLES (Feudal Age)
    // We plan for them during transition
    if (pop >= targetPop) {
        if (strategy === StrategyFocus.SCOUTS && buildings.Stable === 0) {
             goals.push({ name: 'Stable', cost: getCost(civ, 'STABLE'), priority: 95, requiredForAgeUp: false });
        }
        if (strategy === StrategyFocus.ARCHERS && buildings.ArcheryRange === 0) {
             goals.push({ name: 'Archery Range', cost: getCost(civ, 'ARCHERY_RANGE'), priority: 95, requiredForAgeUp: false });
        }
    }

    // MARKET / BLACKSMITH (FC)
    if (strategy === StrategyFocus.FAST_CASTLE) {
        if (buildings.Market === 0 && pop >= targetPop) {
             goals.push({ name: 'Market', cost: getCost(civ, 'MARKET'), priority: 80, requiredForAgeUp: false });
        }
        if (buildings.Blacksmith === 0 && pop >= targetPop) {
             goals.push({ name: 'Blacksmith', cost: getCost(civ, 'BLACKSMITH'), priority: 80, requiredForAgeUp: false });
        }
    }

    return goals.sort((a, b) => b.priority - a.priority);
};

// --- INTELLIGENT ALLOCATION ---

interface AllocationState {
    pop: number;
    housed: number;
    resources: { food: number; wood: number; gold: number; stone: number };
    buildings: Record<string, number>;
    techs: { feudal: boolean; castle: boolean; loom: boolean };
    pendingTechs: { feudalClick: number; castleClick: number };
    strategy: StrategyFocus;
    tightness: Tightness;
    targetPop: number;
    civ: Civilization;
    foodSourceStatus: 'PLENTY' | 'SCARCE' | 'CRITICAL';
    foodSourceType: 'SHEEP' | 'BOAR' | 'DEER' | 'BERRIES' | 'FARM' | null;
    time: number;
    dna: OptimizationDNA;
}

const calculateSmartAllocation = (state: AllocationState) => {
    const { pop, housed, resources, buildings, techs, pendingTechs, strategy, targetPop, civ, foodSourceStatus, foodSourceType } = state;
    
    // 1. BASELINE: ZERO IDLE TC
    // We need 50 food every 25s = 2 food/sec.
    // Early game gather rate is approx 0.33 (Sheep) to 0.41 (Boar).
    // Safety Margin: We aim for 2.2 food/sec to account for walking/decay.
    // Villagers Needed = 2.2 / 0.35 ~= 6.3.
    // We define a strict "Food Floor".
    
    let workingPop = Math.max(0, pop - 1); // Minus Scout
    let builders = 0;
    
    // --- HOUSE PLANNING (Just-in-Time) ---
    // Capacity check
    const housingHeadroom = housed - pop;
    const villProductionTime = 25;
    const houseBuildTime = 25;
    // If we produce villagers continuously, we will be housed in:
    const timeToHoused = housingHeadroom * villProductionTime;
    
    let housePriority = false;
    // If we are about to be housed within the time it takes to build a house + walk + buffer
    if (timeToHoused <= (houseBuildTime + 20) && housed < 200) {
         housePriority = true;
         // Do we have resources?
         if (resources.wood >= 25) {
             builders = 1;
             workingPop--;
         } 
         // If no wood, allocation logic below will prioritize wood heavily
    }

    // --- STRATEGIC GOALS ---
    const goals = getNextStrategicBuildings(strategy, buildings, civ, pop, targetPop, techs);
    const primaryGoal = goals[0]; // The most urgent building

    // --- BUILDER ASSIGNMENT FOR GOALS ---
    // If we have the resources for a high priority building, assign a builder
    if (!housePriority && primaryGoal && primaryGoal.priority >= 80) {
        const cost = primaryGoal.cost;
        if (resources.wood >= cost.wood && resources.food >= cost.food && resources.gold >= cost.gold) {
             // We can afford it! Assign builder.
             builders = 1;
             workingPop--;
        }
    }
    
    // --- RESOURCE DISTRIBUTION ---
    
    // Priority 1: Food for TC (Survival)
    // Dynamic calculation of food vills needed
    let minFoodVills = 6;
    if (foodSourceType === 'BERRIES') minFoodVills = 7; // Slower gather rate
    if (foodSourceType === 'FARM') minFoodVills = 7;
    if (civ === Civilization.FRANKS && foodSourceType === 'BERRIES') minFoodVills = 6;
    
    // Adjust for Age Up
    const feudalCost = getCost(civ, 'FEUDAL_AGE');
    if (!techs.feudal && pendingTechs.feudalClick === 0) {
        if (pop >= targetPop - 1) {
             // RUSH FOR FOOD: We need 500 food NOW
             const deficit = feudalCost.food - resources.food;
             if (deficit > 0) {
                 minFoodVills = workingPop - 2; // Leave 2 on wood/gold, rest food
             }
        }
    }

    // Cap minFoodVills to workingPop
    let foodVills = Math.min(workingPop, minFoodVills);
    let remainingPop = workingPop - foodVills;

    // Priority 2: Wood for Infrastructure
    let woodVills = 0;
    let goldVills = 0;

    // Calculate Wood Need
    let woodNeed = 0;
    if (housePriority && resources.wood < 25) woodNeed += 100; // Urgent need for house
    if (primaryGoal) {
        const deficit = Math.max(0, primaryGoal.cost.wood - resources.wood);
        if (deficit > 0) woodNeed += deficit;
    }
    
    // Calculate Gold Need
    let goldNeed = 0;
    if (strategy === StrategyFocus.MAN_AT_ARMS || strategy === StrategyFocus.ARCHERS || strategy === StrategyFocus.FAST_CASTLE) {
         // Loom gold (50) + Unit gold
         // If we are close to Feudal click, we might need 10 gold for Loom if we don't have it
         if (pop >= targetPop - 2 && resources.gold < 50) goldNeed += 50;
         
         if (primaryGoal && primaryGoal.cost.gold > 0) {
             goldNeed += Math.max(0, primaryGoal.cost.gold - resources.gold);
         }
    }

    // Distribute Remaining Pop based on Needs
    if (remainingPop > 0) {
        if (woodNeed === 0 && goldNeed === 0) {
            // Surplus logic
            if (!techs.feudal) {
                // In Dark Age, surplus usually goes to wood (preparing for farms/buildings)
                woodVills += remainingPop;
            } else {
                // Feudal Surplus -> depends on strategy (Farms vs Gold)
                woodVills += Math.floor(remainingPop / 2);
                foodVills += Math.ceil(remainingPop / 2);
            }
        } else {
            // Weighted distribution
            const totalNeed = woodNeed + (goldNeed * 2); // Gold is gathered slower/harder to access usually
            const woodRatio = totalNeed > 0 ? woodNeed / totalNeed : 1;
            
            // For MAA/Archers, we strictly need Gold Vills if we built mining camp
            if ((strategy === StrategyFocus.ARCHERS || strategy === StrategyFocus.MAN_AT_ARMS) && buildings.MiningCamp > 0) {
                // Force minimum gold vills if we have the camp
                const minGold = 2;
                const availableForGold = Math.min(minGold, remainingPop);
                goldVills += availableForGold;
                remainingPop -= availableForGold;
            }

            const wAdd = Math.round(remainingPop * woodRatio);
            woodVills += wAdd;
            remainingPop -= wAdd;
            goldVills += remainingPop; // Rest to gold
        }
    }

    // Fallback: If no lumber camp, we can't put many on wood efficiently (stragglers only)
    if (buildings.LumberCamp === 0 && woodVills > 3) {
        const excess = woodVills - 3;
        woodVills = 3;
        foodVills += excess;
    }

    return {
        food: foodVills,
        wood: woodVills,
        gold: goldVills,
        builders: builders
    };
};

const calculateCrowdingFactor = (villagers: number, accessTiles: number, difficulty: Difficulty): number => {
  const k = difficulty === Difficulty.ADVANCED ? 0.05 : 0.12; 
  const alpha = 2; 
  if (villagers <= accessTiles) return 1.0;
  const density = villagers / accessTiles;
  const penalty = k * Math.pow(density, alpha);
  return Math.max(0.4, 1 - penalty);
};

const calculateEffectiveRate = (
  rawRate: number,
  distance: number,
  civ: Civilization,
  sourceType: keyof typeof BASE_RATES,
  crowdingFactor: number = 1.0,
  upgrades: { doubleBitAxe: boolean, horseCollar: boolean, wheelbarrow: boolean }
): number => {
  let capacity = getCarryCapacity(civ);
  const walkMult = getWalkingMultiplier(civ);
  let civMult = getGatherRateMultiplier(civ, sourceType);
  
  if (sourceType === 'WOOD' && upgrades.doubleBitAxe) civMult *= 1.20; 
  
  const finalRawRate = rawRate * civMult;
  let speed = VILLAGER_SPEED;
  if (upgrades.wheelbarrow) {
      capacity *= 1.25; 
      speed *= 1.10;    
  }

  const tauWalk = (2 * distance) / (speed * 1.0); 
  const tauAnim = 2.0;
  const cycleTime = (capacity / finalRawRate) + (tauWalk * walkMult) + tauAnim;
  
  return ((capacity * 60) / cycleTime) * crowdingFactor;
};

interface FoodSource {
  type: 'SHEEP' | 'BOAR' | 'DEER' | 'BERRIES' | 'FARM';
  amount: number;
  maxAmount: number;
  decayRate: number; 
  isCarcass: boolean; 
  active: boolean; 
}

const getSpawnWalkingTime = (resource: 'FOOD' | 'WOOD' | 'GOLD', mapType: MapType, isLure: boolean = false): number => {
    let distance = 0;
    if (resource === 'FOOD') {
        distance = 1; 
        if (isLure) distance = 25; 
    }
    else if (resource === 'WOOD') {
        if (mapType === MapType.ARENA) distance = 14; 
        else distance = 10;
    } else if (resource === 'GOLD') {
        distance = 12; 
    }
    return distance / VILLAGER_SPEED;
};

// --- CORE SIMULATION ---
const executeSimulationPass = (
    config: SimulationConfig, 
    dna: OptimizationDNA
): SimulationResult => {
  const steps: BuildStep[] = [];
  const resourceCurve: ResourcePoint[] = [];
  const efficiencyHistory: EfficiencyPoint[] = [];
  const activeBonuses: string[] = [...getCivDescription(config.civilization)];
  const L = config.language;
  const effectiveTargetPop = config.targetPop;

  // Init Resources
  const startRes = getStartingResources(config.civilization);
  const bonus = getCivBonus(config.civilization);
  let food = startRes.food;
  let wood = startRes.wood;
  let gold = startRes.gold;
  let stone = startRes.stone;
  
  const startVills = 3 + (bonus.extraStartVills || 0);
  let pop = startVills + 1; // +1 Scout
  
  // Housing Init
  let housed = 5; 
  if (bonus.popSpaceAdd) housed += bonus.popSpaceAdd;
  if (bonus.noHousesNeeded) housed = 200;

  const buildings: Record<string, number> = {
    House: 0, LumberCamp: 0, Mill: 0, MiningCamp: 0, Barracks: 0, Farm: 0,
    Blacksmith: 0, Market: 0, Stable: 0, ArcheryRange: 0, SiegeWorkshop: 0, Monastery: 0, University: 0
  };

  // Chinese/Mayan start check
  if (!bonus.noHousesNeeded && config.civilization !== Civilization.CHINESE) {
      housed += 10; buildings.House = 2;
  } else if (config.civilization === Civilization.CHINESE) {
      housed += 15; buildings.House = 3;
  }

  interface ActiveConstruction { name: string; timeLeft: number; builders: number; startTime: number; endTime: number; }
  let activeConstruction: ActiveConstruction | null = null;

  const upgrades = { doubleBitAxe: false, horseCollar: false, wheelbarrow: false, loom: false };
  if (bonus.freeTechs?.includes("Loom") || bonus.freeLoom) upgrades.loom = true;

  // Map Resources
  const mapRes = MAP_RESOURCES_CONFIG[config.mapType] || MAP_RESOURCES_CONFIG[MapType.ARABIA];
  const yieldMult = bonus.resourceYieldMultiplier || 1.0;

  const sheepQueue: FoodSource[] = Array(mapRes.sheep).fill(null).map(() => ({ type: 'SHEEP', amount: 100 * yieldMult, maxAmount: 100 * yieldMult, decayRate: DECAY_RATES.SHEEP, isCarcass: false, active: false }));
  const boarQueue: FoodSource[] = Array(mapRes.boar).fill(null).map(() => ({ type: 'BOAR', amount: 340 * yieldMult, maxAmount: 340 * yieldMult, decayRate: DECAY_RATES.BOAR, isCarcass: false, active: false }));
  let deerQueue: FoodSource[] = config.lureDeer ? Array(mapRes.deer).fill(null).map(() => ({ type: 'DEER', amount: 140 * yieldMult, maxAmount: 140 * yieldMult, decayRate: DECAY_RATES.DEER, isCarcass: false, active: false })) : [];
  const berryBush: FoodSource = { type: 'BERRIES', amount: mapRes.berryAmount * mapRes.berries * yieldMult, maxAmount: mapRes.berryAmount * mapRes.berries * yieldMult, decayRate: 0, isCarcass: false, active: true };
  const createFarm = () => ({ type: 'FARM' as const, amount: 175 * yieldMult, maxAmount: 175 * yieldMult, decayRate: 0, isCarcass: false, active: true });

  let currentFoodSource: FoodSource | null = sheepQueue.shift() || null;
  if (currentFoodSource) currentFoodSource.active = true;
  let stragglerWoodLeft = config.useStragglerTrees ? STRAGGLER_TREE_WOOD * MAX_STRAGGLER_TREES : 0;
  
  // Stats
  let decayedFoodTotal = 0;
  let totalWoodGathered = 0;
  let tcIdleTime = 0;
  let feudalClickTime = 0;
  let feudalFinishTime = 0;
  let castleClickTime = 0;
  let lastPopTime = 0;
  let hasLoom = upgrades.loom;
  let tcFreeAt = 0;
  
  const maxTime = 1300; 
  const dt = 1;

  steps.push({
    time: 0, population: pop, instruction: `${pop-1} Vills: Start`, type: 'create',
    resources: { food: Math.floor(food), wood: Math.floor(wood), gold: Math.floor(gold) },
    villagerAllocation: { food: pop-1, wood: 0, gold: 0, builders: 0 }
  });

  let currentAllocation = { food: pop-1, wood: 0, gold: 0, builders: 0 };
  let prevAllocation = { ...currentAllocation };
  let activeSpawnFriction = { food: 0, wood: 0, gold: 0 };
  let finalRates = { food: 0, wood: 0, gold: 0 };

  for (let t = 0; t < maxTime; t += dt) {
      
      // 1. Process Construction
      if (activeConstruction) {
          activeConstruction.timeLeft -= dt;
          if (activeConstruction.timeLeft <= 0) {
              buildings[activeConstruction.name] = (buildings[activeConstruction.name] || 0) + 1;
              activeConstruction = null;
          }
      }

      // 2. Determine Food Status
      let foodStatus: 'PLENTY' | 'SCARCE' | 'CRITICAL' = 'PLENTY';
      if (currentFoodSource?.type === 'FARM') foodStatus = 'CRITICAL';
      else if (currentFoodSource?.type === 'BERRIES' && boarQueue.length === 0 && sheepQueue.length === 0) foodStatus = 'CRITICAL';

      // 3. AI Allocation
      const alloc = calculateSmartAllocation({
          pop, housed, resources: { food, wood, gold, stone }, buildings,
          techs: { feudal: feudalFinishTime > 0, castle: castleClickTime > 0 && t > castleClickTime, loom: hasLoom },
          pendingTechs: { feudalClick: feudalClickTime, castleClick: castleClickTime },
          strategy: config.strategy, tightness: config.tightness, targetPop: effectiveTargetPop,
          civ: config.civilization,
          foodSourceStatus: foodStatus, 
          foodSourceType: currentFoodSource?.type || null,
          time: t, dna
      });
      
      currentAllocation = { ...alloc };
      if (activeConstruction) currentAllocation.builders = activeConstruction.builders;

      // Detect & Log Retasking (Hysteresis)
      const diff = Math.abs(currentAllocation.food - prevAllocation.food) + Math.abs(currentAllocation.wood - prevAllocation.wood) + Math.abs(currentAllocation.gold - prevAllocation.gold);
      if (diff > 1 && t > 10) {
          // Only log significant shifts to avoid spam
          if (Math.abs(currentAllocation.wood - prevAllocation.wood) >= 2) {
             const dir = currentAllocation.wood > prevAllocation.wood ? "Food -> Wood" : "Wood -> Food";
             // steps.push({ time: t, population: pop, instruction: `Retask (${dir})`, type: 'move', resources: {food, wood, gold}, villagerAllocation: {...currentAllocation} });
          }
      }
      prevAllocation = { ...currentAllocation };

      // 4. Gather Resources
      // Wood
      let woodDist = 2 + Math.sqrt(totalWoodGathered/400);
      if (buildings.LumberCamp === 0) woodDist = 1; // Stragglers close to TC
      const wRate = calculateEffectiveRate(BASE_RATES.WOOD, woodDist, config.civilization, 'WOOD', 1.0, upgrades);
      const wIn = (wRate/60) * currentAllocation.wood * dt;
      wood += wIn;
      totalWoodGathered += wIn;
      if (buildings.LumberCamp === 0) stragglerWoodLeft -= wIn;
      if (stragglerWoodLeft <= 0 && buildings.LumberCamp === 0 && currentAllocation.wood > 0) {
           // Stragglers depleted logic could force LC build
      }

      // Food
      let fRate = 0;
      if (currentFoodSource) {
           // Decay
           if (currentFoodSource.decayRate > 0) {
               const decay = currentFoodSource.decayRate * dt;
               currentFoodSource.amount -= decay;
               decayedFoodTotal += decay;
           }
           
           let dist = currentFoodSource.type === 'BERRIES' ? 4 : 0;
           if (currentFoodSource.type === 'FARM') dist = getAverageFarmDistance(buildings.Farm);
           
           const fRawRate = currentFoodSource.type === 'BERRIES' ? BASE_RATES.BERRIES : (currentFoodSource.type === 'BOAR' ? BASE_RATES.BOAR : (currentFoodSource.type === 'FARM' ? BASE_RATES.FARM : BASE_RATES.SHEEP));
           fRate = calculateEffectiveRate(fRawRate, dist, config.civilization, currentFoodSource.type, 1.0, upgrades);
           
           const fIn = (fRate/60) * currentAllocation.food * dt;
           if (currentFoodSource.amount >= fIn) {
               currentFoodSource.amount -= fIn;
               food += fIn;
           } else {
               food += currentFoodSource.amount;
               currentFoodSource.amount = 0;
           }

           // Source Depletion Logic
           if (currentFoodSource.amount <= 1) {
               // Next source
               let next: FoodSource | null = null;
               let instr = "";
               let isLure = false;
               
               // Priority: Boar -> Sheep -> Deer -> Berries -> Farms
               if (pop >= 10 && boarQueue.length > 0) { next = boarQueue.shift()!; instr = tr(L, 'LURE_BOAR'); isLure = true; }
               else if (sheepQueue.length > 0) { next = sheepQueue.shift()!; }
               else if (config.lureDeer && deerQueue.length > 0) { next = deerQueue.shift()!; }
               else if (berryBush.amount > 0 && buildings.Mill > 0) { next = berryBush; instr = tr(L, 'TRANSITION_BERRIES'); }
               else {
                   // Auto Farm
                   if (wood >= 60 && buildings.Mill > 0) {
                       wood -= 60; buildings.Farm++;
                       next = createFarm();
                       instr = "Build Farm (Auto)";
                       steps.push({ time: t, population: pop, instruction: instr, type: 'build', resources: {food, wood, gold}, villagerAllocation: {...currentAllocation} });
                   }
               }
               
               if (next) {
                   currentFoodSource = next;
                   currentFoodSource.active = true;
                   if (instr && !instr.includes("Auto")) steps.push({ time: t, population: pop, instruction: instr, type: 'move', resources: {food, wood, gold}, villagerAllocation: {...currentAllocation} });
                   if (isLure) activeSpawnFriction.food += 25;
               }
           }
      }

      // Gold
      let gRate = 0;
      if (currentAllocation.gold > 0) {
          gRate = calculateEffectiveRate(BASE_RATES.GOLD, 5, config.civilization, 'GOLD', 1.0, upgrades);
          gold += (gRate/60) * currentAllocation.gold * dt;
      }

      finalRates = { food: (fRate * currentAllocation.food), wood: (wRate * currentAllocation.wood), gold: (gRate * currentAllocation.gold) };

      // 5. Start Buildings (From Goals)
      if (!activeConstruction) {
          const goals = getNextStrategicBuildings(config.strategy, buildings, config.civilization, pop, effectiveTargetPop, { feudal: feudalFinishTime > 0, castle: castleClickTime > 0 });
          
          // House check (Highest priority override)
          const housingHeadroom = housed - pop;
          if (housingHeadroom <= 2 && housed < 200 && wood >= 25) {
              // Check if we didn't just build one
              const lastHouse = [...steps].reverse().find(s => s.instruction.includes('House'));
              if (!lastHouse || t - lastHouse.time > 15) {
                   wood -= 25;
                   const buildTime = calculateBuildTime(BUILD_TIMES['House'], 1);
                   activeConstruction = { name: 'House', timeLeft: buildTime, builders: 1, startTime: t, endTime: t + buildTime };
                   housed += 5;
                   // Determine builder origin
                   let builderSrc = "Villager";
                   if (currentAllocation.wood > prevAllocation.wood) builderSrc = "Wood Vill";
                   steps.push({ time: t, endTime: t + buildTime, population: pop, instruction: `${builderSrc} -> ${tr(L, 'BUILD_HOUSE')}`, type: 'build', resources: {food, wood, gold}, villagerAllocation: {...currentAllocation} });
              }
          } else {
              // Try strategic goals
              for (const goal of goals) {
                  if (wood >= goal.cost.wood && food >= goal.cost.food && gold >= goal.cost.gold) {
                      // Affordability check passed.
                      wood -= goal.cost.wood; food -= goal.cost.food; gold -= goal.cost.gold;
                      
                      const buildTimeBase = BUILD_TIMES[goal.name.replace(' ', '')] || 30;
                      const buildTime = calculateBuildTime(buildTimeBase, 1);
                      activeConstruction = { name: goal.name.replace(' ', ''), timeLeft: buildTime, builders: 1, startTime: t, endTime: t + buildTime };
                      
                      let builderSrc = "Villager";
                      if (currentAllocation.wood > prevAllocation.wood) builderSrc = "Wood Vill";
                      else if (t === lastPopTime) builderSrc = "New Villager";
                      
                      let instrName = goal.name;
                      if (goal.name === 'Barracks') instrName = tr(L, 'BUILD_BARRACKS');
                      if (goal.name === 'Lumber Camp') instrName = tr(L, 'BUILD_LUMBER');
                      if (goal.name === 'Mill') instrName = tr(L, 'BUILD_MILL');
                      
                      steps.push({ time: t, endTime: t + buildTime, population: pop, instruction: `${builderSrc} -> ${instrName}`, type: 'build', resources: {food, wood, gold}, villagerAllocation: {...currentAllocation} });
                      break; // Only start one building at a time
                  }
              }
          }
      }

      // 6. Town Center Production & Techs
      if (t >= tcFreeAt) {
          // Check Feudal Click
          const feudalCost = getCost(config.civilization, 'FEUDAL_AGE');
          const canClickFeudal = buildings.LumberCamp > 0 && (buildings.Mill > 0 || buildings.MiningCamp > 0 || buildings.Barracks > 0); // Need 2 buildings
          
          if (pop >= effectiveTargetPop && canClickFeudal && food >= feudalCost.food && feudalClickTime === 0) {
              food -= feudalCost.food;
              feudalClickTime = t;
              tcFreeAt = t + 130;
              steps.push({ time: t, population: pop, instruction: tr(L, 'CLICK_FEUDAL'), type: 'research', resources: {food, wood, gold}, villagerAllocation: {...currentAllocation} });
          } 
          // Check Loom (Just before Feudal if needed)
          else if (!hasLoom && pop >= effectiveTargetPop - 1 && gold >= 50 && feudalClickTime === 0 && dna.loomTiming !== 'SKIP') {
               gold -= 50; hasLoom = true; tcFreeAt = t + 25;
               steps.push({ time: t, population: pop, instruction: tr(L, 'RESEARCH_LOOM'), type: 'research', resources: {food, wood, gold}, villagerAllocation: {...currentAllocation} });
          }
          // Train Villager
          else if (pop < effectiveTargetPop && pop < housed && feudalClickTime === 0) {
              if (food >= 50) {
                  food -= 50;
                  pop++;
                  lastPopTime = t;
                  tcFreeAt = t + 25;
                  
                  // Contextual instruction
                  let task = tr(L, 'GATHER_SHEEP');
                  if (currentAllocation.wood > prevAllocation.wood) task = tr(L, 'GATHER_WOOD');
                  else if (currentAllocation.gold > prevAllocation.gold) task = tr(L, 'GATHER_GOLD');
                  else if (activeConstruction?.builders && currentAllocation.builders > prevAllocation.builders) task = tr(L, 'BUILDER');
                  else if (currentFoodSource?.type === 'BERRIES') task = tr(L, 'GATHER_BERRIES');

                  steps.push({ time: t, population: pop, instruction: task, type: 'create', resources: {food, wood, gold}, villagerAllocation: {...currentAllocation} });
              } else {
                  tcIdleTime += dt;
              }
          }
      }

      // Feudal Complete
      if (feudalClickTime > 0 && t >= feudalClickTime + 130 && feudalFinishTime === 0) {
          feudalFinishTime = t;
          steps.push({ time: t, population: pop, instruction: tr(L, 'FEUDAL_COMPLETE'), type: 'research', resources: {food, wood, gold}, villagerAllocation: {...currentAllocation} });
          // Auto Double Bit Axe
          const dba = getCost(config.civilization, 'DOUBLE_BIT_AXE');
          if (wood >= dba.wood && food >= dba.food) {
              wood -= dba.wood; food -= dba.food; upgrades.doubleBitAxe = true;
              steps.push({ time: t, population: pop, instruction: tr(L, 'DB_AXE'), type: 'research', resources: {food, wood, gold}, villagerAllocation: {...currentAllocation} });
          }
      }

      // Sampling
      if (t % 15 === 0) {
          resourceCurve.push({ time: t, food, wood, gold, totalGathered: food+wood+gold, villagerAllocation: {...currentAllocation} });
          efficiencyHistory.push({ time: t, foodEfficiency: 1, woodEfficiency: 1, woodLineDepth: 0 });
      }

      if (feudalFinishTime > 0 && t > feudalFinishTime + 60) break;
  }

  // Scoring
  const theoretical = (effectiveTargetPop - 3) * 25 + 130;
  const actual = feudalClickTime > 0 ? feudalClickTime + 130 : maxTime;
  const score = Math.max(0, 100 - (actual - theoretical) - (tcIdleTime/2));
  
  const formatTime = (sec: number) => { const m = Math.floor(sec / 60); const s = sec % 60; return `${m}:${s.toString().padStart(2, '0')}`; };

  return {
    id: Date.now().toString(36), timestamp: Date.now(), configName: `${config.civilization} ${config.strategy}`,
    steps, resourceCurve, efficiencyHistory, efficiencyScore: Math.floor(score),
    theoreticalFeudalTime: feudalClickTime > 0 ? formatTime(actual) : "N/A",
    theoreticalCastleTime: castleClickTime > 0 ? formatTime(castleClickTime + 160) : "N/A",
    frictionFactor: 1.0, stats: { decayedFood: Math.floor(decayedFoodTotal), woodLineDepth: 0, idleTime: Math.floor(tcIdleTime) },
    survivalRating: 100, activeBonuses,
    dnaUsed: dna
  };
};

const generateVariants = (config: SimulationConfig): OptimizationDNA[] => {
    return [{ 
        riskProfile: 'BALANCED', loomTiming: 'LATE', useStragglersAggressively: true, forceDropOffs: false, openingBuildOrder: 'STANDARD', boarTiming: 'STANDARD'
    }];
};

export const runSimulation = (config: SimulationConfig): SimulationResult => {
    const dna = generateVariants(config)[0];
    return executeSimulationPass(config, dna);
};
