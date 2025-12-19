import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: '#333', borderRadius: '8px', marginBottom: '2rem' }}>
      <div style={{ fontWeight: 'bold', fontSize: '1.5rem' }}>DeepEng</div>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>Home</Link>
        <Link to="/placement-test" style={{ color: 'white', textDecoration: 'none' }}>Placement Test</Link>
      </div>
    </nav>
  );
};

export default Navbar;
