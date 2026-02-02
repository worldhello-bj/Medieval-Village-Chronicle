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
