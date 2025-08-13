import React, { useState, useEffect } from 'react';

export default function Application() {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [gameHistory, setGameHistory] = useState([]);
  const [promptsUsed, setPromptsUsed] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [score, setScore] = useState(100);
  const [gameWon, setGameWon] = useState(false);
  const [showHints, setShowHints] = useState({ H1: false, H2: false, H3: false });
  const [loading, setLoading] = useState(false);
  const [currentQuestionId, setCurrentQuestionId] = useState(1);

  // Load questions on component mount
  useEffect(() => {
    fetchQuestions();
    fetchCurrentQuestion(1);
  }, []);

  const fetchQuestions = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/questions');
      const data = await response.json();
      setQuestions(data.questions);
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const fetchCurrentQuestion = async (id) => {
    try {
      const response = await fetch(`http://localhost:3001/api/current-question?id=${id}`);
      const data = await response.json();
      setCurrentQuestion(data);
      setCurrentQuestionId(id);
      resetGame();
    } catch (error) {
      console.error('Error fetching question:', error);
    }
  };

  const resetGame = () => {
    setGameHistory([]);
    setPromptsUsed(0);
    setHintsUsed(0);
    setScore(100);
    setGameWon(false);
    setShowHints({ H1: false, H2: false, H3: false });
  };

  const handleSubmit = async () => {
    if (!userInput.trim() || !currentQuestion) return;
    
    setLoading(true);
    setPromptsUsed(prev => prev + 1);
    
    try {
      const response = await fetch('http://localhost:3001/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: userInput.trim(),
          questionId: currentQuestionId
        }),
      });
      
      const data = await response.json();
      
      if (data.error) {
        setGameHistory(prev => [...prev, { 
          type: 'error', 
          content: `Error: ${data.error}`, 
          details: data.reason 
        }]);
      } else {
        const validation = data.validation;
        const isCorrect = validation.pass;
        
        if (isCorrect) {
          setGameWon(true);
          setScore(prev => Math.max(prev - (promptsUsed * 5) - (hintsUsed * 10), 0));
        }
        
        setGameHistory(prev => [...prev, 
          { type: 'question', content: userInput.trim() },
          { 
            type: 'answer', 
            content: data.output,
            validation: validation,
            isCorrect: isCorrect
          }
        ]);
      }
    } catch (error) {
      setGameHistory(prev => [...prev, { 
        type: 'error', 
        content: 'Network error occurred. Please try again.' 
      }]);
    }
    
    setUserInput('');
    setLoading(false);
  };

  const useHint = (hintType) => {
    if (!showHints[hintType]) {
      setHintsUsed(prev => prev + 1);
      setShowHints(prev => ({ ...prev, [hintType]: true }));
    }
  };

  const nextQuestion = () => {
    if (currentQuestionId < questions.length) {
      fetchCurrentQuestion(currentQuestionId + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionId > 1) {
      fetchCurrentQuestion(currentQuestionId - 1);
    }
  };

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-100 text-black p-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="neu-card p-8 rounded-3xl">
            <h1 className="text-4xl font-bold mb-4">Loading...</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 text-black p-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Game Area */}
        <div className="lg:col-span-2">
          <div className="neu-card p-8 rounded-3xl">
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-4xl font-bold mb-2">PromptCraft</h1>
              <p className="text-gray-600 text-lg">Craft the perfect prompt to get the exact output from the AI model.</p>
            </div>

            {/* Question Info */}
            <div className="mb-6">
              <div className="text-center mb-4">
                <span className="text-lg font-semibold">Question {currentQuestion.id} / {questions.length} • Difficulty: {currentQuestion.difficulty}</span>
              </div>
              
              {/* Exemplars */}
              <div className="neu-card p-4 rounded-2xl mb-4">
                <span className="inline-block bg-blue-600 text-white px-2 py-1 rounded text-sm font-medium mb-2">Exemplars</span>
                <div className="space-y-2">
                  {currentQuestion.exemplars.map((exemplar, index) => (
                    <p key={index} className="text-gray-700 text-sm">{exemplar}</p>
                  ))}
                </div>
              </div>
            </div>

            {/* Game History */}
            <div className="neu-card p-6 rounded-2xl mb-6 min-h-64">
              {gameHistory.length === 0 ? (
                <div className="text-center text-gray-500 mt-20">
                  <p>Start by crafting a prompt to get the AI to output the target!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {gameHistory.map((item, index) => (
                    <div key={index} className={`p-3 rounded-lg ${
                      item.type === 'question' ? 'bg-blue-50 border-l-4 border-blue-400' :
                      item.type === 'answer' ? (item.isCorrect ? 'bg-green-50 border-l-4 border-green-400' : 'bg-red-50 border-l-4 border-red-400') :
                      item.type === 'error' ? 'bg-red-50 border-l-4 border-red-400' :
                      'bg-gray-50'
                    }`}>
                      <div className="font-medium text-sm text-gray-600 mb-1">
                        {item.type === 'question' ? 'Your prompt:' :
                         item.type === 'answer' ? (item.isCorrect ? 'Correct output!' : 'Incorrect output') :
                         item.type === 'error' ? 'Error' : ''}
                      </div>
                      <div className="text-gray-800 mb-2">{item.content}</div>
                      {item.type === 'answer' && !item.isCorrect && item.validation && (
                        <div className="text-sm text-red-600">
                          <p><strong>Expected:</strong> {item.validation.normalized_target}</p>
                          <p><strong>Got:</strong> {item.validation.normalized_output}</p>
                          {item.validation.diff && item.validation.diff.hints && (
                            <div className="mt-2">
                              <p><strong>Hints:</strong></p>
                              <ul className="list-disc list-inside">
                                {item.validation.diff.hints.map((hint, i) => (
                                  <li key={i}>{hint}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                      {item.type === 'error' && item.details && (
                        <div className="text-sm text-red-600">
                          <p><strong>Reason:</strong> {item.details}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Craft your prompt here..."
                className="flex-1 p-3 rounded-2xl neu-input"
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                disabled={loading}
              />
              <button 
                onClick={handleSubmit}
                disabled={loading || !userInput.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-2xl neu-btn hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send'}
              </button>
            </div>

            {/* Hint Buttons */}
            <div className="flex gap-3 mb-4">
              <button 
                onClick={() => useHint('H1')}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Hint 1
              </button>
              <button 
                onClick={() => useHint('H2')}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Hint 2
              </button>
              <button 
                onClick={() => useHint('H3')}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Hint 3
              </button>
            </div>

            {/* Hint Display */}
            {Object.entries(showHints).map(([hintType, isVisible]) => (
              isVisible && (
                <div key={hintType} className="mt-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <strong>Hint {hintType.slice(1)}:</strong> {currentQuestion.hints[hintType]}
                </div>
              )
            ))}

            {/* Win Message */}
            {gameWon && (
              <div className="mt-6 p-6 bg-green-50 border border-green-200 rounded-2xl text-center">
                <h3 className="text-2xl font-bold text-green-800 mb-2">🎉 Congratulations!</h3>
                <p className="text-green-700">You successfully crafted a prompt that produced the exact output!</p>
                <p className="text-green-600 mt-2">Final Score: {score}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-1">
          {/* Progress Section */}
          <div className="neu-card p-6 rounded-2xl mb-6">
            <h3 className="text-xl font-bold mb-4">Progress</h3>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span>Prompts used:</span>
                <span className="font-semibold">{promptsUsed}</span>
              </div>
              <div className="flex justify-between">
                <span>Hints used:</span>
                <span className="font-semibold">{hintsUsed}</span>
              </div>
              <div className="flex justify-between">
                <span>Score:</span>
                <span className="font-semibold">{score}</span>
              </div>
            </div>

            {/* Question Navigation */}
            <div className="grid grid-cols-5 gap-2 mb-4">
              {questions.map((question) => (
                <button
                  key={question.id}
                  onClick={() => fetchCurrentQuestion(question.id)}
                  className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                    question.id === currentQuestionId 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {question.id}
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button 
                onClick={resetGame}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Restart Question
              </button>
              <div className="flex gap-2">
                <button 
                  onClick={previousQuestion}
                  disabled={currentQuestionId <= 1}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  Previous
                </button>
                <button 
                  onClick={nextQuestion}
                  disabled={currentQuestionId >= questions.length}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {/* Prompting Tips */}
          <div className="neu-card p-6 rounded-2xl">
            <h3 className="text-xl font-bold mb-4">Prompting Tips</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                Be specific about the exact format you want.
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                Use the exemplars as a guide for your prompt style.
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                Pay attention to case, punctuation, and spacing.
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                Use hints when you're stuck, but they cost points.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
