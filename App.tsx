
import React, { useReducer, useEffect, useState, useCallback } from 'react';
import { GameState, Job, Season, Villager, Activity, GameStatus, Difficulty } from './types';
import { 
  JOB_INCOME, BUILDING_COSTS, HOUSE_CAPACITY_BASE, HOUSE_CAPACITY_UPGRADED, 
  CONSUMPTION, GUARD_COVERAGE_BASE, GUARD_COVERAGE_UPGRADED, TECH_TREE, 
  FARMER_WEEKLY_BASE, WINTER_WOOD_CONSUMPTION, WALL_GUARD_BONUS,
  WEEKS_PER_YEAR, SEASON_BOUNDS, MAX_YEARS, GAME_END_TICK, DIFFICULTY_SETTINGS,
  TRADE_RATES, TRADE_AMOUNT
} from './constants';
import { generateInitialPopulation, generateVillager } from './utils/gameHelper';
import { generateGameEvent, generateHappinessEvent } from './services/geminiService';
import { round2 } from './utils/mathUtils';
import { ResourceDisplay } from './components/ResourceDisplay';
import { VillagerList } from './components/VillagerList';
import { GameControls } from './components/GameControls';
import { EventLog } from './components/EventLog';
import { VillagerModal } from './components/VillagerModal';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { GiTrophyCup, GiSkullCrossedBones, GiBabyFace, GiWheat, GiCrown } from 'react-icons/gi';

// --- State Management ---
type Action = 
  | { type: 'START_GAME'; difficulty: Difficulty }
  | { type: 'TICK' }
  | { type: 'TOGGLE_PAUSE' }
  | { type: 'ASSIGN_JOB'; job: Job; amount: number }
  | { type: 'UPDATE_BIO'; id: string; bio: string }
  | { type: 'AI_EVENT'; payload: any }
  | { type: 'CONSTRUCT_BUILDING'; building: keyof typeof BUILDING_COSTS }
  | { type: 'HOLD_FESTIVAL' }
  | { type: 'RESEARCH_TECH'; techId: string }
  | { type: 'TRADE_RESOURCE'; resource: 'food' | 'wood' | 'stone'; action: 'buy' | 'sell' }
  | { type: 'RESTART_GAME' };

const initialStats = {
  totalBirths: 0,
  totalDeaths: 0,
  peakPopulation: 0,
  totalFoodProduced: 0,
  totalGoldMined: 0,
  festivalsHeld: 0,
  starvationDays: 0
};

const initialState: GameState = {
  status: GameStatus.Menu,
  difficulty: Difficulty.Normal,
  tick: 0,
  season: Season.Spring,
  resources: DIFFICULTY_SETTINGS[Difficulty.Normal].startingResources,
  buildings: { houses: 4, markets: 0, walls: 0, libraries: 0, taverns: 0, cathedrals: 0 },
  technologies: [],
  population: [],
  logs: [],
  paused: true,
  gameSpeed: 500, // Slower tick speed because 1 tick is now 1 week (more impactful)
  history: [],
  stats: initialStats
};

