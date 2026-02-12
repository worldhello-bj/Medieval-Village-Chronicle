
import React, { useState, useCallback } from 'react';
import { Job, Season, Difficulty, FoodPriority, GameStatus, BuildingType, GameState } from './types';
import { 
  BUILDING_COSTS, TECH_TREE, WEEKS_PER_YEAR, MAX_YEARS, GAME_END_TICK, DIFFICULTY_SETTINGS,
  TRADE_RATES, TRADE_AMOUNT, MAX_GAME_FOOD, TRADE_PRICE_THRESHOLDS, TRADE_PRICE_BASE_MODIFIER
} from './constants';
import { round2 } from './utils/mathUtils';
import { ResourceDisplay } from './components/ResourceDisplay';
import { VillagerList } from './components/VillagerList';
import { GameControls } from './components/GameControls';
import { EventLog } from './components/EventLog';
import { VillagerModal } from './components/VillagerModal';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { GiTrophyCup, GiSkullCrossedBones, GiBabyFace, GiWheat, GiCrown } from 'react-icons/gi';

// Hooks
import { useGameState } from './hooks/useGameState';
import { useGameLoop } from './hooks/useGameLoop';
import { useBioGeneration } from './hooks/useBioGeneration';
import { useGamePersistence } from './hooks/useGamePersistence';

