/**
 * Balance Calculator - Ensures game mechanics have solvable solutions
 * 
 * This module analyzes the game's resource production and consumption
 * to verify that the game is winnable and numerically balanced.
 */

import {
  JOB_INCOME,
  CONSUMPTION,
  FARMER_WEEKLY_BASE,
  WINTER_WOOD_CONSUMPTION,
  BUILDING_MAINTENANCE,
  DIFFICULTY_SETTINGS,
  TECH_TREE,
  BUILDING_COSTS,
  WEEKS_PER_YEAR,
  GAME_END_TICK
} from '../constants';
import { Job, Difficulty } from '../types';

/**
 * Resource balance analysis result
 */
export interface BalanceAnalysis {
  difficulty: Difficulty;
  isWinnable: boolean;
  minPopulationNeeded: number;
  minFarmersNeeded: number;
  minWoodcuttersNeeded: number;
  minMinersNeeded: number;
  sustainablePopulation: number;
  resourceBreakdown: {
    food: ResourceBalance;
    wood: ResourceBalance;
    stone: ResourceBalance;
    gold: ResourceBalance;
    knowledge: ResourceBalance;
  };
  warnings: string[];
  recommendations: string[];
}

interface ResourceBalance {
  baseProduction: number;
  baseConsumption: number;
  netBalance: number;
  isSustainable: boolean;
  productionPerWorker: number;
  consumptionPerPerson: number;
}

/**
 * Calculate the minimum viable population needed to sustain the village
 */
function calculateMinimumViablePopulation(difficulty: Difficulty): number {
  const settings = DIFFICULTY_SETTINGS[difficulty];
  
  // Basic survival needs:
  // - At least 1 farmer per 1.5 people for food
  // - At least 1 woodcutter for winter heating
  // - At least 1 guard for security (every 10-15 people)
  
  const minFarmers = 2; // To ensure food buffer
  const minWoodcutters = 1; // For winter survival
  const minGuards = 1; // For security
  const minChildren = 2; // For population growth
  
  return minFarmers + minWoodcutters + minGuards + minChildren;
}

/**
 * Calculate sustainable population given job distribution
 */
function calculateSustainablePopulation(
  farmers: number,
  difficulty: Difficulty
): number {
  const settings = DIFFICULTY_SETTINGS[difficulty];
  
  // Each farmer produces 32 food/week base
  // Summer multiplier: 1.0, Autumn: 2.0, Spring: 0.9, Winter: 0.4
  // Average multiplier over year: (0.9 * 13 + 1.0 * 13 + 2.0 * 13 + 0.4 * 13) / 52 = 1.075
  const avgSeasonalMultiplier = 1.075;
  
  const farmerProduction = FARMER_WEEKLY_BASE * settings.productionMultiplier * avgSeasonalMultiplier;
  const totalFoodProduction = farmers * farmerProduction;
  
  // Each person consumes 21 food/week (adults) or 10 food/week (children)
  // Assume 20% children
  const avgConsumption = (CONSUMPTION.food * 0.8 + CONSUMPTION.childFood * 0.2) * settings.consumptionRate;
  
  return Math.floor(totalFoodProduction / avgConsumption);
}

/**
 * Analyze resource balance for a given difficulty
 */
