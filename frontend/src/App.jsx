import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import FloatingChat from './components/FloatingChat';
import Home from './pages/Home';
import PlacementTest from './pages/PlacementTest';
import ModuleViewer from './pages/ModuleViewer';
import Login from './pages/Login';
import Register from './pages/Register';
import TeacherDashboard from './pages/TeacherDashboard';
import Profile from './pages/Profile';

// Mock Protected Route
const ProtectedRoute = ({ children, role }) => {
  const userRole = localStorage.getItem('userRole');
  if (!userRole) return <Navigate to="/login" replace />;
  if (role && userRole !== role) return <Navigate to="/" replace />;
  return children;
};

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          
          <Route path="/placement-test" element={
            <ProtectedRoute>
              <PlacementTest />
            </ProtectedRoute>
          } />
          
          <Route path="/module/:id" element={
            <ProtectedRoute>
              <ModuleViewer />
            </ProtectedRoute>
          } />

          <Route path="/teacher-dashboard" element={
            <ProtectedRoute role="teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          } />
        </Routes>
        <FloatingChat />
      </Layout>
    </Router>
  );
}

export default App;