function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'START_GAME': {
      const settings = DIFFICULTY_SETTINGS[action.difficulty];
      return {
        ...initialState,
        status: GameStatus.Playing,
        difficulty: action.difficulty,
        tick: 1,
        paused: false,
        resources: { ...settings.startingResources },
        population: generateInitialPopulation(settings.startingPop),
        stats: { ...initialStats, peakPopulation: settings.startingPop },
        logs: [{ id: 'init', tick: 1, message: `你的统治开始了。难度: ${settings.name}。目标: 存活 ${MAX_YEARS} 年。`, type: 'info' }]
      };
    }

    case 'RESTART_GAME':
      return initialState;

    case 'TOGGLE_PAUSE':
      return { ...state, paused: !state.paused };

    case 'UPDATE_BIO':
      return {
        ...state,
        population: state.population.map(v => v.id === action.id ? { ...v, bio: action.bio } : v)
      };

    case 'CONSTRUCT_BUILDING': {
      const { building } = action;
      if (building === 'Festival') return state;
      const cost = BUILDING_COSTS[building];
      
      // Cathedral check handled generically by loop below
      // Specific building count increments
      if (state.resources.wood >= cost.wood && state.resources.stone >= cost.stone && state.resources.gold >= cost.gold) {
        const newResources = {
          ...state.resources,
          wood: state.resources.wood - cost.wood,
          stone: state.resources.stone - cost.stone,
          gold: state.resources.gold - cost.gold
        };
        const newBuildings = { ...state.buildings };
        
        // Map building string to state property
        if (building === 'House') newBuildings.houses += 1;
        if (building === 'Market') newBuildings.markets += 1;
        if (building === 'StoneWall') newBuildings.walls += 1;
        if (building === 'Library') newBuildings.libraries += 1;
        if (building === 'Tavern') newBuildings.taverns += 1;
        if (building === 'Cathedral') newBuildings.cathedrals += 1;
        
        return {
          ...state,
          resources: newResources,
          buildings: newBuildings,
          logs: [...state.logs, { id: Math.random().toString(), tick: state.tick, message: `建造完成`, type: 'success' }]
        };
      }
      return state;
    }

    case 'RESEARCH_TECH': {
        const tech = TECH_TREE.find(t => t.id === action.techId);
        if (tech && state.resources.knowledge >= tech.cost && !state.technologies.includes(tech.id)) {
            return {
                ...state,
                resources: { ...state.resources, knowledge: state.resources.knowledge - tech.cost },
                technologies: [...state.technologies, tech.id],
                logs: [...state.logs, { id: Math.random().toString(), tick: state.tick, message: `科技研发完成：${tech.name}`, type: 'tech' }]
            };
        }
        return state;
    }

    case 'HOLD_FESTIVAL': {
      const cost = BUILDING_COSTS.Festival;
      if (state.resources.gold >= cost.gold && state.resources.food >= cost.food) {
         const newPop = state.population.map(v => ({
             ...v,
             happiness: Math.min(100, v.happiness + 30)
         }));
         return {
             ...state,
             population: newPop,
             resources: {
                 ...state.resources,
                 gold: state.resources.gold - cost.gold,
                 food: state.resources.food - cost.food
             },
             stats: { ...state.stats, festivalsHeld: state.stats.festivalsHeld + 1 },
             logs: [...state.logs, { id: Math.random().toString(), tick: state.tick, message: `举办了盛大的庆典！`, type: 'success' }]
         };
      }
      return state;
    }
    
    case 'TRADE_RESOURCE': {
        if (state.buildings.markets < 1) return state;
        const { resource, action: tradeAction } = action;
        const rates = TRADE_RATES[resource];
        const newResources = { ...state.resources };
        
        if (tradeAction === 'buy') {
            if (newResources.gold >= rates.buy) {
                newResources.gold -= rates.buy;
                newResources[resource] += TRADE_AMOUNT;
                return { ...state, resources: newResources };
            }
        } else if (tradeAction === 'sell') {
            if (newResources[resource] >= TRADE_AMOUNT) {
                newResources[resource] -= TRADE_AMOUNT;
                newResources.gold += rates.sell;
                return { ...state, resources: newResources };
            }
        }
        return state;
    }

    case 'ASSIGN_JOB': {
      const { job, amount } = action;
      const newPop = [...state.population];
      if (amount > 0) {
        let assigned = 0;
        for (let i = 0; i < newPop.length; i++) {
          if (assigned >= amount) break;
          if (newPop[i].job === Job.Unemployed && newPop[i].age >= 16) {
            newPop[i].job = job;
            assigned++;
          }
        }
      } else {
        let fired = 0;
        const target = Math.abs(amount);
        for (let i = 0; i < newPop.length; i++) {
          if (fired >= target) break;
          if (newPop[i].job === job) {
            newPop[i].job = Job.Unemployed;
            fired++;
          }
        }
      }
      return { ...state, population: newPop };
    }

    case 'AI_EVENT': {
      const { message, type, deltaFood, deltaWood, deltaGold, deltaPop } = action.payload;
      
      // Calculate average happiness for impact modifier
      const avgHappiness = state.population.reduce((acc, v) => acc + v.happiness, 0) / state.population.length || 0;
      const happinessMultiplier = round2(1 + (avgHappiness - 50) / 200); // Range: 0.75 to 1.25
      
      // Difficulty modifier for AI events (Bad events are worse on Hard)
      const diffSettings = DIFFICULTY_SETTINGS[state.difficulty];
      let finalDeltaFood = deltaFood;
      let finalDeltaGold = deltaGold;
      
      if (state.difficulty === Difficulty.Hard && (deltaFood < 0 || deltaGold < 0)) {
          finalDeltaFood = round2(deltaFood * 1.5);
          finalDeltaGold = round2(deltaGold * 1.5);
      }

      // Guard mitigation logic
      const guardCount = state.population.filter(p => p.job === Job.Guard).length;
      const hasArchery = state.technologies.includes('archery_1');
      const baseCoverage = hasArchery ? GUARD_COVERAGE_UPGRADED : GUARD_COVERAGE_BASE;
      const wallBonus = state.buildings.walls * WALL_GUARD_BONUS;
      const guardCoverage = baseCoverage + wallBonus;
      const securityRatio = round2(Math.min(1, (guardCount * guardCoverage) / Math.max(1, state.population.length)));
      
      let modMessage = message;
      let happinessImpactNote = "";
      
      // Apply happiness modifier to positive events (amplify good, reduce bad)
      if (deltaFood > 0 || deltaGold > 0) {
        finalDeltaFood = round2(finalDeltaFood * happinessMultiplier);
        finalDeltaGold = round2(finalDeltaGold * happinessMultiplier);
        if (happinessMultiplier > 1.1) {
          happinessImpactNote = " (高幸福度提升了收益)";
        }
      } else if (deltaFood < 0 || deltaGold < 0) {
        // High happiness reduces negative impact
        finalDeltaFood = round2(finalDeltaFood / happinessMultiplier);
        finalDeltaGold = round2(finalDeltaGold / happinessMultiplier);
        if (happinessMultiplier > 1.1) {
          happinessImpactNote = " (高幸福度减轻了损失)";
        } else if (happinessMultiplier < 0.9) {
          happinessImpactNote = " (低幸福度加重了损失)";
        }
      }
      
      if (securityRatio > 0.5) {
          if (finalDeltaFood < 0) finalDeltaFood = round2(finalDeltaFood * (1 - securityRatio * 0.5)); 
          if (finalDeltaGold < 0) finalDeltaGold = round2(finalDeltaGold * (1 - securityRatio * 0.8)); 
          if ((finalDeltaFood !== deltaFood || finalDeltaGold !== deltaGold)) {
               modMessage += " (守卫减少了损失)";
          }
      }
      
      modMessage += happinessImpactNote;

      const newResources = {
        food: round2(Math.max(0, state.resources.food + finalDeltaFood)),
        wood: round2(Math.max(0, state.resources.wood + deltaWood)), // Wood usually not stolen
        stone: round2(state.resources.stone),
        gold: round2(Math.max(0, state.resources.gold + finalDeltaGold)),
        knowledge: round2(state.resources.knowledge)
      };
      
      let newPop = [...state.population];
      if (deltaPop && deltaPop < 0) {
        const deaths = Math.abs(deltaPop);
        newPop.splice(0, deaths);
      } else if (deltaPop && deltaPop > 0) {
        for(let i=0; i<deltaPop; i++) newPop.push(generateVillager());
      }

      return {
        ...state,
        resources: newResources,
        population: newPop,
        logs: [...state.logs, { id: Math.random().toString(), tick: state.tick, message: modMessage, type: 'ai' }]
      };
    }

    case 'TICK': {
      if (state.paused || state.status !== GameStatus.Playing) return state;

      // Check Game End
      if (state.tick >= GAME_END_TICK) {
          return { ...state, status: GameStatus.Finished, paused: true };
      }

      const settings = DIFFICULTY_SETTINGS[state.difficulty];
      const weekOfYear = (state.tick - 1) % WEEKS_PER_YEAR; // 0-51

      // --- Season Logic ---
      let currentSeason = Season.Winter;
      if (weekOfYear < SEASON_BOUNDS.SPRING_END) currentSeason = Season.Spring;
      else if (weekOfYear < SEASON_BOUNDS.SUMMER_END) currentSeason = Season.Summer;
      else if (weekOfYear < SEASON_BOUNDS.AUTUMN_END) currentSeason = Season.Autumn;
      
      // --- Multipliers ---
      let foodMultiplier = 1;
      if (currentSeason === Season.Spring) foodMultiplier = 0.9;
      if (currentSeason === Season.Summer) foodMultiplier = 1.0;
      if (currentSeason === Season.Autumn) foodMultiplier = 2.0; 
      if (currentSeason === Season.Winter) foodMultiplier = 0.4;
      
      if (state.technologies.includes('farming_1')) foodMultiplier += 0.2;
      if (state.technologies.includes('irrigation_1')) foodMultiplier += 0.2;
      
      // Apply Difficulty Production Multiplier
      foodMultiplier *= settings.productionMultiplier;

      // --- Production ---
      let producedFood = 0;
      let producedWood = 0;
      let producedStone = 0;
      let producedGold = 0;
      let producedKnowledge = 0;
      let activeFarmers = 0;

      state.population.forEach(v => {
          if (v.age >= 16 && v.health > 0) { // Alive and adult
              const income = JOB_INCOME[v.job];
              
              // Efficiency Calculation based on Health and Hunger
              let efficiency = 1.0;
              
              // Hunger Penalty
              if (v.hunger > 20) efficiency -= 0.2;
              if (v.hunger > 50) efficiency -= 0.3;
              if (v.hunger > 80) efficiency -= 0.2; // Total -0.7 if starving

              // Health Penalty
              if (v.health < 50) efficiency -= 0.3;
              if (v.health < 20) efficiency -= 0.2; // Total -0.5 if dying

              // Minimum efficiency floor so production doesn't hit absolute zero unless dead
              efficiency = round2(Math.max(0.1, efficiency)); 

              if (v.job === Job.Farmer) {
                  activeFarmers = round2(activeFarmers + efficiency); // Fractional farmer
              }

              let woodMult = round2(1.0 * settings.productionMultiplier);
              if (state.technologies.includes('tools_1')) woodMult = round2(woodMult + 0.2);
              if (state.technologies.includes('forestry_1')) woodMult = round2(woodMult + 0.2);
              producedWood = round2(producedWood + income.wood * woodMult * efficiency);

              let stoneGoldMult = round2(1.0 * settings.productionMultiplier);
              if (state.technologies.includes('tools_1')) stoneGoldMult = round2(stoneGoldMult + 0.2);
              producedStone = round2(producedStone + income.stone * stoneGoldMult * efficiency);
              producedGold = round2(producedGold + income.gold * stoneGoldMult * efficiency);

              const libraryBonus = state.buildings.libraries > 0 ? round2(state.buildings.libraries * 0.2 * 7) : 0; 
              producedKnowledge = round2(producedKnowledge + (income.knowledge * efficiency) + (v.job === Job.Scholar && state.technologies.includes('scribing_1') ? (7 * efficiency) : 0) + (v.job === Job.Scholar ? (libraryBonus * efficiency) : 0));
          }
      });

      // --- Harvest (Every Tick is a Week) ---
      const newLogs = [...state.logs];
      const baseYield = round2(activeFarmers * FARMER_WEEKLY_BASE);
      const totalHarvest = round2(baseYield * foodMultiplier);
      producedFood = totalHarvest;
      
      // --- Security ---
      const guards = state.population.filter(p => p.job === Job.Guard).length;
      const totalPop = state.population.length;
      const baseCoverage = state.technologies.includes('archery_1') ? GUARD_COVERAGE_UPGRADED : GUARD_COVERAGE_BASE;
      const wallBonus = state.buildings.walls * WALL_GUARD_BONUS;
      const guardCoverage = baseCoverage + wallBonus;
      const requiredGuards = Math.max(1, Math.ceil(totalPop / guardCoverage));
      const isSecure = guards >= requiredGuards;
      
      let theftFood = 0;
      let theftGold = 0;

      if (!isSecure && totalPop > 10) {
          if (Math.random() < 0.1) { 
              theftFood = round2(state.resources.food * 0.05 * settings.consumptionRate); 
              theftGold = round2(state.resources.gold * 0.05);
              if (theftFood > 0 || theftGold > 0) {
                  newLogs.push({ id: Math.random().toString(), tick: state.tick, message: `治安恶化！被盗 ${theftFood} 食物, ${theftGold} 黄金`, type: 'warning' });
              }
          }
      }

      // --- Consumption & Winter Heating ---
      let consumedWood = 0;
      let isFreezing = false;
      if (currentSeason === Season.Winter) {
          const heatingNeed = Math.ceil(totalPop * WINTER_WOOD_CONSUMPTION * settings.consumptionRate);
          const availableWood = state.resources.wood + producedWood; 
          
          if (availableWood >= heatingNeed) {
              consumedWood = heatingNeed;
          } else {
              consumedWood = availableWood; 
              isFreezing = true;
              newLogs.push({ id: Math.random().toString(), tick: state.tick, message: `木材耗尽！`, type: 'danger' });
          }
      }

      // Calculate total food consumption with lower rate for children
      let rawFoodConsumption = 0;
      state.population.forEach(v => {
        if (v.age < 16) {
            rawFoodConsumption = round2(rawFoodConsumption + CONSUMPTION.childFood);
        } else {
            rawFoodConsumption = round2(rawFoodConsumption + CONSUMPTION.food);
        }
      });
      const totalConsumption = round2(rawFoodConsumption * settings.consumptionRate);

      const netFood = round2(state.resources.food + producedFood - totalConsumption - theftFood);
      const finalFood = round2(Math.max(0, netFood));
      const isStarving = netFood < 0;

      if (currentSeason !== state.season) {
          newLogs.push({ id: Math.random().toString(), tick: state.tick, message: `季节更替：${currentSeason}`, type: 'info' });
      }

      // --- Villager Logic ---
      const houseCapacityPerBldg = state.technologies.includes('masonry_1') ? HOUSE_CAPACITY_UPGRADED : HOUSE_CAPACITY_BASE;
      const housingCap = state.buildings.houses * houseCapacityPerBldg;
      let newBabies: Villager[] = [];
      
      const newPop = state.population.map(v => {
        let newV = { ...v };

        // Aging: Age once per 52 weeks
        if (state.tick % WEEKS_PER_YEAR === 0) {
            newV.age += 1;
            if (newV.age === 16 && newV.job === Job.Child) {
                newV.job = Job.Unemployed;
                newLogs.push({ id: Math.random().toString(), tick: state.tick, message: `${newV.name} 成年了`, type: 'info' });
            }
        }

        // Stats (Apply weekly effects)
        if (isFreezing) {
            newV.health -= 5; // Harsher per tick since it's a week
            newV.happiness -= 5;
            newV.currentActivity = Activity.Freezing;
        } else if (newV.job === Job.Unemployed || newV.job === Job.Child) {
            newV.currentActivity = Activity.Idle;
        } else {
            newV.currentActivity = Activity.Working;
        }

        if (!isSecure && totalPop > 10) newV.happiness = Math.max(0, newV.happiness - 1);

        if (isStarving) {
            newV.hunger = Math.min(100, newV.hunger + 20); // More hunger per tick
            newV.happiness -= 10;
            newV.health -= 5;
        } else {
            newV.hunger = 0;
            const healRate = state.technologies.includes('medicine_1') ? 5 : 2; // Higher heal rate per tick
            const tavernBonus = state.buildings.taverns > 0 ? 2 : 0;
            const cathedralBonus = state.buildings.cathedrals > 0 ? (state.buildings.cathedrals * 1) : 0; 
            
            if (!isFreezing) {
                newV.health = Math.min(100, newV.health + healRate);
                if (newV.hunger === 0) newV.happiness = Math.min(100, newV.happiness + 2 + tavernBonus + cathedralBonus);
            }
        }
        return newV;
      });

      // Reproduction (Increased probability for weekly scale)
      if (newPop.length < housingCap) {
          const fertilePop = newPop.filter(v => v.age >= 18 && v.age <= 40 && v.happiness > 70 && v.hunger === 0 && !isFreezing).length;
          const birthChance = fertilePop * 0.03; // Increased from 0.002 (daily) to 0.03 (weekly) ~15x increase
          
          if (Math.random() < birthChance) {
               const baby = generateVillager(0);
               const parent = newPop[Math.floor(Math.random() * newPop.length)];
               baby.name = `${baby.name.split('·')[0]}·${parent.name.split('·')[1]}`; 
               newBabies.push(baby);
          }
      }

      // Deaths
      const survivors: Villager[] = [];
      let deathCount = 0;
      newPop.forEach(v => {
          let dead = false;
          if (v.health <= 0) dead = true;
          if (!dead && v.age > 60) {
              let deathChance = (v.age - 60) * 0.003; // Increased chance per tick (week)
              if (state.technologies.includes('medicine_1')) deathChance *= 0.5;
              if (Math.random() < deathChance) dead = true;
          }
          if (!dead) survivors.push(v);
          else deathCount++;
      });

      if (deathCount > 0) newLogs.push({ id: Math.random().toString(), tick: state.tick, message: `${deathCount} 人死亡`, type: 'danger' });
      if (newBabies.length > 0) {
          survivors.push(...newBabies);
          newLogs.push({ id: Math.random().toString(), tick: state.tick, message: `新生命诞生`, type: 'success' });
      }

      // --- Update History & Stats ---
      const newHistory = [...state.history, { tick: state.tick, pop: survivors.length, food: round2(finalFood) }].slice(-520); // Keep 10 years of weekly history

      const newStats = {
          ...state.stats,
          totalBirths: state.stats.totalBirths + newBabies.length,
          totalDeaths: state.stats.totalDeaths + deathCount,
          peakPopulation: Math.max(state.stats.peakPopulation, survivors.length),
          totalFoodProduced: round2(state.stats.totalFoodProduced + producedFood),
          totalGoldMined: round2(state.stats.totalGoldMined + producedGold),
          starvationDays: isStarving ? state.stats.starvationDays + 1 : state.stats.starvationDays
      };

      if (survivors.length === 0) {
           return {
               ...state,
               status: GameStatus.Finished,
               population: [],
               logs: [...newLogs, { id: 'end', tick: state.tick, message: '村庄覆灭了。', type: 'danger' }],
               stats: newStats
           };
      }

      return {
        ...state,
        tick: state.tick + 1,
        season: currentSeason,
        resources: {
          food: round2(finalFood),
          wood: round2(Math.max(0, state.resources.wood + producedWood - consumedWood)),
          stone: round2(state.resources.stone + producedStone),
          gold: round2(Math.max(0, state.resources.gold + producedGold - theftGold)),
          knowledge: round2(state.resources.knowledge + producedKnowledge)
        },
        population: survivors,
        logs: newLogs,
        buildings: state.buildings, 
        history: newHistory,
        stats: newStats
      };
    }
    default:
      return state;
  }
}

