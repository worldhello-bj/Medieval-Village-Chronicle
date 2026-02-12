# 如何运行游戏 / How to Run the Game

## 中文说明

### 重要提示 ⚠️
**不要直接双击打开 `index.html` 文件！** 游戏必须通过 Web 服务器运行，否则会遇到以下问题：
- localStorage 无法使用（浏览器安全限制）
- 模块加载失败
- 游戏无法正常运行

### 方法 1: 开发模式（推荐用于开发）

1. **安装依赖**
```bash
npm install
```

2. **启动开发服务器**
```bash
npm run dev
```

3. **访问游戏**
- 打开浏览器访问: `http://localhost:3000`
- 如果端口被占用，Vite 会自动使用其他端口（查看终端输出）

### 方法 2: 生产构建（推荐用于部署）

1. **构建项目**
```bash
npm run build
```

2. **预览构建结果**
```bash
npm run preview
```

3. **访问游戏**
- 打开浏览器访问预览服务器提供的地址（通常是 `http://localhost:4173`）

### 方法 3: 使用简单的 HTTP 服务器

如果你已经有构建好的文件，可以使用任何 HTTP 服务器：

**Python 3:**
```bash
cd dist
python3 -m http.server 8000
```
然后访问 `http://localhost:8000`

**Node.js (http-server):**
```bash
npx http-server dist -p 8000
```
然后访问 `http://localhost:8000`

### 常见问题

**Q: 为什么不能直接打开 HTML 文件？**
A: 现代浏览器出于安全考虑，限制了 `file://` 协议的功能：
- localStorage 被禁用
- ES 模块无法加载
- CORS 限制

**Q: 游戏数据会保存吗？**
A: 是的！游戏使用 localStorage 自动保存进度，每 20 回合（约 16 秒）保存一次。

**Q: 如何清除保存的游戏？**
A: 在游戏菜单中选择"重新开始"，或者在浏览器开发者工具中清除 localStorage。

---

## English Instructions

### Important Notice ⚠️
**Do NOT open `index.html` directly by double-clicking!** The game must be run through a web server, otherwise you'll encounter:
- localStorage unavailable (browser security restrictions)
- Module loading failures
- Game won't function properly

### Method 1: Development Mode (Recommended for Development)

1. **Install Dependencies**
```bash
npm install
```

2. **Start Development Server**
```bash
npm run dev
```

3. **Access the Game**
- Open your browser and visit: `http://localhost:3000`
- If port is occupied, Vite will automatically use another port (check terminal output)

### Method 2: Production Build (Recommended for Deployment)

1. **Build the Project**
```bash
npm run build
```

2. **Preview the Build**
```bash
npm run preview
```

3. **Access the Game**
- Open your browser and visit the preview server address (usually `http://localhost:4173`)

### Method 3: Using a Simple HTTP Server

If you already have built files, you can use any HTTP server:

**Python 3:**
```bash
cd dist
python3 -m http.server 8000
```
Then visit `http://localhost:8000`

**Node.js (http-server):**
```bash
npx http-server dist -p 8000
```
Then visit `http://localhost:8000`

### Frequently Asked Questions

**Q: Why can't I open the HTML file directly?**
A: Modern browsers restrict `file://` protocol functionality for security:
- localStorage is disabled
- ES modules cannot load
- CORS restrictions apply

**Q: Will my game progress be saved?**
A: Yes! The game uses localStorage to automatically save progress every 20 ticks (approximately every 16 seconds).

**Q: How do I clear saved games?**
A: Select "Restart" in the game menu, or clear localStorage in browser developer tools.

---

## Network Access (局域网访问)

### Accessing from Other Devices on Your Network

The development server is configured to accept connections from all network interfaces.

1. **Start the dev server:**
```bash
npm run dev
```

2. **Find your local IP address:**
   - Windows: `ipconfig`
   - Mac/Linux: `ifconfig` or `ip addr`

3. **Access from other devices:**
   - Use your IP address instead of localhost
   - Example: `http://192.168.1.100:3000`

### Security Note
The server is configured with `host: '0.0.0.0'` which allows network access. This is safe for local development but should be considered when deploying to production.

---

## Troubleshooting (故障排除)

### Game Won't Load
- ✅ Make sure you're using a web server (not file://)
- ✅ Check browser console for errors (F12)
- ✅ Verify localStorage is enabled in browser settings
- ✅ Try a different browser

### Port Already in Use
- Change the port in `vite.config.ts`
- Or kill the process using port 3000:
  - Windows: `netstat -ano | findstr :3000` then `taskkill /PID <PID> /F`
  - Mac/Linux: `lsof -ti:3000 | xargs kill`

### State Not Persisting
- Check if localStorage is available (browser console: `localStorage`)
- Verify you're not in private/incognito mode
- Check browser storage settings

---

## System Requirements (系统要求)

- **Node.js**: 14.0 or higher
- **npm**: 6.0 or higher
- **Modern Browser**: Chrome, Firefox, Safari, or Edge (latest versions)
- **JavaScript**: Must be enabled

---

## Quick Start (快速开始)

```bash
# Clone the repository (克隆仓库)
git clone <repository-url>
cd Medieval-Village-Chronicle

# Install dependencies (安装依赖)
npm install

# Start the game (启动游戏)
npm run dev

# Open browser to (在浏览器中打开)
# http://localhost:3000
```

Enjoy playing Medieval Village Chronicle! 祝你游戏愉快！
