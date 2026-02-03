# TypeError 修复文档 - Job.Lumberjack 不存在

## 错误消息 (Error Message)

```
App.tsx:944  Uncaught TypeError: Cannot read properties of undefined (reading 'wood')
    at gameReducer (App.tsx:944:120)
    at updateReducerImpl (react-dom-client.development.js:8045:15)
    at updateReducer (react-dom-client.development.js:7968:14)
    at Object.useReducer (react-dom-client.development.js:26495:18)
    at exports.useReducer (react.development.js:1257:34)
    at App (App.tsx:1142:29)
```

## 错误分析 (Error Analysis)

### 根本原因 (Root Cause)

代码在 App.tsx 第949行尝试访问一个不存在的 Job 枚举值：

```typescript
// ❌ 错误代码
const baseWoodProduction = state.population.filter(p => p.job === Job.Lumberjack).length * JOB_INCOME.lumberjack.wood;
```

### 为什么会出错 (Why It Failed)

1. **枚举定义不匹配**: 在 `types.ts` 中，Job 枚举定义为：
   ```typescript
   export enum Job {
     Unemployed = '无业游民',
     Farmer = '农夫',
     Woodcutter = '伐木工',  // ← 正确的名称是 Woodcutter，不是 Lumberjack
     Miner = '矿工',
     Guard = '守卫',
     Scholar = '学者',
     Child = '孩童'
   }
   ```

2. **常量定义不匹配**: 在 `constants.ts` 中，JOB_INCOME 使用枚举作为键：
   ```typescript
   export const JOB_INCOME = {
     [Job.Unemployed]: { food: 0, wood: 0, stone: 0, gold: 0, knowledge: 0 },
     [Job.Child]: { food: 0, wood: 0, stone: 0, gold: 0, knowledge: 0 },
     [Job.Farmer]: { food: 0, wood: 0, stone: 0, gold: 0, knowledge: 0 }, 
     [Job.Woodcutter]: { food: 0, wood: 20, stone: 0, gold: 0, knowledge: 0 },  // ← 使用 Job.Woodcutter
     [Job.Miner]: { food: 0, wood: 0, stone: 7, gold: 3, knowledge: 0 },
     // ...
   };
   ```

3. **访问未定义的属性**: 
   - `Job.Lumberjack` 不存在 → `undefined`
   - `JOB_INCOME.lumberjack` 不存在 → `undefined`
   - `undefined.wood` → **TypeError**

## 修复方案 (Solution)

### 修改前 (Before)
```typescript
// App.tsx 第945-950行
// --- Dynamic Trade Pricing Based on Production Capacity ---
// Calculate price modifiers based on village's production capacity
// Production above threshold = lower prices (surplus), below threshold = higher prices (scarcity)
const baseFoodProduction = activeFarmers * FARMER_WEEKLY_BASE * foodMultiplier;
const baseWoodProduction = state.population.filter(p => p.job === Job.Lumberjack).length * JOB_INCOME.lumberjack.wood;
const baseStoneProduction = state.population.filter(p => p.job === Job.Miner).length * JOB_INCOME.miner.stone;
```

### 修改后 (After)
```typescript
// App.tsx 第945-950行
// --- Dynamic Trade Pricing Based on Production Capacity ---
// Calculate price modifiers based on village's production capacity
// Production above threshold = lower prices (surplus), below threshold = higher prices (scarcity)
const baseFoodProduction = activeFarmers * FARMER_WEEKLY_BASE * foodMultiplier;
const baseWoodProduction = state.population.filter(p => p.job === Job.Woodcutter).length * JOB_INCOME[Job.Woodcutter].wood;
const baseStoneProduction = state.population.filter(p => p.job === Job.Miner).length * JOB_INCOME[Job.Miner].stone;
```

### 关键变更 (Key Changes)

1. ✅ `Job.Lumberjack` → `Job.Woodcutter`
2. ✅ `JOB_INCOME.lumberjack` → `JOB_INCOME[Job.Woodcutter]`
3. ✅ `JOB_INCOME.miner` → `JOB_INCOME[Job.Miner]` (保持一致性)

## 影响范围 (Impact)

### 功能影响
这个错误影响了动态交易定价系统：

- **动态交易定价**: 游戏根据村庄的生产能力动态调整资源价格
- **木材价格**: 基于伐木工数量和产量计算
- **石料价格**: 基于矿工数量和产量计算

### 症状表现
- 游戏在尝试计算交易价格修正器时崩溃
- 玩家无法正常进行游戏
- 控制台显示 TypeError

## 测试验证 (Testing)

### 测试步骤
1. ✅ TypeScript 编译成功
2. ✅ 构建成功 (npm run build)
3. ✅ 启动游戏无错误
4. ✅ 分配伐木工和矿工
5. ✅ 动态价格计算正确
6. ✅ 游戏正常运行无崩溃

### 测试结果
```
构建输出:
vite v6.4.1 building for production...
✓ 682 modules transformed.
✓ built in 3.29s

游戏运行:
- 伐木工 (Woodcutter): 3人
- 矿工 (Miner): 2人
- 木材产量计算正确
- 石料产量计算正确
- 无控制台错误
```

## 预防措施 (Prevention)

### 建议
1. **使用枚举访问**: 总是使用枚举值访问对象属性，而不是字符串字面量
   ```typescript
   // ✅ 好的做法
   JOB_INCOME[Job.Woodcutter].wood
   
   // ❌ 避免
   JOB_INCOME.woodcutter.wood
   ```

2. **类型检查**: 启用严格的 TypeScript 检查可以在编译时发现这类问题

3. **代码审查**: 确保枚举名称在整个代码库中保持一致

## 相关文件 (Related Files)

- `types.ts` - Job 枚举定义
- `constants.ts` - JOB_INCOME 常量定义
- `App.tsx` - 游戏逻辑和动态定价计算

## 总结 (Summary)

这是一个简单的名称不匹配错误：
- 代码尝试使用 `Job.Lumberjack`（不存在）
- 正确的名称是 `Job.Woodcutter`（伐木工）
- 修复后游戏的动态交易定价系统正常工作
- 木材和石料的价格根据生产能力正确调整
