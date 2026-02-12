# Happiness Baseline Balance Changes

## Problem
The previous happiness baseline bonus system allowed unlimited stacking:
- **Cathedrals**: +5 per cathedral (unlimited)
- **Temples**: +2 per temple (unlimited)

This meant players could build many cathedrals/temples and reach a happiness baseline of 100, which was too powerful and eliminated the challenge of maintaining happiness.

## Solution
Implemented a balanced system with diminishing returns and caps:

### Cathedral Bonuses (Diminishing Returns)
- **First Cathedral**: +5 baseline
- **Second Cathedral**: +3 baseline
- **Third+ Cathedrals**: +1 each (capped at +4 total)

**Maximum from Cathedrals**: +12 (with 5+ cathedrals)

### Temple Bonuses (Diminishing Returns)
- **First Temple**: +2 baseline
- **Additional Temples**: +1 each (capped at +5 total)

**Maximum from Temples**: +7 (with 6+ temples)

### Total Cap
**Maximum Happiness Baseline**: 70 (50 base + 20 from buildings)

## Examples

### Example 1: Small Village
- 1 Cathedral, 1 Temple
- Cathedral bonus: +5
- Temple bonus: +2
- **Total baseline: 57**

### Example 2: Medium Village
- 2 Cathedrals, 3 Temples
- Cathedral bonus: +5 (first) +3 (second) = +8
- Temple bonus: +2 (first) +2 (additional) = +4
- **Total baseline: 62**

### Example 3: Large Village
- 3 Cathedrals, 5 Temples
- Cathedral bonus: +5 +3 +1 = +9
- Temple bonus: +2 +4 = +6
- **Total baseline: 65**

### Example 4: Maximum (Unrealistic)
- 5+ Cathedrals, 6+ Temples
- Cathedral bonus: +5 +3 +4 = +12
- Temple bonus: +2 +5 = +7
- Total would be +19, but **capped at +20**
- **Total baseline: 70**

## Benefits of This System

1. **Preserves Challenge**: Happiness baseline remains a valuable resource that can't be trivially maximized
2. **Meaningful Choices**: First cathedral/temple has the most impact, encouraging strategic building
3. **Diminishing Returns**: Additional buildings still provide value but with reduced impact
4. **Prevents Exploitation**: Can't reach 100 baseline by spamming buildings
5. **Realistic Cap**: 70 baseline is strong but still requires active happiness management

## Game Balance Impact

- **Early Game**: First cathedral/temple remains very valuable (+5/+2 is significant)
- **Mid Game**: Second cathedral/temple still worthwhile (+3/+1)
- **Late Game**: Additional buildings provide minor benefits but can't break the game
- **Challenge Maintained**: Players still need to manage happiness through festivals, good food distribution, and avoiding starvation

This change ensures that happiness baseline remains a valuable and strategic resource while preventing it from becoming overpowered through unlimited stacking.
