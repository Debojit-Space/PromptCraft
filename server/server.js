import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const MODEL_PROVIDER = process.env.MODEL_PROVIDER || 'openai';
// expectations for evaluator
const challengeExpectations = {
  1: { type: 'joke', keywords: ['cat', 'cats'], maxWords: 40 },
  2: { type: 'table', rows: 3 },
  3: { type: 'summary_and_questions', bulletsMin: 2, questionsMin: 3 }
};

// helper when using OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/api/generate', async (req, res) => {
  const { prompt, challengeId } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'prompt is required' });

  try {
    if (MODEL_PROVIDER === 'huggingface') {
      const HF_URL = process.env.HF_API_URL;
      const HF_TOKEN = process.env.HF_API_KEY;
      const hfResp = await fetch(HF_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${HF_TOKEN}` },
        body: JSON.stringify({ inputs: prompt })
      });
      const hfJson = await hfResp.json();
      // many HF endpoints return { generated_text } or array
      const out = hfJson.generated_text ?? (Array.isArray(hfJson) ? (hfJson[0]?.generated_text || JSON.stringify(hfJson)) : JSON.stringify(hfJson));
      return res.json({ output: out });
    } else {
      const system = 'You are a helpful assistant. Answer concisely.';
      const user = `${prompt}\n\nRespond only with the answer (no meta commentary).`;
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        messages: [ { role: 'system', content: system }, { role: 'user', content: user } ],
        temperature: 0.7,
        max_tokens: 400
      });
      const output = completion.choices[0].message.content.trim();
      return res.json({ output });
    }
  } catch (err) {
    console.error('Generate error:', err);
    return res.status(500).json({ error: 'LLM generation failed', detail: String(err?.message ?? err) });
  }
});

app.post('/api/evaluate', (req, res) => {
  const { challengeId, modelOutput } = req.body || {};
  if (!challengeId || typeof modelOutput !== 'string') return res.status(400).json({ error: 'challengeId and modelOutput are required' });

  const expect = challengeExpectations[challengeId];
  if (!expect) return res.json({ score: 50, passed: false, feedback: ['No expectations configured for this challenge.'] });

  const feedback = [];
  let score = 50;
  const text = modelOutput.toLowerCase();

  if (expect.type === 'joke') {
    const hasKeyword = expect.keywords.some((k) => text.includes(k));
    if (hasKeyword) score += 30; else feedback.push("The joke doesn't mention cats explicitly.");
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length <= expect.maxWords) score += 20; else feedback.push(`The joke is too long (aim <= ${expect.maxWords} words).`);
  } else if (expect.type === 'table') {
    const hasTable = text.includes('|') || (text.split('\n').filter((l) => l.trim()).length >= expect.rows + 1);
    if (hasTable) score += 50; else {
      const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
      const fruitLines = lines.filter((l) => /\b(apple|banana|orange|grape|mango|pear|kiwi|strawberry|blueberry)\b/i.test(l));
      if (fruitLines.length >= expect.rows) score += 40; else feedback.push("Couldn't find 3 fruits and colors in a table or list.");
    }
  } else if (expect.type === 'summary_and_questions') {
    const bullets = modelOutput.split('\n').filter((l) => l.trim().startsWith('-') || l.trim().startsWith('*') || l.trim().startsWith('•'));
    if (bullets.length >= expect.bulletsMin) score += 40; else feedback.push(`Summary should include at least ${expect.bulletsMin} bullet points.`);
    const questions = modelOutput.split('\n').filter((l) => l.trim().endsWith('?'));
    if (questions.length >= expect.questionsMin) score += 10 + 10 * (questions.length >= expect.questionsMin); else feedback.push(`Should produce at least ${expect.questionsMin} questions (lines ending with '?').`);
  }

  score = Math.max(0, Math.min(100, score));
  const passed = score >= 70;
  if (feedback.length === 0) feedback.push('Looks good!');
  return res.json({ score, passed, feedback });
});

const PORT = process.env.PORT || 5173;
app.listen(PORT, () => console.log(`Evaluator server running on port ${PORT}`));
