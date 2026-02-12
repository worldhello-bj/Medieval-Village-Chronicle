import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables from .env.local file
dotenv.config({ path: '.env.local' });

const app = express();
const PORT = process.env.PORT || 3001;

// AI Configuration constants
const AI_TEMPERATURE = 0.5;
const NVIDIA_MODEL = 'openai/gpt-oss-120b';
const OPENAI_MODEL = 'gpt-4-turbo-preview';

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' })); // Increase body size limit to handle game state

// Helper function to get the appropriate model name
const getModelName = () => {
  return process.env.NVIDIA_API_KEY ? NVIDIA_MODEL : OPENAI_MODEL;
};

// Initialize OpenAI client with NVIDIA configuration
const getAI = () => {
  const apiKey = process.env.NVIDIA_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('NVIDIA_API_KEY or OPENAI_API_KEY not set. AI features will be disabled.');
    return null;
  }
  
  // Use NVIDIA's API if NVIDIA_API_KEY is set, otherwise use OpenAI
  const baseURL = process.env.NVIDIA_API_KEY 
    ? 'https://integrate.api.nvidia.com/v1'
    : undefined; // OpenAI's default URL
  
  return new OpenAI({
    apiKey,
    baseURL
  });
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

    const prompt = `当前中世纪村庄状态:
季节: ${state.season}
人口: ${state.population.length}人
食物库存: ${state.resources.food}
平均幸福度: ${avgHappiness}

请生成一个丰富、生动的中世纪村庄随机事件（使用中文）。
不仅限于简单的丰收或灾害，可以包含更多叙事细节，如村民的互动、神秘的访客、自然界的奇观或社会风波。
事件应当具有沉浸感，让玩家感受到村庄的鲜活。
如果是负面事件，请不要太残酷，除非幸福度极低（<30）。
如果是正面事件，可以根据季节和当前资源情况赋予更多色彩。

请用JSON格式返回，包含以下字段：
- message: 事件描述（中文，1-2句话，富有画面感）
- type: 事件类型（info/warning/danger/success）
- deltaFood: 食物变化（整数）
- deltaWood: 木材变化（整数）
- deltaGold: 黄金变化（整数）
- deltaPop: 人口变化（整数，负数为死亡，正数为新移民）`;

    const completion = await ai.chat.completions.create({
      model: getModelName(),
      messages: [{ role: 'user', content: prompt }],
      temperature: AI_TEMPERATURE,
      max_tokens: 1024,
      response_format: { type: 'json_object' }
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return res.status(500).json({ error: 'No response from AI' });
    }

    const eventData = JSON.parse(content);
    res.json(eventData);

  } catch (error) {
    console.error('Error generating event:', error);
    
    if (error.status === 429 || error.code === 429) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }
    
    res.status(500).json({ error: 'Failed to generate event' });
  }
});

// API endpoint for generating villager bio chronicle entry
app.post('/api/generate-bio', async (req, res) => {
  try {
    // Legacy support for simple bio generation if villager object is not present
    const { villager, year, villageStatus, name, age, job, season } = req.body;
    
    const ai = getAI();
    if (!ai) {
      return res.status(503).json({ error: 'AI service not configured' });
    }

    let prompt = '';
    
    if (villager && year !== undefined) {
      // Chronicle Mode
      const { name, age, job, health, happiness, hunger, currentActivity } = villager;
      const { isStarving, population } = villageStatus || {};
      
      prompt = `请为中世纪村民 ${name} 撰写第 ${year} 年的年度经历摘要（使用中文）。
仅需写一句话，富含细节和沉浸感。

村民档案:
- 年龄: ${age}岁
- 职业: ${job}
- 健康状况: ${health}/100 ${health < 40 ? '(虚弱)' : ''}
- 心理状态: ${happiness}/100 ${happiness < 40 ? '(沮丧)' : ''}
- 饥饿程度: ${hunger}/100 ${hunger > 50 ? '(饥饿)' : ''}
- 当前活动: ${currentActivity}

环境背景:
- 村庄人口: ${population}人
- 粮食危机: ${isStarving ? '是' : '否'}

请根据以上数据，推测 ${name} 这一年的生活。
如果健康或快乐低，描述他们的挣扎；如果状态好，描述他们的成就或平静生活。
如果村庄在挨饿，描述他们如何度过难关。
格式示例："[第X年] 严冬中他不幸染病，但在家人的照料下顽强地挺了过来。"`;
    } else {
      // Legacy Mode (Fallback)
      prompt = `请为一个中世纪村民写一段2句话的简短背景故事（使用中文）。
风格可以是古怪的、幽默的或戏剧性的。
姓名: ${name}
年龄: ${age}
职业: ${job}
当前季节: ${season}`;
    }

    const completion = await ai.chat.completions.create({
      model: getModelName(),
      messages: [{ role: 'user', content: prompt }],
      temperature: AI_TEMPERATURE,
      max_tokens: 256
    });

    const bio = completion.choices[0]?.message?.content;
    if (!bio) {
      return res.status(500).json({ error: 'No response from AI' });
    }

    res.json({ bio });

  } catch (error) {
    console.error('Error generating bio:', error);
    
    if (error.status === 429 || error.code === 429) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }
    
    res.status(500).json({ error: 'Failed to generate bio' });
  }
});

