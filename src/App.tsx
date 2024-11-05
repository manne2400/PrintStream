import React, { useEffect, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ChakraProvider, useToast } from '@chakra-ui/react';
import Layout from './components/Layout';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import initializeDatabase from './database/setup';
import { FilamentOperations } from './database/operations';

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

const AppContent: React.FC = () => {
  const toast = useToast();
  const { addNotification, removeNotification } = useNotifications();
  const [checkedFilaments, setCheckedFilaments] = React.useState(new Set<number>());

  const checkLowStock = useCallback(async () => {
    try {
      const db = await initializeDatabase();
      const ops = new FilamentOperations(db);
      const allFilaments = await ops.getAllFilaments();
      
      allFilaments.forEach(filament => {
        const notificationId = `low-stock-${filament.id}`;
        
        if (filament.stock <= (filament.low_stock_alert ?? 500) && 
            !checkedFilaments.has(filament.id!) &&
            filament.id
        ) {
          addNotification({
            id: notificationId,
            type: 'warning',
            title: 'Low Stock Alert',
            message: `${filament.name} (${filament.color}) is running low! Only ${filament.stock}g remaining.`,
          });

          setCheckedFilaments(prev => new Set(prev).add(filament.id!));

          toast({
            title: 'Low Stock Alert',
            description: `${filament.name} (${filament.color}) is running low! Only ${filament.stock}g remaining.`,
            status: 'warning',
            duration: 10000,
            isClosable: true,
            position: 'bottom-right',
            variant: 'left-accent',
          });
        } else if (filament.stock > (filament.low_stock_alert ?? 500)) {
          removeNotification(notificationId);
          setCheckedFilaments(prev => {
            const newSet = new Set(prev);
            newSet.delete(filament.id!);
            return newSet;
          });
        }
      });
    } catch (err) {
      console.error('Failed to check stock levels:', err);
    }
  }, [toast, addNotification, removeNotification, checkedFilaments]);

  // Check ved startup og hver 5. sekund
  useEffect(() => {
    // Kør første check med det samme
    checkLowStock();
    
    // Sæt interval til at køre hver 5. sekund (5000 ms)
    const interval = setInterval(checkLowStock, 5000);
    
    // Cleanup når komponenten unmountes
    return () => clearInterval(interval);
  }, [checkLowStock]);

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/filament" element={<Filament checkedFilaments={checkedFilaments} setCheckedFilaments={setCheckedFilaments} />} />
        <Route path="/print-inventory" element={<PrintInventory />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <ChakraProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </ChakraProvider>
  );
};

export default App;
