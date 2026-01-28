
import React, { useMemo, useState } from 'react';
import { Villager, Job, Activity } from '../types';
import { 
  GiFarmer, 
  GiAxeSwing, 
  GiMining, 
  GiSwordman, 
  GiBookCover,
  GiPerson,
  GiBed,
  GiKnifeFork,
  GiConversation,
  GiHammerDrop,
  GiBabyFace,
  GiHearts,
  GiSnowflake1
} from 'react-icons/gi';

interface VillagerListProps {
  villagers: Villager[];
  onSelectVillager: (v: Villager) => void;
}

const JobIcon: React.FC<{ job: Job }> = ({ job }) => {
  switch (job) {
    case Job.Farmer: return <GiFarmer className="text-yellow-500" />;
    case Job.Woodcutter: return <GiAxeSwing className="text-amber-700" />;
    case Job.Miner: return <GiMining className="text-stone-400" />;
    case Job.Guard: return <GiSwordman className="text-red-500" />;
    case Job.Scholar: return <GiBookCover className="text-blue-400" />;
    case Job.Child: return <GiBabyFace className="text-pink-300" />;
    default: return <GiPerson className="text-gray-500" />;
  }
};

const ActivityIcon: React.FC<{ activity: Activity }> = ({ activity }) => {
    switch (activity) {
        case Activity.Sleeping: return <GiBed title="睡觉" className="text-purple-400" />;
        case Activity.Eating: return <GiKnifeFork title="吃饭" className="text-orange-400" />;
        case Activity.Working: return <GiHammerDrop title="工作" className="text-stone-300" />;
        case Activity.Socializing: return <GiConversation title="社交" className="text-pink-400" />;
        case Activity.Freezing: return <GiSnowflake1 title="受冻" className="text-cyan-400 animate-pulse" />;
        default: return <span title="发呆" className="text-stone-600">-</span>;
    }
};

export const VillagerList: React.FC<VillagerListProps> = ({ villagers, onSelectVillager }) => {
  const [filter, setFilter] = useState<Job | '全部'>('全部');

  const filteredVillagers = useMemo(() => {
    if (filter === '全部') return villagers;
    return villagers.filter(v => v.job === filter);
  }, [villagers, filter]);

  // Helper to check fertility conditions consistent with App.tsx logic
  const isFertile = (v: Villager) => {
    return v.age >= 18 && v.age <= 45 && v.happiness > 70 && v.health > 80 && v.hunger < 30;
  };

  return (
    <div className="bg-stone-800 rounded-lg border border-stone-600 h-full flex flex-col overflow-hidden">
      <div className="p-4 border-b border-stone-700 bg-stone-900/50">
        <h3 className="text-xl medieval-font text-stone-200 mb-2">人口普查</h3>
        <select 
          value={filter} 
          onChange={(e) => setFilter(e.target.value as Job | '全部')}
          className="w-full bg-stone-700 text-stone-200 p-2 rounded border border-stone-600 text-sm focus:outline-none focus:border-amber-500"
        >
          <option value="全部">全部居民 ({villagers.length})</option>
          {Object.values(Job).map(job => (
            <option key={job} value={job}>{job}</option>
          ))}
        </select>
        <div className="mt-2 text-[10px] text-stone-400 flex items-center gap-1">
            <GiHearts className="text-pink-500" /> 
            <span>= 满足生育条件 (快乐,健康,吃饱)</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
        {filteredVillagers.map(villager => {
            const fertile = isFertile(villager);
            return (
              <div 
                key={villager.id}
                onClick={() => onSelectVillager(villager)}
                className="flex items-center justify-between p-3 bg-stone-700/50 hover:bg-stone-700 rounded cursor-pointer transition-colors border border-stone-600 hover:border-amber-500/50"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-2xl bg-stone-800 p-2 rounded-full border border-stone-600 relative">
                    <JobIcon job={villager.job} />
                    {/* Fertility Indicator Dot */}
                    {fertile && (
                        <div className="absolute -top-1 -right-1 bg-pink-500 text-white rounded-full p-[2px] text-[8px] animate-pulse border border-stone-900">
                           <GiHearts />
                        </div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <div className="font-bold text-stone-200 text-sm flex items-center gap-1">
                        {villager.name}
                    </div>
                    <div className="text-xs text-stone-400 flex items-center gap-2">
                        <span>{villager.job}</span>
                        {villager.job === Job.Child && <span className="text-pink-400 text-[10px]">(成长中)</span>}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-1">
                   <div className="text-lg bg-stone-800 p-1 rounded border border-stone-600">
                       <ActivityIcon activity={villager.currentActivity} />
                   </div>
                   <div className="flex gap-2 text-[10px]">
                       <span className={villager.hunger > 80 ? "text-red-500 font-bold" : "text-stone-500"}>饥:{villager.hunger}</span>
                       <span className={villager.energy < 20 ? "text-red-500 font-bold" : "text-stone-500"}>精:{villager.energy}</span>
                   </div>
                </div>
              </div>
            );
        })}
      </div>
    </div>
  );
};
