# PromptCraft — Local dev setup

A prompt engineering game where players craft prompts to get AI models to output specific targets.

## Structure
- `frontend/` — React app with neumorphic UI design
- `server/` — Node/Express backend (generation + evaluator)
- `data/` — Game questions, hints, and system instructions

## Quick start

### Option 1: Automated Setup (Windows)
1. **Double-click `start.bat`** (Command Prompt) or **run `start.ps1`** (PowerShell)
2. The script will:
   - Create environment file from template
   - Install dependencies
   - Start both frontend and backend

### Option 2: Manual Setup

1. **Clone repository** (or copy files into folders as shown)

2. **Set up environment**
   ```bash
   cd server
   copy env.example .env
   # Edit .env and add your API keys
   ```

3. **Install dependencies**
   ```bash
   # Frontend
   cd frontend
   npm install
   
   # Backend
   cd ../server
   npm install
   ```

4. **Start services**
   ```bash
   # Terminal 1: Backend
   cd server
   npm run dev
   
   # Terminal 2: Frontend
   cd frontend
   npm start
   ```

## Environment Setup

1. Copy `server/env.example` to `server/.env`
2. Fill in your API keys:
   - **For OpenAI**: Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
   - **For Hugging Face**: Get your API key from [Hugging Face](https://huggingface.co/settings/tokens)

## Switching LLM provider

Edit the `.env` file in `server/` and set `MODEL_PROVIDER` to `openai` or `huggingface`. Fill respective API keys and HF model URL.

## Ports

- **Backend**: http://localhost:3001
- **Frontend**: http://localhost:3000 (proxies to backend)

## Game Features

- **20 progressive difficulty levels** from simple words to complex sentences
- **Real-time validation** with detailed feedback
- **Hint system** (costs points)
- **Anticheat protection** against target leakage
- **Beautiful neumorphic UI** design

## Notes

- The evaluator is rule-based and simple. You can replace it with an LLM-based rubric later.
- For local free usage, use a small HF model. Performance and quality vary.
- Make sure both frontend and backend are running simultaneously for the app to work properly.
- The frontend proxy is configured to target the backend at `http://localhost:3001`.

## Troubleshooting

- **Port conflicts**: Ensure ports 3000 and 3001 are available
- **API errors**: Check your `.env` file and API keys
- **Build errors**: Run `npm install` in both frontend and server directories
- **Proxy issues**: Verify the proxy setting in `frontend/package.json` points to `http://localhost:3001`