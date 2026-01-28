
import React from 'react';
import { GameState, Job } from '../types';
import { 
  GiWheat, 
  GiWoodPile, 
  GiStoneBlock, 
  GiCoins, 
  GiThreeFriends,
  GiScrollQuill,
  GiShield
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
  const guardCoverage = baseCoverage + wallBonus;

  const guardCount = state.population.filter(p => p.job === Job.Guard).length;
  const totalPop = state.population.length;
  const requiredGuards = Math.max(1, Math.ceil(totalPop / guardCoverage));
  const isSecure = guardCount >= requiredGuards;
  
  // Calculate percentage based on coverage vs population
  // If pop is 0, security is 100%
  const securityPercent = totalPop === 0 ? 100 : Math.min(100, Math.floor((guardCount * guardCoverage / totalPop) * 100));

  return (
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
        value={`${securityPercent}%`} 
        label="治安" 
        color={isSecure ? "text-emerald-400" : "text-red-500"} 
        subLabel={!isSecure ? "危险" : "安全"}
      />
    </div>
  );
};
