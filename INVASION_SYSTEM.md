# Invasion and Raid System

## Overview
The game now features a dynamic invasion and raid system that challenges players to maintain adequate military defenses. Failing to protect your village can result in devastating consequences, including complete destruction.

## Military Defense Mechanics

### Guard Requirements
- Guards are essential for village security
- Different population sizes attract different threats
- Military events check if you have enough guards to defend

### Invasion Events
The system includes 4 types of military threats:

1. **Small Bandit Raid** (Small villages, <15 pop)
   - Required Guards: Max(2, 10% of population)
   - Success: Gain gold from defeated bandits
   - Failure: Lose food, wood, gold, and 2 villagers

2. **Brigand Attack** (Medium villages, <30 pop)
   - Required Guards: Max(3, 15% of population)
   - Success: Repel attack, gain gold
   - Failure: Heavy losses in resources and 3 villagers

3. **Small-Scale Invasion** (Large villages, <50 pop)
   - Required Guards: Max(4, 20% of population)
   - Success: Defeat invaders, capture loot
   - Failure: Severe resource losses and 5 villagers die

4. **Large-Scale Raid** (Large villages, 50+ pop)
   - Required Guards: Max(5, 25% of population)
   - Success: Great victory, morale boost
   - Failure: Catastrophic losses, 8 villagers die

### Event Frequency
- Military events occur every 15 weeks (~3.5 months)
- Only triggered when population > 5
- Threat level scales with village size

## Destruction Mechanics

### Instant Destruction Conditions
If your village fails to defend against an invasion AND one of these is true:
- The invasion would kill all remaining villagers
- You have ZERO guards (completely undefended)

The game immediately ends with a "灭亡" (Destruction) ending.

### Critical Military Failure
When military defense fails catastrophically:
- Game triggers ending sequence
- AI generates a custom destruction reason
- Ending type: "灭亡" (Destruction)
- Ending reason: "军事不足" (Military Insufficiency)

## Ending Types

### 1. Victory (胜利)
- Achieve by surviving 10 years
- AI generates a triumph summary based on your achievements
- Displays total invasions repelled and raids survived

### 2. Destruction (灭亡)
**Military Failure**
- Triggered by insufficient guards during invasion
- Village is completely destroyed
- AI creates a dramatic narrative of the fall

**Population Extinction**
- All villagers die from various causes
- Different narrative from military defeat
- Emphasizes tragedy of slow decline

### 3. Survival (生存)
- Ended early but village still has survivors
- Reflects a harsh but continuing struggle

## AI-Generated Endings

All endings now include AI-generated summaries that:
- Reflect your specific game statistics
- Create unique, interesting narratives
- Incorporate ending type and reason
- Consider:
  - Years survived
  - Final population
  - Peak population
  - Deaths and births
  - Invasions repelled
  - Raids survived
  - Game difficulty

## Statistics Tracking

New military statistics added:
- `invasionsRepelled`: Successfully defended invasions
- `raidsSurvived`: Survived raids (even with losses)

These appear on the ending screen if you've faced any military challenges.

## Strategy Tips

1. **Maintain Guards**: Always keep enough guards relative to population
2. **Build Defenses**: Walls and watchtowers increase guard efficiency
3. **Research Archery**: Improves guard coverage per person
4. **Monitor Population**: Larger populations attract bigger threats
5. **Don't Neglect Military**: Economic growth without defense = destruction

## Implementation Details

### Key Files Modified
- `types.ts`: Added ending summary fields and military stats
- `services/geminiService.ts`: Military event templates and AI ending generator
- `server/index.js`: New `/api/generate-ending` endpoint
- `App.tsx`: Invasion logic, ending generation, and display

### Backend API
New endpoint: `POST /api/generate-ending`
- Accepts: game state, ending type, ending reason
- Returns: AI-generated ending summary
- Falls back to template if AI unavailable
