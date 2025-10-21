import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';

function App() {
  useEffect(() => {
    // Initialize Feather Icons on mount
    const initFeather = () => {
      if (window.feather) {
        window.feather.replace({
          'stroke-width': 2, // Optional: Customize stroke width
          width: 24,
          height: 24
        });
      }
    };

    // Initial replacement
    initFeather();

    // Re-init on dynamic DOM changes (e.g., adding/removing components with icons)
    const observer = new MutationObserver(initFeather);
    const root = document.getElementById('root');
    if (root) {
      observer.observe(root, { childList: true, subtree: true });
    }

    // Cleanup on unmount
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </div>
  );
}

export default App;