import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, GraduationCap, LayoutDashboard, LogOut, Menu, X, User } from 'lucide-react';

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const userRole = localStorage.getItem('userRole');

  const isActive = (path) => location.pathname === path;

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
      {/* Mobile Header */}
      <div style={{ 
        display: 'none', 
        padding: '1rem', 
        background: 'white', 
        borderBottom: '1px solid var(--border-light)',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }} className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '28px', height: '28px', background: 'var(--primary)', borderRadius: '6px' }}></div>
          <span style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>DeepEng</span>
        </div>
        <button onClick={toggleMobileMenu} style={{ background: 'transparent', border: 'none', padding: '4px', marginRight: '8px' }}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1, paddingTop: '70px' }} className="layout-body">
        {/* Sidebar / Topbar */}
        <aside style={{ 
          // width: '100%', // Changed to relative positioning with left/right
          right: 0,
          boxSizing: 'border-box',
          backgroundColor: '#FFFFFF', 
          borderBottom: '1px solid var(--border-light)',
          padding: '0 2rem',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'fixed',
          top: 0,
          left: 0,
          height: '70px',
          zIndex: 40,
          transition: 'transform 0.3s ease',
        }} className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }} className="desktop-logo">
            <div style={{ width: '32px', height: '32px', background: 'var(--primary)', borderRadius: '8px' }}></div>
            <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)' }}>DeepEng</span>
          </div>

          <nav className="nav-links" style={{ display: 'flex', flexDirection: 'row', gap: '1rem', alignItems: 'center', margin: '0 2rem' }}>
            <Link to="/" style={{ textDecoration: 'none' }} onClick={() => setIsMobileMenuOpen(false)}>
              <div style={{ 
                display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', 
                borderRadius: 'var(--radius-md)',
                backgroundColor: isActive('/') ? '#EFF6FF' : 'transparent',
                color: isActive('/') ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: isActive('/') ? '600' : '500',
                transition: 'all 0.2s'
              }}>
                <LayoutDashboard size={20} />
                Dashboard
              </div>
            </Link>
            
            <Link to="/placement-test" style={{ textDecoration: 'none' }} onClick={() => setIsMobileMenuOpen(false)}>
              <div style={{ 
                display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', 
                borderRadius: 'var(--radius-md)',
                backgroundColor: isActive('/placement-test') ? '#EFF6FF' : 'transparent',
                color: isActive('/placement-test') ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: isActive('/placement-test') ? '600' : '500',
                transition: 'all 0.2s'
              }}>
                <GraduationCap size={20} />
                Placement Test
              </div>
            </Link>

            <Link to="/profile" style={{ textDecoration: 'none' }} onClick={() => setIsMobileMenuOpen(false)}>
              <div style={{ 
                display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', 
                borderRadius: 'var(--radius-md)',
                backgroundColor: isActive('/profile') ? '#EFF6FF' : 'transparent',
                color: isActive('/profile') ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: isActive('/profile') ? '600' : '500',
                transition: 'all 0.2s'
              }}>
                <User size={20} />
                 Profile
              </div>
            </Link>

            {userRole === 'teacher' && (
              <Link to="/teacher-dashboard" style={{ textDecoration: 'none' }} onClick={() => setIsMobileMenuOpen(false)}>
                <div style={{ 
                  display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', 
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isActive('/teacher-dashboard') ? '#EFF6FF' : 'transparent',
                  color: isActive('/teacher-dashboard') ? 'var(--primary)' : 'var(--text-muted)',
                  fontWeight: isActive('/teacher-dashboard') ? '600' : '500',
                  transition: 'all 0.2s'
                }}>
                  <GraduationCap size={20} />
                  Teacher Panel
                </div>
              </Link>
            )}

            <div style={{ 
              display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', 
              color: 'var(--text-muted)', fontWeight: '500', cursor: 'not-allowed', opacity: 0.6 
            }}>
              <BookOpen size={20} />
              Vocabulary (Soon)
            </div>
          </nav>

          <div className="logout-container">
            <div onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#EF4444', cursor: 'pointer', fontWeight: '500' }}>
              <LogOut size={20} />
              <span className="logout-text">Log Out</span>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main style={{ 
          flex: 1, 
          marginLeft: '0', 
          padding: '2rem 3rem',
          maxWidth: '1200px',
          width: '100%',
          margin: '0 auto'
        }} className="main-content">
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .mobile-header { display: flex !important; }
          .desktop-logo { display: none !important; }
          .layout-body { padding-top: 0 !important; }
          
          .sidebar {
            transform: translateX(-100%) !important;
            top: 60px !important; /* Height of mobile header */
            height: calc(100vh - 60px) !important;
            width: 100% !important;
            border-right: none !important;
            border-bottom: none !important;
            flex-direction: column !important;
            justify-content: flex-start !important;
            align-items: stretch !important;
            padding: 2rem 1.5rem !important;
          }
          
          .sidebar.mobile-open {
            transform: translateX(0) !important;
          }

          .nav-links {
            flex-direction: column !important;
            align-items: stretch !important;
            margin: 0 !important;
          }
          
          .logout-container {
            margin-top: auto;
            border-top: 1px solid var(--border-light);
            padding-top: 1.5rem;
          }
          
          .main-content {
            margin-left: 0 !important;
            padding: 1.5rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Layout;
