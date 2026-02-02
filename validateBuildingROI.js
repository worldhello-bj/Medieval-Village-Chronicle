// Building ROI Validation Script
// Check if buildings can pay for themselves within 10 years

const WEEKS_PER_YEAR = 52;
const MAX_YEARS = 10;
const GAME_END_TICK = WEEKS_PER_YEAR * MAX_YEARS;

const Job = {
  Unemployed: '无业游民',
  Farmer: '农夫',
  Woodcutter: '伐木工',
  Miner: '矿工',
  Guard: '守卫',
  Scholar: '学者',
  Child: '孩童'
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

const FARMER_WEEKLY_BASE = 32;

const BUILDING_COSTS = {
  House: { wood: 30, stone: 3, gold: 0 },
  Market: { wood: 60, stone: 15, gold: 30 },
  StoneWall: { wood: 0, stone: 100, gold: 0 },
  Library: { wood: 60, stone: 200, gold: 0 },
  Tavern: { wood: 100, stone: 60, gold: 60 },
  Cathedral: { wood: 0, stone: 350, gold: 200 },
  Farm: { wood: 50, stone: 5, gold: 15 },
  LumberMill: { wood: 80, stone: 20, gold: 20 },
  Mine: { wood: 60, stone: 30, gold: 30 },
  Watchtower: { wood: 50, stone: 60, gold: 25 },
  Granary: { wood: 60, stone: 30, gold: 20 },
  Blacksmith: { wood: 60, stone: 50, gold: 60 },
  Temple: { wood: 100, stone: 120, gold: 100 },
  University: { wood: 120, stone: 250, gold: 200 },
  Workshop: { wood: 70, stone: 40, gold: 50 },
  Barracks: { wood: 80, stone: 70, gold: 40 },
  Stables: { wood: 90, stone: 30, gold: 60 },
  Aqueduct: { wood: 50, stone: 150, gold: 80 },
  TrainingGrounds: { wood: 60, stone: 80, gold: 50 },
  Alchemist: { wood: 80, stone: 60, gold: 100 },
};

const BUILDING_MAINTENANCE = {
  houses: { wood: 0.5, gold: 0.2 },
  markets: { wood: 1, gold: 1 },
  walls: { stone: 0.5, gold: 0 },
  libraries: { wood: 1, gold: 0.5 },
  taverns: { wood: 1.5, gold: 1.5 },
  cathedrals: { wood: 2, stone: 1, gold: 2 },
  farms: { wood: 0.5, gold: 0.3 },
  lumberMills: { wood: 1, gold: 0.5 },
  mines: { wood: 1, stone: 0.5, gold: 0.5 },
  watchtowers: { wood: 1, gold: 0.5 },
  granaries: { wood: 0.8, gold: 0.3 },
  blacksmiths: { wood: 1.5, gold: 1 },
  temples: { wood: 1.5, gold: 1 },
  universities: { wood: 2, stone: 0.5, gold: 1.5 },
  workshops: { wood: 1, gold: 0.8 },
  barracks: { wood: 1.5, gold: 1 },
  stables: { wood: 2, gold: 1.5 },
  aqueducts: { stone: 1, gold: 0.5 },
  trainingGrounds: { wood: 1, gold: 0.8 },
  alchemists: { wood: 1, gold: 1.2 }
};

function calculateBuildingROI(buildingName) {
  const TOTAL_WEEKS = GAME_END_TICK;
  
  const constructionCostRaw = BUILDING_COSTS[buildingName];
  if (!constructionCostRaw) {
    throw new Error(`Unknown building: ${buildingName}`);
  }
  
  const constructionCost = {
    wood: constructionCostRaw.wood || 0,
    stone: constructionCostRaw.stone || 0,
    gold: constructionCostRaw.gold || 0,
    food: constructionCostRaw.food || 0,
    total: 0
  };
  
  // Weight: wood=1, stone=3, gold=5, food=0.5
  constructionCost.total = 
    constructionCost.wood * 1 + 
    constructionCost.stone * 3 + 
    constructionCost.gold * 5 +
    constructionCost.food * 0.5;
  
  const buildingKey = buildingName.charAt(0).toLowerCase() + buildingName.slice(1) + 's';
  const maintenanceRaw = BUILDING_MAINTENANCE[buildingKey];
  
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
  
  const benefits = [];
  const notes = [];
  
  const WOODCUTTER_OUTPUT = JOB_INCOME[Job.Woodcutter].wood;
  const MINER_STONE_OUTPUT = JOB_INCOME[Job.Miner].stone;
  const MINER_GOLD_OUTPUT = JOB_INCOME[Job.Miner].gold;
  const FARMER_OUTPUT = FARMER_WEEKLY_BASE;
  const SCHOLAR_OUTPUT = JOB_INCOME[Job.Scholar].knowledge;
  const AVG_POPULATION = 20;
  
  switch (buildingName) {
    case 'House':
      benefits.push({ description: 'Increases population capacity by 5-8', estimatedValue: 100 });
      notes.push('Essential for population growth');
      break;
    case 'Farm':
      const farmBonus = 0.15;
      const foodIncrease = FARMER_OUTPUT * farmBonus * 1 * TOTAL_WEEKS;
      benefits.push({ description: `+15% farmer production`, estimatedValue: foodIncrease * 0.5 });
      break;
    case 'LumberMill':
      const lumberBonus = 0.15;
      const woodIncrease = WOODCUTTER_OUTPUT * lumberBonus * 1 * TOTAL_WEEKS;
      benefits.push({ description: `+15% woodcutter production`, estimatedValue: woodIncrease * 1 });
      break;
    case 'Mine':
      const mineBonus = 0.15;
      const stoneIncrease = MINER_STONE_OUTPUT * mineBonus * 1 * TOTAL_WEEKS;
      const goldIncrease = MINER_GOLD_OUTPUT * mineBonus * 1 * TOTAL_WEEKS;
      benefits.push({ description: `+15% miner production`, estimatedValue: stoneIncrease * 3 + goldIncrease * 5 });
      break;
    case 'Workshop':
      const workshopBonus = 0.1;
      benefits.push({ description: `+10% production bonus`, estimatedValue: (WOODCUTTER_OUTPUT * workshopBonus * 2 * TOTAL_WEEKS) });
      break;
    case 'Blacksmith':
      const blacksmithBonus = 0.1;
      benefits.push({ description: `+10% production bonus`, estimatedValue: (WOODCUTTER_OUTPUT * blacksmithBonus * 2 * TOTAL_WEEKS) });
      break;
    case 'Granary':
      const granaryReduction = 0.05;
      const avgFoodConsumption = 18;
      const foodSaved = AVG_POPULATION * avgFoodConsumption * granaryReduction * TOTAL_WEEKS;
      benefits.push({ description: `-5% food consumption`, estimatedValue: foodSaved * 0.5 });
      break;
    case 'Library':
      benefits.push({ description: `+1.4 knowledge/week per scholar`, estimatedValue: 1.4 * 1 * TOTAL_WEEKS * 2 });
      notes.push('Required for technology');
      break;
    case 'University':
      benefits.push({ description: `+2.1 knowledge/week per scholar`, estimatedValue: 2.1 * 1 * TOTAL_WEEKS * 2 });
      break;
    case 'Alchemist':
      benefits.push({ description: `+1.05 knowledge/week per scholar`, estimatedValue: 1.05 * 1 * TOTAL_WEEKS * 2 });
      break;
    case 'Watchtower':
      benefits.push({ description: '+3 guard coverage', estimatedValue: 300 });
      notes.push('Defensive building');
      break;
    case 'Barracks':
      benefits.push({ description: '+2 guard coverage', estimatedValue: 200 });
      notes.push('Defensive building');
      break;
    case 'TrainingGrounds':
      benefits.push({ description: '+2 guard effectiveness', estimatedValue: 200 });
      notes.push('Defensive building');
      break;
    case 'StoneWall':
      benefits.push({ description: '+5 guard coverage bonus', estimatedValue: 250 });
      notes.push('Defensive structure');
      break;
    case 'Tavern':
      benefits.push({ description: '+2 happiness recovery', estimatedValue: 500 });
      notes.push('Maintains productivity');
      break;
    case 'Temple':
      benefits.push({ description: 'Increases baseline happiness', estimatedValue: 400 });
      break;
    case 'Cathedral':
      benefits.push({ description: 'Major happiness boost', estimatedValue: 600 });
      break;
    case 'Market':
      benefits.push({ description: 'Enables trading', estimatedValue: 300 });
      break;
    case 'Aqueduct':
      const aqueductBonus = 0.1;
      const aqueductFoodIncrease = FARMER_OUTPUT * aqueductBonus * 2 * TOTAL_WEEKS;
      benefits.push({ description: `+10% farming`, estimatedValue: aqueductFoodIncrease * 0.5 });
      break;
    case 'Stables':
      benefits.push({ description: 'Enables cavalry', estimatedValue: 250 });
      notes.push('Requires cavalry tech');
      break;
    default:
      benefits.push({ description: 'Benefits not quantified', estimatedValue: 100 });
  }
  
  const totalBenefits = benefits.reduce((sum, b) => sum + b.estimatedValue, 0);
  const netROI = totalBenefits - totalCost;
  const paysForItself = netROI >= 0;
  
  let yearsToBreakEven = -1;
  if (totalBenefits > 0) {
    const benefitPerWeek = totalBenefits / TOTAL_WEEKS;
    if (benefitPerWeek > 0) {
      const weeksToBreakEven = totalCost / benefitPerWeek;
      yearsToBreakEven = weeksToBreakEven / WEEKS_PER_YEAR;
      if (yearsToBreakEven > MAX_YEARS) {
        yearsToBreakEven = -1;
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

// Generate Report
console.log('============================================================');
console.log('BUILDING ROI ANALYSIS - 10 YEAR PAYBACK VALIDATION');
console.log('============================================================\n');

const buildings = Object.keys(BUILDING_COSTS);
const results = {};

buildings.forEach(building => {
  try {
    results[building] = calculateBuildingROI(building);
  } catch (e) {
    // Skip
  }
});

const sortedBuildings = Object.keys(results).sort((a, b) => {
  return results[b].netROI - results[a].netROI;
});

sortedBuildings.forEach(building => {
  const roi = results[building];
  
  console.log(`\n${roi.buildingName}:`);
  console.log(`  Construction: ${roi.constructionCost.wood}W ${roi.constructionCost.stone}S ${roi.constructionCost.gold}G (${roi.constructionCost.total.toFixed(0)} units)`);
  
  if (roi.maintenanceCostOver10Years.total > 0) {
    console.log(`  Maintenance (10y): ${roi.maintenanceCostOver10Years.wood.toFixed(0)}W ${roi.maintenanceCostOver10Years.stone.toFixed(0)}S ${roi.maintenanceCostOver10Years.gold.toFixed(0)}G (${roi.maintenanceCostOver10Years.total.toFixed(0)} units)`);
  }
  
  console.log(`  Total Cost: ${roi.totalCost.toFixed(0)} units`);
  console.log(`  Benefits:`);
  roi.benefitsOver10Years.forEach(benefit => {
    console.log(`    - ${benefit.description} (${benefit.estimatedValue.toFixed(0)} units)`);
  });
  console.log(`  Total Benefits: ${roi.totalBenefits.toFixed(0)} units`);
  console.log(`  Net ROI: ${roi.netROI >= 0 ? '+' : ''}${roi.netROI.toFixed(0)} units`);
  console.log(`  Pays for itself: ${roi.paysForItself ? '✓ YES' : '✗ NO'}`);
  
  if (roi.yearsToBreakEven > 0 && roi.yearsToBreakEven <= MAX_YEARS) {
    console.log(`  Break-even: ${roi.yearsToBreakEven.toFixed(1)} years`);
  } else if (roi.yearsToBreakEven === -1 && roi.totalBenefits > 0) {
    console.log(`  Break-even: Never (>10 years)`);
  }
  
  if (roi.notes.length > 0) {
    console.log(`  Notes: ${roi.notes.join(', ')}`);
  }
});

// Summary
const totalBuildings = sortedBuildings.length;
const paybackBuildings = sortedBuildings.filter(b => results[b].paysForItself).length;

console.log('\n============================================================');
console.log('SUMMARY');
console.log('============================================================');
console.log(`Total Buildings: ${totalBuildings}`);
console.log(`Pay for themselves: ${paybackBuildings} (${Math.round(paybackBuildings/totalBuildings*100)}%)`);
console.log(`Don't pay back: ${totalBuildings - paybackBuildings}`);
console.log('============================================================\n');
