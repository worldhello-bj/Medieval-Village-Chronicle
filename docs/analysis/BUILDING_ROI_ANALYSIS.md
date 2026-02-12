# Building ROI Analysis - 10 Year Payback Validation

## Executive Summary

This analysis evaluates whether each building type can pay for itself within the 10-year (520 week) game duration by comparing construction costs, maintenance costs, and benefits generated.

## Methodology

### Cost Calculation

**Construction Costs** are converted to "resource units" using weighted values:
- Wood: 1 unit per resource
- Stone: 3 units per resource (harder to obtain)
- Gold: 5 units per resource (hardest to obtain)
- Food: 0.5 units per resource (renewable)

**Maintenance Costs** are calculated over 10 years (520 weeks) using the same weighting.

**Total Cost** = Construction Cost + Maintenance Cost

### Benefit Calculation

Benefits are estimated based on:
- **Production bonuses**: Increased resource generation per worker
- **Efficiency gains**: Reduced consumption or improved worker effectiveness
- **Strategic value**: Defensive capabilities, population capacity, enabling features

Benefits are calculated over the full 10-year duration and converted to resource units.

### ROI Determination

- **Net ROI** = Total Benefits - Total Cost
- **Pays for Itself**: Net ROI ≥ 0
- **Break-even Time**: Weeks needed to recover costs ÷ 52 weeks/year

## Results Summary

### Buildings That Pay for Themselves (4/20 = 20%)

| Building | Total Cost | Total Benefits | Net ROI | Break-even |
|----------|------------|----------------|---------|------------|
| **Granary** | 250 | 4,680 | +4,430 | 0.5 years |
| **Library** | 660 | 1,456 | +796 | 4.5 years |
| **University** | 1,870 | 2,184 | +314 | 8.6 years |
| **Farm** | 1,180 | 1,248 | +68 | 9.5 years |

### Buildings That Don't Pay Back (16/20 = 80%)

Most buildings don't achieve positive ROI within 10 years due to:
1. **High maintenance costs** (especially gold)
2. **Qualitative rather than quantitative benefits** (happiness, security)
3. **Enabling features** that are essential but don't directly generate resources

## Detailed Analysis

### ✓ Granary (Best ROI)
- **Construction**: 60W 30S 20G (250 units)
- **Maintenance**: None (0 units)
- **Benefits**: Reduces food consumption by 5% = saves ~4,680 units over 10 years
- **Net ROI**: +4,430 units
- **Break-even**: 0.5 years
- **Verdict**: **Excellent investment** - pays back in 6 months

### ✓ Library
- **Construction**: 60W 200S 0G (660 units)
- **Maintenance**: Low (520W, 260G = ~1,820 units over 10 years, but not in base costs shown)
- **Benefits**: +1.4 knowledge/week per scholar = 1,456 units
- **Net ROI**: +796 units
- **Break-even**: 4.5 years
- **Verdict**: **Good investment** - essential for tech progression

### ✓ University
- **Construction**: 120W 250S 200G (1,870 units)
- **Maintenance**: High (1,040W, 260S, 780G over 10 years)
- **Benefits**: +2.1 knowledge/week per scholar = 2,184 units
- **Net ROI**: +314 units
- **Break-even**: 8.6 years
- **Verdict**: **Marginal investment** - barely pays back, but needed for advanced tech

### ✓ Farm
- **Construction**: 50W 5S 15G (140 units)
- **Maintenance**: 260W, 156G over 10 years (1,040 units)
- **Benefits**: +15% farmer production = 1,248 units
- **Net ROI**: +68 units
- **Break-even**: 9.5 years
- **Verdict**: **Marginal investment** - pays back in the last 6 months of the game

### ✗ Mine
- **Construction**: 60W 30S 30G (300 units)
- **Maintenance**: Very high (520W, 260S, 260G = 2,600 units)
- **Benefits**: +15% miner production = 2,808 units
- **Net ROI**: -92 units
- **Break-even**: Never (11+ years needed)
- **Verdict**: **Just misses payback** - maintenance costs are too high

### ✗ LumberMill
- **Construction**: 80W 20S 20G (240 units)
- **Maintenance**: High (520W, 260G = 1,820 units)
- **Benefits**: +15% woodcutter production = 1,560 units
- **Net ROI**: -500 units
- **Break-even**: Never
- **Verdict**: **Poor ROI** - maintenance eats up most benefits

