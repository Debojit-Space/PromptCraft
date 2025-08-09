import React, { useState } from 'react';

const mockChallenges = [
  {
    id: 1,
    level: 'Beginner',
    title: 'Tell a joke about cats',
    description: 'Write a short, funny joke involving cats.',
    instruction: 'Type a simple prompt asking the AI for a cat joke.',
    learning: 'Zero-shot prompting: Asking the AI without giving examples.'
  },
  {
    id: 2,
    level: 'Intermediate',
    title: 'Format a list in a table',
    description: 'Ask the AI to list 3 fruits and their colors in a table.',
    instruction: 'Type a prompt that asks the AI to list fruits and their colors, formatted as a table.',
    learning: 'Few-shot prompting: Providing small examples for formatting.'
  },
  {
    id: 3,
    level: 'Advanced',
    title: 'Summarize and Ask Questions',
    description: 'Give the AI a paragraph and ask it to summarize in bullet points, then suggest 3 questions.',
    instruction: 'Type a prompt where you give the AI a paragraph, ask it to summarize in bullet points, then create 3 questions.',
    learning: 'Combination prompting: Multiple tasks in a single prompt.'
  },
];
export default function App() {
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0);
  const [userPrompt, setUserPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState([]);

  const challenge = mockChallenges[currentChallengeIndex];

  const handleSubmit = async () => {
    if (!userPrompt.trim()) return alert('Please write your prompt.');
    setLoading(true);
    setAiResponse('');
    setEvaluation(null);

    try {
      const genRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userPrompt, challengeId: challenge.id })
      });
      const genJson = await genRes.json();
      const modelOutput = genJson.output ?? 'No output from model.';
      setAiResponse(modelOutput);

      const evalRes = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId: challenge.id, modelOutput })
      });
      const evalJson = await evalRes.json();
      setEvaluation(evalJson);
      if (evalJson.passed) setCompleted((prev) => (prev.includes(challenge.id) ? prev : [...prev, challenge.id]));
    } catch (err) {
      console.error(err);
      alert('Error contacting server. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentChallengeIndex < mockChallenges.length - 1) {
      setCurrentChallengeIndex((p) => p + 1);
      setUserPrompt('');
      setAiResponse('');
      setEvaluation(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 text-black p-6 flex justify-center items-start">
      <div className="max-w-3xl w-full p-6 rounded-3xl bg-gray-100 neu-card">
        <h1 className="text-3xl font-bold mb-4 text-center">Prompt Master</h1>

        <div className="mb-4">
          <h2 className="text-lg font-medium">Level: {challenge.level}</h2>
          <h3 className="text-xl font-semibold mt-2">{challenge.title}</h3>
          <p className="text-gray-600 mt-1">{challenge.description}</p>
          <p className="mt-2 instr">Instruction: {challenge.instruction}</p>
        </div>

        <textarea
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
          placeholder={challenge.instruction}
          className="w-full p-4 rounded-2xl neu-input"
          rows={6}
        />

        <button onClick={handleSubmit} disabled={loading} className="mt-4 w-full py-3 rounded-2xl neu-btn">
          {loading ? 'Running...' : 'Submit Prompt'}
        </button>

        {aiResponse && (
          <div className="mt-6 p-4 rounded-2xl neu-response">
            <h4 className="font-semibold mb-2">AI Response:</h4>
            <pre className="whitespace-pre-wrap">{aiResponse}</pre>

            <div className="mt-4 text-sm">
              <strong>What You Learned:</strong> {challenge.learning}
            </div>

            {evaluation && (
              <div className="mt-4 p-3 rounded-lg eval-box">
                <strong>Eval Score:</strong> {evaluation.score} / 100
                <div className="mt-2"><strong>Passed:</strong> {evaluation.passed ? 'Yes' : 'No'}</div>
                <div className="mt-2"><strong>Feedback:</strong>
                  <ul className="ml-5 list-disc">
                    {evaluation.feedback.map((f, idx) => (<li key={idx}>{f}</li>))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {completed.includes(challenge.id) && currentChallengeIndex < mockChallenges.length - 1 && (
          <button onClick={handleNext} className="mt-4 w-full py-3 rounded-2xl neu-btn">Next Challenge</button>
        )}

        {currentChallengeIndex === mockChallenges.length - 1 && completed.includes(challenge.id) && (
          <div className="mt-6 text-yellow-600 font-bold text-center">🎉 You finished all challenges!</div>
        )}
      </div>
    </div>
  );
}