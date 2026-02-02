import { GameState, Season } from "../types";
import { NAMES_MALE } from "../constants";

// Event templates for different scenarios
interface EventTemplate {
  message: string;
  type: 'info' | 'warning' | 'danger' | 'success';
  deltaFood: number;
  deltaWood: number;
  deltaGold: number;
  deltaPop: number;
  condition?: (state: GameState) => boolean;
}

const POSITIVE_EVENTS: EventTemplate[] = [
  { message: "一群商人途经此地，留下了珍贵的礼物。", type: 'success', deltaFood: 50, deltaWood: 20, deltaGold: 30, deltaPop: 0 },
  { message: "天气晴朗，农作物长势喜人。", type: 'success', deltaFood: 100, deltaWood: 0, deltaGold: 0, deltaPop: 0 },
  { message: "村民发现了一处野果林。", type: 'success', deltaFood: 80, deltaWood: 0, deltaGold: 0, deltaPop: 0 },
  { message: "旅行者加入了村庄。", type: 'success', deltaFood: 0, deltaWood: 0, deltaGold: 0, deltaPop: 1 },
  { message: "矿工发现了一处小金矿。", type: 'success', deltaFood: 0, deltaWood: 0, deltaGold: 50, deltaPop: 0 },
  { message: "伐木工发现了优质木材。", type: 'success', deltaFood: 0, deltaWood: 60, deltaGold: 0, deltaPop: 0 },
  { message: "村民举办了简朴的庆祝活动。", type: 'info', deltaFood: -20, deltaWood: 0, deltaGold: 0, deltaPop: 0 },
  { message: "一位游吟诗人为村庄带来了欢乐。", type: 'success', deltaFood: 0, deltaWood: 0, deltaGold: 10, deltaPop: 0 },
  { message: "猎人在森林中收获颇丰。", type: 'success', deltaFood: 60, deltaWood: 0, deltaGold: 0, deltaPop: 0 },
  { message: "村民在河中发现了宝石。", type: 'success', deltaFood: 0, deltaWood: 0, deltaGold: 40, deltaPop: 0 },
];

const NEUTRAL_EVENTS: EventTemplate[] = [
  { message: "一场小雨滋润了田野。", type: 'info', deltaFood: 20, deltaWood: 0, deltaGold: 0, deltaPop: 0 },
  { message: "村民在闲暇时光中休息。", type: 'info', deltaFood: 0, deltaWood: 0, deltaGold: 0, deltaPop: 0 },
  { message: "远方传来了陌生的歌声。", type: 'info', deltaFood: 0, deltaWood: 0, deltaGold: 0, deltaPop: 0 },
  { message: "村庄迎来了平静的一周。", type: 'info', deltaFood: 0, deltaWood: 0, deltaGold: 0, deltaPop: 0 },
  { message: "孩子们在田野间嬉戏。", type: 'info', deltaFood: 0, deltaWood: 0, deltaGold: 0, deltaPop: 0 },
];

const NEGATIVE_EVENTS: EventTemplate[] = [
  { message: "暴风雨损坏了部分储备。", type: 'warning', deltaFood: -30, deltaWood: -20, deltaGold: 0, deltaPop: 0 },
  { message: "野兽袭击了粮仓。", type: 'warning', deltaFood: -50, deltaWood: 0, deltaGold: 0, deltaPop: 0 },
  { message: "部分工具在工作中损坏。", type: 'warning', deltaFood: 0, deltaWood: -30, deltaGold: -10, deltaPop: 0 },
  { message: "干旱影响了作物生长。", type: 'warning', deltaFood: -40, deltaWood: 0, deltaGold: 0, deltaPop: 0 },
  { message: "流行的小病使村民感到不适。", type: 'warning', deltaFood: -20, deltaWood: 0, deltaGold: -5, deltaPop: 0 },
  { message: "盗贼在夜间偷走了一些物资。", type: 'danger', deltaFood: -40, deltaWood: 0, deltaGold: -30, deltaPop: 0 },
  { message: "意外的火灾烧毁了部分木材。", type: 'danger', deltaFood: 0, deltaWood: -50, deltaGold: 0, deltaPop: 0 },
  { message: "一场小型瘟疫袭击了村庄。", type: 'danger', deltaFood: -30, deltaWood: 0, deltaGold: -20, deltaPop: -1 },
];