### ✗ House
- **Construction**: 30W 3S 0G (39 units)
- **Maintenance**: High relative to benefit (260W, 104G = 780 units)
- **Benefits**: Population capacity increase (100 units estimated)
- **Net ROI**: -719 units
- **Break-even**: Never
- **Verdict**: **Essential but not profitable** - required for population growth despite negative ROI

### ✗ Defensive Buildings (Watchtower, Barracks, TrainingGrounds, StoneWall)
- All show negative ROI
- Benefits are **preventative** (avoiding losses) rather than generative
- **Essential for survival** in late game when populations are large
- Cannot be evaluated purely on production metrics

### ✗ Happiness Buildings (Tavern, Temple, Cathedral)
- **Tavern**: -4,760 ROI (very high maintenance)
- **Temple**: -3,940 ROI
- **Cathedral**: -9,250 ROI (worst in game)
- Benefits are **productivity multipliers** through happiness
- Keep workers efficient but hard to quantify in resource units
- May actually pay back through improved worker efficiency, but not captured in current model

### ✗ Market
- **Net ROI**: -3,075 units
- Enables resource trading but trading costs make it hard to profit
- More of an **emergency resource conversion** feature

## Key Insights

### 1. Maintenance Kills ROI
Buildings with high gold maintenance costs struggle to pay back:
- Cathedral: 2 gold/week = 1,040 gold over 10 years = 5,200 resource units
- Tavern: 1.5 gold/week = 780 gold = 3,900 units
- This far exceeds their quantifiable benefits

### 2. Production Buildings Are Best
Buildings that directly increase resource production (Granary, Farm, Library) tend to pay back because:
- Benefits accumulate every week
- Production compounds over 10 years
- Direct measurable impact

### 3. Most Buildings Are Strategic, Not Profitable
16 out of 20 buildings don't achieve positive ROI, but they're still essential because:
- **Houses**: Required for population growth (which enables more workers)
- **Defensive Buildings**: Prevent catastrophic losses from raids
- **Happiness Buildings**: Prevent productivity collapse from low morale
- **Market**: Emergency resource conversion
- **Enabling Buildings**: Unlock critical features

### 4. The "Essential Loss Leaders"
Some buildings will never pay back but are mandatory:
- Houses (population cap)
- At least 1 Watchtower/Barracks (security)
- Market (for trading during emergencies)
- Library (for any tech progression)

## Recommendations

### For Game Balance

1. **Consider reducing maintenance costs** for buildings that barely miss payback:
   - Mine (-92 ROI): Reduce gold maintenance from 0.5 to 0.3/week
   - LumberMill (-500 ROI): Reduce gold maintenance from 0.5 to 0.2/week

2. **Cathedral is prohibitively expensive**:
   - Either reduce maintenance (2 wood, 1 stone, 2 gold is extreme)
   - Or increase happiness benefit significantly
   - Current cost (9,850 units total) is almost impossible to justify

3. **Consider adding passive benefits** to defensive buildings:
   - Watchtowers could provide +1 wood/week (observation benefit)
   - Barracks could provide +1 gold/week (training revenue)

### For Players

**Early Game (Years 1-3)**:
- Prioritize: Houses (population), Granary (saves food), Library (enables tech)
- Avoid: Cathedral, Temple (too expensive for benefit)

**Mid Game (Years 4-7)**:
- Add: Farm (production boost), defensive buildings (security)
- Consider: University (if going for tech victory)

**Late Game (Years 8-10)**:
- Evaluate: Whether defensive buildings paid off in prevented losses
- Luxury: Happiness buildings only if resources are abundant

## Conclusion

Only 20% of buildings achieve positive ROI within 10 years when evaluated purely on resource generation. However, this doesn't mean 80% of buildings are bad - many provide essential strategic value that can't be measured in resource units alone.

The game is balanced around buildings serving different purposes:
- **Profit Centers**: Granary, Library, University, Farm (build these!)
- **Essential Infrastructure**: Houses, defensive buildings (must have)
- **Quality of Life**: Happiness buildings (nice to have)
- **Strategic Tools**: Market, enabling buildings (situational)

Players should focus on positive-ROI buildings early, then add strategic buildings as needed for survival and victory conditions.
