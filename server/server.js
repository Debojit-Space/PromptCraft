import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Import validator and anticheat
import { validateOutput, Presets } from './validator.js';
import { promptAllowed } from '../frontend/src/anticheat.js';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load data files
const questionsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/questions.json'), 'utf8'));
const hintsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/hints.json'), 'utf8'));
const systemInstructions = fs.readFileSync(path.join(__dirname, '../data/system_instructions.txt'), 'utf8');
const scoringInstructions = fs.readFileSync(path.join(__dirname, '../data/scoring.txt'), 'utf8');

const MODEL_PROVIDER = process.env.MODEL_PROVIDER || 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Get current question
app.get('/api/current-question', (req, res) => {
  const questionId = parseInt(req.query.id) || 1;
  const question = questionsData.targets.find(q => q.id === questionId);
  const hints = hintsData.hints.find(h => h.id === questionId);
  
  if (!question || !hints) {
    return res.status(404).json({ error: 'Question not found' });
  }
  
  res.json({
    id: question.id,
    difficulty: question.difficulty,
    exemplars: question.exemplars,
    target: question.target,
    hints: {
      H1: hints.H1,
      H2: hints.H2,
      H3: hints.H3
    }
  });
});

// Get all questions (without targets)
app.get('/api/questions', (req, res) => {
  const questions = questionsData.targets.map(q => ({
    id: q.id,
    difficulty: q.difficulty
  }));
  res.json({ questions });
});

// Generate response from LLM
app.post('/api/generate', async (req, res) => {
  const { prompt, questionId } = req.body || {};
  if (!prompt || !questionId) {
    return res.status(400).json({ error: 'prompt and questionId are required' });
  }

  try {
    // Find the target for validation
    const question = questionsData.targets.find(q => q.id === parseInt(questionId));
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Anticheat check
    const anticheatResult = promptAllowed(prompt, question.target, question.difficulty);
    if (!anticheatResult.ok) {
      return res.status(400).json({ 
        error: 'Prompt not allowed', 
        reason: anticheatResult.reason 
      });
    }

    // Get system instructions
    const systemPrompt = systemInstructions.replace('System instructions (to model):\n\n', '');

    if (MODEL_PROVIDER === 'huggingface') {
      const HF_URL = process.env.HF_API_URL;
      const HF_TOKEN = process.env.HF_API_KEY;
      const hfResp = await fetch(HF_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${HF_TOKEN}` 
        },
        body: JSON.stringify({ inputs: prompt })
      });
      const hfJson = await hfResp.json();
      const output = hfJson.generated_text ?? (Array.isArray(hfJson) ? (hfJson[0]?.generated_text || JSON.stringify(hfJson)) : JSON.stringify(hfJson));
      
      // Validate output
      const validation = validateOutput(output, question.target, Presets.Intermediate);
      
      return res.json({ 
        output: output.trim(),
        validation,
        target: question.target
      });
    } else {
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 200
      });
      
      const output = completion.choices[0].message.content.trim();
      
      // Validate output
      const validation = validateOutput(output, question.target, Presets.Intermediate);
      
      return res.json({ 
        output,
        validation,
        target: question.target
      });
    }
  } catch (err) {
    console.error('Generate error:', err);
    return res.status(500).json({ 
      error: 'LLM generation failed', 
      detail: String(err?.message ?? err) 
    });
  }
});

// Get scoring instructions
app.get('/api/scoring', (req, res) => {
  res.json({ instructions: scoringInstructions });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`PromptCraft server running on port ${PORT}`));
