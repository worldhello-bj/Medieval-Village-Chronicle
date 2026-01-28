import { GoogleGenAI, Type } from "@google/genai";
import { GameState } from "../types";

// Used for generating random events affecting the village
export const generateGameEvent = async (state: GameState) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Calculate average happiness
    const avgHappiness = Math.floor(state.population.reduce((acc, v) => acc + v.happiness, 0) / state.population.length) || 0;

    const prompt = `
      当前中世纪村庄状态:
      季节: ${state.season}
      人口: ${state.population.length}人
      食物库存: ${state.resources.food}
      平均幸福度: ${avgHappiness}
      
      请生成一个简短的、一句话的中世纪村庄随机事件（使用中文）。
      可以是正面的（节日、丰收、旅行者）或负面的（小病、风暴、物资丢失）。
      如果是负面事件，请不要太残酷，除非幸福度极低。
      
      请同时提供资源变动数值。
      
      Response Format: JSON
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            message: { type: Type.STRING, description: "中文事件描述" },
            type: { type: Type.STRING, enum: ['info', 'warning', 'danger', 'success'] },
            deltaFood: { type: Type.INTEGER },
            deltaWood: { type: Type.INTEGER },
            deltaGold: { type: Type.INTEGER },
            deltaPop: { type: Type.INTEGER, description: "人口变动（负数为死亡，正数为新移民）" }
          }
        }
      }
    });
    
    const text = response.text;
    if (!text) return null;
    
    return JSON.parse(text);
  } catch (error: any) {
    if (error.status === 429 || error.code === 429 || (error.message && error.message.includes('429'))) {
      console.warn("AI Event Gen: Quota exceeded (429). Skipping event generation.");
      return null;
    }
    console.error("AI Event Gen Error:", error);
    return null;
  }
};

// Used for generating a backstory for a specific villager
export const generateVillagerBio = async (name: string, age: number, job: string, season: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      请为一个中世纪村民写一段2句话的简短背景故事（使用中文）。
      风格可以是古怪的、幽默的或戏剧性的。
      姓名: ${name}
      年龄: ${age}
      职业: ${job}
      当前季节: ${season}
    `;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    const text = response.text;
    if (!text) throw new Error("No text generated");

    return text;
  } catch (error: any) {
    if (error.status === 429 || error.code === 429 || (error.message && error.message.includes('429'))) {
      console.warn("AI Bio Gen: Quota exceeded (429). Using fallback.");
      return "（由于记录缺失，这名村民的过去不详。）";
    }
    console.warn("AI Bio Gen Error (using fallback):", error);
    return "这个人的过去像迷雾一样不可知。";
  }
};