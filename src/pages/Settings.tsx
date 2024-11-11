import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Heading, Text, VStack, FormControl, FormLabel,
  Input, NumberInput, NumberInputField, NumberInputStepper,
  NumberIncrementStepper, NumberDecrementStepper,
  Select, Button, useToast, Divider, Textarea, useColorMode, Switch, Icon, Flex, Grid
} from '@chakra-ui/react';
import initializeDatabase from '../database/setup';
import { SettingsOperations, Settings as SettingsType, LicenseOperations } from '../database/operations';
import { useCurrency } from '../context/CurrencyContext';
import { ipcRenderer } from 'electron';
import { 
  ArrowDownTrayIcon, 
  ArrowUpTrayIcon, 
  CurrencyDollarIcon, 
  BuildingOfficeIcon, 
  BanknotesIcon, 
  KeyIcon, 
  Cog6ToothIcon 
} from '@heroicons/react/24/outline';

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

  const [customCurrency, setCustomCurrency] = useState('');
  const [showCustomCurrency, setShowCustomCurrency] = useState(false);

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

  const handleCurrencyChange = async (value: string) => {
    if (value === 'CUSTOM') {
      setShowCustomCurrency(true);
    } else {
      setShowCustomCurrency(false);
      setSettings(prev => ({ ...prev, currency: value }));
      await updateCurrency(value);
    }
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
          'Restoring from a backup will replace your current database. This cannot be undone. Are you sure you want to continue? (Restart the application after restoring)'
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
    { code: 'CAD', name: 'Canadian Dollar' },
    { code: 'CUSTOM', name: 'Custom Currency' }
  ];

  // Tilføj custom currency håndtering
  const handleCustomCurrencySubmit = async () => {
    if (customCurrency.trim()) {
      setSettings(prev => ({ ...prev, currency: customCurrency.trim().toUpperCase() }));
      await updateCurrency(customCurrency.trim().toUpperCase());
      setShowCustomCurrency(false);
      setCustomCurrency('');
    }
  };

  return (
    <Box p={4}>
      <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6}>
        {/* Venstre kolonne */}
        <VStack spacing={6} align="stretch">
          {/* Pricing Settings */}
          <Box variant="stats-card">
            <Flex align="center" mb={6}>
              <Icon as={CurrencyDollarIcon} boxSize={6} color="blue.500" mr={4} />
              <Box>
                <Heading size="md">Pricing Settings</Heading>
                <Text fontSize="sm" color="gray.500">Configure your pricing and profit margins</Text>
              </Box>
            </Flex>
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
                <VStack spacing={2} align="stretch">
                  <Select
                    value={showCustomCurrency ? 'CUSTOM' : settings.currency}
                    onChange={(e) => handleCurrencyChange(e.target.value)}
                  >
                    {CURRENCIES.map(currency => (
                      <option key={currency.code} value={currency.code}>
                        {currency.code} - {currency.name}
                      </option>
                    ))}
                  </Select>
                  
                  {showCustomCurrency && (
                    <Flex gap={2}>
                      <Input
                        placeholder="Enter custom currency code (e.g., PLN)"
                        value={customCurrency}
                        onChange={(e) => setCustomCurrency(e.target.value)}
                        maxLength={5}
                      />
                      <Button
                        colorScheme="blue"
                        onClick={handleCustomCurrencySubmit}
                        isDisabled={!customCurrency.trim()}
                      >
                        Apply
                      </Button>
                    </Flex>
                  )}
                </VStack>
              </FormControl>
            </VStack>
          </Box>

          {/* Bank Information */}
          <Box variant="stats-card">
            <Flex align="center" mb={6}>
              <Icon as={BanknotesIcon} boxSize={6} color="green.500" mr={4} />
              <Box>
                <Heading size="md">Bank Information</Heading>
                <Text fontSize="sm" color="gray.500">Configure payment details</Text>
              </Box>
            </Flex>
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

          {/* License Information */}
          <Box variant="stats-card">
            <Flex align="center" mb={6}>
              <Icon as={KeyIcon} boxSize={6} color="yellow.500" mr={4} />
              <Box>
                <Heading size="md">License Information</Heading>
                <Text fontSize="sm" color="gray.500">Manage your software license</Text>
              </Box>
            </Flex>
            <VStack align="stretch" spacing={4}>
              <Text>Days Remaining: {licenseInfo.daysLeft}</Text>
              <Text>
                Expiry Date: {
                  licenseInfo.expiryDate ? 
                    new Date(licenseInfo.expiryDate).toLocaleDateString() : 
                    new Date(Date.now() + (licenseInfo.daysLeft * 24 * 60 * 60 * 1000)).toLocaleDateString()
                }
              </Text>
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
        </VStack>

        {/* Højre kolonne */}
        <VStack spacing={6} align="stretch">
          {/* Company Information */}
          <Box variant="stats-card">
            <Flex align="center" mb={6}>
              <Icon as={BuildingOfficeIcon} boxSize={6} color="purple.500" mr={4} />
              <Box>
                <Heading size="md">Company Information</Heading>
                <Text fontSize="sm" color="gray.500">Manage your business details</Text>
              </Box>
            </Flex>
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

          {/* Appearance & Backup */}
          <Box variant="stats-card">
            <Flex align="center" mb={6}>
              <Icon as={Cog6ToothIcon} boxSize={6} color="orange.500" mr={4} />
              <Box>
                <Heading size="md">Appearance & Backup</Heading>
                <Text fontSize="sm" color="gray.500">Customize appearance and manage backups</Text>
              </Box>
            </Flex>
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
                  leftIcon={<Icon as={ArrowDownTrayIcon} />}
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

          {/* Save Button */}
          <Button colorScheme="blue" onClick={handleSave} size="lg">
            Save Settings
          </Button>
        </VStack>
      </Grid>
    </Box>
  );
};

export default Settings; 