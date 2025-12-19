import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import FloatingChat from './components/FloatingChat';
import Home from './pages/Home';
import PlacementTest from './pages/PlacementTest';
import ModuleViewer from './pages/ModuleViewer';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/placement-test" element={<PlacementTest />} />
          <Route path="/module/:id" element={<ModuleViewer />} />
        </Routes>
        <FloatingChat />
      </Layout>
    </Router>
  );
}

export default App;
