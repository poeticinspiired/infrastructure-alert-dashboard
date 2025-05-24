import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import Dashboard from './pages/Dashboard';
import Alerts from './pages/Alerts';
import Infrastructure from './pages/Infrastructure';
import Analysis from './pages/Analysis';
import Predictions from './pages/Predictions';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import Layout from './components/Layout';

const App: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="infrastructure" element={<Infrastructure />} />
          <Route path="analysis" element={<Analysis />} />
          <Route path="predictions" element={<Predictions />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Box>
  );
};

export default App;