// API endpoint for generating batch villager bio chronicle entries
app.post('/api/generate-bio-batch', async (req, res) => {
  try {
    const { villagers, year, villageStatus } = req.body;
    
    if (!villagers || !Array.isArray(villagers) || villagers.length === 0) {
      return res.status(400).json({ error: 'Villagers array is required' });
    }

    const ai = getAI();
    if (!ai) {
      return res.status(503).json({ error: 'AI service not configured' });
    }

    // Construct a prompt for multiple villagers
    const villagersDesc = villagers.map(v => 
      `- ID: ${v.id}, 姓名: ${v.name}, 年龄: ${v.age}, 职业: ${v.job}, 健康: ${v.health}, 快乐: ${v.happiness}, 饥饿: ${v.hunger}`
    ).join('\n');

    const prompt = `请为以下 ${villagers.length} 位中世纪村民撰写第 ${year} 年的年度经历摘要（使用中文）。
村庄状态: 人口 ${villageStatus.population}人, ${villageStatus.isStarving ? '正在挨饿' : '食物充足'}。

请返回一个JSON对象，Key为村民ID，Value为该村民的年度经历（仅1句话）。

村民列表:
${villagersDesc}

JSON格式示例:
{
  "id1": "[第X年] ...",
  "id2": "[第X年] ..."
}`;

    const completion = await ai.chat.completions.create({
      model: getModelName(),
      messages: [{ role: 'user', content: prompt }],
      temperature: AI_TEMPERATURE,
      max_tokens: 2048,
      response_format: { type: 'json_object' }
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return res.status(500).json({ error: 'No response from AI' });
    }

    const bioMap = JSON.parse(content);
    res.json({ bios: bioMap });

  } catch (error) {
    console.error('Error generating batch bio:', error);
    if (error.status === 429 || error.code === 429) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }
    res.status(500).json({ error: 'Failed to generate batch bio' });
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
    
    const prompt = `请为一个中世纪村庄游戏生成一段2-3句话的结局总结（使用中文）。
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
如果是胜利结局，要突出村庄的成就和辉煌。`;

    const completion = await ai.chat.completions.create({
      model: getModelName(),
      messages: [{ role: 'user', content: prompt }],
      temperature: AI_TEMPERATURE,
      max_tokens: 1024
    });

    const summary = completion.choices[0]?.message?.content;
    if (!summary) {
      return res.status(500).json({ error: 'No response from AI' });
    }

    res.json({ summary });

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
  const aiConfigured = !!(process.env.NVIDIA_API_KEY || process.env.OPENAI_API_KEY);
  const provider = process.env.NVIDIA_API_KEY ? 'NVIDIA' : 
                   process.env.OPENAI_API_KEY ? 'OpenAI' : 'None';
  res.json({ 
    status: 'ok', 
    aiConfigured,
    aiProvider: provider
  });
});

app.listen(PORT, () => {
  console.log(`Backend API server running on port ${PORT}`);
  const apiKey = process.env.NVIDIA_API_KEY || process.env.OPENAI_API_KEY;
  if (apiKey) {
    const provider = process.env.NVIDIA_API_KEY ? 'NVIDIA (openai/gpt-oss-120b)' : 'OpenAI (gpt-4-turbo-preview)';
    console.log(`AI features enabled with ${provider}`);
  } else {
    console.log('AI features disabled (set NVIDIA_API_KEY or OPENAI_API_KEY)');
  }
});
