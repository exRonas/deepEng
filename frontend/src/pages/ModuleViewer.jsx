import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, ArrowRight, Sparkles, MessageSquare, Star } from 'lucide-react';
import InteractiveText from '../components/InteractiveText';
import FormattedText from '../components/FormattedText';
import WordWithAudio from '../components/WordWithAudio';

const ModuleViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [module, setModule] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showFeedback, setShowFeedback] = useState(null); // { isCorrect, explanation }
  const [aiHelp, setAiHelp] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [reflectionAnswers, setReflectionAnswers] = useState({});
  const [aiScore, setAiScore] = useState(0); // Score from AI task (0-100)

  // --- Inline AI Task State ---
  const [aiTaskMessages, setAiTaskMessages] = useState([]);
  const [aiTaskInput, setAiTaskInput] = useState('');
  const [aiTaskLoading, setAiTaskLoading] = useState(false);
  const [isAiChatStarted, setIsAiChatStarted] = useState(false);
  // ---------------------------

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

  // Construct the timeline of steps
  const steps = [];
  if (content.theory || content.text) steps.push({ type: 'theory', data: content });
  exercises.forEach(ex => steps.push({ type: 'exercise', data: ex }));
  if (content.ai_task) steps.push({ type: 'ai_task', data: content.ai_task });
  if (content.reflection) steps.push({ type: 'reflection', data: content.reflection });

  const currentStep = steps[currentStepIndex];
  const progressPercent = ((currentStepIndex) / steps.length) * 100;

  const handleExerciseAnswer = (answer) => {
    const ex = currentStep.data;
    const isCorrect = answer.toLowerCase().trim() === ex.correct_answer.toLowerCase().trim();
    
    setAnswers({ ...answers, [ex.id]: answer });
    setShowFeedback({
      isCorrect,
      explanation: ex.explanation
    });
  };

  const nextStep = () => {
    setShowFeedback(null);
    setAiHelp('');
    // Do NOT reset AI chat state just for navigation, so users can go back and forth
    // setIsAiChatStarted(false); 
    // setAiTaskMessages([]);
    // setAiTaskInput('');
    
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      navigate('/');
    }
  };

  const prevStep = () => {
    setShowFeedback(null);
    setAiHelp('');
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const askAI = async () => {
    setLoadingAi(true);
    try {
      const token = localStorage.getItem('token');
      const ex = currentStep.data;
      const res = await axios.post('/api/chat', {
        messages: [
          { role: 'user', content: `I am stuck on this question: "${ex.question}". Can you explain it simply?` }
        ],
        context: { 
          moduleId: module.id, 
          moduleTitle: module.title,
          moduleType: module.type,
          exerciseType: ex.type 
        }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAiHelp(res.data.content);
    } catch (error) {
      setAiHelp("Sorry, I can't help right now.");
    } finally {
      setLoadingAi(false);
    }
  };

  const renderTheory = (data) => (
    <div className="card">
      <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        📚 Учим теорию!
      </h2>
      
      {data.theory && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '1.1rem' }}>
          {data.theory.map((line, idx) => {
             // Check for "1. **word** - translation" pattern
             const wordMatch = line.match(/^\d+\.\s*\*\*(.+?)\*\*\s*-\s*(.+)$/);
             if (wordMatch) {
               const word = wordMatch[1];
               const translation = wordMatch[2];
               const cleanWord = word.trim().toLowerCase();
               const level = module.level ? module.level.toLowerCase() : 'a1';
               const type = module.type ? module.type.toLowerCase() : 'reading';
               // Example: /pronounce/a1/reading/pronunciation_en_live.mp3
               const audioUrl = `/pronounce/${level}/${type}/pronunciation_en_${cleanWord}.mp3`;
               
               return (
                 <WordWithAudio key={idx} word={word} translation={translation} audioUrl={audioUrl} />
               );
             }
             return (
               <div key={idx}>
                  <FormattedText text={line} />
               </div>
             );
          })}
        </div>
      )}

      {data.text && (
        <div style={{ background: '#EFF6FF', padding: '1.5rem', borderRadius: '12px', marginBottom: '1rem' }}>
          <p style={{ fontSize: '1.2rem', lineHeight: '1.8' }}>
             <InteractiveText content={data.text} />
          </p>
          {data.translation && (
             <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Перевод: {data.translation}</p>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          {currentStepIndex > 0 && (
            <button className="btn btn-outline" onClick={prevStep} style={{ flex: 1 }}>
                Назад
            </button>
          )}
          <button className="btn btn-primary" onClick={nextStep} style={{ flex: 1 }}>
            {currentStepIndex === steps.length - 1 ? 'Завершить' : 'Далее'} <ArrowRight size={18} style={{ marginLeft: '0.5rem' }} />
          </button>
      </div>
    </div>
  );

  const renderExercise = (ex) => (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <span className="badge badge-blue">Вопрос</span>
        <button onClick={askAI} style={{ background: 'none', border: 'none', color: 'var(--secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
          <Sparkles size={16} /> Помощь AI
        </button>
      </div>

      <h3 style={{ fontSize: '1.4rem', marginBottom: '2rem' }}>{ex.question}</h3>

      {/* AI Help Box */}
      {aiHelp && (
        <div style={{ background: '#F0FDF4', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #BBF7D0', fontSize: '0.95rem' }}>
          <strong>🤖 AI репетитор:</strong>
          <div style={{ marginTop: '0.5rem', color: '#1f2937' }}>
            <FormattedText text={aiHelp} />
          </div>
        </div>
      )}
      {loadingAi && <div style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>Думаю...</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {(ex.type === 'multiple-choice' || ex.type === 'true-false') && (
           ex.options.map(opt => {
            const isSelected = answers[ex.id] === opt;
            const isCorrect = isSelected 
                ? (showFeedback ? showFeedback.isCorrect : (opt.toLowerCase().trim() === ex.correct_answer.toLowerCase().trim()))
                : false;
                
            return (
            <button
              key={opt}
              onClick={() => !showFeedback && !answers[ex.id] && handleExerciseAnswer(opt)}
              className={`btn-outline ${isSelected ? 'selected' : ''}`}
              style={{
                textAlign: 'left',
                padding: '1rem',
                fontSize: '1.1rem',
                borderColor: isSelected 
                  ? (isCorrect ? 'var(--secondary)' : '#EF4444') 
                  : 'var(--border-light)',
                background: isSelected 
                  ? (isCorrect ? '#D1FAE5' : '#FEE2E2') 
                  : 'white',
               cursor: (showFeedback || answers[ex.id]) ? 'default' : 'pointer',
               opacity: (answers[ex.id] && !isSelected) ? 0.6 : 1
              }}
            >
              {opt}
            </button>
           )})
        )}

        {ex.type === 'matching' && (
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {ex.options.map(opt => {
                 const isSelected = answers[ex.id] === opt;
                 const isCorrect = isSelected
                    ? (showFeedback ? showFeedback.isCorrect : (opt.toLowerCase().trim() === ex.correct_answer.toLowerCase().trim()))
                    : false;

                 return (
                 <button 
                    key={opt}
                    onClick={() => !showFeedback && !answers[ex.id] && handleExerciseAnswer(opt)}
                    className="btn-outline"
                    style={{ 
                        background: isSelected ? (isCorrect ? '#D1FAE5' : '#FEE2E2') : 'white',
                        borderColor: isSelected ? (isCorrect ? 'var(--secondary)' : '#EF4444') : 'var(--border-light)',
                        opacity: (answers[ex.id] && !isSelected) ? 0.6 : 1,
                        cursor: (showFeedback || answers[ex.id]) ? 'default' : 'pointer'
                    }}
                  >
                    {opt}
                 </button>
              )})}
           </div>
        )}

        {ex.type === 'fill-gap' && (
           <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
               {ex.options.length > 0 ? (
                  ex.options.map(opt => {
                    const isSelected = answers[ex.id] === opt;
                    const isCorrect = isSelected
                        ? (showFeedback ? showFeedback.isCorrect : (opt.toLowerCase().trim() === ex.correct_answer.toLowerCase().trim()))
                        : false;
                    return (
                    <button 
                       key={opt}
                       onClick={() => !showFeedback && !answers[ex.id] && handleExerciseAnswer(opt)} 
                       className={`btn-outline ${isSelected ? 'selected' : ''}`}
                       style={{
                           background: isSelected ? (isCorrect ? '#D1FAE5' : '#FEE2E2') : 'white',
                           borderColor: isSelected ? (isCorrect ? 'var(--secondary)' : '#EF4444') : 'var(--border-light)',
                           opacity: (answers[ex.id] && !isSelected) ? 0.6 : 1,
                           cursor: (showFeedback || answers[ex.id]) ? 'default' : 'pointer'
                       }}
                    >
                       {opt}
                    </button>
                  )})
               ) : (
                 <>
                  <input 
                    className="input-field" 
                    placeholder="Введите ответ..." 
                    disabled={!!showFeedback || !!answers[ex.id]}
                    defaultValue={answers[ex.id] || ''}
                    style={{
                        borderColor: answers[ex.id] 
                          ? ((showFeedback ? showFeedback.isCorrect : (answers[ex.id].toLowerCase().trim() === ex.correct_answer.toLowerCase().trim())) ? 'var(--secondary)' : '#EF4444')
                          : undefined
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && !showFeedback && !answers[ex.id] && handleExerciseAnswer(e.target.value)}
                  />
                  {!answers[ex.id] && (
                      <button className="btn btn-primary" onClick={(e) => !showFeedback && handleExerciseAnswer(e.target.previousSibling.value)}>
                         Проверить
                      </button>
                  )}
                 </>
               )}
           </div>
        )}
      </div>

      {(showFeedback || answers[ex.id]) && (
        <div style={{ marginTop: '2rem', animation: 'fadeIn 0.3s' }}>
          {/* Re-calculate or use showFeedback for visual state */}
          {(() => {
              const isCorrect = showFeedback ? showFeedback.isCorrect : (answers[ex.id]?.toLowerCase().trim() === ex.correct_answer.toLowerCase().trim());
              return (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: isCorrect ? 'var(--secondary)' : '#EF4444', fontWeight: 'bold' }}>
                        {isCorrect ? <CheckCircle2 /> : <XCircle />}
                        {isCorrect ? 'Правильно!' : 'Завершено.'}
                    </div>
                    {/* Show explanation only if we have it in state or if we just decide to show nothing on re-visit */}
                    {showFeedback && <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{showFeedback.explanation}</p>}
                  </>
              );
          })()}
        </div>
      )}

      {/* Navigation Footer */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          {currentStepIndex > 0 && (
            <button className="btn btn-outline" onClick={prevStep} style={{ flex: 1 }}>
                Назад
            </button>
          )}
          {((showFeedback || answers[ex.id]) || (exercises.indexOf(ex) < exercises.length - 1)) && (
            <button className="btn btn-primary" onClick={nextStep} style={{ flex: 1 }}>
                Далее <ArrowRight size={18} style={{ marginLeft: '0.5rem' }} />
            </button>
          )}
      </div>

    </div>
  );

  const handleAiTaskSendMessage = async (task) => {
    if (!aiTaskInput.trim()) return;

    const newMessages = [...aiTaskMessages, { role: 'user', content: aiTaskInput }];
    setAiTaskMessages(newMessages);
    // const userInput = aiTaskInput; // Unused
    setAiTaskInput('');
    setAiTaskLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/chat', {
        messages: newMessages,
        context: {
           customSystemMessage: task.system_message,
           userTaskPrompt: task.prompt,
           moduleId: module.id
        }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Parse Score
      let aiContent = res.data.content;
      const scoreMatch = aiContent.match(/\[\[SCORE:\s*(\d+)\]\]/);
      if (scoreMatch) {
          const score = parseInt(scoreMatch[1]);
          setAiScore(score);
          // Remove the tag from the message shown to user
          aiContent = aiContent.replace(/\[\[SCORE:\s*\d+\]\]/, '').trim();
          res.data.content = aiContent;
      }
      
      setAiTaskMessages([...newMessages, res.data]);
    } catch (error) {
      console.error(error);
      setAiTaskMessages([...newMessages, { role: 'assistant', content: 'Извините, ошибка соединения.' }]);
    } finally {
      setAiTaskLoading(false);
    }
  };

  const handleFinishModule = async () => {
    try {
        const token = localStorage.getItem('token');
        let correctCount = 0;
        let totalExercises = module.exercises ? module.exercises.length : 0;
        
        if (totalExercises > 0) {
            module.exercises.forEach(ex => {
                const userAns = answers[ex.id];
                if (userAns && userAns.toLowerCase().trim() === ex.correct_answer.toLowerCase().trim()) {
                    correctCount++;
                }
            });
        }
        
        const exerciseScore = totalExercises > 0 ? (correctCount / totalExercises) * 100 : 0;
        const hasAiTask = steps.some(s => s.type === 'ai_task');

        // Weighted Score: AI=33% (1/3), Exercises=67% (2/3) only if AI task exists
        let finalScore = exerciseScore;
        if (hasAiTask) {
             finalScore = Math.round((exerciseScore * 0.67) + (aiScore * 0.33));
        } else {
             finalScore = Math.round(exerciseScore);
        }

        await axios.post('/api/progress', {
            moduleId: module.id,
            score: finalScore,
            reflection: reflectionAnswers,
            details: answers,
            ai_history: aiTaskMessages
        }, {
             headers: { Authorization: `Bearer ${token}` }
        });
        
    } catch (err) {
        console.error("Failed to save progress", err);
    }
    navigate('/');
  };

  const handleFinishAiTask = async () => {
    // If we already have a score or haven't started chatting, just move on
    if (aiScore > 0 || !isAiChatStarted || aiTaskMessages.length === 0) {
        nextStep();
        return;
    }

    setAiTaskLoading(true);
    try {
        const token = localStorage.getItem('token');
        // Force the AI to evaluate by sending a system-like message
        // We pretend this is a user message for the API flow, but the content is instructional
        const res = await axios.post('/api/chat', {
            messages: [
                ...aiTaskMessages, 
                { role: 'user', content: "SYSTEM_CMD: The user has finished the task. Please provide the final score immediately in the format [[SCORE: X]]. Do not ask further questions." }
            ],
            context: {
                moduleId: module.id,
                customSystemMessage: "IMPORTANT: The user is forcing the end of the session. IGNORE everything else. You MUST output [[SCORE: <number>]] based on their performance so far. Be fair."
            }
        }, {
             headers: { Authorization: `Bearer ${token}` }
        });

        const aiContent = res.data.content;
        const scoreMatch = aiContent.match(/\[\[SCORE:\s*(\d+)\]\]/); 
        if (scoreMatch) {
            const parsedScore = parseInt(scoreMatch[1]);
            setAiScore(parsedScore);
            console.log("Forced AI Score:", parsedScore);
        } else {
            console.warn("AI didn't return a score even when forced.");
        }
        
    } catch (e) {
        console.error("Error fetching final score", e);
    } finally {
        setAiTaskLoading(false);
        nextStep();
    }
  };

  const renderAiTask = (task) => (
    <div className="card" style={{ borderTop: '4px solid #8b5cf6' }}>
      <h2 style={{ marginBottom: '1.5rem', color: '#7c3aed', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
         <Sparkles /> Задание с AI
      </h2>
      <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>{task.prompt}</p>
      
      {!isAiChatStarted ? (
        <div style={{ background: '#f5f3ff', padding: '2rem', borderRadius: '12px', textAlign: 'center' }}>
            <p style={{ marginBottom: '1.5rem', color: '#666' }}>
               Нажми кнопку ниже, чтобы начать диалог c AI прямо здесь!
            </p>
            <button 
              onClick={async () => {
                  setIsAiChatStarted(true);
                  setAiTaskLoading(true);
                  setAiTaskMessages([]); // Clear initially
                  
                  try {
                      const token = localStorage.getItem('token');
                      // Send a hidden trigger message to AI to start the conversation contextually
                      const res = await axios.post('/api/chat', {
                        messages: [
                            { role: 'user', content: "Я готов. Поздоровайся со мной и сразу задай ПЕРВЫЙ вопрос по контексту этого задания." }
                        ],
                        context: {
                           customSystemMessage: task.system_message,
                           userTaskPrompt: task.prompt,
                           moduleId: module.id
                        }
                      }, {
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      setAiTaskMessages([res.data]);
                  } catch (e) {
                      console.error(e);
                      setAiTaskMessages([{ role: 'assistant', content: "Привет! Я готов. О чем говорится в тексте?"}]);
                  } finally {
                      setAiTaskLoading(false);
                  }
              }}
              className="btn-primary"
              style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)', padding: '1rem 2rem' }}
            >
               <MessageSquare size={20} style={{ marginRight: '0.5rem' }}/> Начать Задание
            </button>
        </div>
      ) : (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', background: '#ffffff' }}>
           {/* Chat History */}
           <div style={{ height: '400px', overflowY: 'auto', padding: '1.5rem', background: '#F9FAFB', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {aiTaskMessages.map((msg, idx) => (
                    <div key={idx} style={{ 
                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '85%',
                    }}>
                        <div style={{ 
                        background: msg.role === 'user' ? '#7c3aed' : 'white',
                        color: msg.role === 'user' ? 'white' : '#1f2937',
                        padding: '0.75rem 1rem',
                        borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        boxShadow: msg.role === 'assistant' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                        border: msg.role === 'assistant' ? '1px solid #e5e7eb' : 'none',
                        fontSize: '1rem',
                        lineHeight: '1.5'
                        }}>
                         {msg.role === 'assistant' ? <FormattedText text={msg.content} /> : msg.content}
                        </div>
                    </div>
              ))}
               {aiTaskLoading && (
                  <div style={{ alignSelf: 'flex-start', background: 'white', padding: '0.5rem 1rem', borderRadius: '16px', color: '#6b7280' }}>
                     ...
                  </div>
               )}
           </div>
           
           {/* Input */}
           <div style={{ padding: '1rem', borderTop: '1px solid #e5e7eb', background: 'white', display: 'flex', gap: '0.5rem' }}>
              <input 
                 className="input-field"
                 placeholder="Напиши что-нибудь..."
                 value={aiTaskInput}
                 onChange={(e) => setAiTaskInput(e.target.value)}
                 onKeyPress={(e) => e.key === 'Enter' && handleAiTaskSendMessage(task)}
              />
              <button 
                className="btn-primary" 
                style={{ background: '#7c3aed', padding: '0.75rem' }}
                onClick={() => handleAiTaskSendMessage(task)}
                disabled={aiTaskLoading}
              >
                 <ArrowRight size={20} />
              </button>
           </div>
        </div>
      )}
      
      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          {currentStepIndex > 0 && (
            <button className="btn btn-outline" onClick={prevStep} style={{ flex: 1 }}>
                Назад
            </button>
          )}
          <button className="btn btn-outline" onClick={handleFinishAiTask} style={{ flex: 1 }} disabled={aiTaskLoading}>
            {aiTaskLoading ? 'Оценка...' : 'Я выполнил задание'} <ArrowRight size={18} style={{ marginLeft: '0.5rem' }} />
          </button>
      </div>

    </div>
  );

  const renderReflection = (questions) => (
    <div className="card">
       <h2 style={{ marginBottom: '1.5rem' }}>🌟 Повторение</h2>
       <p style={{ marginBottom: '2rem', color: '#666' }}>Перед тем, как закончить, давай вспомним, что мы выучили.</p>
       
       <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {questions.map((q, idx) => (
             <div key={idx}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>{q}</label>
                <textarea 
                   className="input-field" 
                   rows="2" 
                   placeholder="Мои мысли..."
                   style={{ width: '100%' }}
                   onChange={(e) => setReflectionAnswers({...reflectionAnswers, [idx]: e.target.value})}
                ></textarea>
             </div>
          ))}
       </div>

       <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          {currentStepIndex > 0 && (
            <button className="btn btn-outline" onClick={prevStep} style={{ flex: 1 }}>
                Назад
            </button>
          )}
          <button className="btn btn-primary" onClick={handleFinishModule} style={{ flex: 1 }}>
             Завершить модуль <Star size={18} style={{ marginLeft: '0.5rem' }} />
          </button>
       </div>
    </div>
  );

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem' }}>{module.title}</h1>
        <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', marginTop: '1rem', overflow: 'hidden' }}>
           <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.3s ease' }}></div>
        </div>
      </div>

      {currentStep.type === 'theory' && renderTheory(currentStep.data)}
      {currentStep.type === 'exercise' && renderExercise(currentStep.data)}
      {currentStep.type === 'ai_task' && renderAiTask(currentStep.data)}
      {currentStep.type === 'reflection' && renderReflection(currentStep.data)}
    </div>
  );
};

export default ModuleViewer;
