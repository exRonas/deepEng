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
    text: "**Family**\nI am Asel. I am 11 years old. I live in Almaty with my family. I have one brother and one sister. My brother is 15. My sister is 7. My father is a doctor. My mother is a teacher. We have a cat named Tom.",
    q: "How old is Asel's sister?", 
    options: ["11", "15", "7", "not mentioned"], 
    a: "7" 
  },
  { 
    text: "**Family**\nI am Asel. I am 11 years old. I live in Almaty with my family. I have one brother and one sister. My brother is 15. My sister is 7. My father is a doctor. My mother is a teacher. We have a cat named Tom.",
    q: "What is her father's job?", 
    options: ["teacher", "doctor", "student", "not mentioned"], 
    a: "doctor" 
  },
  { 
    text: "**Nauryz**\nNauryz is a spring holiday in Kazakhstan. It is on March 22. People clean their homes. They cook nauryz-kozhe. This dish has 7 ingredients. Families visit each other. Children play games. It is a happy time.",
    q: "When is Nauryz?", 
    options: ["January 1", "March 22", "December 25", "April 1"], 
    a: "March 22" 
  },
  { 
    text: "**Nauryz**\nNauryz is a spring holiday in Kazakhstan. It is on March 22. People clean their homes. They cook nauryz-kozhe. This dish has 7 ingredients. Families visit each other. Children play games. It is a happy time.",
    q: "How many ingredients in nauryz-kozhe?", 
    options: ["5", "12", "10", "7"], 
    a: "7" 
  },
  { 
    text: "**Education**\nThe education system in Kazakhstan is changing. Students now learn three languages: Kazakh, Russian and English. Some schools have special programs for math and science. Students use computers in class. This helps them learn better. But some schools need more books and teachers.",
    q: "How many languages do students learn?", 
    options: ["1", "2", "3", "4"], 
    a: "3" 
  },
  { 
    text: "**Education**\nThe education system in Kazakhstan is changing. Students now learn three languages: Kazakh, Russian and English. Some schools have special programs for math and science. Students use computers in class. This helps them learn better. But some schools need more books and teachers.",
    q: "What helps students learn better?", 
    options: ["more homework", "computers", "longer lessons", "bigger classrooms"], 
    a: "computers" 
  },
  { 
    text: "**Ecology**\nThe Aral Sea, once one of the world's largest lakes, has shrunk dramatically due to water diversion for irrigation. This ecological catastrophe has resulted in climate changes, health problems for local residents, and economic difficulties. Restoration efforts are underway, but the process is slow and complex. International organizations are involved in projects to mitigate the consequences and prevent similar disasters in other regions.",
    q: "What caused the Aral Sea to shrink?", 
    options: ["climate change", "water diversion", "pollution", "earthquakes"], 
    a: "water diversion" 
  },
  { 
    text: "**Ecology**\nThe Aral Sea, once one of the world's largest lakes, has shrunk dramatically due to water diversion for irrigation. This ecological catastrophe has resulted in climate changes, health problems for local residents, and economic difficulties. Restoration efforts are underway, but the process is slow and complex. International organizations are involved in projects to mitigate the consequences and prevent similar disasters in other regions.",
    q: "What is NOT mentioned as a consequence?", 
    options: ["climate changes", "health problems", "economic difficulties", "political conflicts"], 
    a: "political conflicts" 
  },
  { 
    text: "**Ecology**\nThe Aral Sea, once one of the world's largest lakes, has shrunk dramatically due to water diversion for irrigation. This ecological catastrophe has resulted in climate changes, health problems for local residents, and economic difficulties. Restoration efforts are underway, but the process is slow and complex. International organizations are involved in projects to mitigate the consequences and prevent similar disasters in other regions.",
    q: "What is the current situation?", 
    options: ["completely restored", "getting worse", "restoration is slow", "abandoned"], 
    a: "restoration is slow" 
  }
];

