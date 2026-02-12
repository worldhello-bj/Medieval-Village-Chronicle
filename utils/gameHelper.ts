
import { Job, Villager, Activity } from "../types";
import { NAMES_MALE, NAMES_FEMALE, SURNAMES } from "../constants";

export const generateVillager = (ageOverride?: number): Villager => {
  const isMale = Math.random() > 0.5;
  const firstName = isMale 
    ? NAMES_MALE[Math.floor(Math.random() * NAMES_MALE.length)] 
    : NAMES_FEMALE[Math.floor(Math.random() * NAMES_FEMALE.length)];
  const lastName = SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
  
  const age = ageOverride !== undefined ? ageOverride : Math.floor(Math.random() * 40) + 16;
  
  // Children or preset adults
  let job = Job.Unemployed;
  
  if (age < 16) {
    job = Job.Child;
  } else {
    // Only assign jobs if random gen (initial population), otherwise default unemployed
    if (ageOverride === undefined) {
        const rand = Math.random();
        // Increased farmer chance to ~60% to match new productivity requirements
        if (rand < 0.6) job = Job.Farmer;
        else if (rand < 0.75) job = Job.Woodcutter;
        else if (rand < 0.85) job = Job.Miner;
    }
  }

  return {
    id: Math.random().toString(36).substr(2, 9),
    name: `${firstName}·${lastName}`, // Chinese naming convention dot
    age,
    job,
    happiness: 70 + Math.floor(Math.random() * 30),
    happinessBaseline: 50, // Default natural regression value
    health: 80 + Math.floor(Math.random() * 20),
    hunger: Math.floor(Math.random() * 30),
    energy: 50 + Math.floor(Math.random() * 50),
    currentActivity: Activity.Idle,
    lastBioYear: 0, // Not yet generated
  };
};

export const generateInitialPopulation = (size: number): Villager[] => {
  return Array.from({ length: size }, () => generateVillager());
};
