import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight, AlertCircle } from 'lucide-react';

const questions = [
  // Vocabulary (A1-B2)
  { q: "I have breakfast in the ___.", options: ["kitchen", "garage", "garden", "balcony"], a: "kitchen" },
  { q: "My mother's brother is my ___.", options: ["aunt", "uncle", "cousin", "nephew"], a: "uncle" },
  { q: "We learn English, Math and ___ at school.", options: ["football", "subjects", "books", "History"], a: "History" },
  { q: "Beshbarmak is traditional Kazakh ___.", options: ["music", "clothing", "food", "dance"], a: "food" },
  { q: "The dombra is a musical ___.", options: ["song", "concert", "instrument", "player"], a: "instrument" },
  { q: "Baikonur is famous for ___ launches.", options: ["train", "rocket", "airplane", "ship"], a: "rocket" },
  { q: "Please ___ the light when you leave.", options: ["turn off", "turn on", "turn up", "turn down"], a: "turn off" },
  { q: "Education -> adjective:", options: ["educate", "educative", "educator", "educational"], a: "educational" },
  { q: "Synonym for 'intelligent':", options: ["lazy", "funny", "smart", "tall"], a: "smart" },
  { q: "Don't judge a book by its ___.", options: ["author", "cover", "price", "title"], a: "cover" },
  { q: "She has a ___ knowledge of history.", options: ["wide", "big", "large", "tall"], a: "wide" },
  { q: "Formal word for 'buy':", options: ["get", "purchase", "take", "grab"], a: "purchase" },

  // Grammar (A1-B2)
  { q: "She ___ to school every day.", options: ["go", "goes", "going", "went"], a: "goes" },
  { q: "There are three ___ on the table.", options: ["books", "book", "bookes", "book's"], a: "books" },
  { q: "This is ___ pen.", options: ["I", "me", "my", "mine"], a: "my" },
  { q: "Yesterday I ___ my homework.", options: ["do", "did", "done", "doing"], a: "did" },
  { q: "___ you please help me with this?", options: ["Do", "Does", "Will", "Can"], a: "Can" },
  { q: "She is ___ than her brother.", options: ["tall", "taller", "tallest", "more tall"], a: "taller" },
  { q: "If I ___ time, I would help you.", options: ["have", "had", "will have", "would have"], a: "had" },
  { q: "He asked me where ___.", options: ["do I live", "I live", "I lived", "did I live"], a: "I lived" },
  { q: "By next year, she ___ English for 5 years.", options: ["studies", "will study", "will be studying", "will have studied"], a: "will have studied" },
  { q: "Not only ___ late, but he also forgot the books.", options: ["he was", "was he", "he is", "is he"], a: "was he" },
  { q: "Had I known, ___ you.", options: ["I will help", "I would help", "I would have helped", "I helped"], a: "I would have helped" },
  { q: "The report, ___ last week, is very important.", options: ["written", "writing", "wrote", "writes"], a: "written" },

  // Reading (with Texts)
  { 
    text: "**Text A1 (Family)**\nI am Asel. I am 11 years old. I live in Almaty with my family. I have one brother and one sister. My brother is 15. My sister is 7. My father is a doctor. My mother is a teacher. We have a cat named Tom.",
    q: "How old is Asel's sister?", 
    options: ["11", "15", "7", "not mentioned"], 
    a: "7" 
  },
  { 
    text: "**Text A1 (Family)**\nI am Asel. I am 11 years old. I live in Almaty with my family. I have one brother and one sister. My brother is 15. My sister is 7. My father is a doctor. My mother is a teacher. We have a cat named Tom.",
    q: "What is her father's job?", 
    options: ["teacher", "doctor", "student", "not mentioned"], 
    a: "doctor" 
  },
  { 
    text: "**Text A2 (Nauryz)**\nNauryz is a spring holiday in Kazakhstan. It is on March 22. People clean their homes. They cook nauryz-kozhe. This dish has 7 ingredients. Families visit each other. Children play games. It is a happy time.",
    q: "When is Nauryz?", 
    options: ["January 1", "March 22", "December 25", "April 1"], 
    a: "March 22" 
  },
  { 
    text: "**Text A2 (Nauryz)**\nNauryz is a spring holiday in Kazakhstan. It is on March 22. People clean their homes. They cook nauryz-kozhe. This dish has 7 ingredients. Families visit each other. Children play games. It is a happy time.",
    q: "How many ingredients in nauryz-kozhe?", 
    options: ["5", "12", "10", "7"], 
    a: "7" 
  },
  { 
    text: "**Text B1 (Education)**\nThe education system in Kazakhstan is changing. Students now learn three languages: Kazakh, Russian and English. Some schools have special programs for math and science. Students use computers in class. This helps them learn better. But some schools need more books and teachers.",
    q: "How many languages do students learn?", 
    options: ["1", "2", "3", "4"], 
    a: "3" 
  },
  { 
    text: "**Text B1 (Education)**\nThe education system in Kazakhstan is changing. Students now learn three languages: Kazakh, Russian and English. Some schools have special programs for math and science. Students use computers in class. This helps them learn better. But some schools need more books and teachers.",
    q: "What helps students learn better?", 
    options: ["more homework", "computers", "longer lessons", "bigger classrooms"], 
    a: "computers" 
  },
  { 
    text: "**Text B2 (Ecology)**\nThe Aral Sea, once one of the world's largest lakes, has shrunk dramatically due to water diversion for irrigation. This ecological catastrophe has resulted in climate changes, health problems for local residents, and economic difficulties. Restoration efforts are underway, but the process is slow and complex. International organizations are involved in projects to mitigate the consequences and prevent similar disasters in other regions.",
    q: "What caused the Aral Sea to shrink?", 
    options: ["climate change", "water diversion", "pollution", "earthquakes"], 
    a: "water diversion" 
  },
  { 
    text: "**Text B2 (Ecology)**\nThe Aral Sea, once one of the world's largest lakes, has shrunk dramatically due to water diversion for irrigation. This ecological catastrophe has resulted in climate changes, health problems for local residents, and economic difficulties. Restoration efforts are underway, but the process is slow and complex. International organizations are involved in projects to mitigate the consequences and prevent similar disasters in other regions.",
    q: "What is NOT mentioned as a consequence?", 
    options: ["climate changes", "health problems", "economic difficulties", "political conflicts"], 
    a: "political conflicts" 
  },
  { 
    text: "**Text B2 (Ecology)**\nThe Aral Sea, once one of the world's largest lakes, has shrunk dramatically due to water diversion for irrigation. This ecological catastrophe has resulted in climate changes, health problems for local residents, and economic difficulties. Restoration efforts are underway, but the process is slow and complex. International organizations are involved in projects to mitigate the consequences and prevent similar disasters in other regions.",
    q: "What is the current situation?", 
    options: ["completely restored", "getting worse", "restoration is slow", "abandoned"], 
    a: "restoration is slow" 
  }
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
        {questions[currentStep].text && (
          <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '1rem', lineHeight: '1.6', whiteSpace: 'pre-line', border: '1px solid #e5e7eb' }}>
            {questions[currentStep].text}
          </div>
        )}
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
