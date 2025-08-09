# Prompt Master — Local dev setup

## Structure
- `frontend/` — React app (neumorphic UI)
- `server/` — Node/Express backend (generation + evaluator)

## Quick start
1. Clone repository (or copy files into folders as shown).

2. Frontend
```bash
cd frontend
npm install
npm start
```

3. Backend
```bash
cd server
npm install
# copy env.example to .env and fill keys
npm run dev
```

4. The frontend proxy is already configured to target the backend at `http://localhost:5173`.

## Environment Setup
1. Copy `server/env.example` to `server/.env`
2. Fill in your API keys:
   - For OpenAI: Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
   - For Hugging Face: Get your API key from [Hugging Face](https://huggingface.co/settings/tokens)

## Switching LLM provider
Edit the `.env` file in `server/` and set `MODEL_PROVIDER` to `openai` or `huggingface`. Fill respective API keys and HF model URL.

## Notes
- The evaluator is rule-based and simple. You can replace it with an LLM-based rubric later.
- For local free usage, use a small HF model. Performance and quality vary.
- Make sure both frontend and backend are running simultaneously for the app to work properly.