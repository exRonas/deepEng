import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, BookOpen, PenTool, Trophy, ArrowRight } from 'lucide-react';

const Home = () => {
  const [modules, setModules] = useState([]);
  const [user, setUser] = useState(null);
  const [userProgress, setUserProgress] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        const modulesRes = await axios.get('/api/modules'); // Not protected, but okay
        setModules(modulesRes.data);
        
        const userRes = await axios.get('/api/user/progress', { headers });
        setUser(userRes.data.user);
        setUserProgress(userRes.data.progress || []);
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

  const isCompleted = (moduleId) => userProgress.some(p => p.module_id === moduleId);

  const activeModules = modules.filter(m => !isCompleted(m.id));
  const completedModules = modules.filter(m => isCompleted(m.id));

  return (
    <div>
      {/* Header Section */}
      <header style={{ marginBottom: '3rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Welcome back, {user?.full_name || user?.username || 'Student'}! 👋</h1>
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
          <p style={{ color: 'rgba(255,255,255,0.9)', marginBottom: '1.5rem' }}>
             {userProgress.length > 0 
                ? `You have completed ${userProgress.length} module${userProgress.length !== 1 ? 's' : ''}!` 
                : "You haven't completed any modules yet. Start one today!"}
          </p>
          <button style={{ 
            background: 'white', 
            color: 'var(--primary)', 
            border: 'none', 
            padding: '0.75rem 1.5rem', 
            borderRadius: '8px', 
            fontWeight: '600',
            cursor: 'pointer' 
          }} onClick={() => {
              const nextModule = activeModules[0];
              if(nextModule) navigate(`/module/${nextModule.id}`);
          }}>
            Continue Learning
          </button>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '1.5rem', borderRadius: '50%' }}>
          <Trophy size={48} color="white" />
        </div>
      </div>

      {/* Active Modules Grid */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Available Modules</h2>
      </div>

      <div className="grid-modules">
        {activeModules.map(module => (
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
              onClick={() => navigate(`/module/${module.id}`)}
            >
              Start Module
              <ArrowRight size={16} />
            </button>
          </div>
        ))}
        {activeModules.length === 0 && <p style={{color: '#666'}}>No active modules available. Good job!</p>}
      </div>

      {/* Completed Modules Section */}
      {completedModules.length > 0 && (
        <div style={{ marginTop: '3rem' }}>
            <h2 style={{ marginBottom: '1.5rem', color: '#10B981' }}>Completed Modules ✅</h2>
            <div className="grid-modules" style={{opacity: 0.8}}>
                {completedModules.map(module => (
                <div key={module.id} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', border: '1px solid #10B981' }}>
                    <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div style={{ padding: '10px', background: '#ECFDF5', borderRadius: '12px' }}>
                        {getIcon(module.type)}
                        </div>
                        <span className="badge" style={{background: '#D1FAE5', color: '#065F46'}}>{module.level}</span>
                    </div>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', textDecoration: 'line-through', color: '#6B7280' }}>{module.title}</h3>
                    <p style={{ fontSize: '0.9rem', lineHeight: '1.5', color: '#9CA3AF' }}>Completed</p>
                    </div>
                    
                    <button 
                    className="btn btn-outline" 
                    style={{ width: '100%', marginTop: '1.5rem', justifyContent: 'space-between', borderColor: '#10B981', color: '#10B981' }}
                    onClick={() => navigate(`/module/${module.id}`)}
                    >
                    Review
                    <ArrowRight size={16} />
                    </button>
                </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
};

export default Home;
