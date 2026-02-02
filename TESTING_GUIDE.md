# Testing the Invasion and Raid System

## Quick Start

### 1. Install and Run
```bash
# Install frontend dependencies
npm install

# Install backend dependencies (for AI features)
cd server && npm install && cd ..

# Run the game (frontend only)
npm run dev

# Run with AI features (in separate terminals)
npm run dev:backend  # Terminal 1
npm run dev          # Terminal 2
```

### 2. Enable AI-Generated Endings (Optional)
To get AI-generated ending summaries instead of fallback text:

1. Get a Gemini API key from https://ai.google.dev/
2. Create `server/.env.local` with:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```
3. Run the backend server: `npm run dev:backend`

## What to Test

### Test 1: Basic Invasion Event (15-30 minutes)
**Goal**: Experience an invasion event and successful defense

1. Start a new game on Normal difficulty
2. Assign 2-3 villagers as Guards immediately
3. Play the game for about 15 weeks (wait for tick % 15 === 0)
4. Watch for invasion event message
5. **Expected**: See success message and small rewards

### Test 2: Failed Defense → Destruction (15-20 minutes)
**Goal**: Trigger instant destruction from military failure

1. Start a new game on Normal difficulty
2. **DO NOT** assign any Guards (keep all as farmers/workers)
3. Play for 15+ weeks until invasion triggers
4. **Expected**: 
   - Invasion fails
   - Game immediately ends
   - Ending type shows "灭亡" (red)
   - Reason mentions military insufficiency

### Test 3: Population Growth and Scaling Threats (longer playthrough)
**Goal**: See how threats scale with population

1. Play a successful game
2. Grow population to different sizes
3. Observe invasion types:
   - Pop 10-14: Small bandit raids
   - Pop 15-29: Brigand attacks
   - Pop 30-49: Small invasions
   - Pop 50+: Large-scale raids
4. Maintain guards = 20-25% of population to defend successfully

### Test 4: Victory Ending (Complete 10 years)
**Goal**: See victory ending with statistics

1. Play a complete 10-year game
2. Successfully defend against invasions
3. **Expected**:
   - Game ends after 520 weeks
   - Shows "胜利" (green) ending type
   - Displays total invasions repelled/raids survived
   - Shows AI-generated summary (if backend running)

### Test 5: AI-Generated Summaries
**Goal**: Verify AI creates unique narratives

1. Ensure backend is running with valid API key
2. Complete game (victory or defeat)
3. **Expected**:
   - Ending summary should be unique and contextual
   - Should reference your specific stats (years, population, invasions)
   - Should differ between victory and defeat endings

## Key Indicators of Success

✅ **Invasions trigger every 15 weeks** when pop > 5
✅ **Guard requirements scale** with population size
✅ **Zero guards = high risk** of instant destruction
✅ **Success grants rewards**, failure causes losses
✅ **Stats track** invasionsRepelled and raidsSurvived
✅ **Ending screen shows** military statistics (when applicable)
✅ **AI summaries appear** (when backend configured)
✅ **Fallback endings work** when AI unavailable
✅ **Different ending types** display correctly (color-coded)

## Debug Tips

### Check Event Timing
Open browser console (F12) to see:
```
Triggering event: [event message] (source: fixed)
```

### Verify Military Logic
In console, you'll see when guards check happens (around tick % 15 === 0).

### AI Backend Status
Check console for:
- "AI Ending summary generated via backend API" = working
- "Backend API unavailable" = using fallback

### Common Issues

**Problem**: No invasions happening
- Solution: Make sure population > 5 and wait for tick divisible by 15

**Problem**: All invasions instantly destroy village
- Solution: Assign more guards (aim for 20-25% of population)

**Problem**: No AI summaries
- Solution: Ensure backend is running and GEMINI_API_KEY is set

**Problem**: Game too easy/hard
- Solution: Try different difficulty levels (Easy/Normal/Hard)

## What's New in the Ending Screen

When you complete or fail the game, you'll now see:

1. **Ending Type Badge**: 
   - 胜利 (Victory) - Green
   - 灭亡 (Destruction) - Red
   - 生存 (Survival) - Yellow

2. **AI-Generated Summary**: 
   - Unique narrative based on your playthrough
   - References specific stats and events
   - Different tone for victory vs defeat

3. **Military Statistics** (if applicable):
   - ⚔️ Invasions Repelled
   - 🛡️ Raids Survived

4. **All Original Stats**:
   - Population, deaths, births
   - Food produced, tech unlocked
   - Game difficulty

Enjoy defending your medieval village! 🏰⚔️
