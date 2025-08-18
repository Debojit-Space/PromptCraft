import { validateOutput, Presets } from './validator.js';
import { promptAllowed } from '../frontend/src/anticheat.js';
import OpenAI from 'openai';

// Load static data at startup
import questionsData from '../data/questions.json' assert { type: 'json' };
import hintsData from '../data/hints.json' assert { type: 'json' };
import systemInstructions from '../data/system_instructions.txt' assert { type: 'text' };
import scoringInstructions from '../data/scoring.txt' assert { type: 'text' };

export default {
  async fetch(request, env, ctx) {
    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    const url = new URL(request.url);

    // GET /api/current-question?id=1
    if (url.pathname === "/api/current-question" && request.method === "GET") {
      const questionId = parseInt(url.searchParams.get("id") || "1");
      const question = questionsData.targets.find(q => q.id === questionId);
      const hints = hintsData.hints.find(h => h.id === questionId);

      if (!question || !hints) {
        return new Response(JSON.stringify({ error: "Question not found" }), { status: 404 });
      }
      return Response.json({
        id: question.id,
        difficulty: question.difficulty,
        exemplars: question.exemplars,
        target: question.target,
        hints: { H1: hints.H1, H2: hints.H2, H3: hints.H3 }
      });
    }

    // GET /api/questions
    if (url.pathname === "/api/questions" && request.method === "GET") {
      const questions = questionsData.targets.map(q => ({
        id: q.id,
        difficulty: q.difficulty
      }));
      return Response.json({ questions });
    }

    // POST /api/generate
    if (url.pathname === "/api/generate" && request.method === "POST") {
      const body = await request.json();
      const { prompt, questionId } = body || {};
      if (!prompt || !questionId) {
        return new Response(JSON.stringify({ error: "prompt and questionId are required" }), { status: 400 });
      }

      const question = questionsData.targets.find(q => q.id === parseInt(questionId));
      if (!question) {
        return new Response(JSON.stringify({ error: "Question not found" }), { status: 404 });
      }

      const anticheatResult = promptAllowed(prompt, question.target, question.difficulty);
      if (!anticheatResult.ok) {
        return new Response(JSON.stringify({ error: "Prompt not allowed", reason: anticheatResult.reason }), { status: 400 });
      }

      const systemPrompt = systemInstructions.replace("System instructions (to model):\n\n", "");

      const completion = await openai.chat.completions.create({
        model: env.OPENAI_MODEL || "gpt-5-nano",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 200
      });

      const output = completion.choices[0].message.content.trim();
      const validation = validateOutput(output, question.target, Presets.Intermediate);

      return Response.json({ output, validation, target: question.target });
    }

    // GET /api/scoring
    if (url.pathname === "/api/scoring" && request.method === "GET") {
      return Response.json({ instructions: scoringInstructions });
    }

    return new Response("Not found", { status: 404 });
  }
};
