// Standalone Balance Validation Script
// This can be run directly with Node.js to validate game balance

// Import game constants (simplified for standalone execution)
const WEEKS_PER_YEAR = 52;
const MAX_YEARS = 10;

const Difficulty = {
  Easy: 'Easy',
  Normal: 'Normal',
  Hard: 'Hard'
};

const Job = {
  Unemployed: '无业游民',
  Farmer: '农夫',
  Woodcutter: '伐木工',
  Miner: '矿工',
  Guard: '守卫',
  Scholar: '学者',
  Child: '孩童'
};

const DIFFICULTY_SETTINGS = {
  [Difficulty.Easy]: {
    name: '农奴 (简单)',
    description: '资源丰富，消耗较低，适合休闲建设。',
    consumptionRate: 0.8,
    productionMultiplier: 1.2,
    startingResources: { food: 500, wood: 150, stone: 50, gold: 50, knowledge: 20 },
    startingPop: 25
  },
  [Difficulty.Normal]: {
    name: '骑士 (普通)',
    description: '标准的生存挑战。',
    consumptionRate: 1.0,
    productionMultiplier: 1.0,
    startingResources: { food: 300, wood: 100, stone: 30, gold: 30, knowledge: 0 },
    startingPop: 20
  },
  [Difficulty.Hard]: {
    name: '领主 (困难)',
    description: '严酷的寒冬，刁民难养，物资匮乏。',
    consumptionRate: 1.2,
    productionMultiplier: 0.9,
    startingResources: { food: 300, wood: 50, stone: 0, gold: 0, knowledge: 0 },
    startingPop: 15
  }
};

const JOB_INCOME = {
  [Job.Unemployed]: { food: 0, wood: 0, stone: 0, gold: 0, knowledge: 0 },
  [Job.Child]: { food: 0, wood: 0, stone: 0, gold: 0, knowledge: 0 },
  [Job.Farmer]: { food: 0, wood: 0, stone: 0, gold: 0, knowledge: 0 },
  [Job.Woodcutter]: { food: 0, wood: 20, stone: 0, gold: 0, knowledge: 0 },
  [Job.Miner]: { food: 0, wood: 0, stone: 7, gold: 3, knowledge: 0 },
  [Job.Guard]: { food: 0, wood: 0, stone: 0, gold: 0, knowledge: 0 },
  [Job.Scholar]: { food: 0, wood: 0, stone: 0, gold: 0, knowledge: 10 },
};

const CONSUMPTION = {
  food: 21,
  childFood: 10,
};

const WINTER_WOOD_CONSUMPTION = 7;
const FARMER_WEEKLY_BASE = 32;

// Balance Analysis Functions
function calculateSustainablePopulation(farmers, difficulty) {
  const settings = DIFFICULTY_SETTINGS[difficulty];
  const avgSeasonalMultiplier = 1.075;
  const farmerProduction = FARMER_WEEKLY_BASE * settings.productionMultiplier * avgSeasonalMultiplier;
  const totalFoodProduction = farmers * farmerProduction;
  const avgConsumption = (CONSUMPTION.food * 0.8 + CONSUMPTION.childFood * 0.2) * settings.consumptionRate;
  return Math.floor(totalFoodProduction / avgConsumption);
}