const SEVERE_NEGATIVE_EVENTS: EventTemplate[] = [
  { message: "严重的暴风雪摧毁了储备。", type: 'danger', deltaFood: -80, deltaWood: -60, deltaGold: -20, deltaPop: 0 },
  { message: "饥荒导致村民流失。", type: 'danger', deltaFood: -100, deltaWood: 0, deltaGold: 0, deltaPop: -2 },
  { message: "土匪洗劫了村庄。", type: 'danger', deltaFood: -60, deltaWood: -30, deltaGold: -50, deltaPop: -1 },
];

// Used for generating random events affecting the village
export const generateGameEvent = async (state: GameState) => {
  try {
    // Calculate average happiness
    const avgHappiness = Math.floor(state.population.reduce((acc, v) => acc + v.happiness, 0) / state.population.length) || 0;
    const popSize = state.population.length;
    const foodRatio = state.resources.food / Math.max(1, popSize * 50); // Rough food per capita
    
    // Select event pool based on village state
    let eventPool: EventTemplate[] = [];
    
    // If happiness is low or food is scarce, more negative events
    if (avgHappiness < 40 || foodRatio < 0.5) {
      eventPool = [...SEVERE_NEGATIVE_EVENTS, ...NEGATIVE_EVENTS, ...NEUTRAL_EVENTS];
    } else if (avgHappiness < 60 || foodRatio < 1.0) {
      eventPool = [...NEGATIVE_EVENTS, ...NEUTRAL_EVENTS, ...POSITIVE_EVENTS];
    } else {
      // Good times = more positive events (doubled weight for positive events)
      eventPool = [...POSITIVE_EVENTS, ...POSITIVE_EVENTS, ...NEUTRAL_EVENTS, ...NEGATIVE_EVENTS];
    }
    
    // Season-specific events
    if (state.season === Season.Winter) {
      eventPool.push({ message: "寒冷的冬日考验着村民的意志。", type: 'warning', deltaFood: -20, deltaWood: -40, deltaGold: 0, deltaPop: 0 });
    } else if (state.season === Season.Spring) {
      eventPool.push({ message: "春天带来了新的希望和活力。", type: 'success', deltaFood: 40, deltaWood: 0, deltaGold: 0, deltaPop: 0 });
    } else if (state.season === Season.Summer) {
      eventPool.push({ message: "夏日阳光普照，万物繁茂。", type: 'success', deltaFood: 50, deltaWood: 0, deltaGold: 0, deltaPop: 0 });
    } else if (state.season === Season.Autumn) {
      eventPool.push({ message: "秋收时节，粮仓充盈。", type: 'success', deltaFood: 80, deltaWood: 0, deltaGold: 0, deltaPop: 0 });
    }
    
    // Randomly select an event
    const event = eventPool[Math.floor(Math.random() * eventPool.length)];
    
    return event;
  } catch (error: any) {
    console.error("Event Gen Error:", error);
    return null;
  }
};