export function analyzeBalance(difficulty: Difficulty): BalanceAnalysis {
  const settings = DIFFICULTY_SETTINGS[difficulty];
  const warnings: string[] = [];
  const recommendations: string[] = [];
  
  // Analyze food balance
  const avgSeasonalMultiplier = 1.075;
  const farmerProductionPerWeek = FARMER_WEEKLY_BASE * settings.productionMultiplier * avgSeasonalMultiplier;
  const foodConsumptionPerPerson = ((CONSUMPTION.food * 0.8) + (CONSUMPTION.childFood * 0.2)) * settings.consumptionRate;
  
  const foodRatio = farmerProductionPerWeek / foodConsumptionPerPerson;
  const minFarmersNeeded = Math.ceil(settings.startingPop / foodRatio);
  
  // Analyze wood balance
  const woodProductionPerWorker = JOB_INCOME[Job.Woodcutter].wood * settings.productionMultiplier;
  const winterWoodConsumptionPerPerson = WINTER_WOOD_CONSUMPTION * settings.consumptionRate;
  const avgWoodConsumptionPerPerson = winterWoodConsumptionPerPerson / 4; // Winter is 1/4 of year
  
  const woodRatio = woodProductionPerWorker / avgWoodConsumptionPerPerson;
  const minWoodcuttersNeeded = Math.ceil(settings.startingPop / woodRatio);
  
  // Analyze stone/gold balance
  const stoneProductionPerWorker = JOB_INCOME[Job.Miner].stone * settings.productionMultiplier;
  const goldProductionPerWorker = JOB_INCOME[Job.Miner].gold * settings.productionMultiplier;
  
  // Calculate minimum population needed
  const minPopulationNeeded = minFarmersNeeded + minWoodcuttersNeeded + 1; // +1 for guard
  
  // Calculate sustainable population with optimal job distribution
  const optimalFarmers = Math.ceil(settings.startingPop * 0.6); // 60% farmers
  const sustainablePopulation = calculateSustainablePopulation(optimalFarmers, difficulty);
  
  // Check if starting resources can sustain until first harvest
  // Players start with already-assigned workers producing from day 1
  const weeksToStability = 2; // Time to adjust job distribution
  const startingFoodBudget = settings.startingResources.food - (settings.startingPop * foodConsumptionPerPerson * weeksToStability);
  
  if (startingFoodBudget < -50) { // Allow some tolerance
    warnings.push(`Starting food buffer is tight. Consider assigning farmers quickly.`);
  }
  
  // Check wood for winter
  const weeksToWinter = 39; // Autumn ends at week 39
  const startingWoodBudget = settings.startingResources.wood;
  const winterWoodNeeded = settings.startingPop * winterWoodConsumptionPerPerson * 13; // 13 weeks of winter
  
  if (startingWoodBudget < winterWoodNeeded / 4) {
    warnings.push(`May need more wood for first winter. Recommended: ${Math.ceil(winterWoodNeeded / 4)} wood.`);
  }
  
  // Check if game is winnable
  // Players start with ~60% farmers already producing from week 1
  // So the actual starting production is much higher than minimum
  const expectedStartingFarmers = Math.floor(settings.startingPop * 0.6);
  const actualStartingSustainablePop = calculateSustainablePopulation(expectedStartingFarmers, difficulty);
  
  const isWinnable = actualStartingSustainablePop >= settings.startingPop * 0.8 && // Can sustain at least 80% of starting pop
                     startingFoodBudget >= -300; // Allow some deficit since production starts immediately
  
  if (!isWinnable) {
    warnings.push('Game may be extremely difficult or impossible to win with current settings.');
  }
  
  if (minFarmersNeeded > settings.startingPop * 0.7) {
    recommendations.push('Consider increasing farmer food production or reducing consumption.');
  }
  
  if (minWoodcuttersNeeded > settings.startingPop * 0.3) {
    recommendations.push('Winter wood consumption may be too high for sustainable play.');
  }
  
  return {
    difficulty,
    isWinnable,
    minPopulationNeeded,
    minFarmersNeeded,
    minWoodcuttersNeeded,
    minMinersNeeded: 1, // At least 1 for stone/gold
    sustainablePopulation,
    resourceBreakdown: {
      food: {
        baseProduction: farmerProductionPerWeek,
        baseConsumption: foodConsumptionPerPerson,
        netBalance: farmerProductionPerWeek - foodConsumptionPerPerson,
        isSustainable: foodRatio >= 1.0,
        productionPerWorker: farmerProductionPerWeek,
        consumptionPerPerson: foodConsumptionPerPerson
      },
      wood: {
        baseProduction: woodProductionPerWorker,
        baseConsumption: avgWoodConsumptionPerPerson,
        netBalance: woodProductionPerWorker - avgWoodConsumptionPerPerson,
        isSustainable: woodRatio >= 1.0,
        productionPerWorker: woodProductionPerWorker,
        consumptionPerPerson: avgWoodConsumptionPerPerson
      },
      stone: {
        baseProduction: stoneProductionPerWorker,
        baseConsumption: 0, // No base consumption
        netBalance: stoneProductionPerWorker,
        isSustainable: true,
        productionPerWorker: stoneProductionPerWorker,
        consumptionPerPerson: 0
      },
      gold: {
        baseProduction: goldProductionPerWorker,
        baseConsumption: 0, // No base consumption, only building maintenance
        netBalance: goldProductionPerWorker,
        isSustainable: true,
        productionPerWorker: goldProductionPerWorker,
        consumptionPerPerson: 0
      },
      knowledge: {
        baseProduction: JOB_INCOME[Job.Scholar].knowledge,
        baseConsumption: 0,
        netBalance: JOB_INCOME[Job.Scholar].knowledge,
        isSustainable: true,
        productionPerWorker: JOB_INCOME[Job.Scholar].knowledge,
        consumptionPerPerson: 0
      }
    },
    warnings,
    recommendations
  };
}

