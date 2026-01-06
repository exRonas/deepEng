import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('userRole');
  const username = localStorage.getItem('username');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <nav style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: '#333', borderRadius: '8px', marginBottom: '2rem', alignItems: 'center' }}>
      <Link to="/" style={{ fontWeight: 'bold', fontSize: '1.5rem', color: 'white', textDecoration: 'none' }}>DeepEng</Link>
      
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        {userRole ? (
          <>
            {userRole === 'teacher' ? (
               <Link to="/teacher-dashboard" style={{ color: 'white', textDecoration: 'none' }}>Teacher Panel</Link>
            ) : (
               <>
                <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>Home</Link>
                <Link to="/profile" style={{ color: 'white', textDecoration: 'none' }}>Profile</Link>
                <Link to="/placement-test" style={{ color: 'white', textDecoration: 'none' }}>Test</Link>
               </>
            )}
            
            <span style={{ color: '#aaa', fontSize: '0.9rem' }}>Welcome, {username}</span>
            <button 
              onClick={handleLogout}
              style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid #666', color: 'white', borderRadius: '4px', cursor: 'pointer' }}
            >
              Logout
            </button>
          </>
        ) : (
          <Link to="/login" style={{ color: 'white', textDecoration: 'none' }}>Login</Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
