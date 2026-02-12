
export enum Job {
  Unemployed = '无业游民',
  Farmer = '农夫',
  Woodcutter = '伐木工',
  Miner = '矿工',
  Guard = '守卫',
  Scholar = '学者',
  Child = '孩童' // New state for non-working population
}

export enum Activity {
  Idle = '闲逛',
  Working = '工作',
  Eating = '吃饭',
  Sleeping = '休息', // Changed from Sleeping to Resting as tick is now Day
  Socializing = '社交',
  Freezing = '受冻' // New activity state for winter without wood
}

export enum Season {
  Spring = '春',
  Summer = '夏',
  Autumn = '秋',
  Winter = '冬'
}

export enum Difficulty {
  Easy = 'Easy',
  Normal = 'Normal',
  Hard = 'Hard'
}

export enum GameStatus {
  Menu = 'MENU',
  Playing = 'PLAYING',
  Finished = 'FINISHED'
}

export enum FoodPriority {
  Equal = '平等分配',
  ChildrenFirst = '儿童优先',
  WorkersFirst = '工人优先',
  ElderlyLast = '老人最后'
}

export interface Villager {
  id: string;
  name: string;
  age: number;
  job: Job;
  happiness: number; // 0-100
  happinessBaseline: number; // 0-100, natural regression target (default 50, increased by wonders)
  health: number; // 0-100
  hunger: number; // 0-100 (100 is starving)
  energy: number; // 0-100 (Abstracted daily energy/stamina)
  currentActivity: Activity;
  bio?: string; // AI Generated Chronicle
  lastBioYear?: number; // Last year for which a bio entry was generated
}

export type BuildingType = 
  | 'House' 
  | 'Market' 
  | 'StoneWall' 
  | 'Library' 
  | 'Tavern' 
  | 'Cathedral' 
  | 'Farm' 
  | 'LumberMill' 
  | 'Mine' 
  | 'Watchtower' 
  | 'Granary' 
  | 'Blacksmith' 
  | 'Temple' 
  | 'University' 
  | 'Workshop' 
  | 'Barracks' 
  | 'Stables' 
  | 'Aqueduct' 
  | 'TrainingGrounds' 
  | 'Alchemist' 
  | 'Festival';

export interface Buildings {
  houses: number; // Increases population cap
  markets: number; // Allows festivals
  walls: number; // Increases guard efficiency
  libraries: number; // Increases scholar output
  taverns: number; // Increases happiness recovery
  cathedrals: number; // Increases passive happiness, massive stone sink
  farms: number; // Increases farmer efficiency
  lumberMills: number; // Increases woodcutter efficiency
  mines: number; // Increases miner efficiency
  watchtowers: number; // Increases guard coverage
  granaries: number; // Reduces food waste
  blacksmiths: number; // Boosts tool efficiency
  temples: number; // Religious building for morale
  universities: number; // Ultimate knowledge wonder
  workshops: number; // Boosts production efficiency
  barracks: number; // Improves guard training
  stables: number; // Enables cavalry
  aqueducts: number; // Improves health and farming
  trainingGrounds: number; // Boosts guard effectiveness
  alchemists: number; // Boosts knowledge production
}

export interface Tech {
  id: string;
  name: string;
  description: string;
  cost: number;
}

export interface GameEvent {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'danger' | 'success';
  deltaFood: number;
  deltaWood: number;
  deltaGold: number;
  deltaPop: number;
  source: 'ai' | 'fixed' | 'happiness';
  weight: number; // For weighted random selection
}

export interface GameStats {
  totalBirths: number;
  totalDeaths: number;
  peakPopulation: number;
  totalFoodProduced: number;
  totalGoldMined: number;
  festivalsHeld: number;
  starvationDays: number;
  invasionsRepelled: number;
  raidsSurvived: number;
}

export interface GameState {
  status: GameStatus;
  difficulty: Difficulty;
  tick: number; // Days passed
  season: Season;
  resources: {
    food: number;
    wood: number;
    stone: number;
    gold: number;
    knowledge: number;
  };
  buildings: Buildings;
  technologies: string[]; // List of unlocked tech IDs
  population: Villager[];
  logs: LogEntry[];
  paused: boolean;
  gameSpeed: number;
  history: { tick: number; pop: number; food: number }[];
  stats: GameStats;
  eventPool: GameEvent[]; // Pool of available events (mixed AI and fixed)
  foodPriority: FoodPriority; // Food distribution priority setting
  tradePriceModifiers?: { food: number; wood: number; stone: number }; // Dynamic price modifiers (1.0 = base price)
  endingSummary?: string; // AI-generated ending summary
  endingType?: string; // Type of ending achieved
  endingReason?: string; // Reason for the ending (e.g., '军事不足', '人口灭绝')
}

export interface LogEntry {
  id: string;
  tick: number;
  message: string;
  type: 'info' | 'warning' | 'danger' | 'success' | 'ai' | 'tech';
}

export type GameAction = 
  | { type: 'START_GAME'; difficulty: Difficulty }
  | { type: 'INIT_EVENT_POOL'; events: GameEvent[] }
  | { type: 'REPLENISH_EVENT_POOL'; events: GameEvent[] }
  | { type: 'TICK' }
  | { type: 'TOGGLE_PAUSE' }
  | { type: 'ASSIGN_JOB'; job: Job; amount: number }
  | { type: 'UPDATE_BIO'; id: string; bio: string; year?: number }
  | { type: 'TRIGGER_EVENT'; eventId: string }
  | { type: 'CONSTRUCT_BUILDING'; building: BuildingType }
  | { type: 'HOLD_FESTIVAL' }
  | { type: 'RESEARCH_TECH'; techId: string }
  | { type: 'TRADE_RESOURCE'; resource: 'food' | 'wood' | 'stone'; action: 'buy' | 'sell' }
  | { type: 'SET_FOOD_PRIORITY'; priority: FoodPriority }
  | { type: 'UPDATE_ENDING_SUMMARY'; summary: string }
  | { type: 'LOAD_STATE'; state: GameState }
  | { type: 'RESTART_GAME' };

export const INITIAL_POPULATION_SIZE = 20; // Start smaller to emphasize growth mechanics
