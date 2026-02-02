
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
  bio?: string; // AI Generated
}

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
}

export interface LogEntry {
  id: string;
  tick: number;
  message: string;
  type: 'info' | 'warning' | 'danger' | 'success' | 'ai' | 'tech';
}

export const INITIAL_POPULATION_SIZE = 20; // Start smaller to emphasize growth mechanics
