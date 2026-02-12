
import { useReducer } from 'react';
import { 
  JOB_INCOME, BUILDING_COSTS, HOUSE_CAPACITY_BASE, HOUSE_CAPACITY_UPGRADED, 
  CONSUMPTION, GUARD_COVERAGE_BASE, GUARD_COVERAGE_UPGRADED, TECH_TREE, 
  FARMER_WEEKLY_BASE, WINTER_WOOD_CONSUMPTION, WALL_GUARD_BONUS,
  WEEKS_PER_YEAR, SEASON_BOUNDS, MAX_YEARS, GAME_END_TICK, DIFFICULTY_SETTINGS,
  TRADE_RATES, TRADE_AMOUNT, BUILDING_MAINTENANCE, MAX_GAME_FOOD,
  TRADE_PRICE_THRESHOLDS, TRADE_PRICE_BASE_MODIFIER
} from '../constants';
import { generateInitialPopulation, generateVillager } from '../utils/gameHelper';
import { getMilitaryEventTemplates, determineEndingType } from '../services/aiService';
import { round2 } from '../utils/mathUtils';
import { GameState, Job, Season, Villager, Activity, GameStatus, Difficulty, FoodPriority, GameAction, GameEvent } from '../types';

// Happiness-based productivity constants
const MIN_PRODUCTIVITY = 0.1; // 10% minimum productivity
const PRODUCTIVITY_RANGE = 1.9; // Range from 10% to 200% (1.9 + 0.1 = 2.0)

const initialStats = {
  totalBirths: 0,
  totalDeaths: 0,
  peakPopulation: 0,
  totalFoodProduced: 0,
  totalGoldMined: 0,
  festivalsHeld: 0,
  starvationDays: 0,
  invasionsRepelled: 0,
  raidsSurvived: 0
};

const initialState: GameState = {
  status: GameStatus.Menu,
  difficulty: Difficulty.Normal,
  tick: 0,
  season: Season.Spring,
  resources: DIFFICULTY_SETTINGS[Difficulty.Normal].startingResources,
  buildings: { houses: 4, markets: 0, walls: 0, libraries: 0, taverns: 0, cathedrals: 0, farms: 0, lumberMills: 0, mines: 0, watchtowers: 0, granaries: 0, blacksmiths: 0, temples: 0, universities: 0, workshops: 0, barracks: 0, stables: 0, aqueducts: 0, trainingGrounds: 0, alchemists: 0 },
  technologies: [],
  population: [],
  logs: [],
  paused: true,
  gameSpeed: 2000,
  history: [],
  stats: initialStats,
  eventPool: [],
  foodPriority: FoodPriority.Equal,
  tradePriceModifiers: { food: 1.0, wood: 1.0, stone: 1.0 }
};

