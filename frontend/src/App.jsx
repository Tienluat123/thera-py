import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home, ChatPage, VisualizePage } from './pages';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/visualize" element={<VisualizePage />} />
      </Routes>
    </Router>
  );
}

export default App;
