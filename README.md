<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1tp1aU7ub4lMiDZ1SSsxVophCI4ITuEZV

## Architecture

This application consists of two parts:

1. **Frontend (React + Vite)**: Game UI and logic
2. **Backend API (Node.js + Express)**: AI event and bio generation using Gemini API

The backend API isolates AI API calls from the frontend, providing better security and control.

## Run Locally

**Prerequisites:** Node.js

### Quick Start

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

## Environment Variables

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:3001
```

### Backend (server/.env.local)
```
GEMINI_API_KEY=your_gemini_api_key_here
```

