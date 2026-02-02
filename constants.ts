
import { Job, Tech, Difficulty } from './types';

// Game Duration Settings
// Changed from Days to Weeks
export const WEEKS_PER_YEAR = 52;
export const MAX_YEARS = 10;
export const GAME_END_TICK = WEEKS_PER_YEAR * MAX_YEARS;

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
    startingResources: { food: 2000, wood: 500, stone: 100, gold: 200, knowledge: 50 },
    startingPop: 25
  },
  [Difficulty.Normal]: {
    name: '骑士 (普通)',
    description: '标准的生存挑战。',
    consumptionRate: 1.0,
    productionMultiplier: 1.0,
    startingResources: { food: 1000, wood: 200, stone: 50, gold: 100, knowledge: 0 },
    startingPop: 20
  },
  [Difficulty.Hard]: {
    name: '领主 (困难)',
    description: '严酷的寒冬，刁民难养，物资匮乏。',
    consumptionRate: 1.2,
    productionMultiplier: 0.8,
    startingResources: { food: 600, wood: 50, stone: 0, gold: 0, knowledge: 0 },
    startingPop: 15
  }
};

// Scale: Per WEEK Per Person (Previously per day, so x7)
export const JOB_INCOME = {
  [Job.Unemployed]: { food: 0, wood: 0, stone: 0, gold: 0, knowledge: 0 },
  [Job.Child]: { food: 0, wood: 0, stone: 0, gold: 0, knowledge: 0 },
  [Job.Farmer]: { food: 0, wood: 0, stone: 0, gold: 0, knowledge: 0 }, 
  [Job.Woodcutter]: { food: 0, wood: 35, stone: 0, gold: 0, knowledge: 0 }, // 5 * 7
  [Job.Miner]: { food: 0, wood: 0, stone: 7, gold: 7, knowledge: 0 }, // 1 * 7
  [Job.Guard]: { food: 0, wood: 0, stone: 0, gold: 0, knowledge: 0 },
  [Job.Scholar]: { food: 0, wood: 0, stone: 0, gold: 0, knowledge: 21 }, // 3 * 7
};

export const CONSUMPTION = {
  food: 21, // Food per adult per WEEK (3 * 7)
  childFood: 10, // Food per child per WEEK (Lower consumption for < 16)
};

export const WINTER_WOOD_CONSUMPTION = 7; // Wood per person per WEEK in Winter (1 * 7)

// Base output per farmer per week (This remains the same as base, but applies every tick now)
export const FARMER_WEEKLY_BASE = 28; 

export const BUILDING_COSTS = {
  House: { wood: 50, stone: 5, gold: 0 }, 
  Market: { wood: 100, stone: 20, gold: 50 },
  StoneWall: { wood: 0, stone: 150, gold: 0 }, 
  Library: { wood: 100, stone: 300, gold: 0 }, 
  Tavern: { wood: 150, stone: 100, gold: 100 },
  Cathedral: { wood: 0, stone: 500, gold: 300 }, 
  Farm: { wood: 80, stone: 10, gold: 20 },
  LumberMill: { wood: 120, stone: 30, gold: 30 },
  Mine: { wood: 100, stone: 50, gold: 50 },
  Watchtower: { wood: 80, stone: 100, gold: 40 },
  Granary: { wood: 100, stone: 50, gold: 30 },
  Blacksmith: { wood: 100, stone: 80, gold: 100 },
  Temple: { wood: 150, stone: 200, gold: 150 },
  University: { wood: 200, stone: 400, gold: 300 },
  Festival: { wood: 0, stone: 0, gold: 100, food: 200 } 
};

// Trade Rates (Resource amount per transaction)
export const TRADE_AMOUNT = 10;
export const TRADE_RATES = {
    food: { buy: 5, sell: 2 }, 
    wood: { buy: 10, sell: 4 },
    stone: { buy: 25, sell: 10 } 
};

export const HOUSE_CAPACITY_BASE = 5;
export const HOUSE_CAPACITY_UPGRADED = 8;
export const GUARD_COVERAGE_BASE = 10;
export const GUARD_COVERAGE_UPGRADED = 15;
export const WALL_GUARD_BONUS = 5; 
export const LIBRARY_KNOWLEDGE_BONUS = 7; // Weekly bonus

export const TECH_TREE: Tech[] = [
    // Tier 1
    { id: 'tools_1', name: '铁制工具', description: '更锋利的工具。伐木工与矿工产量 +20%。', cost: 150 },
    { id: 'farming_1', name: '轮作技术', description: '改良耕种方式，农夫产量 +20%。', cost: 200 },
    // Tier 2
    { id: 'archery_1', name: '箭术训练', description: '守卫受过专业训练，单人治安覆盖人数从 10 提升至 15。', cost: 300 },
    { id: 'forestry_1', name: '林业管理', description: '科学砍伐，伐木工产量额外 +20%。', cost: 300 },
    { id: 'scribing_1', name: '抄写员', description: '优化知识记录，学者每周产出知识 +7。', cost: 350 },
    // Tier 3
    { id: 'medicine_1', name: '草药学', description: '改善医疗卫生。生病死亡率大幅降低，健康恢复速度翻倍。', cost: 500 },
    { id: 'irrigation_1', name: '灌溉渠', description: '建立水利设施。农夫产量额外 +20% (与轮作叠加)。', cost: 600 },
    { id: 'masonry_1', name: '石工建筑', description: '改良房屋结构。房屋人口容量从 5 提升至 8。', cost: 800 },
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