/**
 * Validate that all difficulties are winnable
 */
export function validateAllDifficulties(): Record<Difficulty, BalanceAnalysis> {
  return {
    [Difficulty.Easy]: analyzeBalance(Difficulty.Easy),
    [Difficulty.Normal]: analyzeBalance(Difficulty.Normal),
    [Difficulty.Hard]: analyzeBalance(Difficulty.Hard)
  };
}

/**
 * Generate a balance report for console logging
 */
export function generateBalanceReport(): string {
  const results = validateAllDifficulties();
  let report = '\n=== GAME BALANCE ANALYSIS ===\n\n';
  
  const difficulties = [Difficulty.Easy, Difficulty.Normal, Difficulty.Hard];
  difficulties.forEach((difficulty) => {
    const analysis = results[difficulty];
    report += `\n${DIFFICULTY_SETTINGS[difficulty].name}:\n`;
    report += `  Winnable: ${analysis.isWinnable ? '✓ YES' : '✗ NO'}\n`;
    report += `  Starting Pop: ${DIFFICULTY_SETTINGS[difficulty].startingPop}\n`;
    report += `  Min Pop Needed: ${analysis.minPopulationNeeded}\n`;
    report += `  Sustainable Pop: ${analysis.sustainablePopulation}\n`;
    report += `  Min Farmers: ${analysis.minFarmersNeeded}\n`;
    report += `  Min Woodcutters: ${analysis.minWoodcuttersNeeded}\n`;
    
    report += `\n  Resource Balance:\n`;
    report += `    Food: ${analysis.resourceBreakdown.food.productionPerWorker.toFixed(2)}/week per farmer vs ${analysis.resourceBreakdown.food.consumptionPerPerson.toFixed(2)}/week per person\n`;
    report += `    Wood: ${analysis.resourceBreakdown.wood.productionPerWorker.toFixed(2)}/week per woodcutter vs ${analysis.resourceBreakdown.wood.consumptionPerPerson.toFixed(2)}/week per person\n`;
    report += `    Stone: ${analysis.resourceBreakdown.stone.productionPerWorker.toFixed(2)}/week per miner\n`;
    report += `    Gold: ${analysis.resourceBreakdown.gold.productionPerWorker.toFixed(2)}/week per miner\n`;
    
    if (analysis.warnings.length > 0) {
      report += `\n  ⚠ Warnings:\n`;
      analysis.warnings.forEach(w => report += `    - ${w}\n`);
    }
    
    if (analysis.recommendations.length > 0) {
      report += `\n  💡 Recommendations:\n`;
      analysis.recommendations.forEach(r => report += `    - ${r}\n`);
    }
  });
  
  return report;
}

/**
 * Check if building maintenance is sustainable
 */
export function validateBuildingMaintenance(): {
  sustainable: boolean;
  analysis: Record<string, { woodPerWeek: number; goldPerWeek: number; stonePerWeek: number }>;
} {
  const analysis: Record<string, { woodPerWeek: number; goldPerWeek: number; stonePerWeek: number }> = {};
  
  const buildingKeys = Object.keys(BUILDING_MAINTENANCE) as (keyof typeof BUILDING_MAINTENANCE)[];
  buildingKeys.forEach((building) => {
    const costs = BUILDING_MAINTENANCE[building];
    analysis[building] = {
      woodPerWeek: costs.wood || 0,
      goldPerWeek: costs.gold || 0,
      stonePerWeek: costs.stone || 0
    };
  });
  
  // Check if maintenance costs are reasonable compared to production
  const woodProduction = JOB_INCOME[Job.Woodcutter].wood;
  const goldProduction = JOB_INCOME[Job.Miner].gold;
  
  // A single building shouldn't consume more than 10% of a worker's output
  const maxReasonableWoodMaintenance = woodProduction * 0.1;
  const maxReasonableGoldMaintenance = goldProduction * 0.1;
  
  let sustainable = true;
  buildingKeys.forEach((building) => {
    const costs = analysis[building];
    if (costs.woodPerWeek > maxReasonableWoodMaintenance || 
        costs.goldPerWeek > maxReasonableGoldMaintenance) {
      sustainable = false;
    }
  });
  
  return { sustainable, analysis };
}

