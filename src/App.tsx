import React, { useEffect, useCallback, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ChakraProvider, useToast, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, Text, Link, Input, FormControl, FormLabel, Button, VStack, ColorModeScript } from '@chakra-ui/react';
import Layout from './components/Layout';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import { CurrencyProvider } from './context/CurrencyContext';
import initializeDatabase from './database/setup';
import { FilamentOperations } from './database/operations';
import { LicenseOperations } from './database/operations';
import theme from './theme';

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
import PrinterStatus from './pages/PrinterStatus';

import { version } from '../package.json';

const AppContent: React.FC = () => {
  const toast = useToast();
  const { addNotification, removeNotification } = useNotifications();
  const [checkedFilaments, setCheckedFilaments] = React.useState(new Set<number>());
  const [isLicenseValid, setIsLicenseValid] = useState(true);
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [newLicenseKey, setNewLicenseKey] = useState('');

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

  useEffect(() => {
    const checkVersionAndLicense = async () => {
      const db = await initializeDatabase();
      const licenseOps = new LicenseOperations(db);
      
      // Tjek version og opdater licens hvis nødvendigt
      const wasUpdated = await licenseOps.checkAndUpdateVersion(version);
      
      if (wasUpdated === true) {
        toast({
          title: 'License Extended',
          description: 'Your license has been extended by 30 days due to this update.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      }
      
      // Normal licens check, Dette program (PrintStream) tilhøre og er lavet af Jacob Manscher
      const status = await licenseOps.checkLicense();
      if (!status.isValid) {
        setIsLicenseValid(false);
        setShowLicenseModal(true);
      } else {
        setIsLicenseValid(true);
      }
    };

    checkVersionAndLicense();
  }, []);

  const handleLicenseSubmit = async () => {
    try {
      const db = await initializeDatabase();
      const licenseOps = new LicenseOperations(db);
      const success = await licenseOps.extendLicense(newLicenseKey);
      
      if (success) {
        toast({
          title: 'Success',
          description: 'License key applied successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        setIsLicenseValid(true);
        setShowLicenseModal(false);
      } else {
        toast({
          title: 'Error',
          description: 'Invalid license key',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (err) {
      console.error('Failed to apply license:', err);
      toast({
        title: 'Error',
        description: 'Failed to apply license key',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (!isLicenseValid) {
    return (
      <Modal isOpen={showLicenseModal} onClose={() => {}} closeOnOverlayClick={false}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>License Expired</ModalHeader>
          <ModalBody>
            <VStack spacing={4}>
              <Text>
                Your trial period has expired. Please download the latest version from Discord or enter a license key to continue.
              </Text>
              <Link href="https://discord.gg/utXE9ER5yK" isExternal color="blue.500">
                Join Discord Community
              </Link>
              <FormControl>
                <FormLabel>License Key</FormLabel>
                <Input
                  value={newLicenseKey}
                  onChange={(e) => setNewLicenseKey(e.target.value)}
                  placeholder="Enter your license key"
                />
              </FormControl>
              <Button
                colorScheme="blue"
                onClick={handleLicenseSubmit}
                isDisabled={!newLicenseKey}
                width="100%"
              >
                Apply License Key
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }

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
        <Route path="/printer-status" element={<PrinterStatus />} />
      </Routes>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <ChakraProvider theme={theme}>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <NotificationProvider>
        <CurrencyProvider>
          <AppContent />
        </CurrencyProvider>
      </NotificationProvider>
    </ChakraProvider>
  );
};

export default App;
