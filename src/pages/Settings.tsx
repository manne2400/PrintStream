import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Heading, Text, VStack, FormControl, FormLabel,
  Input, NumberInput, NumberInputField, NumberInputStepper,
  NumberIncrementStepper, NumberDecrementStepper,
  Select, Button, useToast, Divider, Textarea, useColorMode, Switch, Icon, Flex
} from '@chakra-ui/react';
import initializeDatabase from '../database/setup';
import { SettingsOperations, Settings as SettingsType, LicenseOperations } from '../database/operations';
import { useCurrency } from '../context/CurrencyContext';
import { ipcRenderer } from 'electron';
import { DownloadIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';

const Settings: React.FC = () => {
  const toast = useToast();
  const [settings, setSettings] = useState<SettingsType>({
    printer_hourly_rate: 0,
    post_processing_cost: 0,
    currency: 'USD',
    profit_margin: 30,
    company_name: '',
    company_address: '',
    company_phone: '',
    company_email: '',
    bank_details: '',
    vat_id: ''
  });
  const { updateCurrency } = useCurrency();

  const [licenseInfo, setLicenseInfo] = useState<{
    daysLeft: number;
    expiryDate: string;
    licenseKey: string | null;
  }>({
    daysLeft: 0,
    expiryDate: '',
    licenseKey: null
  });

  const [newLicenseKey, setNewLicenseKey] = useState('');

  const { colorMode, toggleColorMode } = useColorMode();

  const [autoBackup, setAutoBackup] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    loadLicenseInfo();
  }, []);

  useEffect(() => {
    const loadAutoBackupSetting = async () => {
      const db = await initializeDatabase();
      const ops = new SettingsOperations(db);
      const settings = await ops.getSettings();
      setAutoBackup(settings.auto_backup || false);
    };
    loadAutoBackupSetting();
  }, []);

  const loadSettings = async () => {
    try {
      const db = await initializeDatabase();
      const ops = new SettingsOperations(db);
      const data = await ops.getSettings();
      setSettings({
        ...data,
        profit_margin: data.profit_margin ?? 30
      });
    } catch (err) {
      console.error('Failed to load settings:', err);
      toast({
        title: 'Error',
        description: 'Failed to load settings',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const loadLicenseInfo = async () => {
    try {
      const db = await initializeDatabase();
      const ops = new LicenseOperations(db);
      const status = await ops.checkLicense();
      setLicenseInfo(status);
    } catch (err) {
      console.error('Failed to load license info:', err);
    }
  };

  const handleSave = async () => {
    try {
      const db = await initializeDatabase();
      const ops = new SettingsOperations(db);
      await ops.updateSettings(settings);
      toast({
        title: 'Success',
        description: 'Settings saved successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Failed to save settings:', err);
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleCurrencyChange = async (newCurrency: string) => {
    setSettings(prev => ({ ...prev, currency: newCurrency }));
    await updateCurrency(newCurrency);
  };

  const handleLicenseSubmit = async () => {
    try {
      const db = await initializeDatabase();
      const ops = new LicenseOperations(db);
      const success = await ops.extendLicense(newLicenseKey);
      
      if (success) {
        toast({
          title: 'Success',
          description: 'License key applied successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        loadLicenseInfo();
        setNewLicenseKey('');
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

  const handleBackup = useCallback(async () => {
    try {
      const savePath = await ipcRenderer.invoke('show-save-dialog', {
        defaultPath: `printstream_backup_${new Date().toISOString().split('T')[0]}.db`,
        filters: [{ name: 'Database Files', extensions: ['db'] }]
      });

      if (savePath) {
        await ipcRenderer.invoke('backup-database', savePath);
        toast({
          title: 'Success',
          description: 'Database backup created successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (err) {
      console.error('Failed to backup database:', err);
      toast({
        title: 'Error',
        description: 'Failed to create database backup',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [toast]);

  const handleAutoBackupChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    try {
      const db = await initializeDatabase();
      const ops = new SettingsOperations(db);
      await ops.updateSettings({ auto_backup: newValue });
      setAutoBackup(newValue);
      toast({
        title: 'Success',
        description: `Auto backup ${newValue ? 'enabled' : 'disabled'}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Failed to update auto backup setting:', err);
      toast({
        title: 'Error',
        description: 'Failed to update auto backup setting',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleRestore = useCallback(async () => {
    try {
      const backupPath = await ipcRenderer.invoke('show-open-dialog');
      
      if (backupPath) {
        // Vis bekræftelsesdialog
        const shouldRestore = window.confirm(
          'Restoring from a backup will replace your current database. This cannot be undone. Are you sure you want to continue?'
        );

        if (shouldRestore) {
          const result = await ipcRenderer.invoke('restore-database', backupPath);
          
          if (result.success) {
            toast({
              title: 'Success',
              description: 'Database restored successfully. The application will now restart.',
              status: 'success',
              duration: 3000,
              isClosable: true,
            });
            
            // Giv brugeren tid til at se success beskeden før restart
            setTimeout(() => {
              ipcRenderer.invoke('restart-app');
            }, 3000);
          } else {
            throw new Error(result.error);
          }
        }
      }
    } catch (err) {
      console.error('Failed to restore database:', err);
      toast({
        title: 'Error',
        description: 'Failed to restore database',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [toast]);

  // Tilføj valuta konstant
  const CURRENCIES = [
    { code: 'DKK', name: 'Danish Krone' },
    { code: 'EUR', name: 'Euro' },
    { code: 'USD', name: 'US Dollar' },
    { code: 'GBP', name: 'British Pound' },
    { code: 'JPY', name: 'Japanese Yen' },
    { code: 'CHF', name: 'Swiss Franc' },
    { code: 'SEK', name: 'Swedish Krona' },
    { code: 'NOK', name: 'Norwegian Krone' },
    { code: 'AUD', name: 'Australian Dollar' },
    { code: 'CAD', name: 'Canadian Dollar' }
  ];

  return (
    <Box p={4}>
      <VStack spacing={8} align="stretch">
        {/* Pricing Settings */}
        <Box variant="stats-card">
          <Heading size="md" mb={4}>Pricing Settings</Heading>
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel>Printer Hourly Rate</FormLabel>
              <NumberInput
                value={settings.printer_hourly_rate}
                onChange={(value) => setSettings(prev => ({ ...prev, printer_hourly_rate: parseFloat(value) }))}
                min={0}
                precision={2}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>

            <FormControl>
              <FormLabel>Post Processing Cost</FormLabel>
              <NumberInput
                value={settings.post_processing_cost}
                onChange={(value) => setSettings(prev => ({ ...prev, post_processing_cost: parseFloat(value) }))}
                min={0}
                precision={2}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>

            <FormControl>
              <FormLabel>Default Profit Margin (%)</FormLabel>
              <NumberInput
                value={settings.profit_margin}
                onChange={(value) => setSettings(prev => ({ ...prev, profit_margin: parseFloat(value) }))}
                min={0}
                max={100}
                precision={1}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              <Text fontSize="sm" color="gray.500" mt={1}>
                This percentage will be used to calculate suggested selling prices
              </Text>
            </FormControl>

            <FormControl>
              <FormLabel>Currency</FormLabel>
              <Select
                value={settings.currency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
              >
                {CURRENCIES.map(currency => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
                  </option>
                ))}
              </Select>
            </FormControl>
          </VStack>
        </Box>

        <Divider />

        {/* Company Information */}
        <Box variant="stats-card">
          <Heading size="md" mb={4}>Company Information</Heading>
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel>Company Name</FormLabel>
              <Input
                value={settings.company_name}
                onChange={(e) => setSettings(prev => ({ ...prev, company_name: e.target.value }))}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Company Address</FormLabel>
              <Textarea
                value={settings.company_address}
                onChange={(e) => setSettings(prev => ({ ...prev, company_address: e.target.value }))}
                rows={3}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Company Phone</FormLabel>
              <Input
                value={settings.company_phone}
                onChange={(e) => setSettings(prev => ({ ...prev, company_phone: e.target.value }))}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Company Email</FormLabel>
              <Input
                type="email"
                value={settings.company_email}
                onChange={(e) => setSettings(prev => ({ ...prev, company_email: e.target.value }))}
              />
            </FormControl>
          </VStack>
        </Box>

        <Divider />

        {/* Bank Information */}
        <Box variant="stats-card">
          <Heading size="md" mb={4}>Bank Information</Heading>
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel>Banking Details</FormLabel>
              <Textarea
                value={settings.bank_details}
                onChange={(e) => setSettings(prev => ({ ...prev, bank_details: e.target.value }))}
                placeholder="Enter bank account details for customer payments"
                rows={3}
              />
            </FormControl>

            <FormControl>
              <FormLabel>VAT ID</FormLabel>
              <Input
                value={settings.vat_id}
                onChange={(e) => setSettings(prev => ({ ...prev, vat_id: e.target.value }))}
              />
            </FormControl>
          </VStack>
        </Box>

        <Box variant="stats-card">
          <Heading size="md" mb={4}>License Information</Heading>
          <VStack align="stretch" spacing={4}>
            <Text>Days Remaining: {licenseInfo.daysLeft}</Text>
            <Text>Expiry Date: {new Date(licenseInfo.expiryDate).toLocaleDateString()}</Text>
            <FormControl>
              <FormLabel>Enter License Key</FormLabel>
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
            >
              Apply License Key
            </Button>
          </VStack>
        </Box>

        <Box pt={4}>
          <Button colorScheme="blue" onClick={handleSave}>
            Save Settings
          </Button>
        </Box>

        <Box variant="stats-card">
          <Heading size="md" mb={4}>Appearance & Backup</Heading>
          <VStack spacing={4} align="stretch">
            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="dark-mode" mb="0">
                Dark Mode
              </FormLabel>
              <Switch
                id="dark-mode"
                isChecked={colorMode === 'dark'}
                onChange={toggleColorMode}
              />
            </FormControl>

            <Divider />

            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="auto-backup" mb="0">
                Auto Backup on Startup
              </FormLabel>
              <Switch
                id="auto-backup"
                isChecked={autoBackup}
                onChange={handleAutoBackupChange}
              />
            </FormControl>

            <Flex gap={2}>
              <Button
                leftIcon={<Icon as={DownloadIcon} />}
                onClick={handleBackup}
                colorScheme="blue"
                variant="outline"
                flex="1"
              >
                Create Backup
              </Button>
              
              <Button
                leftIcon={<Icon as={ArrowUpTrayIcon} />}
                onClick={handleRestore}
                colorScheme="blue"
                variant="outline"
                flex="1"
              >
                Restore Backup
              </Button>
            </Flex>
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default Settings; 