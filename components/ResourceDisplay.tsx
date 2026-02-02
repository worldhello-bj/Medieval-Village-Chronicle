
import React from 'react';
import { GameState, Job } from '../types';
import { 
  GiWheat, 
  GiWoodPile, 
  GiStoneBlock, 
  GiCoins, 
  GiThreeFriends,
  GiScrollQuill,
  GiShield,
  GiHearts,
  GiFactory,
  GiCrossedSwords
} from 'react-icons/gi';
import { HOUSE_CAPACITY_BASE, HOUSE_CAPACITY_UPGRADED, GUARD_COVERAGE_BASE, GUARD_COVERAGE_UPGRADED, WALL_GUARD_BONUS } from '../constants';

interface ResourceDisplayProps {
  state: GameState;
}

const ResourceItem: React.FC<{ icon: React.ReactNode; value: string | number; label: string; color: string; subLabel?: string }> = ({ icon, value, label, color, subLabel }) => (
  <div className={`flex items-center space-x-2 bg-stone-800 px-3 py-2 rounded border border-stone-600 ${color} min-w-[100px]`}>
    <span className="text-xl">{icon}</span>
    <div className="flex flex-col w-full">
      <div className="flex justify-between items-center w-full">
          <span className="text-[10px] text-stone-400 uppercase tracking-widest">{label}</span>
          {subLabel && <span className="text-[10px] text-stone-500">{subLabel}</span>}
      </div>
      <span className="text-lg font-bold font-mono leading-none">{value}</span>
    </div>
  </div>
);

