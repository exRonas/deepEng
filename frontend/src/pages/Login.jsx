import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('student'); // 'student' or 'teacher'
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
        const res = await axios.post('/api/auth/login', {
            identifier: formData.identifier,
            password: formData.password
        });
        
        const { token, user } = res.data;
        
        if (activeTab === 'teacher' && user.role !== 'teacher') {
            setError('Access denied. Not a teacher account.');
            return;
        }

        localStorage.setItem('token', token);
        localStorage.setItem('userRole', user.role);
        localStorage.setItem('username', user.username);
        
        if (user.role === 'teacher') {
          navigate('/teacher-dashboard');
        } else {
          navigate('/');
        }
        window.location.reload();
    } catch (err) {
        setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="container" style={{ maxWidth: '400px', marginTop: '4rem' }}>
      <div className="card">
        <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Welcome Back</h1>

        <div style={{ display: 'flex', borderBottom: '1px solid #eee', marginBottom: '1.5rem' }}>
          <button 
            style={{ flex: 1, padding: '1rem', background: 'none', border: 'none', borderBottom: activeTab === 'student' ? '2px solid var(--primary)' : 'none', fontWeight: activeTab === 'student' ? 'bold' : 'normal', cursor: 'pointer' }}
            onClick={() => setActiveTab('student')}
          >
            🎓 Student
          </button>
          <button 
            style={{ flex: 1, padding: '1rem', background: 'none', border: 'none', borderBottom: activeTab === 'teacher' ? '2px solid var(--primary)' : 'none', fontWeight: activeTab === 'teacher' ? 'bold' : 'normal', cursor: 'pointer' }}
            onClick={() => setActiveTab('teacher')}
          >
            👨‍🏫 Teacher
          </button>
        </div>
        
        {error && <div style={{ background: '#FECACA', color: '#B91C1C', padding: '0.8rem', borderRadius: '4px', marginBottom: '1rem' }}>{error}</div>}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
           <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                {activeTab === 'student' ? 'Phone Number' : 'Username'}
            </label>
            <input 
              type="text" 
              name="identifier"
              className="input-field" 
              placeholder={activeTab === 'student' ? "87771234567" : "teacher123"}
              value={formData.identifier}
              onChange={handleChange}
              required
            />
          </div>
           
           <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Password</label>
            <input 
              type="password" 
              name="password"
              className="input-field" 
              placeholder="******"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>Login</button>
        </form>

        {activeTab === 'student' && (
             <p style={{ textAlign: 'center', marginTop: '1rem', color: '#666' }}>
                New here? <Link to="/register" style={{ color: 'var(--primary)' }}>Create Account</Link>
             </p>
        )}
      </div>
    </div>
  );
};

export default Login;
