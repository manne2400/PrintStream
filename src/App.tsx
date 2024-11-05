import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import Layout from './components/Layout';

// Page imports
import Dashboard from './pages/Dashboard';
import Filament from './pages/Filament';
import PrintInventory from './pages/PrintInventory';
import Projects from './pages/Projects';
import Customers from './pages/Customers';
import Sales from './pages/Sales';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import About from './pages/About';

const App: React.FC = () => {
  return (
    <ChakraProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/filament" element={<Filament />} />
          <Route path="/print-inventory" element={<PrintInventory />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </Layout>
    </ChakraProvider>
  );
};

export default App;