export const ResourceDisplay: React.FC<ResourceDisplayProps> = ({ state }) => {
  const hasMasonry = state.technologies.includes('masonry_1');
  const houseCapacity = hasMasonry ? HOUSE_CAPACITY_UPGRADED : HOUSE_CAPACITY_BASE;
  const maxPop = state.buildings.houses * houseCapacity;
  
  const hasArchery = state.technologies.includes('archery_1');
  const baseCoverage = hasArchery ? GUARD_COVERAGE_UPGRADED : GUARD_COVERAGE_BASE;
  const wallBonus = state.buildings.walls * WALL_GUARD_BONUS;
  const watchtowerBonus = state.buildings.watchtowers * 3;
  const barracksBonus = state.buildings.barracks * 2;
  const trainingGroundsBonus = state.buildings.trainingGrounds * 2;
  const cavalryBonus = state.technologies.includes('cavalry_1') ? (state.buildings.stables * 3) : 0;
  const guardCoverage = baseCoverage + wallBonus + watchtowerBonus + barracksBonus + trainingGroundsBonus + cavalryBonus;

  const guardCount = state.population.filter(p => p.job === Job.Guard).length;
  const totalPop = state.population.length;
  const requiredGuards = Math.max(1, Math.ceil(totalPop / guardCoverage));
  const isSecure = guardCount >= requiredGuards;
  
  // Calculate percentage based on coverage vs population
  // If pop is 0, security is 100%
  const securityPercent = totalPop === 0 ? 100 : Math.min(100, Math.floor((guardCount * guardCoverage / totalPop) * 100));

  // Calculate next invasion info
  // Invasions occur every 15 weeks when tick % 15 === 0
  const ticksUntilInvasion = totalPop > 5 ? ((15 - (state.tick % 15)) % 15) : 0;
  const weeksUntilInvasion = ticksUntilInvasion === 0 ? 15 : ticksUntilInvasion;
  const showInvasionWarning = totalPop > 5 && weeksUntilInvasion > 0;
  
  // Calculate threat level based on population
  let threatLevel = '';
  let minRequiredGuards = 0;
  let maxRequiredGuards = 0;
  
  if (totalPop < 15) {
    threatLevel = '低';
    minRequiredGuards = Math.max(2, Math.ceil(totalPop * 0.1));
    maxRequiredGuards = minRequiredGuards;
  } else if (totalPop < 30) {
    threatLevel = '中';
    minRequiredGuards = Math.max(2, Math.ceil(totalPop * 0.1));
    maxRequiredGuards = Math.max(3, Math.ceil(totalPop * 0.15));
  } else if (totalPop < 50) {
    threatLevel = '高';
    minRequiredGuards = Math.max(2, Math.ceil(totalPop * 0.1));
    maxRequiredGuards = Math.max(4, Math.ceil(totalPop * 0.2));
  } else {
    threatLevel = '极高';
    minRequiredGuards = Math.max(2, Math.ceil(totalPop * 0.1));
    maxRequiredGuards = Math.max(5, Math.ceil(totalPop * 0.25));
  }

  // Calculate average happiness
  const avgHappiness = totalPop > 0 
    ? Math.floor(state.population.reduce((acc, v) => acc + v.happiness, 0) / totalPop) 
    : 0;
  
  // Calculate productivity multiplier from average happiness (10%-200% range)
  const productivityPercent = Math.floor(10 + (avgHappiness / 100) * 190);

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex flex-wrap gap-2 md:gap-4 w-full justify-start">
        <ResourceItem 
          icon={<GiThreeFriends />} 
          value={state.population.length} 
          label="人口" 
          subLabel={`/ ${maxPop}`}
          color={state.population.length >= maxPop ? "text-red-400" : "text-sky-400"} 
        />
        <ResourceItem icon={<GiWheat />} value={Math.floor(state.resources.food)} label="食物" color="text-yellow-500" />
        <ResourceItem icon={<GiWoodPile />} value={Math.floor(state.resources.wood)} label="木材" color="text-amber-700" />
        <ResourceItem icon={<GiStoneBlock />} value={Math.floor(state.resources.stone)} label="石料" color="text-stone-400" />
        <ResourceItem icon={<GiCoins />} value={Math.floor(state.resources.gold)} label="黄金" color="text-yellow-300" />
        <ResourceItem icon={<GiScrollQuill />} value={Math.floor(state.resources.knowledge)} label="知识" color="text-blue-400" />
        <ResourceItem 
          icon={<GiShield />} 
          value={`${guardCount}/${requiredGuards}`}
          label="治安" 
          color={isSecure ? "text-emerald-400" : "text-red-500"} 
          subLabel={`${securityPercent}%`}
        />
        <ResourceItem 
          icon={<GiHearts />} 
          value={avgHappiness} 
          label="幸福度" 
          color={avgHappiness >= 70 ? "text-pink-400" : avgHappiness >= 40 ? "text-yellow-400" : "text-red-400"} 
        />
        <ResourceItem 
          icon={<GiFactory />} 
          value={`${productivityPercent}%`} 
          label="产能" 
          color={productivityPercent >= 100 ? "text-green-400" : productivityPercent >= 50 ? "text-yellow-400" : "text-red-400"} 
          subLabel="效率"
        />
      </div>
      
      {/* Invasion Warning */}
      {showInvasionWarning && totalPop > 5 && (
        <div className={`bg-stone-800 px-3 py-2 rounded border ${
          guardCount >= minRequiredGuards ? 'border-yellow-600' : 'border-red-600'
        } flex items-center gap-3`}>
          <GiCrossedSwords className={`text-2xl ${
            guardCount >= minRequiredGuards ? 'text-yellow-500' : 'text-red-500'
          }`} />
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <span className="text-xs text-stone-400 uppercase tracking-widest">下波袭击</span>
              <span className={`text-xs font-bold ${
                guardCount >= minRequiredGuards ? 'text-yellow-500' : 'text-red-500'
              }`}>
                {weeksUntilInvasion}周后
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-stone-300">
                威胁: <span className={`font-bold ${
                  threatLevel === '极高' ? 'text-red-400' :
                  threatLevel === '高' ? 'text-orange-400' :
                  threatLevel === '中' ? 'text-yellow-400' : 'text-green-400'
                }`}>{threatLevel}</span>
              </span>
              <span className="text-xs text-stone-400">|</span>
              <span className="text-sm text-stone-300">
                需守卫: <span className={`font-bold ${
                  guardCount >= minRequiredGuards ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {minRequiredGuards === maxRequiredGuards 
                    ? `${minRequiredGuards}` 
                    : `${minRequiredGuards}-${maxRequiredGuards}`}
                </span>
              </span>
              <span className="text-xs text-stone-400">|</span>
              <span className="text-sm text-stone-300">
                当前: <span className={`font-bold ${
                  guardCount >= minRequiredGuards ? 'text-emerald-400' : 'text-red-400'
                }`}>{guardCount}</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