const PlacementTest = () => {
  const [shuffledQuestions, setShuffledQuestions] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [detailedResult, setDetailedResult] = useState(null);
  const navigate = useNavigate();

  // Initialize random OPTIONS on load
  React.useEffect(() => {
    // Keep questions order fixed, but shuffle options for each question
    const processed = questions.map(q => {
        // Shuffle options
        const shuffledOptions = [...q.options].sort(() => Math.random() - 0.5);
        return { ...q, options: shuffledOptions };
    });
    setShuffledQuestions(processed);
  }, []);

  const handleOptionSelect = (option) => {
    setAnswers({ ...answers, [currentStep]: option });
  };

  const handleNext = () => {
    if (currentStep < shuffledQuestions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const calculateLevel = (correct, total) => {
      const percentage = (correct / total) * 100;
      if (percentage >= 85) return 'B2';
      if (percentage >= 70) return 'B1';
      if (percentage >= 40) return 'A2';
      return 'A1';
  };

  const levelToScore = (lvl) => {
      if (lvl === 'B2') return 4;
      if (lvl === 'B1') return 3;
      if (lvl === 'A2') return 2;
      return 1;
  };

  const scoreToLevel = (score) => {
      if (score >= 3.5) return 'B2';
      if (score >= 2.5) return 'B1';
      if (score >= 1.5) return 'A2';
      return 'A1';
  }

  const handleSubmit = async () => {
    // Grading Logic
    let stats = {
        vocab: { correct: 0, total: 0 },
        grammar: { correct: 0, total: 0 },
        reading: { correct: 0, total: 0 }
    };

    shuffledQuestions.forEach((q, idx) => {
        let category = 'vocab'; // default
        // Identify category based on question content patterns roughly
        if (q.text) category = 'reading';
        else if (q.options.some(o => o === 'go' || o === 'goes' || o === 'am' || o === 'is')) category = 'grammar';
        else if (q.q.includes('___')) category = 'grammar'; // Actually most gap fills are grammar or vocab, hard to distinguish perfectly without explicit tag.
        
        // Better approach: explicit tagging in questions array would be best, but let's infer for now based on original array index or content.
        // Since we shuffled, we lose index order. Let's look at the content.
        // Reading is easy (has text).
        // Grammar vs Vocab: 
        // Vocab: "breakfast in", "mother's brother", "traditional Kazakh", "musical", "launches", "phrasal verb", "adjective", "Synonym", "idiom", "knowledge", "Formal word"
        // Grammar: "She ___ to school", "three ___ on the table", "This is ___ pen", "Yesterday I", "help me with this", "than her brother", "If I ___ time", "asked me where", "next year", "Not only", "Had I known", "The report"
        
        const qText = q.q.toLowerCase();
        
        if (q.text) {
            category = 'reading';
        } else if (
            qText.includes('breakfast') || qText.includes('brother') || qText.includes('school') || 
            qText.includes('kazakh') || qText.includes('dombra') || qText.includes('baikonur') ||
            qText.includes('turn') || qText.includes('adjective') || qText.includes('synonym') ||
            qText.includes('book') || qText.includes('knowledge') || qText.includes('formal')
        ) {
            category = 'vocab';
        } else {
            category = 'grammar';
        }

        stats[category].total++;
        if (answers[idx] === q.a) stats[category].correct++;
    });

    const vocabLevel = calculateLevel(stats.vocab.correct, Math.max(stats.vocab.total, 1));
    const grammarLevel = calculateLevel(stats.grammar.correct, Math.max(stats.grammar.total, 1));
    const readingLevel = calculateLevel(stats.reading.correct, Math.max(stats.reading.total, 1));

    const avgScore = (levelToScore(vocabLevel) + levelToScore(grammarLevel) + levelToScore(readingLevel)) / 3;
    const finalLevel = scoreToLevel(avgScore);

    const detailedSync = {
        vocab: vocabLevel,
        grammar: grammarLevel,
        reading: readingLevel,
        final: finalLevel
    };
    
    setDetailedResult(detailedSync);

    try {
      const token = localStorage.getItem('token');
      // Sending raw score just for compatibility, but mainly level
      // Ideally backend should accept 'level' directly now
      
      // We'll update the backend to just take the final level as trusted or keep score logic. 
      // For now let's emulate a "score" that produces this level in the backend logic, OR ask backend to update level directly.
      // Let's assume we update backend to accept explicit level or just send a high score to match B2 etc.
      
      // Better: Send average score mapped to 0-33 scale
      let simulatedScore = 0;
      if (finalLevel === 'A1') simulatedScore = 5;
      if (finalLevel === 'A2') simulatedScore = 12;
      if (finalLevel === 'B1') simulatedScore = 20;
      if (finalLevel === 'B2') simulatedScore = 30;

      await axios.post('/api/placement-test', { score: simulatedScore }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResult(finalLevel);
    } catch (error) {
      console.error(error);
    }
  };

  if (result && detailedResult) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '2rem' }}>
        <div className="card" style={{ textAlign: 'center', maxWidth: '600px', width: '100%', padding: '3rem' }}>
          <div style={{ marginBottom: '1.5rem', display: 'inline-block', padding: '1rem', background: '#D1FAE5', borderRadius: '50%' }}>
            <CheckCircle2 size={48} color="#059669" />
          </div>
          <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>Test Complete!</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '1rem', marginBottom: '2rem', textAlign: 'center' }}>
            <div style={{ padding: '1rem', background: '#F3F4F6', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.9rem', color: '#6B7280' }}>Vocabulary</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1F2937' }}>{detailedResult.vocab}</div>
            </div>
            <div style={{ padding: '1rem', background: '#F3F4F6', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.9rem', color: '#6B7280' }}>Grammar</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1F2937' }}>{detailedResult.grammar}</div>
            </div>
            <div style={{ padding: '1rem', background: '#F3F4F6', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.9rem', color: '#6B7280' }}>Reading</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1F2937' }}>{detailedResult.reading}</div>
            </div>
          </div>

          <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Overall Recommended Level:</p>
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

  if (shuffledQuestions.length === 0) return <div>Loading test...</div>;

  const currentQ = shuffledQuestions[currentStep];
  const progress = ((currentStep + 1) / shuffledQuestions.length) * 100;

  // Render Heading properly (Center, Bold, No Markdown characters)
  const renderText = (text) => {
      if (!text) return null;
      
      // Basic markdown parser for bold headers
      const parts = text.split('\n');
      return (
        <div style={{ padding: '1.5rem', background: '#f9fafb', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #e5e7eb' }}>
            {parts.map((part, idx) => {
                const isHeader = part.trim().startsWith('**') && part.trim().endsWith('**');
                if (isHeader) {
                    return (
                        <h3 key={idx} style={{ textAlign: 'center', fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#374151' }}>
                            {part.replace(/\*\*/g, '')}
                        </h3>
                    );
                }
                return <p key={idx} style={{ marginBottom: '0.5rem', fontSize: '1rem', lineHeight: '1.6', color: '#4B5563' }}>{part}</p>;
            })}
        </div>
      );
  };

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', paddingTop: '2rem' }}>
      {/* Progress Bar */}
      <div style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          <span>Question {currentStep + 1} of {shuffledQuestions.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div style={{ width: '100%', height: '8px', background: '#E5E7EB', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.3s ease' }}></div>
        </div>
      </div>

      {/* Question Card */}
      <div className="card" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
        {renderText(currentQ.text)}
        
        <h2 style={{ marginBottom: '2rem', fontSize: '1.5rem', lineHeight: '1.4' }}>
          {currentQ.q}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
          {currentQ.options.map((opt, oIdx) => ( // Using index in key too just in case of duplicate options (rare)
            <label 
              key={oIdx} 
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
            {currentStep === shuffledQuestions.length - 1 ? 'Finish Test' : 'Next Question'}
            <ArrowRight size={18} style={{ marginLeft: '0.5rem' }} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlacementTest;
