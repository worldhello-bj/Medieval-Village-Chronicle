
import React, { useState } from 'react';
import { GameState, Job } from '../types';
import { BUILDING_COSTS, TECH_TREE, TRADE_RATES, TRADE_AMOUNT } from '../constants';
import { GiHelp, GiHammerDrop, GiPartyFlags, GiHouse, GiScrollQuill, GiCheckMark, GiStoneWall, GiBookshelf, GiBeerStein, GiTrade, GiCoins, GiHolySymbol } from 'react-icons/gi';

interface GameControlsProps {
  state: GameState;
  onAssignJob: (job: Job, amount: number) => void;
  onConstruct: (building: keyof typeof BUILDING_COSTS) => void;
  onFestival: () => void;
  onResearch: (techId: string) => void;
  onTrade: (resource: 'food' | 'wood' | 'stone', action: 'buy' | 'sell') => void;
  onTogglePause: () => void;
}

export const GameControls: React.FC<GameControlsProps> = ({ state, onAssignJob, onConstruct, onFestival, onResearch, onTrade, onTogglePause }) => {
  const [showHelp, setShowHelp] = useState(false);
  const [tab, setTab] = useState<'jobs' | 'build' | 'tech' | 'trade'>('jobs');

  const unemployedCount = state.population.filter(v => v.job === Job.Unemployed).length;
  const jobs = Object.values(Job).filter(j => j !== Job.Unemployed && j !== Job.Child);

  // Helper to check resource availability
  const canAfford = (type: keyof typeof BUILDING_COSTS) => {
      const cost = BUILDING_COSTS[type];
      const affordable = state.resources.wood >= cost.wood && state.resources.stone >= cost.stone && state.resources.gold >= cost.gold;
      
      if (type === 'Festival') {
          return affordable && state.resources.food >= BUILDING_COSTS.Festival.food;
      }
      return affordable;
  };

  const hasMarket = state.buildings.markets > 0;

  return (
    <div className="bg-stone-800 rounded-lg border border-stone-600 p-4 h-full flex flex-col relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 pb-4 border-b border-stone-700">
        <h3 className="text-xl medieval-font text-stone-200">政令</h3>
        <div className="flex gap-2">
            <button
                onClick={() => setShowHelp(!showHelp)}
                className="w-8 h-8 flex items-center justify-center rounded bg-stone-700 hover:bg-stone-600 text-stone-300"
                title="游戏指南"
            >
                <GiHelp />
            </button>
            <button 
              onClick={onTogglePause}
              className={`px-4 py-1 rounded font-bold ${state.paused ? 'bg-amber-600 hover:bg-amber-500' : 'bg-stone-600 hover:bg-stone-500'} text-white transition-colors`}
            >
              {state.paused ? '▶' : '⏸'}
            </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex mb-4 gap-1">
          <button 
            onClick={() => setTab('jobs')}
            className={`flex-1 py-1 text-xs md:text-sm font-bold rounded ${tab === 'jobs' ? 'bg-amber-700 text-white' : 'bg-stone-700 text-stone-400 hover:bg-stone-600'}`}
          >
            工作
          </button>
          <button 
            onClick={() => setTab('build')}
            className={`flex-1 py-1 text-xs md:text-sm font-bold rounded ${tab === 'build' ? 'bg-amber-700 text-white' : 'bg-stone-700 text-stone-400 hover:bg-stone-600'}`}
          >
            建设
          </button>
          <button 
            onClick={() => setTab('tech')}
            className={`flex-1 py-1 text-xs md:text-sm font-bold rounded ${tab === 'tech' ? 'bg-amber-700 text-white' : 'bg-stone-700 text-stone-400 hover:bg-stone-600'}`}
          >
            科技
          </button>
          {hasMarket && (
             <button 
                onClick={() => setTab('trade')}
                className={`flex-1 py-1 text-xs md:text-sm font-bold rounded ${tab === 'trade' ? 'bg-amber-700 text-white' : 'bg-stone-700 text-stone-400 hover:bg-stone-600'}`}
             >
                交易
             </button>
          )}
      </div>

      {showHelp && (
          <div className="absolute inset-0 bg-stone-900/95 z-20 p-4 rounded-lg border border-stone-500 overflow-y-auto text-sm">
              <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold text-amber-500">领主指南</h4>
                  <button onClick={() => setShowHelp(false)} className="text-stone-400">✕</button>
              </div>
              <ul className="space-y-3 text-stone-300 list-disc pl-4">
                  <li><strong className="text-stone-100">冬季生存：</strong> <span className="text-blue-300">冬季</span>每天每人消耗1单位木材。如果没有木材，村民会冻死。</li>
                  <li><strong className="text-stone-100">石料紧缺：</strong> 石料现在非常稀缺。请通过<span className="text-stone-400">集市</span>购买或积攒。</li>
                  <li><strong className="text-stone-100">集市交易：</strong> 建造集市后可以买卖资源。</li>
                  <li><strong className="text-stone-100">大教堂：</strong> 终极建筑，消耗大量石料，但能极大提升幸福度。</li>
              </ul>
          </div>
      )}

      {/* Job Management Tab */}
      {tab === 'jobs' && (
        <>
            <div className="mb-4 bg-stone-900/50 p-3 rounded border border-stone-700">
                <div className="text-stone-400 text-sm">可用劳动力</div>
                <div className="text-2xl text-white font-mono">{unemployedCount}</div>
            </div>

            <div className="space-y-3 overflow-y-auto flex-1 custom-scrollbar pr-2">
                {jobs.map(job => {
                const count = state.population.filter(v => v.job === job).length;
                return (
                    <div key={job} className="flex items-center justify-between bg-stone-700/30 p-2 rounded">
                    <span className="text-stone-300">{job}</span>
                    <div className="flex items-center space-x-2">
                        <span className="text-stone-400 text-sm w-6 text-center">{count}</span>
                        <button 
                            onClick={() => onAssignJob(job, -1)}
                            className="w-8 h-8 rounded bg-stone-600 hover:bg-red-900/50 text-stone-200 flex items-center justify-center text-lg disabled:opacity-30"
                            disabled={count <= 0}
                        >-</button>
                        <button 
                            onClick={() => onAssignJob(job, 1)}
                            className="w-8 h-8 rounded bg-stone-600 hover:bg-emerald-900/50 text-stone-200 flex items-center justify-center text-lg disabled:opacity-30"
                            disabled={unemployedCount <= 0}
                        >+</button>
                    </div>
                    </div>
                );
                })}
            </div>
        </>
      )}

      {/* Construction Tab */}
      {tab === 'build' && (
          <div className="space-y-4 overflow-y-auto flex-1 custom-scrollbar pr-2">
              <div className="bg-stone-700/30 p-3 rounded border border-stone-600">
                  <div className="flex justify-between items-start mb-2">
                      <div className="font-bold text-stone-200 flex items-center gap-2"><GiHouse /> 民居</div>
                      <span className="text-xs text-stone-400">拥有: {state.buildings.houses}</span>
                  </div>
                  <div className="text-xs text-stone-400 mb-2">提供居住空间。</div>
                  <div className="text-xs text-amber-500 mb-3">木: {BUILDING_COSTS.House.wood} | 石: {BUILDING_COSTS.House.stone}</div>
                  <button 
                    onClick={() => onConstruct('House')}
                    disabled={!canAfford('House')}
                    className="w-full py-2 bg-stone-600 hover:bg-stone-500 disabled:opacity-30 disabled:hover:bg-stone-600 text-white rounded font-bold text-sm transition-colors"
                  >
                      建造
                  </button>
              </div>

              <div className="bg-stone-700/30 p-3 rounded border border-stone-600">
                  <div className="flex justify-between items-start mb-2">
                      <div className="font-bold text-stone-400 flex items-center gap-2"><GiStoneWall /> 石墙</div>
                      <span className="text-xs text-stone-400">拥有: {state.buildings.walls}</span>
                  </div>
                  <div className="text-xs text-stone-400 mb-2">坚固的防御。需要纯石料建造。</div>
                  <div className="text-xs text-amber-500 mb-3">石: {BUILDING_COSTS.StoneWall.stone}</div>
                  <button 
                    onClick={() => onConstruct('StoneWall')}
                    disabled={!canAfford('StoneWall')}
                    className="w-full py-2 bg-stone-600 hover:bg-stone-500 disabled:opacity-30 disabled:hover:bg-stone-600 text-white rounded font-bold text-sm transition-colors"
                  >
                      建造
                  </button>
              </div>

              <div className="bg-stone-700/30 p-3 rounded border border-stone-600">
                  <div className="flex justify-between items-start mb-2">
                      <div className="font-bold text-stone-200 flex items-center gap-2"><GiHammerDrop /> 集市</div>
                      <span className="text-xs text-stone-400">拥有: {state.buildings.markets}</span>
                  </div>
                  <div className="text-xs text-stone-400 mb-2">允许交易和举办庆典。</div>
                  <div className="text-xs text-amber-500 mb-3">木: {BUILDING_COSTS.Market.wood} | 石: {BUILDING_COSTS.Market.stone} | 金: {BUILDING_COSTS.Market.gold}</div>
                  <button 
                    onClick={() => onConstruct('Market')}
                    disabled={!canAfford('Market')}
                    className="w-full py-2 bg-stone-600 hover:bg-stone-500 disabled:opacity-30 disabled:hover:bg-stone-600 text-white rounded font-bold text-sm transition-colors"
                  >
                      建造
                  </button>
              </div>

              <div className="bg-stone-700/30 p-3 rounded border border-stone-600">
                  <div className="flex justify-between items-start mb-2">
                      <div className="font-bold text-blue-300 flex items-center gap-2"><GiBookshelf /> 图书馆</div>
                      <span className="text-xs text-stone-400">拥有: {state.buildings.libraries}</span>
                  </div>
                  <div className="text-xs text-stone-400 mb-2">知识的殿堂。提升学者效率。</div>
                  <div className="text-xs text-amber-500 mb-3">木: {BUILDING_COSTS.Library.wood} | 石: {BUILDING_COSTS.Library.stone}</div>
                  <button 
                    onClick={() => onConstruct('Library')}
                    disabled={!canAfford('Library')}
                    className="w-full py-2 bg-stone-600 hover:bg-stone-500 disabled:opacity-30 disabled:hover:bg-stone-600 text-white rounded font-bold text-sm transition-colors"
                  >
                      建造
                  </button>
              </div>

               <div className="bg-stone-700/30 p-3 rounded border border-stone-600">
                  <div className="flex justify-between items-start mb-2">
                      <div className="font-bold text-yellow-500 flex items-center gap-2"><GiBeerStein /> 酒馆</div>
                      <span className="text-xs text-stone-400">拥有: {state.buildings.taverns}</span>
                  </div>
                  <div className="text-xs text-stone-400 mb-2">提升幸福度恢复速度。</div>
                  <div className="text-xs text-amber-500 mb-3">木: {BUILDING_COSTS.Tavern.wood} | 石: {BUILDING_COSTS.Tavern.stone} | 金: {BUILDING_COSTS.Tavern.gold}</div>
                  <button 
                    onClick={() => onConstruct('Tavern')}
                    disabled={!canAfford('Tavern')}
                    className="w-full py-2 bg-stone-600 hover:bg-stone-500 disabled:opacity-30 disabled:hover:bg-stone-600 text-white rounded font-bold text-sm transition-colors"
                  >
                      建造
                  </button>
              </div>

              <div className="bg-stone-700/30 p-3 rounded border border-stone-600 border-l-4 border-l-purple-500">
                  <div className="flex justify-between items-start mb-2">
                      <div className="font-bold text-purple-300 flex items-center gap-2"><GiHolySymbol /> 大教堂</div>
                      <span className="text-xs text-stone-400">拥有: {state.buildings.cathedrals}</span>
                  </div>
                  <div className="text-xs text-stone-400 mb-2">宏伟的奇观。大幅提升幸福度。</div>
                  <div className="text-xs text-amber-500 mb-3">石: {BUILDING_COSTS.Cathedral.stone} | 金: {BUILDING_COSTS.Cathedral.gold}</div>
                  <button 
                    onClick={() => onConstruct('Cathedral')}
                    disabled={!canAfford('Cathedral')}
                    className="w-full py-2 bg-purple-900 hover:bg-purple-800 disabled:opacity-30 disabled:hover:bg-stone-600 text-white rounded font-bold text-sm transition-colors"
                  >
                      建造奇观
                  </button>
              </div>

              <div className="bg-stone-700/30 p-3 rounded border border-stone-600">
                  <div className="flex justify-between items-start mb-2">
                      <div className="font-bold text-pink-300 flex items-center gap-2"><GiPartyFlags /> 丰收庆典</div>
                  </div>
                  <div className="text-xs text-stone-400 mb-2">大幅提升幸福度。</div>
                  <div className="text-xs text-amber-500 mb-3">需要: 集市, 金: {BUILDING_COSTS.Festival.gold}, 食: {BUILDING_COSTS.Festival.food}</div>
                  <button 
                    onClick={onFestival}
                    disabled={!canAfford('Festival')}
                    className="w-full py-2 bg-pink-800 hover:bg-pink-700 disabled:opacity-30 disabled:hover:bg-stone-600 text-white rounded font-bold text-sm transition-colors"
                  >
                      举办!
                  </button>
              </div>
          </div>
      )}

      {/* Trade Tab */}
      {tab === 'trade' && hasMarket && (
        <div className="space-y-4 overflow-y-auto flex-1 custom-scrollbar pr-2">
            <div className="text-center text-xs text-stone-400 mb-2">
               <GiTrade className="inline text-lg text-amber-500 mr-2"/>
               集市汇率 (每 {TRADE_AMOUNT} 单位)
            </div>

            {/* Food Trade */}
            <div className="bg-stone-700/30 p-3 rounded border border-stone-600">
                <div className="flex justify-between text-sm font-bold text-yellow-500 mb-2">
                    <span>食物 (库存: {Math.floor(state.resources.food)})</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <button 
                        onClick={() => onTrade('food', 'buy')}
                        disabled={state.resources.gold < TRADE_RATES.food.buy}
                        className="py-2 bg-emerald-900/50 hover:bg-emerald-800 disabled:opacity-30 text-white rounded text-xs flex flex-col items-center"
                    >
                        <span>买入</span>
                        <span className="text-yellow-300 font-mono">-{TRADE_RATES.food.buy} 金</span>
                    </button>
                    <button 
                        onClick={() => onTrade('food', 'sell')}
                        disabled={state.resources.food < TRADE_AMOUNT}
                        className="py-2 bg-red-900/50 hover:bg-red-800 disabled:opacity-30 text-white rounded text-xs flex flex-col items-center"
                    >
                         <span>卖出</span>
                         <span className="text-yellow-300 font-mono">+{TRADE_RATES.food.sell} 金</span>
                    </button>
                </div>
            </div>

            {/* Wood Trade */}
            <div className="bg-stone-700/30 p-3 rounded border border-stone-600">
                <div className="flex justify-between text-sm font-bold text-amber-700 mb-2">
                    <span>木材 (库存: {Math.floor(state.resources.wood)})</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <button 
                        onClick={() => onTrade('wood', 'buy')}
                        disabled={state.resources.gold < TRADE_RATES.wood.buy}
                        className="py-2 bg-emerald-900/50 hover:bg-emerald-800 disabled:opacity-30 text-white rounded text-xs flex flex-col items-center"
                    >
                        <span>买入</span>
                        <span className="text-yellow-300 font-mono">-{TRADE_RATES.wood.buy} 金</span>
                    </button>
                    <button 
                        onClick={() => onTrade('wood', 'sell')}
                        disabled={state.resources.wood < TRADE_AMOUNT}
                        className="py-2 bg-red-900/50 hover:bg-red-800 disabled:opacity-30 text-white rounded text-xs flex flex-col items-center"
                    >
                         <span>卖出</span>
                         <span className="text-yellow-300 font-mono">+{TRADE_RATES.wood.sell} 金</span>
                    </button>
                </div>
            </div>

            {/* Stone Trade */}
            <div className="bg-stone-700/30 p-3 rounded border border-stone-600">
                <div className="flex justify-between text-sm font-bold text-stone-400 mb-2">
                    <span>石料 (库存: {Math.floor(state.resources.stone)})</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <button 
                        onClick={() => onTrade('stone', 'buy')}
                        disabled={state.resources.gold < TRADE_RATES.stone.buy}
                        className="py-2 bg-emerald-900/50 hover:bg-emerald-800 disabled:opacity-30 text-white rounded text-xs flex flex-col items-center"
                    >
                        <span>买入</span>
                        <span className="text-yellow-300 font-mono">-{TRADE_RATES.stone.buy} 金</span>
                    </button>
                    <button 
                        onClick={() => onTrade('stone', 'sell')}
                        disabled={state.resources.stone < TRADE_AMOUNT}
                        className="py-2 bg-red-900/50 hover:bg-red-800 disabled:opacity-30 text-white rounded text-xs flex flex-col items-center"
                    >
                         <span>卖出</span>
                         <span className="text-yellow-300 font-mono">+{TRADE_RATES.stone.sell} 金</span>
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Tech Tab */}
      {tab === 'tech' && (
          <div className="space-y-4 overflow-y-auto flex-1 custom-scrollbar pr-2">
              <div className="bg-stone-900/50 p-2 rounded border border-blue-900/30 mb-2">
                   <div className="text-blue-300 text-xs flex justify-between">
                       <span>现有知识:</span>
                       <span className="font-bold text-sm">{Math.floor(state.resources.knowledge)}</span>
                   </div>
              </div>
              
              {TECH_TREE.map(tech => {
                  const unlocked = state.technologies.includes(tech.id);
                  const canAfford = state.resources.knowledge >= tech.cost;

                  return (
                    <div key={tech.id} className={`p-3 rounded border ${unlocked ? 'bg-emerald-900/20 border-emerald-700' : 'bg-stone-700/30 border-stone-600'}`}>
                        <div className="flex justify-between items-start mb-1">
                            <div className="font-bold text-stone-200 flex items-center gap-2">
                                <GiScrollQuill className={unlocked ? 'text-emerald-400' : 'text-stone-400'} /> 
                                {tech.name}
                            </div>
                            {unlocked && <GiCheckMark className="text-emerald-500" />}
                        </div>
                        <div className="text-xs text-stone-400 mb-2 min-h-[32px]">{tech.description}</div>
                        
                        {!unlocked ? (
                            <button 
                                onClick={() => onResearch(tech.id)}
                                disabled={!canAfford}
                                className="w-full py-1 bg-blue-900 hover:bg-blue-800 disabled:opacity-30 disabled:hover:bg-blue-900 text-blue-100 rounded text-xs font-bold transition-colors flex justify-between px-3"
                            >
                                <span>研究</span>
                                <span>{tech.cost} 知识</span>
                            </button>
                        ) : (
                            <div className="text-xs text-emerald-500 font-bold text-center py-1">已掌握</div>
                        )}
                    </div>
                  );
              })}
          </div>
      )}
    </div>
  );
};
