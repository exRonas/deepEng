import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { User, BookOpen, Trophy, Clock, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
           navigate('/login');
           return;
        }

        const res = await axios.get('/api/profile/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfileData(res.data);
      } catch (error) {
        console.error('Failed to fetch profile', error);
        if (error.response && (error.response.status === 403 || error.response.status === 401)) {
           // Token invalid
           localStorage.clear();
           navigate('/login');
        }
      }
    };

    fetchProfile();
  }, []);

  if (!profileData) return <div className="container">Loading profile...</div>;

  const { user, progress } = profileData;

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // Handle case where user is null/undefined (e.g. deleted from DB but token valid)
  if (!user) {
    return (
        <div className="container">
            <h2>User not found</h2>
            <p>Please log in again.</p>
            <button className="btn-primary" onClick={handleLogout}>To Login</button>
        </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: '#E0E7FF', padding: '1rem', borderRadius: '50%', color: 'var(--primary)' }}>
             <User size={32} />
          </div>
          My Profile
        </h1>
        <button className="btn-outline" onClick={handleLogout} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', borderColor: '#EF4444', color: '#EF4444' }}>
           <LogOut size={18} /> Logout
        </button>
      </div>

      {/* User Info Card */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
          <div>
            <h3 style={{ color: '#666', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Full Name</h3>
            <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{user.full_name || user.username}</p>
          </div>
          <div>
            <h3 style={{ color: '#666', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Current Level</h3>
            <div className="badge badge-purple" style={{ display: 'inline-block', fontSize: '1rem' }}>{user.level}</div>
          </div>
          <div>
            <h3 style={{ color: '#666', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Joined</h3>
            <p>{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Recently'}</p>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
         <div className="card" style={{ flex: 1, textAlign: 'center' }}>
            <Trophy size={32} style={{ color: '#F59E0B', marginBottom: '0.5rem' }} />
            <h3>{progress.length}</h3>
            <p style={{ color: '#666' }}>Modules Completed</p>
         </div>
         <div className="card" style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>
               {progress.length > 0 ? Math.round(progress.reduce((a, b) => a + b.score, 0) / progress.length) : 0}%
            </div>
            <p style={{ color: '#666' }}>Average Score</p>
         </div>
      </div>

      {/* Activity History */}
      <h2 style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
         <Clock size={24} /> Learning History
      </h2>
      
      <div className="card">
        {progress.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>You haven't completed any lessons yet. Time to start! 🚀</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #eee', textAlign: 'left' }}>
                <th style={{ padding: '1rem' }}>Module</th>
                <th style={{ padding: '1rem' }}>Type</th>
                <th style={{ padding: '1rem' }}>Score</th>
                <th style={{ padding: '1rem' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {progress.map((p, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '1rem', fontWeight: '500' }}>{p.title}</td>
                  <td style={{ padding: '1rem' }}><span className="badge badge-blue" style={{ fontSize: '0.8rem' }}>{p.type}</span></td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ color: p.score >= 80 ? 'green' : (p.score >= 50 ? 'orange' : 'red'), fontWeight: 'bold' }}>
                       {p.score}%
                    </span>
                  </td>
                  <td style={{ padding: '1rem', color: '#666' }}>{new Date(p.completed_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
};

export default Profile;