// --- START SCREEN COMPONENT ---
const StartScreen: React.FC<{ onStart: (diff: Difficulty) => void }> = ({ onStart }) => (
    <div className="absolute inset-0 bg-[#1c1917] z-50 flex flex-col items-center justify-center p-4">
        <h1 className="text-5xl text-amber-500 medieval-font mb-2">中世纪村庄编年史</h1>
        <p className="text-stone-400 mb-8 font-mono">目标：在恶劣的环境中带领村庄存活 10 年</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
            {Object.entries(DIFFICULTY_SETTINGS).map(([key, setting]) => (
                <div key={key} className="bg-stone-800 border-2 border-stone-600 p-6 rounded-lg hover:border-amber-500 transition-colors cursor-pointer group"
                     onClick={() => onStart(key as Difficulty)}>
                    <h3 className="text-xl font-bold text-stone-200 mb-2 group-hover:text-amber-400">{setting.name}</h3>
                    <p className="text-sm text-stone-400 mb-4 h-10">{setting.description}</p>
                    <div className="text-xs text-stone-500 space-y-1 font-mono">
                        <div>初始人口: {setting.startingPop}</div>
                        <div>初始食物: {setting.startingResources.food}</div>
                        <div>消耗倍率: {setting.consumptionRate}x</div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// --- END SCREEN COMPONENT ---
const EndScreen: React.FC<{ state: GameState, onRestart: () => void }> = ({ state, onRestart }) => {
    // Score Calculation
    const { stats, resources, buildings, technologies, population, difficulty } = state;
    const avgHappiness = population.length > 0 ? round2(population.reduce((a, b) => a + b.happiness, 0) / population.length) : 0;
    
    let score = 0;
    score = round2(score + population.length * 100);
    score = round2(score + avgHappiness * 50);
    score = round2(score + technologies.length * 500);
    score = round2(score + (buildings.houses + buildings.markets + buildings.walls + buildings.libraries + buildings.taverns + buildings.cathedrals + buildings.farms + buildings.lumberMills + buildings.mines + buildings.watchtowers + buildings.granaries + buildings.blacksmiths + buildings.temples + buildings.universities) * 200);
    score = round2(score + resources.gold * 1);
    score = round2(score - stats.totalDeaths * 50);
    score = round2(score - stats.starvationDays * 10);
    
    // Difficulty Multiplier
    let diffMult = 1;
    if (difficulty === Difficulty.Easy) diffMult = 0.8;
    if (difficulty === Difficulty.Hard) diffMult = 1.5;
    
    const finalScore = round2(score * diffMult);
    
    let rank = 'F';
    if (finalScore > 5000) rank = 'D';
    if (finalScore > 10000) rank = 'C';
    if (finalScore > 20000) rank = 'B';
    if (finalScore > 35000) rank = 'A';
    if (finalScore > 50000) rank = 'S';

    const livedYears = Math.floor(state.tick / WEEKS_PER_YEAR);

    return (
        <div className="absolute inset-0 bg-[#1c1917]/95 z-50 flex flex-col items-center justify-center p-4 overflow-y-auto">
            <div className="max-w-3xl w-full bg-[#2a2620] border-4 border-[#5c5040] rounded-lg p-8 shadow-2xl">
                <div className="text-center mb-8">
                    <h2 className="text-4xl medieval-font text-amber-100 mb-2">编年史终章</h2>
                    {state.endingType && (
                        <div className={`text-2xl font-bold mb-3 ${
                            state.endingType.includes('隐藏') || ['完美统治', '钢铁意志', '速通大师', '苦难求生'].includes(state.endingType) ? 'text-purple-400 animate-pulse' :
                            ['繁荣盛世', '知识帝国', '军事霸权', '和平天堂', '经济奇迹', '文化巨人'].includes(state.endingType) ? 'text-yellow-400' :
                            state.endingType === '胜利' ? 'text-green-400' : 
                            state.endingType === '灭亡' ? 'text-red-400' : 'text-yellow-400'
                        }`}>
                            {['完美统治', '钢铁意志', '速通大师', '苦难求生'].includes(state.endingType) && '✨ '}
                            {state.endingType}
                            {['完美统治', '钢铁意志', '速通大师', '苦难求生'].includes(state.endingType) && ' ✨'}
                        </div>
                    )}
                    {state.endingSummary && (
                        <p className="text-stone-300 italic mb-4 leading-relaxed">
                            {state.endingSummary}
                        </p>
                    )}
                    <p className="text-stone-400">
                        {state.tick >= GAME_END_TICK ? '你成功带领村庄走过了整整十年。' : `村庄在第 ${livedYears + 1} 年覆灭了。`}
                    </p>
                </div>

                <div className="flex justify-center items-center gap-8 mb-8">
                    <div className="text-center">
                        <div className="text-sm text-stone-500 uppercase tracking-widest">最终评分</div>
                        <div className="text-5xl font-bold text-amber-500 medieval-font">{finalScore.toLocaleString()}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-sm text-stone-500 uppercase tracking-widest">评级</div>
                        <div className={`text-6xl font-bold medieval-font ${rank === 'S' || rank === 'A' ? 'text-yellow-400' : 'text-stone-300'}`}>{rank}</div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8 text-sm font-mono text-stone-300">
                    <div className="bg-stone-900/50 p-4 rounded flex justify-between">
                        <span><span className="inline mr-2 text-yellow-500"><GiCrown /></span>存活人口</span>
                        <span className="font-bold">{population.length} (峰值: {stats.peakPopulation})</span>
                    </div>
                    <div className="bg-stone-900/50 p-4 rounded flex justify-between">
                        <span><span className="inline mr-2 text-stone-500"><GiSkullCrossedBones /></span>死亡人数</span>
                        <span className="font-bold">{stats.totalDeaths}</span>
                    </div>
                    <div className="bg-stone-900/50 p-4 rounded flex justify-between">
                        <span><span className="inline mr-2 text-pink-400"><GiBabyFace /></span>新生人口</span>
                        <span className="font-bold">{stats.totalBirths}</span>
                    </div>
                    <div className="bg-stone-900/50 p-4 rounded flex justify-between">
                        <span><span className="inline mr-2 text-orange-400"><GiWheat /></span>生产食物</span>
                        <span className="font-bold">{stats.totalFoodProduced.toLocaleString()}</span>
                    </div>
                    <div className="bg-stone-900/50 p-4 rounded flex justify-between">
                        <span><span className="inline mr-2 text-blue-400"><GiTrophyCup /></span>解锁科技</span>
                        <span className="font-bold">{technologies.length} / {TECH_TREE.length}</span>
                    </div>
                    <div className="bg-stone-900/50 p-4 rounded flex justify-between">
                        <span>难度</span>
                        <span className="font-bold">{DIFFICULTY_SETTINGS[difficulty].name}</span>
                    </div>
                    {(stats.invasionsRepelled > 0 || stats.raidsSurvived > 0) && (
                        <>
                            <div className="bg-stone-900/50 p-4 rounded flex justify-between">
                                <span className="text-green-400">⚔️ 击退入侵</span>
                                <span className="font-bold">{stats.invasionsRepelled}</span>
                            </div>
                            <div className="bg-stone-900/50 p-4 rounded flex justify-between">
                                <span className="text-orange-400">🛡️ 幸存劫掠</span>
                                <span className="font-bold">{stats.raidsSurvived}</span>
                            </div>
                        </>
                    )}
                </div>

                {/* Special/Hidden Ending Achievement Display */}
                {state.endingType && ['完美统治', '钢铁意志', '速通大师', '苦难求生', '繁荣盛世', '知识帝国', '军事霸权', '和平天堂', '经济奇迹', '文化巨人'].includes(state.endingType) && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-purple-900/30 to-amber-900/30 border-2 border-amber-600/50 rounded-lg">
                        <div className="text-center text-amber-400 font-bold mb-2">
                            {['完美统治', '钢铁意志', '速通大师', '苦难求生'].includes(state.endingType) ? '🏆 隐藏结局达成！' : '⭐ 特殊结局达成！'}
                        </div>
                        <div className="text-sm text-stone-300 text-center">
                            {state.endingType === '完美统治' && '全方位的完美表现：高人口、高幸福、全科技、强军事、丰富资源'}
                            {state.endingType === '钢铁意志' && `经历${stats.starvationDays}天饥荒仍坚持到最后`}
                            {state.endingType === '速通大师' && '用最少的人口完成10年统治'}
                            {state.endingType === '苦难求生' && '在困难模式下克服重重困难'}
                            {state.endingType === '繁荣盛世' && `${population.length}人口、高幸福度、大量建筑`}
                            {state.endingType === '知识帝国' && `${technologies.length}项科技、${resources.knowledge}知识点`}
                            {state.endingType === '军事霸权' && `击退${stats.invasionsRepelled}次入侵、强大防御`}
                            {state.endingType === '和平天堂' && `仅${stats.totalDeaths}人死亡、极高幸福度`}
                            {state.endingType === '经济奇迹' && `黄金${resources.gold}、食物${resources.food}`}
                            {state.endingType === '文化巨人' && `${stats.festivalsHeld}次庆典、多座文化建筑`}
                        </div>
                    </div>
                )}

                <button 
                    onClick={onRestart}
                    className="w-full py-4 bg-amber-700 hover:bg-amber-600 text-white font-bold rounded text-lg transition-colors medieval-font"
                >
                    书写新的篇章
                </button>
            </div>
        </div>
    );
};

export default function App() {
  const [state, dispatch] = useGameState();
  const [selectedVillagerId, setSelectedVillagerId] = useState<string | null>(null);

  // Initialize hooks
  useGamePersistence(state, dispatch);
  useGameLoop(state, dispatch);
  useBioGeneration(state, dispatch);

  const selectedVillager = state.population.find(v => v.id === selectedVillagerId) || null;

  // Handlers
  const handleAssignJob = useCallback((job: Job, amount: number) => {
    dispatch({ type: 'ASSIGN_JOB', job, amount });
  }, [dispatch]);
  
  const handleConstruct = useCallback((building: BuildingType) => {
      dispatch({ type: 'CONSTRUCT_BUILDING', building });
  }, [dispatch]);

  const handleFestival = useCallback(() => {
      dispatch({ type: 'HOLD_FESTIVAL' });
  }, [dispatch]);

  const handleResearch = useCallback((techId: string) => {
      dispatch({ type: 'RESEARCH_TECH', techId });
  }, [dispatch]);

  const handleUpdateBio = useCallback((id: string, bio: string) => {
    dispatch({ type: 'UPDATE_BIO', id, bio });
  }, [dispatch]);

  const handleTrade = useCallback((resource: 'food' | 'wood' | 'stone', action: 'buy' | 'sell') => {
      dispatch({ type: 'TRADE_RESOURCE', resource, action });
  }, [dispatch]);
  
  const handleSetFoodPriority = useCallback((priority: FoodPriority) => {
      dispatch({ type: 'SET_FOOD_PRIORITY', priority });
  }, [dispatch]);

  const year = Math.floor(state.tick / WEEKS_PER_YEAR) + 1;
  const weekOfYear = state.tick % WEEKS_PER_YEAR;

  return (
    <div className="h-screen w-screen bg-[#1c1917] text-stone-200 flex flex-col font-sans selection:bg-amber-900 selection:text-white relative">
      
      {state.status === GameStatus.Menu && (
          <StartScreen onStart={(diff) => dispatch({ type: 'START_GAME', difficulty: diff })} />
      )}

      {state.status === GameStatus.Finished && (
          <EndScreen state={state} onRestart={() => dispatch({ type: 'RESTART_GAME' })} />
      )}

      <header className="bg-[#292524] border-b border-stone-700 p-4 shadow-lg">
        <div className="flex justify-between items-center mb-4">
           <div className="flex flex-col">
             <h1 className="text-3xl text-amber-100 medieval-font tracking-wider">中世纪村庄编年史</h1>
             <div className="text-stone-500 text-xs uppercase tracking-widest mt-1">Medieval Village Chronicle - {DIFFICULTY_SETTINGS[state.difficulty].name}</div>
           </div>
           <div className="text-right">
             <div className="text-2xl text-amber-500 font-mono font-bold">第 {year} 年 <span className="text-sm text-stone-500">/ 10</span></div>
             <div className="text-stone-400 font-mono text-sm">
               第 {weekOfYear} 周 | {state.season} {state.season === Season.Spring && '🌱'} {state.season === Season.Summer && '☀️'} {state.season === Season.Autumn && '🍂'} {state.season === Season.Winter && '❄️'}
             </div>
           </div>
        </div>
        <ResourceDisplay state={state} />
      </header>

      <main className="flex-1 p-4 overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-3 h-full min-h-0">
          <VillagerList 
            villagers={state.population} 
            onSelectVillager={(v) => setSelectedVillagerId(v.id)} 
          />
        </div>

        <div className="md:col-span-6 h-full min-h-0 flex flex-col gap-4">
           <div className="flex-1 bg-stone-800 rounded-lg border border-stone-600 p-4 min-h-0 flex flex-col">
              <h3 className="medieval-font text-stone-300 mb-2">人口与食物趋势</h3>
              <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={state.history}>
                    <defs>
                      <linearGradient id="colorPop" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorFood" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#eab308" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="tick" hide />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#292524', borderColor: '#57534e', color: '#e7e5e4' }}
                    />
                    <Area type="monotone" dataKey="pop" stroke="#38bdf8" fillOpacity={1} fill="url(#colorPop)" />
                    <Area type="monotone" dataKey="food" stroke="#eab308" fillOpacity={1} fill="url(#colorFood)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
           </div>

           <div className="h-64 min-h-0">
             <EventLog logs={state.logs} />
           </div>
        </div>

        <div className="md:col-span-3 h-full min-h-0">
           <GameControls 
             state={state} 
             onAssignJob={handleAssignJob} 
             onConstruct={handleConstruct}
             onFestival={handleFestival}
             onResearch={handleResearch}
             onTrade={handleTrade}
             onSetFoodPriority={handleSetFoodPriority}
             onTogglePause={() => dispatch({ type: 'TOGGLE_PAUSE' })} 
           />
        </div>
      </main>

      {selectedVillager && (
        <VillagerModal 
          villager={selectedVillager} 
          season={state.season}
          onClose={() => setSelectedVillagerId(null)}
          onUpdateBio={handleUpdateBio}
        />
      )}
    </div>
  );
}