// --- START SCREEN COMPONENT ---
const StartScreen: React.FC<{ onStart: (diff: Difficulty) => void }> = ({ onStart }) => (
    <div className="absolute inset-0 bg-[#1c1917] z-50 flex flex-col items-center justify-center p-4">
        <h1 className="text-5xl text-amber-500 medieval-font mb-2">中世纪村庄编年史</h1>
        <p className="text-stone-400 mb-8 font-mono">目标：在恶劣的环境中带领村庄存活 10 年</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
            {Object.entries(DIFFICULTY_SETTINGS).map(([key, setting]) => (
                <div key={key} className="bg-stone-800 border-2 border-stone-600 p-6 rounded-lg hover:border-amber-500 transition-colors cursor-pointer group"
                     onClick={() => onStart(key as Difficulty)}>
                    <h3 className="text-xl font-bold text-stone-200 mb-2 group-hover:text-amber-400">{setting.name}</h3>
                    <p className="text-sm text-stone-400 mb-4 h-10">{setting.description}</p>
                    <div className="text-xs text-stone-500 space-y-1 font-mono">
                        <div>初始人口: {setting.startingPop}</div>
                        <div>初始食物: {setting.startingResources.food}</div>
                        <div>消耗倍率: {setting.consumptionRate}x</div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// --- END SCREEN COMPONENT ---
const EndScreen: React.FC<{ state: GameState, onRestart: () => void }> = ({ state, onRestart }) => {
    // Score Calculation
    const { stats, resources, buildings, technologies, population, difficulty } = state;
    const avgHappiness = population.length > 0 ? round2(population.reduce((a, b) => a + b.happiness, 0) / population.length) : 0;
    
    let score = 0;
    score = round2(score + population.length * 100);
    score = round2(score + avgHappiness * 50);
    score = round2(score + technologies.length * 500);
    score = round2(score + (buildings.houses + buildings.markets + buildings.walls + buildings.libraries + buildings.taverns + buildings.cathedrals) * 200);
    score = round2(score + resources.gold * 1);
    score = round2(score - stats.totalDeaths * 50);
    score = round2(score - stats.starvationDays * 10);
    
    // Difficulty Multiplier
    let diffMult = 1;
    if (difficulty === Difficulty.Easy) diffMult = 0.8;
    if (difficulty === Difficulty.Hard) diffMult = 1.5;
    
    const finalScore = round2(score * diffMult);
    
    let rank = 'F';
    if (finalScore > 5000) rank = 'D';
    if (finalScore > 10000) rank = 'C';
    if (finalScore > 20000) rank = 'B';
    if (finalScore > 35000) rank = 'A';
    if (finalScore > 50000) rank = 'S';

    const livedYears = Math.floor(state.tick / WEEKS_PER_YEAR);

    return (
        <div className="absolute inset-0 bg-[#1c1917]/95 z-50 flex flex-col items-center justify-center p-4 overflow-y-auto">
            <div className="max-w-3xl w-full bg-[#2a2620] border-4 border-[#5c5040] rounded-lg p-8 shadow-2xl">
                <div className="text-center mb-8">
                    <h2 className="text-4xl medieval-font text-amber-100 mb-2">编年史终章</h2>
                    <p className="text-stone-400">
                        {state.tick >= GAME_END_TICK ? '你成功带领村庄走过了整整十年。' : `村庄在第 ${livedYears + 1} 年覆灭了。`}
                    </p>
                </div>

                <div className="flex justify-center items-center gap-8 mb-8">
                    <div className="text-center">
                        <div className="text-sm text-stone-500 uppercase tracking-widest">最终评分</div>
                        <div className="text-5xl font-bold text-amber-500 medieval-font">{finalScore.toLocaleString()}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-sm text-stone-500 uppercase tracking-widest">评级</div>
                        <div className={`text-6xl font-bold medieval-font ${rank === 'S' || rank === 'A' ? 'text-yellow-400' : 'text-stone-300'}`}>{rank}</div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8 text-sm font-mono text-stone-300">
                    <div className="bg-stone-900/50 p-4 rounded flex justify-between">
                        <span><GiCrown className="inline mr-2 text-yellow-500"/>存活人口</span>
                        <span className="font-bold">{population.length} (峰值: {stats.peakPopulation})</span>
                    </div>
                    <div className="bg-stone-900/50 p-4 rounded flex justify-between">
                        <span><GiSkullCrossedBones className="inline mr-2 text-stone-500"/>死亡人数</span>
                        <span className="font-bold">{stats.totalDeaths}</span>
                    </div>
                    <div className="bg-stone-900/50 p-4 rounded flex justify-between">
                        <span><GiBabyFace className="inline mr-2 text-pink-400"/>新生人口</span>
                        <span className="font-bold">{stats.totalBirths}</span>
                    </div>
                    <div className="bg-stone-900/50 p-4 rounded flex justify-between">
                        <span><GiWheat className="inline mr-2 text-orange-400"/>生产食物</span>
                        <span className="font-bold">{stats.totalFoodProduced.toLocaleString()}</span>
                    </div>
                    <div className="bg-stone-900/50 p-4 rounded flex justify-between">
                        <span><GiTrophyCup className="inline mr-2 text-blue-400"/>解锁科技</span>
                        <span className="font-bold">{technologies.length} / {TECH_TREE.length}</span>
                    </div>
                     <div className="bg-stone-900/50 p-4 rounded flex justify-between">
                        <span>难度</span>
                        <span className="font-bold">{DIFFICULTY_SETTINGS[difficulty].name}</span>
                    </div>
                </div>

                <button 
                    onClick={onRestart}
                    className="w-full py-4 bg-amber-700 hover:bg-amber-600 text-white font-bold rounded text-lg transition-colors medieval-font"
                >
                    书写新的篇章
                </button>
            </div>
        </div>
    );
};

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [selectedVillager, setSelectedVillager] = useState<Villager | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      dispatch({ type: 'TICK' });
    }, state.gameSpeed);
    return () => clearInterval(timer);
  }, [state.gameSpeed]);

  useEffect(() => {
    if (state.paused || state.status !== GameStatus.Playing) return;
    
    // Check for AI events roughly once every 4-5 weeks (ticks)
    if (state.tick > 4 && state.tick % 4 === 0) { 
      if (Math.random() > 0.6) {
        generateGameEvent(state).then(eventData => {
            if (eventData) {
                dispatch({ type: 'AI_EVENT', payload: eventData });
            }
        });
      }
    }
    
    // Check for happiness-based fixed events independently (can occur alongside AI events)
    if (state.tick > 2 && state.tick % 3 === 0) {
      const happinessEvent = generateHappinessEvent(state);
      if (happinessEvent) {
        dispatch({ type: 'AI_EVENT', payload: happinessEvent });
      }
    }
  }, [state.tick, state.paused, state.status]);

  const handleAssignJob = (job: Job, amount: number) => {
    dispatch({ type: 'ASSIGN_JOB', job, amount });
  };
  
  const handleConstruct = (building: keyof typeof BUILDING_COSTS) => {
      dispatch({ type: 'CONSTRUCT_BUILDING', building });
  }

  const handleFestival = () => {
      dispatch({ type: 'HOLD_FESTIVAL' });
  }

  const handleResearch = (techId: string) => {
      dispatch({ type: 'RESEARCH_TECH', techId });
  }

  const handleUpdateBio = useCallback((id: string, bio: string) => {
    dispatch({ type: 'UPDATE_BIO', id, bio });
  }, []);

  const handleTrade = (resource: 'food' | 'wood' | 'stone', action: 'buy' | 'sell') => {
      dispatch({ type: 'TRADE_RESOURCE', resource, action });
  }

  const year = Math.floor(state.tick / WEEKS_PER_YEAR) + 1;
  const weekOfYear = state.tick % WEEKS_PER_YEAR;

  return (
    <div className="h-screen w-screen bg-[#1c1917] text-stone-200 flex flex-col font-sans selection:bg-amber-900 selection:text-white relative">
      
      {state.status === GameStatus.Menu && (
          <StartScreen onStart={(diff) => dispatch({ type: 'START_GAME', difficulty: diff })} />
      )}

      {state.status === GameStatus.Finished && (
          <EndScreen state={state} onRestart={() => dispatch({ type: 'RESTART_GAME' })} />
      )}

      <header className="bg-[#292524] border-b border-stone-700 p-4 shadow-lg">
        <div className="flex justify-between items-center mb-4">
           <div className="flex flex-col">
             <h1 className="text-3xl text-amber-100 medieval-font tracking-wider">中世纪村庄编年史</h1>
             <div className="text-stone-500 text-xs uppercase tracking-widest mt-1">Medieval Village Chronicle - {DIFFICULTY_SETTINGS[state.difficulty].name}</div>
           </div>
           <div className="text-right">
             <div className="text-2xl text-amber-500 font-mono font-bold">第 {year} 年 <span className="text-sm text-stone-500">/ 10</span></div>
             <div className="text-stone-400 font-mono text-sm">
               第 {weekOfYear} 周 | {state.season} {state.season === Season.Spring && '🌱'} {state.season === Season.Summer && '☀️'} {state.season === Season.Autumn && '🍂'} {state.season === Season.Winter && '❄️'}
             </div>
           </div>
        </div>
        <ResourceDisplay state={state} />
      </header>

      <main className="flex-1 p-4 overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-3 h-full min-h-0">
          <VillagerList 
            villagers={state.population} 
            onSelectVillager={setSelectedVillager} 
          />
        </div>

        <div className="md:col-span-6 h-full min-h-0 flex flex-col gap-4">
           <div className="flex-1 bg-stone-800 rounded-lg border border-stone-600 p-4 min-h-0 flex flex-col">
              <h3 className="medieval-font text-stone-300 mb-2">人口与食物趋势</h3>
              <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={state.history}>
                    <defs>
                      <linearGradient id="colorPop" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorFood" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#eab308" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="tick" hide />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#292524', borderColor: '#57534e', color: '#e7e5e4' }}
                    />
                    <Area type="monotone" dataKey="pop" stroke="#38bdf8" fillOpacity={1} fill="url(#colorPop)" />
                    <Area type="monotone" dataKey="food" stroke="#eab308" fillOpacity={1} fill="url(#colorFood)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
           </div>

           <div className="h-64 min-h-0">
             <EventLog logs={state.logs} />
           </div>
        </div>

        <div className="md:col-span-3 h-full min-h-0">
           <GameControls 
             state={state} 
             onAssignJob={handleAssignJob} 
             onConstruct={handleConstruct}
             onFestival={handleFestival}
             onResearch={handleResearch}
             onTrade={handleTrade}
             onTogglePause={() => dispatch({ type: 'TOGGLE_PAUSE' })} 
           />
        </div>
      </main>

      {selectedVillager && (
        <VillagerModal 
          villager={selectedVillager} 
          season={state.season}
          onClose={() => setSelectedVillager(null)}
          onUpdateBio={handleUpdateBio}
        />
      )}
    </div>
  );
}