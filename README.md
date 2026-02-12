<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Medieval Village Chronicle - 中世纪村庄编年史

A strategic village management game where you guide your medieval village through 10 years of challenges, growth, and survival.

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

## Architecture

This application consists of two parts:

1. **Frontend (React + Vite)**: Game UI and logic
2. **Backend API (Node.js + Express)**: AI event and bio generation using Gemini API

The backend API isolates AI API calls from the frontend, providing better security and control.

## Run Locally

**Prerequisites:** Node.js 14.0 or higher

### Complete Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. (Optional) Set up the backend API for AI features:
   - Create `server/.env.local` with your Gemini API key:
     ```
     GEMINI_API_KEY=your_api_key_here
     ```
   - Get your API key from: https://ai.google.dev/

3. Start the backend server (in a separate terminal):
   ```bash
   npm run dev:backend
   ```

4. Run the frontend app:
   ```bash
   npm run dev
   ```

The app will run at http://localhost:3000

**Note**: If the backend API is not configured or running, the app will fall back to using predefined event and bio templates.

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

## Environment Variables

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:3001
```

### Backend (server/.env.local)
```
GEMINI_API_KEY=your_gemini_api_key_here
```

## Game Features

- 🏘️ Village management and population growth
- 🌾 Resource production and economy
- ⚔️ Defense against raids and invasions
- 🔬 Technology research system
- 🏗️ Building construction
- 📊 Dynamic event system
- 💾 Auto-save functionality (localStorage)

## Troubleshooting (故障排除)

See the [complete troubleshooting guide](./docs/guides/HOW_TO_RUN.md#troubleshooting-故障排除) for common issues and solutions.

### Common Issues:
- Game won't load → Use a web server, not file://
- State not saving → Check localStorage availability
- Port conflicts → Change port in vite.config.ts

## View in AI Studio

https://ai.studio/apps/drive/1tp1aU7ub4lMiDZ1SSsxVophCI4ITuEZV

---

**Enjoy playing Medieval Village Chronicle!** 祝你游戏愉快！
