# Building ROI Quick Reference

## 检查建筑十年中能否回本 (Building 10-Year Payback Check)

### ✅ Buildings That Pay Back (4/20)

```
🏆 GRANARY - Best Investment
   Cost: 250 units | Benefits: 4,680 units | ROI: +4,430
   Payback: 6 months ⭐⭐⭐⭐⭐

📚 LIBRARY - Good Investment  
   Cost: 660 units | Benefits: 1,456 units | ROI: +796
   Payback: 4.5 years ⭐⭐⭐⭐

🎓 UNIVERSITY - Marginal Investment
   Cost: 1,870 units | Benefits: 2,184 units | ROI: +314
   Payback: 8.6 years ⭐⭐⭐

🌾 FARM - Barely Profitable
   Cost: 1,180 units | Benefits: 1,248 units | ROI: +68
   Payback: 9.5 years ⭐⭐
```

### ❌ Buildings That Don't Pay Back (16/20)

**Near Misses** (close to breaking even):
- Mine: -92 ROI (needs 11+ years)
- Stone Wall: -50 ROI (defensive value)

**Moderate Losses**:
- LumberMill: -500 ROI (high maintenance)
- Workshop: -960 ROI
- Blacksmith: -1,810 ROI

**High Losses** (strategic buildings):
- House: -719 ROI (essential for population)
- Watchtower: -1,875 ROI (defensive)
- Aqueduct: -2,096 ROI
- Market: -3,075 ROI (enables trading)
- Alchemist: -3,308 ROI

**Very High Losses** (happiness buildings):
- Temple: -3,940 ROI
- Tavern: -4,760 ROI
- Cathedral: -9,250 ROI (worst in game!)

## Key Takeaways

1. **Only 20% of buildings are profitable** from a pure ROI perspective
2. **Granary is the best investment** - saves massive amounts of food
3. **Knowledge buildings pay back** if you focus on tech progression
4. **Most buildings serve strategic purposes** rather than generating profit
5. **Cathedral is extremely expensive** relative to its benefits

## Build Priority Guide

### Early Game (Years 1-3)
✅ BUILD: Granary, Library, Houses (as needed)
❌ AVOID: Cathedral, Temple, Tavern

### Mid Game (Years 4-7)
✅ BUILD: Farm, University (if going tech route), defensive buildings
⚠️ CONSIDER: Market (for emergencies)

### Late Game (Years 8-10)
✅ BUILD: Whatever is needed for survival/victory
💰 LUXURY: Happiness buildings only if resources abundant

## Running the Analysis

```bash
# Validate all buildings
node validateBuildingROI.js

# See detailed analysis
cat BUILDING_ROI_ANALYSIS.md
```

## Conclusion

Most buildings don't "pay for themselves" in pure resource terms, but they serve essential strategic purposes:
- **Houses**: Enable population growth
- **Defensive buildings**: Prevent catastrophic raid losses  
- **Happiness buildings**: Prevent productivity collapse
- **Market**: Emergency resource conversion

Focus on the 4 profitable buildings early, then add strategic buildings as survival demands.
