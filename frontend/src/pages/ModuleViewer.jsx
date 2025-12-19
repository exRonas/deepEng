import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, ArrowRight, HelpCircle, Sparkles } from 'lucide-react';

const ModuleViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [module, setModule] = useState(null);
  const [currentStep, setCurrentStep] = useState(0); // 0 = theory, 1+ = exercises
  const [answers, setAnswers] = useState({});
  const [showFeedback, setShowFeedback] = useState(null); // { isCorrect, explanation }
  const [aiHelp, setAiHelp] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    const fetchModule = async () => {
      try {
        const res = await axios.get(`/api/modules/${id}`);
        setModule(res.data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchModule();
  }, [id]);

  if (!module) return <div className="container">Loading...</div>;

  const content = JSON.parse(module.content || '{}');
  const exercises = module.exercises || [];
  const isTheoryStep = currentStep === 0 && (content.theory || content.text);
  const currentExerciseIndex = isTheoryStep ? -1 : (content.theory || content.text ? currentStep - 1 : currentStep);
  const currentExercise = currentExerciseIndex >= 0 ? exercises[currentExerciseIndex] : null;

  const handleAnswer = (answer) => {
    const isCorrect = answer.toLowerCase().trim() === currentExercise.correct_answer.toLowerCase().trim();
    setAnswers({ ...answers, [currentExercise.id]: answer });
    setShowFeedback({
      isCorrect,
      explanation: currentExercise.explanation
    });
  };

  const askAI = async () => {
    setLoadingAi(true);
    try {
      const res = await axios.post('/api/chat', {
        messages: [
          { role: 'user', content: `I am stuck on this question: "${currentExercise.question}". Can you explain it simply?` }
        ],
        context: { 
          moduleId: module.id, 
          moduleTitle: module.title,
          moduleType: module.type,
          exerciseType: currentExercise.type 
        }
      });
      setAiHelp(res.data.content);
    } catch (error) {
      setAiHelp("Sorry, I can't help right now.");
    } finally {
      setLoadingAi(false);
    }
  };

  const nextStep = () => {
    setShowFeedback(null);
    setAiHelp('');
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate('/'); // Finish
    }
  };

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem' }}>{module.title}</h1>
        <p style={{ color: 'var(--text-muted)' }}>{module.description}</p>
      </div>

      {/* THEORY BLOCK */}
      {isTheoryStep && (
        <div className="card">
          <h2 style={{ marginBottom: '1.5rem' }}>📚 Let's Learn!</h2>
          
          {content.theory && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '1.1rem' }}>
              {content.theory.map((line, idx) => (
                <div key={idx} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--primary)">$1</strong>') }} />
              ))}
            </div>
          )}

          {content.text && (
            <div style={{ background: '#EFF6FF', padding: '1.5rem', borderRadius: '12px', marginBottom: '1rem' }}>
              <p style={{ fontSize: '1.2rem', lineHeight: '1.8' }}>{content.text}</p>
              <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Translation: {content.translation}</p>
            </div>
          )}

          <button className="btn btn-primary" onClick={() => setCurrentStep(currentStep + 1)} style={{ marginTop: '2rem', width: '100%' }}>
            Start Exercises <ArrowRight size={18} style={{ marginLeft: '0.5rem' }} />
          </button>
        </div>
      )}

      {/* EXERCISE BLOCK */}
      {currentExercise && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span className="badge badge-blue">Exercise {currentExerciseIndex + 1} / {exercises.length}</span>
            <button onClick={askAI} style={{ background: 'none', border: 'none', color: 'var(--secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              <Sparkles size={16} /> Ask AI Help
            </button>
          </div>

          <h2 style={{ marginBottom: '2rem' }}>{currentExercise.question}</h2>

          {/* AI Help Box */}
          {aiHelp && (
            <div style={{ background: '#F0FDF4', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #BBF7D0', fontSize: '0.95rem' }}>
              <strong>🤖 AI Tutor:</strong> {aiHelp}
            </div>
          )}
          {loadingAi && <div style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>Thinking...</div>}

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {currentExercise.type === 'multiple-choice' || currentExercise.type === 'true-false' ? (
              currentExercise.options.map(opt => (
                <button
                  key={opt}
                  onClick={() => !showFeedback && handleAnswer(opt)}
                  style={{
                    padding: '1rem',
                    borderRadius: '12px',
                    border: '2px solid var(--border-light)',
                    background: answers[currentExercise.id] === opt 
                      ? (showFeedback?.isCorrect ? '#D1FAE5' : '#FEE2E2') 
                      : 'white',
                    borderColor: answers[currentExercise.id] === opt 
                      ? (showFeedback?.isCorrect ? 'var(--secondary)' : '#EF4444') 
                      : 'var(--border-light)',
                    textAlign: 'left',
                    cursor: showFeedback ? 'default' : 'pointer',
                    fontWeight: '500'
                  }}
                >
                  {opt}
                </button>
              ))
            ) : (
              <div style={{ display: 'flex', gap: '1rem' }}>
                <input 
                  className="input-field" 
                  placeholder="Type your answer..."
                  disabled={!!showFeedback}
                  onKeyPress={(e) => e.key === 'Enter' && !showFeedback && handleAnswer(e.target.value)}
                />
                <button className="btn btn-primary" onClick={(e) => !showFeedback && handleAnswer(e.target.previousSibling.value)}>Check</button>
              </div>
            )}
          </div>

          {/* Feedback & Next Button */}
          {showFeedback && (
            <div style={{ marginTop: '2rem', animation: 'fadeIn 0.3s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: showFeedback.isCorrect ? 'var(--secondary)' : '#EF4444', fontWeight: 'bold' }}>
                {showFeedback.isCorrect ? <CheckCircle2 /> : <XCircle />}
                {showFeedback.isCorrect ? 'Correct!' : 'Not quite right.'}
              </div>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{showFeedback.explanation}</p>
              <button className="btn btn-primary" onClick={nextStep} style={{ width: '100%' }}>
                Next <ArrowRight size={18} style={{ marginLeft: '0.5rem' }} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ModuleViewer;
