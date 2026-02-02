
import { Job, Tech, Difficulty } from './types';

// Game Duration Settings
// Changed from Days to Weeks
export const WEEKS_PER_YEAR = 52;
export const MAX_YEARS = 10;
export const GAME_END_TICK = WEEKS_PER_YEAR * MAX_YEARS;

// Resource Limits
// Maximum safe food value to prevent unrealistic gameplay scenarios and potential display issues
// Food is stored as JavaScript 'number' type (64-bit float), NOT as integer
export const MAX_SAFE_FOOD = 999999; // Cap at a reasonable game balance limit

// Season Boundaries (Week of Year)
export const SEASON_BOUNDS = {
  SPRING_END: 13,
  SUMMER_END: 26,
  AUTUMN_END: 39,
  // Winter ends at 52
};

export const DIFFICULTY_SETTINGS = {
  [Difficulty.Easy]: {
    name: '农奴 (简单)',
    description: '资源丰富，消耗较低，适合休闲建设。',
    consumptionRate: 0.8,
    productionMultiplier: 1.2,
    startingResources: { food: 500, wood: 150, stone: 50, gold: 50, knowledge: 20 },
    startingPop: 25
  },
  [Difficulty.Normal]: {
    name: '骑士 (普通)',
    description: '标准的生存挑战。',
    consumptionRate: 1.0,
    productionMultiplier: 1.0,
    startingResources: { food: 300, wood: 100, stone: 30, gold: 30, knowledge: 0 },
    startingPop: 20
  },
  [Difficulty.Hard]: {
    name: '领主 (困难)',
    description: '严酷的寒冬，刁民难养，物资匮乏。',
    consumptionRate: 1.2,
    productionMultiplier: 0.9, // Increased from 0.8 to make game winnable
    startingResources: { food: 300, wood: 50, stone: 0, gold: 0, knowledge: 0 }, // Increased food and wood
    startingPop: 15
  }
};

// Scale: Per WEEK Per Person (Reduced for medieval realism)
export const JOB_INCOME = {
  [Job.Unemployed]: { food: 0, wood: 0, stone: 0, gold: 0, knowledge: 0 },
  [Job.Child]: { food: 0, wood: 0, stone: 0, gold: 0, knowledge: 0 },
  [Job.Farmer]: { food: 0, wood: 0, stone: 0, gold: 0, knowledge: 0 }, 
  [Job.Woodcutter]: { food: 0, wood: 20, stone: 0, gold: 0, knowledge: 0 }, // ~3 per day (reduced from 35)
  [Job.Miner]: { food: 0, wood: 0, stone: 7, gold: 3, knowledge: 0 }, // Stone remains, gold reduced from 7 to 3
  [Job.Guard]: { food: 0, wood: 0, stone: 0, gold: 0, knowledge: 0 },
  [Job.Scholar]: { food: 0, wood: 0, stone: 0, gold: 0, knowledge: 10 }, // Reduced from 21 to 10
};

export const CONSUMPTION = {
  food: 21, // Food per adult per WEEK (3 * 7)
  childFood: 10, // Food per child per WEEK (Lower consumption for < 16)
};

export const WINTER_WOOD_CONSUMPTION = 7; // Wood per person per WEEK in Winter (1 * 7)

// Base output per farmer per week (Adjusted to ensure 1 farmer can feed 1.5 people)
// 32 food/week ÷ 21 food/week per person = 1.52 ratio
export const FARMER_WEEKLY_BASE = 32; // ~4.5 per day 

export const BUILDING_COSTS = {
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
  // New Buildings
  Workshop: { wood: 70, stone: 40, gold: 50 },
  Barracks: { wood: 80, stone: 70, gold: 40 },
  Stables: { wood: 90, stone: 30, gold: 60 },
  Aqueduct: { wood: 50, stone: 150, gold: 80 },
  TrainingGrounds: { wood: 60, stone: 80, gold: 50 },
  Alchemist: { wood: 80, stone: 60, gold: 100 },
  Festival: { wood: 0, stone: 0, gold: 60, food: 120 } 
};