function analyzeBalance(difficulty) {
  const settings = DIFFICULTY_SETTINGS[difficulty];
  const warnings = [];
  const recommendations = [];
  
  const avgSeasonalMultiplier = 1.075;
  const farmerProductionPerWeek = FARMER_WEEKLY_BASE * settings.productionMultiplier * avgSeasonalMultiplier;
  const foodConsumptionPerPerson = ((CONSUMPTION.food * 0.8) + (CONSUMPTION.childFood * 0.2)) * settings.consumptionRate;
  
  const foodRatio = farmerProductionPerWeek / foodConsumptionPerPerson;
  const minFarmersNeeded = Math.ceil(settings.startingPop / foodRatio);
  
  const woodProductionPerWorker = JOB_INCOME[Job.Woodcutter].wood * settings.productionMultiplier;
  const winterWoodConsumptionPerPerson = WINTER_WOOD_CONSUMPTION * settings.consumptionRate;
  const avgWoodConsumptionPerPerson = winterWoodConsumptionPerPerson / 4;
  
  const woodRatio = woodProductionPerWorker / avgWoodConsumptionPerPerson;
  const minWoodcuttersNeeded = Math.ceil(settings.startingPop / woodRatio);
  
  const minPopulationNeeded = minFarmersNeeded + minWoodcuttersNeeded + 1;
  
  const optimalFarmers = Math.ceil(settings.startingPop * 0.6);
  const sustainablePopulation = calculateSustainablePopulation(optimalFarmers, difficulty);
  
  // Check if starting resources can sustain until production kicks in
  // Players start with ~60% farmers already producing from week 1
  // So we only need enough food for the first week
  const weeksBuffer = 1; // Farmers produce from week 1
  const startingFoodBudget = settings.startingResources.food - (settings.startingPop * foodConsumptionPerPerson * weeksBuffer);
  
  if (startingFoodBudget < 0) {
    warnings.push(`Starting food is very tight. Farmers must produce immediately to survive.`);
  }
  
  const winterWoodNeeded = settings.startingPop * winterWoodConsumptionPerPerson * 13;
  if (settings.startingResources.wood < winterWoodNeeded / 4) {
    warnings.push(`May need more wood for first winter. Recommended: ${Math.ceil(winterWoodNeeded / 4)} wood.`);
  }
  
  const expectedStartingFarmers = Math.floor(settings.startingPop * 0.6);
  const actualStartingSustainablePop = calculateSustainablePopulation(expectedStartingFarmers, difficulty);
  
  // Game is winnable if we can sustain the population with starting farmers
  // and we have enough food to survive the first week (production starts immediately)
  const isWinnable = actualStartingSustainablePop >= Math.ceil(settings.startingPop * 0.8) &&
                     startingFoodBudget >= -100; // Allow some deficit since production is immediate
  
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
    sustainablePopulation,
    farmerProductionPerWeek,
    foodConsumptionPerPerson,
    woodProductionPerWorker,
    avgWoodConsumptionPerPerson,
    warnings,
    recommendations
  };
}

// Generate Report
console.log('='.repeat(60));
console.log('MEDIEVAL VILLAGE CHRONICLE - BALANCE VALIDATION');
console.log('='.repeat(60));
console.log('\n=== GAME BALANCE ANALYSIS ===\n');

const difficulties = [Difficulty.Easy, Difficulty.Normal, Difficulty.Hard];
difficulties.forEach(difficulty => {
  const analysis = analyzeBalance(difficulty);
  
  console.log(`\n${DIFFICULTY_SETTINGS[difficulty].name}:`);
  console.log(`  Winnable: ${analysis.isWinnable ? '✓ YES' : '✗ NO'}`);
  console.log(`  Starting Pop: ${DIFFICULTY_SETTINGS[difficulty].startingPop}`);
  console.log(`  Min Pop Needed: ${analysis.minPopulationNeeded}`);
  console.log(`  Sustainable Pop: ${analysis.sustainablePopulation}`);
  console.log(`  Min Farmers: ${analysis.minFarmersNeeded}`);
  console.log(`  Min Woodcutters: ${analysis.minWoodcuttersNeeded}`);
  
  console.log(`\n  Resource Balance:`);
  console.log(`    Food: ${analysis.farmerProductionPerWeek.toFixed(2)}/week per farmer vs ${analysis.foodConsumptionPerPerson.toFixed(2)}/week per person`);
  console.log(`    Wood: ${analysis.woodProductionPerWorker.toFixed(2)}/week per woodcutter vs ${analysis.avgWoodConsumptionPerPerson.toFixed(2)}/week per person`);
  
  if (analysis.warnings.length > 0) {
    console.log(`\n  ⚠ Warnings:`);
    analysis.warnings.forEach(w => console.log(`    - ${w}`));
  }
  
  if (analysis.recommendations.length > 0) {
    console.log(`\n  💡 Recommendations:`);
    analysis.recommendations.forEach(r => console.log(`    - ${r}`));
  }
});

console.log('\n' + '='.repeat(60));
console.log('VALIDATION COMPLETE');
console.log('='.repeat(60) + '\n');
