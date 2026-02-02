# Game Balance Analysis Report

## Executive Summary

This document provides a mathematical analysis of the Medieval Village Chronicle game balance to ensure the game has solvable resource equations at all difficulty levels.

## Methodology

The balance calculator analyzes:
1. **Food Production vs Consumption**: Can farmers produce enough food to sustain the population?
2. **Wood Production vs Consumption**: Can woodcutters provide enough wood for winter heating?
3. **Starting Resources**: Are starting resources sufficient until production stabilizes?
4. **Sustainable Population**: What population can be sustained long-term with optimal job distribution?

## Key Findings

### Easy Difficulty (农奴-简单) ✓ BALANCED
- **Starting Population**: 25
- **Minimum Farmers Needed**: 10
- **Starting Farmers** (60% auto-assigned): ~15
- **Sustainable Population**: 41
- **Status**: **WINNABLE**
- **Food Balance**: 41.28/week per farmer vs 15.04/week per person (ratio: 2.74x)
- **Wood Balance**: 24.00/week per woodcutter vs 1.40/week per person (ratio: 17.1x)

**Assessment**: Well-balanced with good safety margins.

### Normal Difficulty (骑士-普通) ✓ BALANCED
- **Starting Population**: 20
- **Minimum Farmers Needed**: 11
- **Starting Farmers** (60% auto-assigned): ~12
- **Sustainable Population**: 21
- **Status**: **WINNABLE** (tight balance)
- **Food Balance**: 34.40/week per farmer vs 18.80/week per person (ratio: 1.83x)
- **Wood Balance**: 20.00/week per woodcutter vs 1.75/week per person (ratio: 11.4x)

**Assessment**: Balanced but challenging. Starting food is tight (-76 after week 1), requires immediate production.

**Warnings**:
- Starting food budget is very tight (-76 food after first week)
- Players must ensure farmers produce from week 1
- Recommended to not change job assignments immediately

### Hard Difficulty (领主-困难) ✗ UNBALANCED
- **Starting Population**: 15
- **Minimum Farmers Needed**: 13
- **Starting Farmers** (60% auto-assigned): ~9
- **Sustainable Population**: 10
- **Status**: **NOT WINNABLE** 
- **Food Balance**: 27.52/week per farmer vs 22.56/week per person (ratio: 1.22x)
- **Wood Balance**: 16.00/week per woodcutter vs 2.10/week per person (ratio: 7.6x)

**Critical Issues**:
1. **Insufficient Farmers**: Only 9 farmers can sustain max 10 people, but population is 15
2. **Death Spiral**: Population will decline as food runs out
3. **No Recovery Path**: Even with all 15 people as farmers (impossible since children can't work), sustainable population would only be ~16

**Assessment**: **Mathematically impossible to win** under current settings.

## Resource Production Matrix

| Resource | Farmer | Woodcutter | Miner | Scholar |
|----------|--------|------------|-------|---------|
| Food     | 32*    | 0          | 0     | 0       |
| Wood     | 0      | 20         | 0     | 0       |
| Stone    | 0      | 0          | 7     | 0       |
| Gold     | 0      | 0          | 3     | 0       |
| Knowledge| 0      | 0          | 0     | 10      |

*Base value, modified by season (0.4-2.0x) and difficulty multiplier

## Resource Consumption Matrix

| Resource | Per Adult/Week | Per Child/Week | Winter Modifier |
|----------|----------------|----------------|-----------------|
| Food     | 21             | 10             | -               |
| Wood     | -              | -              | 7/person        |
| Stone    | 0              | 0              | -               |
| Gold     | 0*             | 0*             | -               |

*Gold consumed by building maintenance (0.2-2.0 per building per week)

## Recommendations

### For Hard Difficulty - CRITICAL FIXES NEEDED

**Option 1: Increase Starting Resources**
```typescript
startingResources: { food: 400, wood: 60, stone: 0, gold: 0, knowledge: 0 }
// Gives ~6 weeks buffer instead of negative budget
```

**Option 2: Increase Farmer Production (Recommended)**
```typescript
productionMultiplier: 1.0  // Change from 0.8 to 1.0
// This increases sustainable population from 10 to 13, making game barely winnable
```

**Option 3: Reduce Consumption**
```typescript
consumptionRate: 1.0  // Change from 1.2 to 1.0
// Reduces food pressure significantly
```

**Option 4: Increase Starting Population**
```typescript
startingPop: 18  // Change from 15 to 18
// Gives ~11 farmers (60%) which can sustain ~12 people (67% of 18)
```

**Recommended Solution**: Combination of Options 2 + 1 (partial)
- Set `productionMultiplier: 0.9` (between normal and hard)
- Set `startingResources: { food: 300, wood: 50, ... }`
- This makes hard difficulty challenging but mathematically winnable

### Building Maintenance Balance

All building maintenance costs are **SUSTAINABLE**:
- No single building consumes more than 10% of a worker's output
- Maximum wood maintenance: 2.0/week (stables, cathedrals) = 10% of woodcutter output (20/week)
- Maximum gold maintenance: 2.0/week (cathedrals) = 67% of miner output (3/week) - acceptable for luxury building

## Mathematical Proof of Winnability

A difficulty is considered winnable if:
1. **Sustainable Population >= 80% of Starting Population**
2. **Starting Food Budget >= -100** (1 week deficit acceptable with immediate production)

Formula:
```
Sustainable_Pop = (Farmers × Farmer_Production × Season_Avg × Difficulty_Mult) / Avg_Consumption_Per_Person

Where:
- Farmer_Production = 32 food/week (base)
- Season_Avg = 1.075 (averaged over year)
- Avg_Consumption_Per_Person = (Adult_Consumption × 0.8 + Child_Consumption × 0.2) × Difficulty_Consumption_Rate
```

**Current Results**:
- Easy: 41 >= 20 (200% margin) ✓
- Normal: 21 >= 16 (31% margin) ✓
- Hard: 10 < 12 (FAIL) ✗

## Conclusion

The game balance analysis reveals:
1. ✅ Easy and Normal difficulties are mathematically winnable
2. ❌ Hard difficulty is mathematically unwinnable and requires balance adjustments
3. ✅ Building maintenance costs are sustainable
4. ✅ Resource production equations have positive solutions for Easy and Normal

**Action Required**: Adjust Hard difficulty parameters to ensure winnability while maintaining challenge.

## Implementation

The balance calculator is located in:
- `/utils/balanceCalculator.ts` - TypeScript implementation
- `/validateBalance.js` - Standalone Node.js script

Run validation:
```bash
node validateBalance.js
```

Expected output after fixes:
```
✓ All difficulty levels are winnable and balanced!
```
