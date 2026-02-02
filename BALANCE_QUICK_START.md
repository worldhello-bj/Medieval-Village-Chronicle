# Balance Validation Quick Start Guide

## Problem Statement
计算数值平衡，确保矩阵有解 (Calculate numerical balance, ensure the matrix has a solution)

## What Was Done

This implementation ensures the game is mathematically winnable by validating that resource production can sustain resource consumption at all difficulty levels.

## How to Use

### Run Balance Validation

```bash
node validateBalance.js
```

Expected output:
```
============================================================
MEDIEVAL VILLAGE CHRONICLE - BALANCE VALIDATION
============================================================

农奴 (简单):   Winnable: ✓ YES
骑士 (普通):   Winnable: ✓ YES  
领主 (困难):   Winnable: ✓ YES
============================================================
```

### Understanding the Results

Each difficulty shows:
- **Winnable**: Whether the game is mathematically possible to win
- **Starting Pop**: Initial population
- **Min Pop Needed**: Minimum population needed to survive
- **Sustainable Pop**: Maximum population that can be sustained long-term
- **Min Farmers/Woodcutters**: Minimum workers needed for each resource
- **Resource Balance**: Production vs consumption ratios

### Key Metrics

**Food Balance** = Farmer Production per Week ÷ Person Consumption per Week
- Should be > 1.0 for sustainability
- Easy: 2.74x (excellent)
- Normal: 1.83x (good)
- Hard: 1.37x (tight but viable)

**Wood Balance** = Woodcutter Production ÷ Average Winter Consumption
- Should be > 1.0 to survive winter
- All difficulties: 7.6x - 17.1x (safe)

## What Changed

### Hard Difficulty Balance Fix

**Before (UNWINNABLE):**
```typescript
productionMultiplier: 0.8
startingResources: { food: 200, wood: 30, ... }
Result: 10 sustainable pop vs 15 starting = DEATH SPIRAL ❌
```

**After (WINNABLE):**
```typescript
productionMultiplier: 0.9
startingResources: { food: 300, wood: 50, ... }
Result: 12 sustainable pop vs 15 starting = VIABLE ✅
```

## Files Structure

```
/utils/balanceCalculator.ts      # Main balance analysis module
/utils/balanceCalculator.test.ts # Test suite
/validateBalance.js              # Standalone validation script
/balanceCheck.ts                 # Development helper
/BALANCE_ANALYSIS.md            # Detailed analysis document
/BALANCE_QUICK_START.md         # This file
```

## Mathematical Model

### Population Sustainability

```
Sustainable_Population = Total_Food_Production / Food_Consumption_Per_Person

Where:
  Total_Food_Production = Farmers × Base_Production × Season_Multiplier × Difficulty_Multiplier
  Food_Consumption_Per_Person = (Adult_Rate × 0.8 + Child_Rate × 0.2) × Difficulty_Consumption_Rate
```

### Starting Job Distribution

The game automatically assigns jobs to initial population:
- 60% Farmers (primary food production)
- 15% Woodcutters (winter survival)
- 10% Miners (buildings/gold)
- 15% Unemployed/Guards/Others

This distribution is accounted for in the balance calculator.

## Validation Criteria

A difficulty is considered **WINNABLE** if:

1. **Sustainable Population ≥ 80% of Starting Population**
   - Allows for some population loss while still being viable

2. **Starting Food Budget ≥ -100**
   - One week deficit is acceptable since production starts immediately

3. **Minimum Workers Needed < 70% of Population**
   - Leaves room for children, guards, scholars

## Common Issues

### "Game may be extremely difficult or impossible to win"
- Sustainable population is too low
- Increase production multiplier or starting resources

### "Starting food is very tight"
- Food buffer for first week is negative
- Normal for Hard difficulty - farmers must produce from week 1

### "May need more wood for first winter"
- Starting wood may not cover full winter heating
- Players need to assign woodcutters early

## Extending the Balance Calculator

To add new validations:

```typescript
// In utils/balanceCalculator.ts

export function validateNewFeature(difficulty: Difficulty) {
  const settings = DIFFICULTY_SETTINGS[difficulty];
  
  // Your validation logic here
  
  return {
    isBalanced: boolean,
    warnings: string[],
    recommendations: string[]
  };
}
```

## Testing

Run the test suite (if test infrastructure exists):
```bash
npm test -- balanceCalculator.test.ts
```

## Troubleshooting

**Q: Balance validation shows all difficulties as unwinnable**
A: Check that constants.ts has the updated values (Hard: food=300, prodMult=0.9)

**Q: How do I adjust difficulty without breaking balance?**
A: 
1. Make the change
2. Run `node validateBalance.js`
3. Adjust until all show "Winnable: ✓ YES"

**Q: Can I make Hard even harder?**
A: Yes, but ensure sustainable population ≥ 12 (80% of 15)

## Credits

Balance calculator created to ensure "矩阵有解" (matrix has solution) - i.e., the game's resource equations are solvable at all difficulty levels.