/**
 * Building ROI Analysis Result
 */
export interface BuildingROI {
  buildingName: string;
  constructionCost: {
    wood: number;
    stone: number;
    gold: number;
    food: number;
    total: number; // In "resource units" for comparison
  };
  maintenanceCostOver10Years: {
    wood: number;
    stone: number;
    gold: number;
    total: number;
  };
  totalCost: number;
  benefitsOver10Years: {
    description: string;
    estimatedValue: number; // Estimated value in resource units
  }[];
  totalBenefits: number;
  netROI: number; // Total benefits - total cost
  paysForItself: boolean;
  yearsToBreakEven: number; // How many years to pay back (or -1 if never)
  notes: string[];
}

/**
 * Calculate ROI for a specific building over 10 years
 */
export function calculateBuildingROI(buildingName: string): BuildingROI {
  const TOTAL_WEEKS = GAME_END_TICK; // 520 weeks (10 years)
  
  // Get construction costs
  const constructionCostRaw = BUILDING_COSTS[buildingName as keyof typeof BUILDING_COSTS];
  if (!constructionCostRaw) {
    throw new Error(`Unknown building: ${buildingName}`);
  }
  
  const constructionCost = {
    wood: constructionCostRaw.wood || 0,
    stone: constructionCostRaw.stone || 0,
    gold: constructionCostRaw.gold || 0,
    food: (constructionCostRaw as any).food || 0,
    total: 0
  };
  
  // Calculate total construction cost in "resource units"
  // Weight: wood=1, stone=3 (harder to get), gold=5 (hardest), food=0.5 (renewable)
  constructionCost.total = 
    constructionCost.wood * 1 + 
    constructionCost.stone * 3 + 
    constructionCost.gold * 5 +
    constructionCost.food * 0.5;
  
  // Get maintenance costs
  const buildingKey = buildingName.charAt(0).toLowerCase() + buildingName.slice(1) + 's'; // Convert to plural lowercase
  const maintenanceRaw = BUILDING_MAINTENANCE[buildingKey as keyof typeof BUILDING_MAINTENANCE];
  
  const maintenanceCostOver10Years = {
    wood: 0,
    stone: 0,
    gold: 0,
    total: 0
  };
  
  if (maintenanceRaw) {
    maintenanceCostOver10Years.wood = (maintenanceRaw.wood || 0) * TOTAL_WEEKS;
    maintenanceCostOver10Years.stone = (maintenanceRaw.stone || 0) * TOTAL_WEEKS;
    maintenanceCostOver10Years.gold = (maintenanceRaw.gold || 0) * TOTAL_WEEKS;
    maintenanceCostOver10Years.total = 
      maintenanceCostOver10Years.wood * 1 +
      maintenanceCostOver10Years.stone * 3 +
      maintenanceCostOver10Years.gold * 5;
  }
  
  const totalCost = constructionCost.total + maintenanceCostOver10Years.total;
  
  // Calculate benefits based on building type
  const benefits: { description: string; estimatedValue: number }[] = [];
  const notes: string[] = [];
  
  // Define building benefits
  const WOODCUTTER_OUTPUT = JOB_INCOME[Job.Woodcutter].wood; // 20/week
  const MINER_STONE_OUTPUT = JOB_INCOME[Job.Miner].stone; // 7/week
  const MINER_GOLD_OUTPUT = JOB_INCOME[Job.Miner].gold; // 3/week
  const FARMER_OUTPUT = FARMER_WEEKLY_BASE; // 32/week base
  const SCHOLAR_OUTPUT = JOB_INCOME[Job.Scholar].knowledge; // 10/week
  
  // Assume average of 1 worker per building for production bonuses
  const WORKERS_PER_BUILDING = 1;
  const AVG_POPULATION = 20; // Average population
  
  switch (buildingName) {
    case 'House':
      benefits.push({
        description: 'Increases population capacity by 5-8',
        estimatedValue: 100 // Population growth enables more workers
      });
      notes.push('Essential for population growth');
      break;
      
    case 'Farm':
      // Farm adds 15% food production per farm
      const farmBonus = 0.15;
      const farmersPerFarm = 1;
      const foodIncrease = FARMER_OUTPUT * farmBonus * farmersPerFarm * TOTAL_WEEKS;
      benefits.push({
        description: `+15% farmer production (~${(FARMER_OUTPUT * farmBonus).toFixed(1)} food/week per farmer)`,
        estimatedValue: foodIncrease * 0.5 // Food worth 0.5 resource units
      });
      break;
      
    case 'LumberMill':
      // LumberMill adds 15% wood production
      const lumberBonus = 0.15;
      const woodcuttersPerMill = 1;
      const woodIncrease = WOODCUTTER_OUTPUT * lumberBonus * woodcuttersPerMill * TOTAL_WEEKS;
      benefits.push({
        description: `+15% woodcutter production (~${(WOODCUTTER_OUTPUT * lumberBonus).toFixed(1)} wood/week per woodcutter)`,
        estimatedValue: woodIncrease * 1 // Wood worth 1 resource unit
      });
      break;
      
    case 'Mine':
      // Mine adds 15% stone and gold production
      const mineBonus = 0.15;
      const minersPerMine = 1;
      const stoneIncrease = MINER_STONE_OUTPUT * mineBonus * minersPerMine * TOTAL_WEEKS;
      const goldIncrease = MINER_GOLD_OUTPUT * mineBonus * minersPerMine * TOTAL_WEEKS;
      benefits.push({
        description: `+15% miner production (~${(MINER_STONE_OUTPUT * mineBonus).toFixed(1)} stone, ${(MINER_GOLD_OUTPUT * mineBonus).toFixed(1)} gold/week per miner)`,
        estimatedValue: stoneIncrease * 3 + goldIncrease * 5
      });
      break;
      
    case 'Workshop':
      // Workshop adds 10% to wood and mining production
      const workshopBonus = 0.1;
      const workersPerWorkshop = 2; // Benefits both woodcutters and miners
      const workshopWoodIncrease = WOODCUTTER_OUTPUT * workshopBonus * workersPerWorkshop * TOTAL_WEEKS;
      const workshopStoneIncrease = MINER_STONE_OUTPUT * workshopBonus * workersPerWorkshop * TOTAL_WEEKS;
      benefits.push({
        description: `+10% wood and resource production`,
        estimatedValue: workshopWoodIncrease * 1 + workshopStoneIncrease * 3
      });
      break;
      
    case 'Blacksmith':
      // Blacksmith adds 10% to wood and mining production
      const blacksmithBonus = 0.1;
      const workersPerBlacksmith = 2;
      const blacksmithWoodIncrease = WOODCUTTER_OUTPUT * blacksmithBonus * workersPerBlacksmith * TOTAL_WEEKS;
      const blacksmithStoneIncrease = MINER_STONE_OUTPUT * blacksmithBonus * workersPerBlacksmith * TOTAL_WEEKS;
      benefits.push({
        description: `+10% wood and resource production`,
        estimatedValue: blacksmithWoodIncrease * 1 + blacksmithStoneIncrease * 3
      });
      break;
      
    case 'Granary':
      // Granary reduces food consumption by 5%
      const granaryReduction = 0.05;
      const avgFoodConsumption = 18; // Average per person per week
      const foodSaved = AVG_POPULATION * avgFoodConsumption * granaryReduction * TOTAL_WEEKS;
      benefits.push({
        description: `-5% food consumption (saves ~${(AVG_POPULATION * avgFoodConsumption * granaryReduction).toFixed(1)} food/week)`,
        estimatedValue: foodSaved * 0.5
      });
      break;
      
    case 'Library':
      // Library adds 1.4 knowledge per week per scholar (0.2 * 7)
      const libraryKnowledgeBonus = 0.2 * 7;
      const scholarsPerLibrary = 1;
      const knowledgeIncrease = libraryKnowledgeBonus * scholarsPerLibrary * TOTAL_WEEKS;
      benefits.push({
        description: `+${libraryKnowledgeBonus} knowledge/week per scholar`,
        estimatedValue: knowledgeIncrease * 2 // Knowledge worth 2 resource units (needed for tech)
      });
      notes.push('Required for technology research');
      break;
      
    case 'University':
      // University adds 2.1 knowledge per week per scholar (0.3 * 7)
      const universityKnowledgeBonus = 0.3 * 7;
      const scholarsPerUniversity = 1;
      const universityKnowledgeIncrease = universityKnowledgeBonus * scholarsPerUniversity * TOTAL_WEEKS;
      benefits.push({
        description: `+${universityKnowledgeBonus} knowledge/week per scholar`,
        estimatedValue: universityKnowledgeIncrease * 2
      });
      notes.push('Advanced knowledge production');
      break;
      
    case 'Alchemist':
      // Alchemist adds 1.05 knowledge per week per scholar (0.15 * 7)
      const alchemistKnowledgeBonus = 0.15 * 7;
      const scholarsPerAlchemist = 1;
      const alchemistKnowledgeIncrease = alchemistKnowledgeBonus * scholarsPerAlchemist * TOTAL_WEEKS;
      benefits.push({
        description: `+${alchemistKnowledgeBonus} knowledge/week per scholar`,
        estimatedValue: alchemistKnowledgeIncrease * 2
      });
      break;
      
    case 'Watchtower':
      benefits.push({
        description: '+3 guard coverage, reduces theft and raid damage',
        estimatedValue: 300 // Prevents losses
      });
      notes.push('Defensive building - prevents resource losses');
      break;
      
    case 'Barracks':
      benefits.push({
        description: '+2 guard coverage, improves security',
        estimatedValue: 200
      });
      notes.push('Defensive building');
      break;
      
    case 'TrainingGrounds':
      benefits.push({
        description: '+2 guard effectiveness',
        estimatedValue: 200
      });
      notes.push('Defensive building');
      break;
      
    case 'StoneWall':
      benefits.push({
        description: '+5 guard coverage bonus',
        estimatedValue: 250
      });
      notes.push('Defensive structure - essential for large populations');
      break;
      
    case 'Tavern':
      benefits.push({
        description: '+2 happiness recovery per week, prevents productivity loss',
        estimatedValue: 500 // Happy workers are more productive
      });
      notes.push('Maintains workforce productivity through happiness');
      break;
      
    case 'Temple':
      benefits.push({
        description: 'Increases baseline happiness, +1 happiness recovery',
        estimatedValue: 400
      });
      notes.push('Long-term happiness benefit');
      break;
      
    case 'Cathedral':
      benefits.push({
        description: 'Major happiness boost (+5 baseline)',
        estimatedValue: 600
      });
      notes.push('Premium happiness building');
      break;
      
    case 'Market':
      benefits.push({
        description: 'Enables trading and festivals',
        estimatedValue: 300
      });
      notes.push('Required for resource trading');
      break;
      
    case 'Aqueduct':
      // Aqueduct adds 10% food production
      const aqueductBonus = 0.1;
      const farmersPerAqueduct = 2;
      const aqueductFoodIncrease = FARMER_OUTPUT * aqueductBonus * farmersPerAqueduct * TOTAL_WEEKS;
      benefits.push({
        description: `+10% farming production`,
        estimatedValue: aqueductFoodIncrease * 0.5
      });
      notes.push('Infrastructure building for farming');
      break;
      
    case 'Stables':
      benefits.push({
        description: 'Enables cavalry (requires tech), +3 guard coverage with cavalry',
        estimatedValue: 250
      });
      notes.push('Defensive building - requires cavalry tech');
      break;
      
    case 'Festival':
      benefits.push({
        description: 'One-time +30 happiness to all villagers',
        estimatedValue: 0 // One-time event, not a building
      });
      notes.push('Not a permanent building');
      break;
      
    default:
      benefits.push({
        description: 'Benefits not fully quantified',
        estimatedValue: 100 // Generic benefit
      });
      notes.push('Building has qualitative benefits');
  }
  
  const totalBenefits = benefits.reduce((sum, b) => sum + b.estimatedValue, 0);
  const netROI = totalBenefits - totalCost;
  const paysForItself = netROI >= 0;
  
  // Calculate years to break even
  let yearsToBreakEven = -1;
  if (totalBenefits > 0) {
    const benefitPerWeek = totalBenefits / TOTAL_WEEKS;
    if (benefitPerWeek > 0) {
      const weeksToBreakEven = totalCost / benefitPerWeek;
      yearsToBreakEven = weeksToBreakEven / WEEKS_PER_YEAR;
      if (yearsToBreakEven > MAX_YEARS) {
        yearsToBreakEven = -1; // Never pays back within game duration
      }
    }
  }
  
  return {
    buildingName,
    constructionCost,
    maintenanceCostOver10Years,
    totalCost,
    benefitsOver10Years: benefits,
    totalBenefits,
    netROI,
    paysForItself,
    yearsToBreakEven,
    notes
  };
}

