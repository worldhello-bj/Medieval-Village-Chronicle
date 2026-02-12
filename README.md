<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Medieval Village Chronicle - 中世纪村庄编年史

A strategic village management game where you guide your medieval village through 10 years of challenges, growth, and survival.

一款策略型村庄管理游戏，带领你的中世纪村庄经历 10 年的挑战、成长与存续。

## ⚠️ Important: How to Run (重要：如何运行)

**Do NOT open `index.html` directly!** The game must be run through a web server.

**不要直接打开 `index.html` 文件！** 游戏必须通过 Web 服务器运行。

📖 **[Read the Complete Running Guide / 阅读完整运行指南 →](./docs/guides/HOW_TO_RUN.md)**

### Quick Start (快速开始)

```bash
# Install dependencies (安装依赖)
npm install

# Start the game (启动游戏)
npm run dev

# Open browser to (在浏览器中打开)
# http://localhost:3000
```

## Architecture / 架构分析

This application consists of two parts:

1. **Frontend (React + Vite)**: Game UI and logic
2. **Backend API (Node.js + Express)**: AI event, chronicle bio, and ending generation using NVIDIA/OpenAI

The backend API isolates AI API calls from the frontend, providing better security and control.

应用采用前后端分离架构：

1. **前端（React + Vite）**：负责界面渲染、游戏循环、村民与资源状态管理、以及本地自动存档（localStorage）。
2. **后端（Node.js + Express）**：提供 AI 事件、村民编年史与结局总结的生成接口，支持 NVIDIA 或 OpenAI。

后端将 AI 调用与前端隔离，便于密钥保护与失败降级。

### Data Flow / 数据流

- 前端通过 `services/aiService.ts` 调用 `/api/*`，默认指向 `VITE_API_URL` 或 Vite 代理（`vite.config.ts`）。
- 若 AI 服务不可用，前端自动退回内置事件模板，保证游戏可玩。
- 后端在 `server/index.js` 中实现接口：`/api/generate-event`、`/api/generate-bio`、`/api/generate-bio-batch`、`/api/generate-ending`、`/api/health`。

### Project Layout / 目录结构

- `components/`：UI 组件与面板
- `services/`：AI 调用与数据处理服务
- `hooks/`：状态与游戏逻辑 Hook
- `utils/`：计算与辅助函数
- `server/`：Express 后端与 AI 接口
- `docs/`：玩法分析、指南与历史记录

## Run Locally (本地运行)

**Prerequisites:** Node.js 14.0 or higher

**前置条件：** Node.js 14.0 或更高版本

### Complete Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. (Optional) Set up the backend API for AI features:
   - Create `server/.env.local` with your NVIDIA/OpenAI API key:
     ```
     NVIDIA_API_KEY=your_api_key_here
     # or
     OPENAI_API_KEY=your_api_key_here
     ```
   - Get your API key from NVIDIA or OpenAI.

3. Start the backend server (in a separate terminal):
   ```bash
   npm run dev:backend
   ```

4. Run the frontend app:
   ```bash
   npm run dev
   ```

The app will run at http://localhost:3000

应用默认运行在 http://localhost:3000

**Note**: If the backend API is not configured or running, the app will fall back to using predefined event and bio templates.

**提示**：若后端未配置或未启动，游戏将自动使用内置模板生成事件与人物经历。

### Running Components Separately

- **Frontend only**: `npm run dev` (http://localhost:3000)
- **Backend only**: `npm run server` (http://localhost:3001)

## Production Build (生产构建)

```bash
# Build the project
npm run build

# Preview the build
npm run preview
```

## Environment Variables (环境变量)

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:3001
```

### Backend (server/.env.local)
```
NVIDIA_API_KEY=your_nvidia_api_key_here
# or
OPENAI_API_KEY=your_openai_api_key_here
```

## Game Features (游戏特色)

- 🏘️ Village management and population growth（村庄管理与人口增长）
- 🌾 Resource production and economy（资源生产与经济循环）
- ⚔️ Defense against raids and invasions（抵御袭击与入侵）
- 🔬 Technology research system（科技研究系统）
- 🏗️ Building construction（建筑建造）
- 📊 Dynamic event system（动态事件系统）
- 💾 Auto-save functionality (localStorage)（自动存档）

## Troubleshooting (故障排除)

See the [complete troubleshooting guide](./docs/guides/HOW_TO_RUN.md#troubleshooting-故障排除) for common issues and solutions.

### Common Issues:
- Game won't load → Use a web server, not file://
- State not saving → Check localStorage availability
- Port conflicts → Change port in vite.config.ts

## View in AI Studio（在 AI Studio 中查看）

https://ai.studio/apps/drive/1tp1aU7ub4lMiDZ1SSsxVophCI4ITuEZV

---

**Enjoy playing Medieval Village Chronicle!** 祝你游戏愉快！
