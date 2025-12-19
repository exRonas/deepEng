import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, GraduationCap, LayoutDashboard, LogOut, Menu, X } from 'lucide-react';

const Layout = ({ children }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

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
        <button onClick={toggleMobileMenu} style={{ background: 'transparent', border: 'none', padding: '4px' }}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <aside style={{ 
          width: '260px', 
          backgroundColor: '#FFFFFF', 
          borderRight: '1px solid var(--border-light)',
          padding: '2rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          height: '100vh',
          zIndex: 40,
          transition: 'transform 0.3s ease',
          transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(0)', // Desktop default
        }} className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          
          <div style={{ marginBottom: '3rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }} className="desktop-logo">
            <div style={{ width: '32px', height: '32px', background: 'var(--primary)', borderRadius: '8px' }}></div>
            <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)' }}>DeepEng</span>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
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

            <div style={{ 
              display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', 
              color: 'var(--text-muted)', fontWeight: '500', cursor: 'not-allowed', opacity: 0.6 
            }}>
              <BookOpen size={20} />
              Vocabulary (Soon)
            </div>
          </nav>

          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <LogOut size={20} />
              <span>Log Out</span>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main style={{ 
          flex: 1, 
          marginLeft: '260px', 
          padding: '2rem 3rem',
          maxWidth: '1200px',
          width: '100%'
        }} className="main-content">
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .mobile-header { display: flex !important; }
          .desktop-logo { display: none !important; }
          
          .sidebar {
            transform: translateX(-100%) !important;
            top: 60px; /* Height of mobile header */
            height: calc(100vh - 60px);
            width: 100%;
            border-right: none;
          }
          
          .sidebar.mobile-open {
            transform: translateX(0) !important;
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