// Bio templates for different job types
const BIO_TEMPLATES = {
  '农夫': [
    "{name}自幼便在田间劳作，对土地有着深厚的感情。{他/她}的双手虽粗糙，却能种出最香甜的谷物。",
    "{name}继承了家族的耕种技艺，{他/她}认为只有辛勤的汗水才能换来丰收的喜悦。",
    "{name}曾经历过大饥荒，因此{他/她}特别珍惜每一粒粮食，从不浪费。",
    "{name}总是第一个起床的人，{他/她}相信早起的鸟儿有虫吃，勤劳才能致富。",
    "{name}年轻时曾想成为骑士，但最终选择了耕种。{他/她}说，养活众人也是一种荣耀。",
  ],
  '伐木工': [
    "{name}的父亲是位传奇伐木工，{他/她}从小就学会了如何尊重森林、砍伐树木。",
    "{name}身材魁梧，力大无穷，据说{他/她}一斧能劈开最粗的橡树。",
    "{name}热爱森林的宁静，{他/她}常说树木也有灵魂，需要善待。",
    "{name}曾在一次意外中被倒下的树压伤，但康复后依然坚持工作。{他/她}是个真正的硬汉。",
    "{name}喜欢在工作时哼唱古老的民谣，村民们都说那歌声能让树木更容易倒下。",
  ],
  '矿工': [
    "{name}在地底深处寻找宝藏，{他/她}的眼睛已经习惯了黑暗和微光。",
    "{name}年轻时曾在矿井中迷路三天，靠着意志力活了下来，从此练就了过人的方向感。",
    "{name}相信每一块石头都藏着秘密，{他/她}的镐子下已经挖出无数财富。",
    "{name}沉默寡言，但在矿洞里却是最可靠的伙伴。{他/她}的经验救过许多人的命。",
    "{name}梦想着有一天能挖到传说中的龙金矿脉，为此{他/她}愿意付出一切。",
  ],
  '守卫': [
    "{name}曾是一名雇佣兵，经历过无数战斗后选择在这个安静的村庄定居。",
    "{name}以保护村民为己任，{他/她}的剑从不离身，时刻警惕着危险。",
    "{name}在一次土匪袭击中失去了家人，从那以后{他/她}发誓要守护每一个无辜的生命。",
    "{name}白天是严肃的守卫，晚上却喜欢给孩子们讲英雄故事。村民都很喜欢{他/她}。",
    "{name}年轻时接受过正规的军事训练，{他/她}的战术思维让村庄更加安全。",
  ],
  '学者': [
    "{name}游历四方，收集各地的知识与传说，最终在这个村庄安顿下来。",
    "{name}的书房里堆满了手稿和古籍，{他/她}相信知识能改变世界。",
    "{name}曾是贵族的私人教师，后来因为理念不合而离开了奢华的生活。",
    "{name}热衷于研究古代文明，{他/她}常说，历史是最好的老师。",
    "{name}不仅精通文字，还懂得草药医学。村民生病时，都会来找{他/她}求助。",
  ],
  '无业游民': [
    "{name}曾尝试过许多职业，但总找不到真正适合自己的方向，因此四处游荡。",
    "{name}是个天生的自由灵魂，{他/她}不愿被任何工作束缚，更喜欢随心所欲地生活。",
    "{name}年轻时受过伤，身体不太适合重体力劳动，但{他/她}总能帮村民做些小事。",
    "{name}虽然没有固定工作，但{他/她}是村里最会讲故事的人，经常逗得大家哈哈大笑。",
    "{name}在等待一个机会，{他/她}相信命运终会为自己安排合适的角色。",
  ],
  '孩童': [
    "{name}是村里最调皮的孩子之一，{他/她}总是充满好奇心，到处探险。",
    "{name}从小就展现出过人的天赋，长辈们都说{他/她}将来必成大器。",
    "{name}喜欢跟在大人身后学习各种技能，{他/她}梦想着有一天能成为村里的英雄。",
    "{name}虽然年幼，但已经懂得帮助家人做些力所能及的小事。{他/她}是父母的骄傲。",
    "{name}天真烂漫，笑声常常回荡在村庄的每个角落。{他/她}是大家的开心果。",
  ]
};

// Used for generating a backstory for a specific villager
export const generateVillagerBio = async (name: string, age: number, job: string, season: string) => {
  try {
    // Get templates for the job type
    const templates = BIO_TEMPLATES[job as keyof typeof BIO_TEMPLATES] || BIO_TEMPLATES['无业游民'];
    
    // Randomly select a template
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    // Replace placeholders
    let bio = template.replace(/{name}/g, name);
    
    // Determine gender pronoun based on name (uses shared male names constant)
    const firstName = name.split('·')[0];
    const isMale = NAMES_MALE.includes(firstName);
    bio = bio.replace(/{他\/她}/g, isMale ? '他' : '她');
    
    return bio;
  } catch (error: any) {
    console.warn("Bio Gen Error (using fallback):", error);
    return "这个人的过去像迷雾一样不可知。";
  }
};