// Trade Rates (Resource amount per transaction)
export const TRADE_AMOUNT = 10;
export const TRADE_RATES = {
    food: { buy: 5, sell: 2 }, 
    wood: { buy: 10, sell: 4 },
    stone: { buy: 25, sell: 10 } 
};

// Building Maintenance Costs (per week)
export const BUILDING_MAINTENANCE = {
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

export const HOUSE_CAPACITY_BASE = 5;
export const HOUSE_CAPACITY_UPGRADED = 8;
export const GUARD_COVERAGE_BASE = 10;
export const GUARD_COVERAGE_UPGRADED = 15;
export const WALL_GUARD_BONUS = 5; 
export const LIBRARY_KNOWLEDGE_BONUS = 7; // Weekly bonus

export const TECH_TREE: Tech[] = [
    // Tier 1
    { id: 'tools_1', name: '铁制工具', description: '更锋利的工具。伐木工与矿工产量 +20%。', cost: 80 },
    { id: 'farming_1', name: '轮作技术', description: '改良耕种方式，农夫产量 +20%。', cost: 100 },
    // Tier 2
    { id: 'archery_1', name: '箭术训练', description: '守卫受过专业训练，单人治安覆盖人数从 10 提升至 15。', cost: 150 },
    { id: 'forestry_1', name: '林业管理', description: '科学砍伐，伐木工产量额外 +20%。', cost: 150 },
    { id: 'scribing_1', name: '抄写员', description: '优化知识记录，学者每周产出知识 +7。', cost: 180 },
    // Tier 3
    { id: 'medicine_1', name: '草药学', description: '改善医疗卫生。生病死亡率大幅降低，健康恢复速度翻倍。', cost: 250 },
    { id: 'irrigation_1', name: '灌溉渠', description: '建立水利设施。农夫产量额外 +20% (与轮作叠加)。', cost: 300 },
    { id: 'masonry_1', name: '石工建筑', description: '改良房屋结构。房屋人口容量从 5 提升至 8。', cost: 400 },
    // Tier 4 - Advanced Technologies
    { id: 'metallurgy_1', name: '冶金术', description: '精炼金属技术。矿工黄金产量 +30%。', cost: 500 },
    { id: 'engineering_1', name: '工程学', description: '建筑技术升级。建造和维护成本降低 10%。', cost: 550 },
    { id: 'preservation_1', name: '食物保存', description: '腌制与储藏技术。粮仓效率提升，食物消耗减少 10%。', cost: 600 },
    { id: 'cavalry_1', name: '骑兵训练', description: '组建骑兵部队。每个马厩提供 +3 守卫覆盖。', cost: 650 },
    // Tier 5 - Masterworks
    { id: 'alchemy_1', name: '炼金术', description: '神秘的知识。学者额外产出 +15 知识。', cost: 800 },
    { id: 'architecture_1', name: '建筑学', description: '宏伟建筑设计。建筑物效果提升 20%。', cost: 850 },
    { id: 'philosophy_1', name: '哲学', description: '思想启蒙。村民幸福度缓慢恢复速度提升。', cost: 900 },
    { id: 'advanced_farming', name: '高级农业', description: '先进耕作法。农夫产量额外 +30%。', cost: 950 },
];

export const NAMES_MALE = [
  "亚瑟", "伯纳德", "查理", "大卫", "爱德华", "弗雷德", "乔治", "亨利", "伊恩", "杰克", "凯文", "利奥", "马丁", "诺亚", "奥利弗", "彼得", "昆汀", "罗伯特", "史蒂夫", "托马斯", "乌瑞克", "维克多", "威廉"
];

export const NAMES_FEMALE = [
  "阿黛尔", "贝翠丝", "克拉拉", "黛安娜", "艾莉诺", "菲奥娜", "格蕾丝", "海伦", "伊莎贝尔", "珍妮", "凯特", "露西", "玛丽", "娜拉", "奥菲利亚", "佩妮", "奎妮", "露丝", "萨拉", "泰莎", "乌苏拉", "薇薇安", "温迪"
];

export const SURNAMES = [
  "铁匠", "磨坊", "贝克", "卡特", "费舍尔", "格洛弗", "海沃德", "史密斯", "泰勒", "沃德", "韦弗", "伍德", "里德", "库珀"
];
