import express from 'express';
import cors from 'cors';
import { GoogleGenAI, Type } from '@google/genai';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' })); // Increase body size limit to handle game state

// Initialize Gemini AI
const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY not set. AI features will be disabled.');
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

// API endpoint for generating game events
app.post('/api/generate-event', async (req, res) => {
  try {
    const { state } = req.body;
    
    if (!state) {
      return res.status(400).json({ error: 'Game state is required' });
    }

    const ai = getAI();
    if (!ai) {
      return res.status(503).json({ error: 'AI service not configured' });
    }

    // Calculate average happiness
    const avgHappiness = Math.floor(
      state.population.reduce((acc, v) => acc + v.happiness, 0) / state.population.length
    ) || 0;

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
    if (!text) {
      return res.status(500).json({ error: 'No response from AI' });
    }

    const eventData = JSON.parse(text);
    res.json(eventData);

  } catch (error) {
    console.error('Error generating event:', error);
    
    if (error.status === 429 || error.code === 429) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }
    
    res.status(500).json({ error: 'Failed to generate event' });
  }
});

// API endpoint for generating villager bio
app.post('/api/generate-bio', async (req, res) => {
  try {
    const { name, age, job, season } = req.body;
    
    if (!name || !age || !job || !season) {
      return res.status(400).json({ error: 'Name, age, job, and season are required' });
    }

    const ai = getAI();
    if (!ai) {
      return res.status(503).json({ error: 'AI service not configured' });
    }

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
    if (!text) {
      return res.status(500).json({ error: 'No response from AI' });
    }

    res.json({ bio: text });

  } catch (error) {
    console.error('Error generating bio:', error);
    
    if (error.status === 429 || error.code === 429) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }
    
    res.status(500).json({ error: 'Failed to generate bio' });
  }
});

// API endpoint for generating game ending summary
app.post('/api/generate-ending', async (req, res) => {
  try {
    const { state, endingType, endingReason } = req.body;
    
    if (!state || !endingType) {
      return res.status(400).json({ error: 'Game state and ending type are required' });
    }

    const ai = getAI();
    if (!ai) {
      return res.status(503).json({ error: 'AI service not configured' });
    }

    const yearsPlayed = Math.floor(state.tick / 52);
    const finalPop = state.population || 0;
    
    const prompt = `
      请为一个中世纪村庄游戏生成一段2-3句话的结局总结（使用中文）。
      风格应当引人入胜、富有戏剧性，并符合历史背景。
      
      游戏数据:
      结局类型: ${endingType}
      ${endingReason ? `结局原因: ${endingReason}` : ''}
      游玩时长: ${yearsPlayed} 年
      最终人口: ${finalPop} 人
      峰值人口: ${state.stats?.peakPopulation || 0} 人
      总死亡数: ${state.stats?.totalDeaths || 0} 人
      总出生数: ${state.stats?.totalBirths || 0} 人
      击退入侵: ${state.stats?.invasionsRepelled || 0} 次
      幸存劫掠: ${state.stats?.raidsSurvived || 0} 次
      难度: ${state.difficulty}
      
      请根据这些数据生成一段有趣、引人注目的结局总结。
      如果是灭亡结局，要说明灭亡原因并营造悲壮气氛。
      如果是胜利结局，要突出村庄的成就和辉煌。
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    const text = response.text;
    if (!text) {
      return res.status(500).json({ error: 'No response from AI' });
    }

    res.json({ summary: text });

  } catch (error) {
    console.error('Error generating ending:', error);
    
    if (error.status === 429 || error.code === 429) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }
    
    res.status(500).json({ error: 'Failed to generate ending' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    aiConfigured: !!process.env.GEMINI_API_KEY 
  });
});

app.listen(PORT, () => {
  console.log(`Backend API server running on port ${PORT}`);
  console.log(`AI features ${process.env.GEMINI_API_KEY ? 'enabled' : 'disabled (set GEMINI_API_KEY)'}`);
});
