# 防御建筑修复文档 - Defensive Buildings Fix

## 问题描述 (Problem Description)

在修复前，游戏中的防御性建筑（城墙、瞭望塔、军营、训练场等）对袭击事件的结果没有任何影响。这使得这些昂贵的建筑几乎毫无用处，玩家必须雇佣大量守卫才能防御袭击。

Before the fix, defensive buildings (walls, watchtowers, barracks, training grounds) had NO effect on raid/invasion event outcomes. This made these expensive buildings nearly useless, forcing players to hire many guards to defend against raids.

## 技术分析 (Technical Analysis)

### 旧代码 (Old Code)
```typescript
// Line 535 in App.tsx
const canDefend = guards >= requiredDefenders;
```

这个简单的比较只检查守卫数量，完全忽略了所有防御建筑的加成。

This simple comparison only checked guard count, completely ignoring all defensive building bonuses.

### 防御建筑加成 (Defensive Building Bonuses)

游戏中已经计算了以下加成（用于治安系统），但在袭击防御中被忽略：

The game already calculated these bonuses (for security system) but ignored them in raid defense:

- **城墙 (Walls)**: 每座城墙 +5 覆盖范围
- **瞭望塔 (Watchtowers)**: 每座瞭望塔 +3 覆盖范围  
- **军营 (Barracks)**: 每座军营 +2 覆盖范围
- **训练场 (Training Grounds)**: 每座训练场 +2 覆盖范围
- **马厩 (Stables)** (需要骑兵科技): 每座马厩 +3 覆盖范围
- **箭术科技 (Archery Tech)**: 基础覆盖 10 -> 15

这些加成在 `guardCoverage` 变量中计算（Line 494），但只用于治安系统，不用于袭击防御。

These bonuses were calculated in the `guardCoverage` variable (Line 494) but only used for the security system, not raid defense.

## 修复方案 (Solution)

### 新代码 (New Code)
```typescript
// Lines 533-538 in App.tsx
if (selectedEvent && selectedEvent.requiredGuards) {
  const requiredDefenders = selectedEvent.requiredGuards(totalPop);
  // Calculate effective defense strength using guardCoverage (includes defensive building bonuses)
  // Each guard's effectiveness is multiplied by guardCoverage
  const effectiveDefenseStrength = guards * guardCoverage;
  const requiredDefenseStrength = requiredDefenders * baseCoverage; // Base requirement
  const canDefend = effectiveDefenseStrength >= requiredDefenseStrength;
```

### 计算逻辑 (Calculation Logic)

**有效防御力 (Effective Defense Strength)**:
```
effectiveDefenseStrength = guards × guardCoverage

其中 guardCoverage = baseCoverage + wallBonus + watchtowerBonus + barracksBonus + trainingGroundsBonus + cavalryBonus
```

**需求防御力 (Required Defense Strength)**:
```
requiredDefenseStrength = requiredDefenders × baseCoverage
```

这样，防御建筑会成倍增加每个守卫的效力。

This way, defensive buildings multiply the effectiveness of each guard.

## 实际效果示例 (Practical Examples)

### 场景 1: 无防御建筑 (No Defensive Buildings)
- 人口: 20
- 守卫: 2
- 建筑: 无
- 袭击类型: 小股土匪（需要 2 守卫）

```
baseCoverage = 10
guardCoverage = 10
effectiveDefenseStrength = 2 × 10 = 20
requiredDefenseStrength = 2 × 10 = 20
结果: 20 >= 20 ✅ 成功防御
```

### 场景 2: 有防御建筑 (With Defensive Buildings)
- 人口: 20
- 守卫: 2
- 建筑: 2座城墙 + 1座瞭望塔
- 袭击类型: 流寇（需要 3 守卫）

```
baseCoverage = 10
wallBonus = 2 × 5 = 10
watchtowerBonus = 1 × 3 = 3
guardCoverage = 10 + 10 + 3 = 23

effectiveDefenseStrength = 2 × 23 = 46
requiredDefenseStrength = 3 × 10 = 30
结果: 46 >= 30 ✅ 成功防御
```

**原来**: 2个守卫 vs 需要3个 → ❌ 失败  
**现在**: 2个守卫 × 2.3倍效率 → ✅ 成功

### 场景 3: 强大防御 (Strong Defense)
- 人口: 50
- 守卫: 5
- 建筑: 3座城墙 + 2座瞭望塔 + 1座军营 + 箭术科技
- 袭击类型: 大规模劫掠（需要 13 守卫）

```
baseCoverage = 15 (箭术科技)
wallBonus = 3 × 5 = 15
watchtowerBonus = 2 × 3 = 6
barracksBonus = 1 × 2 = 2
guardCoverage = 15 + 15 + 6 + 2 = 38

effectiveDefenseStrength = 5 × 38 = 190
requiredDefenseStrength = 13 × 15 = 195
结果: 190 < 195 ❌ 失败（差一点！）
```

再建1座瞭望塔或训练场就能成功！

## 游戏平衡影响 (Game Balance Impact)

### 正面影响 (Positive Impact)
1. **防御建筑现在有价值**: 玩家有动力建造城墙和瞭望塔
2. **策略多样性**: 可以选择"少守卫+强建筑"或"多守卫+少建筑"
3. **科技树更有意义**: 箭术科技对防御的提升更明显
4. **资源投资回报**: 花费石料和木材建造防御建筑能看到实际效果

### 平衡性调整 (Balance Considerations)
- 防御建筑确实提升了村庄的防御能力，但仍需要基本的守卫数量
- 守卫数量为0时，防御建筑无效（0 × 任何数 = 0）
- 这鼓励了"守卫+建筑"的组合策略，而非单一依赖守卫

## 测试场景 (Test Scenarios)

建议测试以下场景：

1. **无守卫但有建筑**: 应该失败（0守卫无法防御）
2. **少量守卫+多建筑**: 应该能防御需要更多守卫的袭击
3. **多守卫+无建筑**: 仍需要大量守卫才能防御
4. **平衡配置**: 适量守卫+适量建筑能有效防御
5. **科技提升**: 箭术科技应该明显提升防御能力

## 相关代码位置 (Related Code Locations)

- **App.tsx Line 488-494**: guardCoverage 计算
- **App.tsx Line 533-538**: 袭击防御检查（已修复）
- **constants.ts Line 139-141**: 防御建筑常量
- **services/geminiService.ts Line 65-118**: 袭击事件模板

## 总结 (Summary)

这个修复让防御建筑发挥实际作用，使游戏更加合理和有趣。玩家现在可以通过建造防御设施来减少所需的守卫数量，这符合现实逻辑，也增加了游戏的策略深度。

This fix makes defensive buildings actually useful, making the game more reasonable and interesting. Players can now reduce required guard count by building defensive structures, which aligns with real-world logic and adds strategic depth to the game.
