import React, { useState, useEffect } from 'react';
import {
  Box, Heading, Text, VStack, FormControl, FormLabel,
  Input, NumberInput, NumberInputField, NumberInputStepper,
  NumberIncrementStepper, NumberDecrementStepper,
  Select, Button, useToast, Divider, Textarea
} from '@chakra-ui/react';
import initializeDatabase from '../database/setup';
import { SettingsOperations, Settings as SettingsType } from '../database/operations';
import { useCurrency } from '../context/CurrencyContext';

const Settings: React.FC = () => {
  const toast = useToast();
  const [settings, setSettings] = useState<SettingsType>({
    printer_hourly_rate: 100,
    post_processing_cost: 100,
    currency: 'DKK',
    company_name: '',
    company_address: '',
    company_phone: '',
    company_email: '',
    bank_details: '',
    vat_id: ''
  });
  const { updateCurrency } = useCurrency();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const db = await initializeDatabase();
      const ops = new SettingsOperations(db);
      const data = await ops.getSettings();
      setSettings({
        printer_hourly_rate: data.printer_hourly_rate ?? 100,
        post_processing_cost: data.post_processing_cost ?? 100,
        currency: data.currency ?? 'DKK',
        company_name: data.company_name ?? '',
        company_address: data.company_address ?? '',
        company_phone: data.company_phone ?? '',
        company_email: data.company_email ?? '',
        bank_details: data.bank_details ?? '',
        vat_id: data.vat_id ?? ''
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
    <Box>
      <VStack spacing={8} align="stretch">
        {/* Pricing Settings */}
        <Box>
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
        <Box>
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
        <Box>
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

        <Box pt={4}>
          <Button colorScheme="blue" onClick={handleSave}>
            Save Settings
          </Button>
        </Box>
      </VStack>
    </Box>
  );
};

export default Settings; 