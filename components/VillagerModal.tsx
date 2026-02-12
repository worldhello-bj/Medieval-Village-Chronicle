import React, { useEffect, useState } from 'react';
import { Villager, Season } from '../types';
import { generateVillagerBio } from '../services/aiService';
import { GiQuill, GiHealthNormal, GiHearts, GiChickenLeg, GiBatteryPack } from 'react-icons/gi';

interface VillagerModalProps {
  villager: Villager | null;
  season: Season;
  onClose: () => void;
  onUpdateBio: (id: string, bio: string) => void;
}

const StatBar: React.FC<{ label: string; value: number; color: string; icon: React.ReactNode; max?: number; invert?: boolean }> = ({ label, value, color, icon, max = 100, invert = false }) => {
    let barColor = color;
    if (invert) {
        if (value > 80) barColor = 'bg-red-600';
        else if (value > 50) barColor = 'bg-yellow-600';
        else barColor = 'bg-emerald-600';
    } else {
        if (value < 30) barColor = 'bg-red-600';
        else if (value < 60) barColor = 'bg-yellow-600';
        else barColor = 'bg-emerald-600';
    }

    const percentage = Math.min(100, (value / max) * 100);

    return (
        <div className="mb-2">
            <div className="flex justify-between text-xs uppercase text-stone-500 mb-1">
                <span className="flex items-center gap-1">{icon} {label}</span>
                <span>{Math.floor(value)}/{max}</span>
            </div>
            <div className="h-2 w-full bg-stone-800 rounded-full overflow-hidden border border-stone-700">
                <div 
                    className={`h-full ${barColor} transition-all duration-300`} 
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    )
}

export const VillagerModal: React.FC<VillagerModalProps> = ({ villager, season, onClose, onUpdateBio }) => {
  const [loadingBio, setLoadingBio] = useState(false);

  useEffect(() => {
    if (villager && !villager.bio && !loadingBio) {
      setLoadingBio(true);
      generateVillagerBio(villager.name, villager.age, villager.job, season)
        .then(bio => {
          if (bio) onUpdateBio(villager.id, bio);
        })
        .finally(() => setLoadingBio(false));
    }
  }, [villager, season, loadingBio, onUpdateBio]);

  if (!villager) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#2a2620] border-2 border-[#5c5040] w-full max-w-lg rounded-lg shadow-2xl relative">
        {/* Header Parchment Effect */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#d4c5a9] text-[#2a2620] px-6 py-1 rounded shadow medieval-font font-bold text-xl border border-[#5c5040]">
          居民档案
        </div>

        <button 
          onClick={onClose}
          className="absolute top-2 right-2 text-stone-500 hover:text-stone-300 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10"
        >
          ✕
        </button>

        <div className="p-8 pt-10">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-3xl text-amber-100 medieval-font">{villager.name}</h2>
              <div className="text-amber-500 font-bold uppercase tracking-wider text-sm mt-1">{villager.job}</div>
              <div className="text-stone-500 text-xs mt-1">当前状态: <span className="text-stone-300 font-bold">{villager.currentActivity}</span></div>
            </div>
            <div className="text-right text-stone-400">
              <div className="text-xl font-bold">{villager.age} <span className="text-xs font-normal">岁</span></div>
              <div className="text-xs">ID: {villager.id}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
             <StatBar label="健康" value={villager.health} icon={<GiHealthNormal />} color="bg-red-600" />
             <StatBar label="幸福" value={villager.happiness} icon={<GiHearts />} color="bg-yellow-500" />
             <StatBar label="饥饿" value={villager.hunger} icon={<GiChickenLeg />} color="bg-orange-500" invert />
             <StatBar label="精力" value={villager.energy} icon={<GiBatteryPack />} color="bg-blue-500" />
          </div>

          <div className="bg-[#1a1814] p-4 rounded border border-[#3e3529] mb-4 min-h-[120px]">
            <h4 className="text-stone-500 text-xs uppercase mb-2 flex items-center gap-2">
              <GiQuill /> 生平传记 (AI撰写)
            </h4>
            {loadingBio ? (
              <div className="animate-pulse text-stone-600 italic">正在查询档案...</div>
            ) : (
              <p className="text-stone-300 italic leading-relaxed font-serif">
                "{villager.bio || '暂无信息。'}"
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};