/**
 * Validate all buildings for ROI over 10 years
 */
export function validateAllBuildingsROI(): Record<string, BuildingROI> {
  const buildings = Object.keys(BUILDING_COSTS);
  const results: Record<string, BuildingROI> = {};
  
  buildings.forEach(building => {
    try {
      results[building] = calculateBuildingROI(building);
    } catch (e) {
      // Skip buildings that fail
    }
  });
  
  return results;
}

/**
 * Generate ROI report for all buildings
 */
export function generateBuildingROIReport(): string {
  const results = validateAllBuildingsROI();
  let report = '\n=== BUILDING ROI ANALYSIS (10 YEAR PAYBACK) ===\n\n';
  
  const buildings = Object.keys(results).sort((a, b) => {
    const roiA = results[a].netROI;
    const roiB = results[b].netROI;
    return roiB - roiA; // Sort by ROI descending
  });
  
  buildings.forEach(building => {
    const roi = results[building];
    
    report += `\n${roi.buildingName}:\n`;
    report += `  Construction: ${roi.constructionCost.wood}W ${roi.constructionCost.stone}S ${roi.constructionCost.gold}G`;
    if (roi.constructionCost.food > 0) report += ` ${roi.constructionCost.food}F`;
    report += ` (${roi.constructionCost.total.toFixed(0)} units)\n`;
    
    if (roi.maintenanceCostOver10Years.total > 0) {
      report += `  Maintenance (10y): ${roi.maintenanceCostOver10Years.wood.toFixed(0)}W ${roi.maintenanceCostOver10Years.stone.toFixed(0)}S ${roi.maintenanceCostOver10Years.gold.toFixed(0)}G (${roi.maintenanceCostOver10Years.total.toFixed(0)} units)\n`;
    }
    
    report += `  Total Cost: ${roi.totalCost.toFixed(0)} resource units\n`;
    report += `  Benefits:\n`;
    roi.benefitsOver10Years.forEach(benefit => {
      report += `    - ${benefit.description} (${benefit.estimatedValue.toFixed(0)} units)\n`;
    });
    report += `  Total Benefits: ${roi.totalBenefits.toFixed(0)} units\n`;
    report += `  Net ROI: ${roi.netROI >= 0 ? '+' : ''}${roi.netROI.toFixed(0)} units\n`;
    report += `  Pays for itself: ${roi.paysForItself ? '✓ YES' : '✗ NO'}\n`;
    
    if (roi.yearsToBreakEven > 0 && roi.yearsToBreakEven <= MAX_YEARS) {
      report += `  Break-even time: ${roi.yearsToBreakEven.toFixed(1)} years\n`;
    } else if (roi.yearsToBreakEven === -1 && roi.totalBenefits > 0) {
      report += `  Break-even time: Never (>10 years)\n`;
    }
    
    if (roi.notes.length > 0) {
      report += `  Notes: ${roi.notes.join(', ')}\n`;
    }
  });
  
  // Summary
  const totalBuildings = buildings.length;
  const paybackBuildings = buildings.filter(b => results[b].paysForItself).length;
  
  report += `\n=== SUMMARY ===\n`;
  report += `Total Buildings Analyzed: ${totalBuildings}\n`;
  report += `Buildings that pay for themselves: ${paybackBuildings} (${Math.round(paybackBuildings/totalBuildings*100)}%)\n`;
  report += `Buildings that don't pay back: ${totalBuildings - paybackBuildings}\n`;
  
  return report;
}
