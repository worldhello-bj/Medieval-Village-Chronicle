import express from 'express';
import cors from 'cors';
import { GoogleGenAI, Type } from '@google/genai';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

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