function gameReducer(state: GameState, action: GameAction): GameState {
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
        logs: [{ id: 'init', tick: 1, message: `你的统治开始了。难度: ${settings.name}。目标: 存活 ${MAX_YEARS} 年。`, type: 'info' }],
        eventPool: [] // Will be filled asynchronously after game starts
      };
    }

    case 'INIT_EVENT_POOL': {
      return {
        ...state,
        eventPool: action.events
      };
    }

    case 'REPLENISH_EVENT_POOL': {
      return {
        ...state,
        eventPool: [...state.eventPool, ...action.events]
      };
    }

    case 'TRIGGER_EVENT': {
      // Find event in pool
      const event = state.eventPool.find(e => e.id === action.eventId);
      if (!event) return state;

      // Calculate average happiness for impact modifier
      const avgHappiness = state.population.reduce((acc, v) => acc + v.happiness, 0) / state.population.length || 0;
      const happinessMultiplier = round2(1 + (avgHappiness - 50) / 200); // Range: 0.75 to 1.25
      
      // Difficulty modifier for events (Bad events are worse on Hard)
      const diffSettings = DIFFICULTY_SETTINGS[state.difficulty];
      let finalDeltaFood = event.deltaFood;
      let finalDeltaGold = event.deltaGold;
      let finalDeltaWood = event.deltaWood;
      
      if (state.difficulty === Difficulty.Hard && (event.deltaFood < 0 || event.deltaGold < 0)) {
          finalDeltaFood = round2(event.deltaFood * 1.5);
          finalDeltaGold = round2(event.deltaGold * 1.5);
      }

      // Guard mitigation logic
      const guardCount = state.population.filter(p => p.job === Job.Guard).length;
      const hasArchery = state.technologies.includes('archery_1');
      const baseCoverage = hasArchery ? GUARD_COVERAGE_UPGRADED : GUARD_COVERAGE_BASE;
      const wallBonus = state.buildings.walls * WALL_GUARD_BONUS;
      const guardCoverage = baseCoverage + wallBonus;
      const securityRatio = round2(Math.min(1, (guardCount * guardCoverage) / Math.max(1, state.population.length)));
      
      let modMessage = event.message;
      let happinessImpactNote = "";
      
      // Apply happiness modifier to events (amplify good, reduce bad impact)
      if (event.deltaFood > 0 || event.deltaGold > 0) {
        finalDeltaFood = round2(finalDeltaFood * happinessMultiplier);
        finalDeltaGold = round2(finalDeltaGold * happinessMultiplier);
        if (happinessMultiplier > 1.1) {
          happinessImpactNote = " (高幸福度提升了收益)";
        }
      } else if (event.deltaFood < 0 || event.deltaGold < 0) {
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
          if ((finalDeltaFood !== event.deltaFood || finalDeltaGold !== event.deltaGold)) {
               modMessage += " (守卫减少了损失)";
          }
      }
      
      modMessage += happinessImpactNote;

      const newResources = {
        food: round2(Math.max(0, state.resources.food + finalDeltaFood)),
        wood: round2(Math.max(0, state.resources.wood + finalDeltaWood)),
        stone: round2(state.resources.stone),
        gold: round2(Math.max(0, state.resources.gold + finalDeltaGold)),
        knowledge: round2(state.resources.knowledge)
      };
      
      let newPop = [...state.population];
      if (event.deltaPop && event.deltaPop < 0) {
        const deaths = Math.abs(event.deltaPop);
        newPop.splice(0, deaths);
      } else if (event.deltaPop && event.deltaPop > 0) {
        for(let i=0; i<event.deltaPop; i++) newPop.push(generateVillager());
      }

      // Remove used event from pool
      const newEventPool = state.eventPool.filter(e => e.id !== action.eventId);

      return {
        ...state,
        resources: newResources,
        population: newPop,
        logs: [...state.logs, { id: Math.random().toString(), tick: state.tick, message: modMessage, type: event.source === 'ai' ? 'ai' : event.type }],
        eventPool: newEventPool
      };
    }

    case 'LOAD_STATE':
      return action.state;

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
      
      // Apply engineering tech discount to construction costs
      const engineeringDiscount = state.technologies.includes('engineering_1') ? 0.9 : 1;
      const actualCost = {
        wood: round2(cost.wood * engineeringDiscount),
        stone: round2(cost.stone * engineeringDiscount),
        gold: round2(cost.gold * engineeringDiscount)
      };
      
      if (state.resources.wood >= actualCost.wood && state.resources.stone >= actualCost.stone && state.resources.gold >= actualCost.gold) {
        const newResources = {
          ...state.resources,
          wood: state.resources.wood - actualCost.wood,
          stone: state.resources.stone - actualCost.stone,
          gold: state.resources.gold - actualCost.gold
        };
        const newBuildings = { ...state.buildings };
        
        // Map building string to state property
        if (building === 'House') newBuildings.houses += 1;
        if (building === 'Market') newBuildings.markets += 1;
        if (building === 'StoneWall') newBuildings.walls += 1;
        if (building === 'Library') newBuildings.libraries += 1;
        if (building === 'Tavern') newBuildings.taverns += 1;
        if (building === 'Cathedral') newBuildings.cathedrals += 1;
        if (building === 'Farm') newBuildings.farms += 1;
        if (building === 'LumberMill') newBuildings.lumberMills += 1;
        if (building === 'Mine') newBuildings.mines += 1;
        if (building === 'Watchtower') newBuildings.watchtowers += 1;
        if (building === 'Granary') newBuildings.granaries += 1;
        if (building === 'Blacksmith') newBuildings.blacksmiths += 1;
        if (building === 'Temple') newBuildings.temples += 1;
        if (building === 'University') newBuildings.universities += 1;
        if (building === 'Workshop') newBuildings.workshops += 1;
        if (building === 'Barracks') newBuildings.barracks += 1;
        if (building === 'Stables') newBuildings.stables += 1;
        if (building === 'Aqueduct') newBuildings.aqueducts += 1;
        if (building === 'TrainingGrounds') newBuildings.trainingGrounds += 1;
        if (building === 'Alchemist') newBuildings.alchemists += 1;
        
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
        const priceModifier = state.tradePriceModifiers?.[resource] || 1.0;
        const newResources = { ...state.resources };
        
        if (tradeAction === 'buy') {
            // Higher price when buying (base price * modifier)
            const buyPrice = Math.ceil(rates.buy * priceModifier);
            if (newResources.gold >= buyPrice) {
                newResources.gold -= buyPrice;
                newResources[resource] += TRADE_AMOUNT;
                return { ...state, resources: newResources };
            }
        } else if (tradeAction === 'sell') {
            // Lower price when selling (base price * modifier)
            const sellPrice = Math.floor(rates.sell * priceModifier);
            if (newResources[resource] >= TRADE_AMOUNT) {
                newResources[resource] -= TRADE_AMOUNT;
                newResources.gold += sellPrice;
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

    case 'SET_FOOD_PRIORITY': {
      return { ...state, foodPriority: action.priority };
    }

    case 'UPDATE_ENDING_SUMMARY': {
      return { ...state, endingSummary: action.summary };
    }

    case 'TICK': {
      if (state.paused || state.status !== GameStatus.Playing) return state;

      // Check Game End
      if (state.tick >= GAME_END_TICK) {
          // Determine the specific ending type based on achievements
          const baseEndingType = '胜利';
          const specificEndingType = determineEndingType(state, baseEndingType);
          
          return { 
            ...state, 
            status: GameStatus.Finished, 
            paused: true,
            endingType: specificEndingType,
            endingSummary: `经过${MAX_YEARS}年的艰苦奋斗，村庄终于迎来了和平与繁荣！${state.population.length}位村民享受着他们用汗水和智慧换来的美好生活。这是一段值得永远铭记的传奇！`
          };
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
      if (state.technologies.includes('advanced_farming')) foodMultiplier += 0.3;
      
      // Building bonuses (architecture tech increases all building effects by 20%)
      const architectureBonus = state.technologies.includes('architecture_1') ? 1.2 : 1;
      if (state.buildings.farms > 0) foodMultiplier += state.buildings.farms * 0.15 * architectureBonus;
      if (state.buildings.aqueducts > 0) foodMultiplier += state.buildings.aqueducts * 0.1 * architectureBonus;
      
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

              // Happiness-based Productivity Multiplier (Maps 0-100 happiness to 10%-200% productivity)
              // Formula: productivity = MIN_PRODUCTIVITY + (happiness / 100) * PRODUCTIVITY_RANGE
              // happiness=0 → 10%, happiness=50 → 105%, happiness=100 → 200%
              const happinessProductivity = round2(MIN_PRODUCTIVITY + (v.happiness / 100) * PRODUCTIVITY_RANGE);
              efficiency = round2(efficiency * happinessProductivity);

              // Minimum efficiency floor so production doesn't hit absolute zero unless dead
              efficiency = round2(Math.max(0.1, efficiency)); 

              if (v.job === Job.Farmer) {
                  activeFarmers = round2(activeFarmers + efficiency); // Fractional farmer
              }

              let woodMult = round2(1.0 * settings.productionMultiplier);
              if (state.technologies.includes('tools_1')) woodMult = round2(woodMult + 0.2);
              if (state.technologies.includes('forestry_1')) woodMult = round2(woodMult + 0.2);
              
              // Building bonuses use the architectureBonus from outer scope
              if (state.buildings.lumberMills > 0) woodMult = round2(woodMult + state.buildings.lumberMills * 0.15 * architectureBonus);
              if (state.buildings.blacksmiths > 0) woodMult = round2(woodMult + state.buildings.blacksmiths * 0.1 * architectureBonus);
              if (state.buildings.workshops > 0) woodMult = round2(woodMult + state.buildings.workshops * 0.1 * architectureBonus);
              producedWood = round2(producedWood + income.wood * woodMult * efficiency);

              let stoneGoldMult = round2(1.0 * settings.productionMultiplier);
              if (state.technologies.includes('tools_1')) stoneGoldMult = round2(stoneGoldMult + 0.2);
              if (state.technologies.includes('metallurgy_1')) stoneGoldMult = round2(stoneGoldMult + 0.3);
              if (state.buildings.mines > 0) stoneGoldMult = round2(stoneGoldMult + state.buildings.mines * 0.15 * architectureBonus);
              if (state.buildings.blacksmiths > 0) stoneGoldMult = round2(stoneGoldMult + state.buildings.blacksmiths * 0.1 * architectureBonus);
              if (state.buildings.workshops > 0) stoneGoldMult = round2(stoneGoldMult + state.buildings.workshops * 0.1 * architectureBonus);
              producedStone = round2(producedStone + income.stone * stoneGoldMult * efficiency);
              producedGold = round2(producedGold + income.gold * stoneGoldMult * efficiency);

              const libraryBonus = state.buildings.libraries > 0 ? round2(state.buildings.libraries * 0.2 * 7 * architectureBonus) : 0;
              const universityBonus = state.buildings.universities > 0 ? round2(state.buildings.universities * 0.3 * 7 * architectureBonus) : 0;
              const alchemistBonus = state.buildings.alchemists > 0 ? round2(state.buildings.alchemists * 0.15 * 7 * architectureBonus) : 0;
              producedKnowledge = round2(producedKnowledge + (income.knowledge * efficiency) + (v.job === Job.Scholar && state.technologies.includes('scribing_1') ? (7 * efficiency) : 0) + (v.job === Job.Scholar ? ((libraryBonus + universityBonus + alchemistBonus) * efficiency) : 0));
          }
      });

      // Add flat knowledge bonus from alchemy tech (once per week)
      if (state.technologies.includes('alchemy_1')) {
        producedKnowledge = round2(producedKnowledge + 15);
      }

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
      const watchtowerBonus = state.buildings.watchtowers * 3;
      const barracksBonus = state.buildings.barracks * 2;
      const trainingGroundsBonus = state.buildings.trainingGrounds * 2;
      const cavalryBonus = state.technologies.includes('cavalry_1') ? (state.buildings.stables * 3) : 0;
      const guardCoverage = baseCoverage + wallBonus + watchtowerBonus + barracksBonus + trainingGroundsBonus + cavalryBonus;
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

      // --- Invasion/Raid Events (Military Challenge) ---
      // Trigger invasion/raid events periodically, especially for larger populations
      let invasionLosses = { food: 0, wood: 0, gold: 0, pop: 0 };
      let invasionBonuses = { food: 0, wood: 0, gold: 0 }; // Separate bonuses from production
      let newInvasionsRepelled = 0;
      let newRaidsSurvived = 0;
      
      if (totalPop > 5 && state.tick % 15 === 0) { // Every 15 weeks (~3.5 months)
        const militaryTemplates = getMilitaryEventTemplates();
        
        // Select event based on population size (larger pop = bigger threats)
        let selectedEvent = null;
        if (totalPop < 15) {
          selectedEvent = militaryTemplates[0]; // Small bandit raid
        } else if (totalPop < 30) {
          selectedEvent = militaryTemplates[Math.floor(Math.random() * 2)]; // Small raid or brigands
        } else if (totalPop < 50) {
          selectedEvent = militaryTemplates[Math.floor(Math.random() * 3)]; // Up to small invasion
        } else {
          selectedEvent = militaryTemplates[Math.floor(Math.random() * militaryTemplates.length)]; // Any event
        }
        
        if (selectedEvent && selectedEvent.requiredGuards) {
          const requiredDefenders = selectedEvent.requiredGuards(totalPop);
          // Calculate effective defense strength using guardCoverage (includes defensive building bonuses)
          // Each guard's effectiveness is multiplied by guardCoverage
          const effectiveDefenseStrength = guards * guardCoverage;
          const requiredDefenseStrength = requiredDefenders * baseCoverage; // Base requirement
          const canDefend = effectiveDefenseStrength >= requiredDefenseStrength;
          
          if (canDefend && selectedEvent.successMessage && selectedEvent.successDeltas) {
            // Successfully defended
            newLogs.push({ 
              id: Math.random().toString(), 
              tick: state.tick, 
              message: `${selectedEvent.message} ${selectedEvent.successMessage}`, 
              type: 'success' 
            });
            invasionBonuses.food += selectedEvent.successDeltas.deltaFood;
            invasionBonuses.wood += selectedEvent.successDeltas.deltaWood;
            invasionBonuses.gold += selectedEvent.successDeltas.deltaGold;
            newInvasionsRepelled = 1;
          } else if (!canDefend && selectedEvent.failureMessage && selectedEvent.failureDeltas) {
            // Failed to defend - check if this causes total destruction
            const wouldSurvive = totalPop + selectedEvent.failureDeltas.deltaPop > 0;
            
            if (!wouldSurvive || guards === 0) {
              // Catastrophic military failure - trigger destruction ending
              const endingType = '灭亡';
              const endingReason = '军事不足';
              
              return {
                ...state,
                status: GameStatus.Finished,
                population: [],
                endingType,
                endingReason,
                endingSummary: '村庄因军事防御力量严重不足而被入侵者彻底摧毁。所有村民或战死或逃散，曾经繁华的村庄化为废墟。',
                logs: [...newLogs, { 
                  id: 'end', 
                  tick: state.tick, 
                  message: `${selectedEvent.message} ${selectedEvent.failureMessage} 村庄覆灭了。`, 
                  type: 'danger' 
                }],
                stats: {
                  ...state.stats,
                  totalDeaths: state.stats.totalDeaths + totalPop
                }
              };
            } else {
              // Severe losses but village survives
              newLogs.push({ 
                id: Math.random().toString(), 
                tick: state.tick, 
                message: `${selectedEvent.message} ${selectedEvent.failureMessage}`, 
                type: 'danger' 
              });
              invasionLosses = {
                food: selectedEvent.failureDeltas.deltaFood,
                wood: selectedEvent.failureDeltas.deltaWood,
                gold: selectedEvent.failureDeltas.deltaGold,
                pop: selectedEvent.failureDeltas.deltaPop
              };
              newRaidsSurvived = 1;
            }
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
      // Granary reduces food consumption by 5% per building
      // Preservation tech reduces consumption by 10%
      const granaryReduction = state.buildings.granaries > 0 ? (1 - state.buildings.granaries * 0.05) : 1;
      const preservationReduction = state.technologies.includes('preservation_1') ? 0.9 : 1;
      
      let rawFoodConsumption = 0;
      const villagerFoodNeeds: { villager: Villager; need: number; priority: number }[] = [];
      
      state.population.forEach((v, index) => {
        const foodNeed = v.age < 16 ? CONSUMPTION.childFood : CONSUMPTION.food;
        const adjustedNeed = round2(foodNeed * settings.consumptionRate * granaryReduction * preservationReduction);
        rawFoodConsumption = round2(rawFoodConsumption + adjustedNeed);
        
        // Calculate priority based on food priority setting
        let priority = 0;
        switch (state.foodPriority) {
          case FoodPriority.ChildrenFirst:
            priority = v.age < 16 ? 2 : 1;
            break;
          case FoodPriority.WorkersFirst:
            priority = (v.job !== Job.Unemployed && v.job !== Job.Child) ? 2 : 1;
            break;
          case FoodPriority.ElderlyLast:
            priority = v.age >= 60 ? 0 : (v.age < 16 ? 2 : 1);
            break;
          case FoodPriority.Equal:
          default:
            priority = 1;
            break;
        }
        
        villagerFoodNeeds.push({ villager: v, need: adjustedNeed, priority });
      });
      
      const totalConsumption = rawFoodConsumption;

      const availableFood = round2(state.resources.food + producedFood - theftFood);
      const netFood = round2(availableFood - totalConsumption);
      const finalFood = round2(Math.max(0, netFood));
      
      // Calculate individual food allocation based on priority
      const foodAllocation = new Map<string, number>(); // villager.id -> food received
      
      if (availableFood < totalConsumption) {
        // Not enough food - distribute by priority
        let remainingFood = availableFood;
        
        // Sort by priority (higher priority first)
        const sortedNeeds = [...villagerFoodNeeds].sort((a, b) => b.priority - a.priority);
        
        // First pass: Give food to high priority villagers
        const highPriority = sortedNeeds.filter(vn => vn.priority === 2);
        const midPriority = sortedNeeds.filter(vn => vn.priority === 1);
        const lowPriority = sortedNeeds.filter(vn => vn.priority === 0);
        
        // Allocate to high priority first
        for (const vn of highPriority) {
          if (remainingFood >= vn.need) {
            foodAllocation.set(vn.villager.id, vn.need);
            remainingFood = round2(remainingFood - vn.need);
          } else {
            foodAllocation.set(vn.villager.id, remainingFood);
            remainingFood = 0;
            break;
          }
        }
        
        // Then mid priority
        if (remainingFood > 0) {
          for (const vn of midPriority) {
            if (remainingFood >= vn.need) {
              foodAllocation.set(vn.villager.id, vn.need);
              remainingFood = round2(remainingFood - vn.need);
            } else {
              foodAllocation.set(vn.villager.id, remainingFood);
              remainingFood = 0;
              break;
            }
          }
        }
        
        // Finally low priority
        if (remainingFood > 0) {
          for (const vn of lowPriority) {
            if (remainingFood >= vn.need) {
              foodAllocation.set(vn.villager.id, vn.need);
              remainingFood = round2(remainingFood - vn.need);
            } else {
              foodAllocation.set(vn.villager.id, remainingFood);
              remainingFood = 0;
              break;
            }
          }
        }
      } else {
        // Enough food for everyone
        villagerFoodNeeds.forEach(vn => {
          foodAllocation.set(vn.villager.id, vn.need);
        });
      }

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
            newV.happiness = Math.max(0, newV.happiness - 5);
            newV.currentActivity = Activity.Freezing;
        } else if (newV.job === Job.Unemployed || newV.job === Job.Child) {
            newV.currentActivity = Activity.Idle;
        } else {
            newV.currentActivity = Activity.Working;
        }

        if (!isSecure && totalPop > 10) newV.happiness = Math.max(0, newV.happiness - 1);

        // Calculate food shortage for this villager
        const foodNeed = v.age < 16 ? CONSUMPTION.childFood : CONSUMPTION.food;
        const adjustedNeed = round2(foodNeed * settings.consumptionRate * granaryReduction * preservationReduction);
        const foodReceived = foodAllocation.get(v.id) || 0;
        const foodShortageRatio = round2(Math.max(0, 1 - (foodReceived / adjustedNeed)));
        
        if (foodShortageRatio > 0) {
            // Proportional hunger increase based on shortage
            const hungerIncrease = round2(foodShortageRatio * 20); // Max 20 if completely unfed
            newV.hunger = Math.min(100, newV.hunger + hungerIncrease);
            
            // Proportional happiness and health penalties
            const happinessPenalty = round2(foodShortageRatio * 10); // Max 10 if completely unfed
            const healthPenalty = round2(foodShortageRatio * 5); // Max 5 if completely unfed
            
            newV.happiness = Math.max(0, newV.happiness - happinessPenalty);
            newV.health = Math.max(0, newV.health - healthPenalty);
        } else {
            // Well fed - reduce hunger and allow healing/happiness recovery
            newV.hunger = Math.max(0, newV.hunger - 10); // Recover from hunger when fed
            
            const healRate = state.technologies.includes('medicine_1') ? 5 : 2; // Higher heal rate per tick
            const tavernBonus = state.buildings.taverns > 0 ? 2 : 0;
            const templeBonus = state.buildings.temples > 0 ? state.buildings.temples * 1 : 0;
            
            // Cathedral and Temple now increase baseline happiness with caps to prevent it from being too powerful
            // Cathedrals: First gives +5, second gives +3, third+ gives +1 each (max realistic: +12 for 5 cathedrals)
            const cathedralCount = state.buildings.cathedrals;
            let cathedralBaselineBonus = 0;
            if (cathedralCount > 0) {
              cathedralBaselineBonus = 5; // First cathedral
              if (cathedralCount > 1) cathedralBaselineBonus += 3; // Second cathedral
              if (cathedralCount > 2) cathedralBaselineBonus += Math.min(cathedralCount - 2, 4); // Remaining (capped at +4)
            }
            
            // Temples: +2 for first, +1 for each additional (max realistic: +7 for 6 temples)
            const templeCount = state.buildings.temples;
            let templeBaselineBonus = 0;
            if (templeCount > 0) {
              templeBaselineBonus = 2; // First temple
              if (templeCount > 1) templeBaselineBonus += Math.min(templeCount - 1, 5); // Additional temples (capped at +5)
            }
            
            // Cap total baseline bonus at +20 to preserve balance
            const totalBaselineBonus = Math.min(20, cathedralBaselineBonus + templeBaselineBonus);
            newV.happinessBaseline = 50 + totalBaselineBonus; // Base 50 + capped building bonuses
            
            if (!isFreezing) {
                newV.health = Math.min(100, newV.health + healRate);
                if (newV.hunger === 0) {
                  // Natural happiness regression towards baseline with bonuses
                  const baseIncrease = 2; // Base happiness recovery per week when fed
                  const philosophyBonus = state.technologies.includes('philosophy_1') ? 3 : 0;
                  const totalIncrease = baseIncrease + tavernBonus + templeBonus + philosophyBonus; // Taverns, temples, and philosophy boost recovery
                  const regressionRate = 1; // Natural regression rate per week
                  
                  if (newV.happiness < newV.happinessBaseline) {
                    // Below baseline: increase happiness, but don't overshoot the baseline
                    const delta = newV.happinessBaseline - newV.happiness;
                    newV.happiness = Math.min(100, newV.happiness + Math.min(delta, totalIncrease));
                  } else if (newV.happiness > newV.happinessBaseline) {
                    // Above baseline: gradually decrease towards baseline
                    newV.happiness = Math.max(newV.happinessBaseline, newV.happiness - regressionRate);
                  }
                  // Ensure happiness stays within 0-100 range
                  newV.happiness = Math.max(0, Math.min(100, newV.happiness));
                }
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

      // Apply invasion/raid casualties
      if (invasionLosses.pop < 0) {
        const casualtyCount = Math.min(Math.abs(invasionLosses.pop), survivors.length);
        const casualtiesRemoved = survivors.splice(-casualtyCount, casualtyCount); // Remove from end (random victims)
        deathCount += casualtiesRemoved.length;
      }

      if (deathCount > 0) newLogs.push({ id: Math.random().toString(), tick: state.tick, message: `${deathCount} 人死亡`, type: 'danger' });
      if (newBabies.length > 0) {
          survivors.push(...newBabies);
          newLogs.push({ id: Math.random().toString(), tick: state.tick, message: `新生命诞生`, type: 'success' });
      }

      // --- Update History & Stats ---
      // Keep limited history to prevent memory issues with chart rendering
      // Store food as integer to reduce memory footprint
      // Sample less frequently when history is large to prevent memory overflow
      const shouldRecordHistory = state.history.length < 200 || state.tick % 2 === 0; // Record every tick until 200 entries, then every other tick
      
      const newHistory = shouldRecordHistory 
        ? [...state.history, { 
            tick: state.tick, 
            pop: survivors.length, 
            food: Math.floor(finalFood) // Store as integer to reduce memory usage
          }].slice(-260) // Keep 5 years of weekly history (reduced from 10 years to prevent memory issues)
        : state.history;

      // Count starvation - if anyone has food shortage
      const isAnyoneStarving = availableFood < totalConsumption;
      
      const newStats = {
          ...state.stats,
          totalBirths: state.stats.totalBirths + newBabies.length,
          totalDeaths: state.stats.totalDeaths + deathCount,
          peakPopulation: Math.max(state.stats.peakPopulation, survivors.length),
          totalFoodProduced: round2(state.stats.totalFoodProduced + producedFood),
          totalGoldMined: round2(state.stats.totalGoldMined + producedGold),
          starvationDays: isAnyoneStarving ? state.stats.starvationDays + 1 : state.stats.starvationDays,
          invasionsRepelled: state.stats.invasionsRepelled + newInvasionsRepelled,
          raidsSurvived: state.stats.raidsSurvived + newRaidsSurvived
      };

      if (survivors.length === 0) {
           const endingType = '灭亡';
           const endingReason = '人口灭绝';
           
           return {
               ...state,
               status: GameStatus.Finished,
               population: [],
               endingType,
               endingReason,
               endingSummary: '经过长期的饥荒、疾病和苦难，村庄的最后一位居民也离开了人世。曾经生机勃勃的村庄如今只剩下空荡荡的房屋和无尽的沉默。',
               logs: [...newLogs, { id: 'end', tick: state.tick, message: '村庄覆灭了。', type: 'danger' }],
               stats: newStats
           };
      }

      // --- Building Maintenance Costs ---
      let maintenanceWood = 0;
      let maintenanceStone = 0;
      let maintenanceGold = 0;
      
      // Calculate total maintenance costs
      const buildingTypes = Object.keys(state.buildings) as (keyof typeof state.buildings)[];
      buildingTypes.forEach(buildingType => {
        const count = state.buildings[buildingType];
        const maintenance = BUILDING_MAINTENANCE[buildingType] as any;
        if (maintenance && count > 0) {
          maintenanceWood += round2((maintenance.wood || 0) * count);
          maintenanceStone += round2((maintenance.stone || 0) * count);
          maintenanceGold += round2((maintenance.gold || 0) * count);
        }
      });
      
      // Apply engineering tech to reduce maintenance
      if (state.technologies.includes('engineering_1')) {
        maintenanceWood = round2(maintenanceWood * 0.9);
        maintenanceStone = round2(maintenanceStone * 0.9);
        maintenanceGold = round2(maintenanceGold * 0.9);
      }
      
      // Warn if insufficient resources for maintenance
      const insufficientMaintenance = 
        (state.resources.wood + producedWood - consumedWood < maintenanceWood) ||
        (state.resources.stone + producedStone < maintenanceStone) ||
        (state.resources.gold + producedGold - theftGold < maintenanceGold);
      
      if (insufficientMaintenance && state.tick % 4 === 0) { // Warning every 4 weeks (monthly)
        newLogs.push({ 
          id: Math.random().toString(), 
          tick: state.tick, 
          message: `建筑维护资源不足！生产效率下降`, 
          type: 'warning' 
        });
      }

      // --- Dynamic Trade Pricing Based on Production Capacity ---
      // Calculate price modifiers based on village's production capacity
      // Production above threshold = lower prices (surplus), below threshold = higher prices (scarcity)
      const baseFoodProduction = activeFarmers * FARMER_WEEKLY_BASE * foodMultiplier;
      const baseWoodProduction = state.population.filter(p => p.job === Job.Woodcutter).length * JOB_INCOME[Job.Woodcutter].wood;
      const baseStoneProduction = state.population.filter(p => p.job === Job.Miner).length * JOB_INCOME[Job.Miner].stone;
      
      // Calculate modifiers: 0.5x (high production) to 2.0x (low production)
      // At threshold production, modifier = 1.0x (base price)
      const foodPriceModifier = round2(Math.max(0.5, Math.min(2.0, TRADE_PRICE_BASE_MODIFIER - (baseFoodProduction / TRADE_PRICE_THRESHOLDS.food))));
      const woodPriceModifier = round2(Math.max(0.5, Math.min(2.0, TRADE_PRICE_BASE_MODIFIER - (baseWoodProduction / TRADE_PRICE_THRESHOLDS.wood))));
      const stonePriceModifier = round2(Math.max(0.5, Math.min(2.0, TRADE_PRICE_BASE_MODIFIER - (baseStoneProduction / TRADE_PRICE_THRESHOLDS.stone))));

      return {
        ...state,
        tick: state.tick + 1,
        season: currentSeason,
        resources: {
          // Cap food at MAX_GAME_FOOD for game balance (see constants.ts for rationale)
          food: round2(Math.min(MAX_GAME_FOOD, Math.max(0, finalFood + invasionLosses.food + invasionBonuses.food))),
          wood: round2(Math.max(0, state.resources.wood + producedWood - consumedWood - maintenanceWood + invasionLosses.wood + invasionBonuses.wood)),
          stone: round2(Math.max(0, state.resources.stone + producedStone - maintenanceStone)),
          gold: round2(Math.max(0, state.resources.gold + producedGold - theftGold - maintenanceGold + invasionLosses.gold + invasionBonuses.gold)),
          knowledge: round2(state.resources.knowledge + producedKnowledge)
        },
        population: survivors,
        logs: newLogs.slice(-1000), // Cap logs to last 1000 entries to prevent memory issues
        buildings: state.buildings, 
        history: newHistory,
        stats: newStats,
        tradePriceModifiers: { food: foodPriceModifier, wood: woodPriceModifier, stone: stonePriceModifier }
      };
    }
    default:
      return state;
  }
}

export const useGameState = () => {
  return useReducer(gameReducer, initialState);
};
