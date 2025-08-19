import { validateOutput, Presets } from './validator.js';
import { promptAllowed } from '../frontend/src/anticheat.js';
import OpenAI from 'openai';

import questionsData from '../data/questions.json' assert { type: 'json' };
import hintsData from '../data/hints.json' assert { type: 'json' };
import systemInstructions from '../data/system_instructions.txt' assert { type: 'text' };
import scoringInstructions from '../data/scoring.txt' assert { type: 'text' };

function withCors(response) {
  const newHeaders = new Headers(response.headers);
  newHeaders.set("Access-Control-Allow-Origin", "*");
  newHeaders.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  newHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return new Response(response.body, { status: response.status, headers: newHeaders });
}

async function runCloudflareAI(env, model, input) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/ai/run/${model}`,
    {
      headers: { Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}` },
      method: "POST",
      body: JSON.stringify(input),
    }
  );
  const result = await response.json();
  return result;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    if (url.pathname === "/api/current-question" && request.method === "GET") {
      const questionId = parseInt(url.searchParams.get("id") || "1");
      const question = questionsData.targets.find(q => q.id === questionId);
      const hints = hintsData.hints.find(h => h.id === questionId);

      if (!question || !hints) {
        return withCors(new Response(JSON.stringify({ error: "Question not found" }), { status: 404 }));
      }
      return withCors(Response.json({
        id: question.id,
        difficulty: question.difficulty,
        exemplars: question.exemplars,
        target: question.target,
        hints: { H1: hints.H1, H2: hints.H2, H3: hints.H3 }
      }));
    }

    if (url.pathname === "/api/questions" && request.method === "GET") {
      const questions = questionsData.targets.map(q => ({
        id: q.id,
        difficulty: q.difficulty
      }));
      return withCors(Response.json({ questions }));
    }

    if (url.pathname === "/api/generate" && request.method === "POST") {
      const body = await request.json();
      const { prompt, questionId } = body || {};
      if (!prompt || !questionId) {
        return withCors(new Response(JSON.stringify({ error: "prompt and questionId are required" }), { status: 400 }));
      }

      const question = questionsData.targets.find(q => q.id === parseInt(questionId));
      if (!question) {
        return withCors(new Response(JSON.stringify({ error: "Question not found" }), { status: 404 }));
      }

      const anticheatResult = promptAllowed(prompt, question.target, question.difficulty);
      if (!anticheatResult.ok) {
        return withCors(new Response(JSON.stringify({ error: "Prompt not allowed", reason: anticheatResult.reason }), { status: 400 }));
      }

      const systemPrompt = systemInstructions.replace("System instructions (to model):\n\n", "");
      let output;
      if (env.MODEL_PROVIDER === "cloudflare") {
        const cfResult = await runCloudflareAI(env, env.CLOUDFLARE_MODEL, {
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
          ],
        });
        output = cfResult.result?.response || cfResult.result?.output || JSON.stringify(cfResult);
      } else {
        const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY, baseURL: "https://gateway.ai.cloudflare.com/v1/9e20a2d23e8227768214ace8238988ed/promptcraft-ai-gateway/openai" });
        const completion = await openai.chat.completions.create({
          model: env.OPENAI_MODEL || "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
          ],
          temperature: 0.1,
          max_tokens: 200
        });
        output = completion.choices[0].message.content.trim();
      }

      const validation = validateOutput(output, question.target, Presets.Intermediate);
      return withCors(Response.json({ output, validation, target: question.target }));
    }

    if (url.pathname === "/api/scoring" && request.method === "GET") {
      return withCors(Response.json({ instructions: scoringInstructions }));
    }

    return withCors(new Response("Not found", { status: 404 }));
  }
};
