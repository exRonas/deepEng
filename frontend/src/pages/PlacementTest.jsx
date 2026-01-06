import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight, AlertCircle } from 'lucide-react';

const questions = [
  { q: "I ___ a student.", options: ["am", "is", "are"], a: "am" },
  { q: "She ___ to the store yesterday.", options: ["go", "went", "gone"], a: "went" },
  { q: "They ___ playing football now.", options: ["is", "are", "am"], a: "are" },
  { q: "___ you like coffee?", options: ["Do", "Does", "Is"], a: "Do" },
  { q: "He has ___ to Paris twice.", options: ["be", "been", "being"], a: "been" },
  { q: "If I ___ rich, I would buy a car.", options: ["was", "were", "am"], a: "were" },
  { q: "The book ___ by him.", options: ["wrote", "was written", "writing"], a: "was written" },
  { q: "I look forward to ___ you.", options: ["see", "seeing", "saw"], a: "seeing" },
  { q: "She asked me where ___.", options: ["was I", "I was", "am I"], a: "I was" },
  { q: "By next year, I ___ graduated.", options: ["will have", "will", "have"], a: "will have" }
];

const PlacementTest = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  const handleOptionSelect = (option) => {
    setAnswers({ ...answers, [currentStep]: option });
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    let score = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.a) score++;
    });

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/placement-test', { score }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResult(res.data.level);
    } catch (error) {
      console.error(error);
    }
  };

  if (result) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <div className="card" style={{ textAlign: 'center', maxWidth: '500px', padding: '3rem' }}>
          <div style={{ marginBottom: '1.5rem', display: 'inline-block', padding: '1rem', background: '#D1FAE5', borderRadius: '50%' }}>
            <CheckCircle2 size={48} color="#059669" />
          </div>
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Test Complete!</h2>
          <p style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>Based on your answers, your recommended level is:</p>
          
          <div style={{ fontSize: '4rem', fontWeight: '800', color: 'var(--primary)', marginBottom: '2rem' }}>
            {result}
          </div>
          
          <button className="btn btn-primary" onClick={() => navigate('/')} style={{ width: '100%' }}>
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const progress = ((currentStep + 1) / questions.length) * 100;

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', paddingTop: '2rem' }}>
      {/* Progress Bar */}
      <div style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          <span>Question {currentStep + 1} of {questions.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div style={{ width: '100%', height: '8px', background: '#E5E7EB', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.3s ease' }}></div>
        </div>
      </div>

      {/* Question Card */}
      <div className="card" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ marginBottom: '2rem', fontSize: '1.5rem', lineHeight: '1.4' }}>
          {questions[currentStep].q}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
          {questions[currentStep].options.map(opt => (
            <label 
              key={opt} 
              style={{ 
                padding: '1.25rem', 
                border: `2px solid ${answers[currentStep] === opt ? 'var(--primary)' : 'var(--border-light)'}`,
                borderRadius: '12px',
                cursor: 'pointer',
                background: answers[currentStep] === opt ? '#EFF6FF' : 'white',
                transition: 'all 0.2s',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}
            >
              <input 
                type="radio" 
                name={`q${currentStep}`} 
                value={opt} 
                checked={answers[currentStep] === opt}
                onChange={() => handleOptionSelect(opt)}
                style={{ width: '18px', height: '18px' }}
              /> 
              {opt}
            </label>
          ))}
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            className="btn btn-primary" 
            onClick={handleNext}
            disabled={!answers[currentStep]}
            style={{ opacity: !answers[currentStep] ? 0.5 : 1 }}
          >
            {currentStep === questions.length - 1 ? 'Finish Test' : 'Next Question'}
            <ArrowRight size={18} style={{ marginLeft: '0.5rem' }} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlacementTest;
