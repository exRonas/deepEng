import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { PlayCircle, BookOpen, PenTool, Trophy, ArrowRight } from 'lucide-react';

const Home = () => {
  const [modules, setModules] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const modulesRes = await axios.get('/api/modules');
        setModules(modulesRes.data);
        const userRes = await axios.get('/api/user/progress');
        setUser(userRes.data.user);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  const getIcon = (type) => {
    switch(type) {
      case 'listening': return <PlayCircle size={24} color="#2563EB" />;
      case 'reading': return <BookOpen size={24} color="#059669" />;
      case 'grammar': return <PenTool size={24} color="#7C3AED" />;
      default: return <BookOpen size={24} />;
    }
  };

  return (
    <div>
      {/* Header Section */}
      <header style={{ marginBottom: '3rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Welcome back, {user?.username || 'Student'}! 👋</h1>
        <p style={{ fontSize: '1.1rem' }}>You are currently at level <span className="badge badge-blue" style={{ fontSize: '1rem', marginLeft: '0.5rem' }}>{user?.level || '...'}</span></p>
      </header>

      {/* Stats / Hero Card */}
      <div className="card" style={{ 
        background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', 
        color: 'white', 
        marginBottom: '3rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        border: 'none'
      }}>
        <div>
          <h2 style={{ color: 'white', marginBottom: '0.5rem' }}>Keep up the momentum!</h2>
          <p style={{ color: 'rgba(255,255,255,0.9)', marginBottom: '1.5rem' }}>You've completed 3 exercises this week.</p>
          <button style={{ 
            background: 'white', 
            color: 'var(--primary)', 
            border: 'none', 
            padding: '0.75rem 1.5rem', 
            borderRadius: '8px', 
            fontWeight: '600',
            cursor: 'pointer' 
          }}>
            Continue Learning
          </button>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '1.5rem', borderRadius: '50%' }}>
          <Trophy size={48} color="white" />
        </div>
      </div>

      {/* Modules Grid */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Recommended Modules</h2>
        <button className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>View All</button>
      </div>

      <div className="grid-modules">
        {modules.map(module => (
          <div key={module.id} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ padding: '10px', background: '#F3F4F6', borderRadius: '12px' }}>
                  {getIcon(module.type)}
                </div>
                <span className="badge badge-blue">{module.level}</span>
              </div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{module.title}</h3>
              <p style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>{module.description}</p>
            </div>
            
            <button 
              className="btn btn-outline" 
              style={{ width: '100%', marginTop: '1.5rem', justifyContent: 'space-between' }}
              onClick={() => window.location.href = `/module/${module.id}`}
            >
              Start Module
              <ArrowRight size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
