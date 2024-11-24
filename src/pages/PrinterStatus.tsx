import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Progress,
  Badge,
  useToast,
  Button,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton
} from '@chakra-ui/react';
import initializeDatabase from '../database/setup';
import { PrinterOperations } from '../database/operations';
const { ipcRenderer } = window.require('electron');
import path from 'path';

interface PrinterStatusData {
  connected: boolean;
  error?: string;
  last_update: number;
  gcode_state: string | null;
  nozzle_temper: number | null;
  bed_temper: number | null;
  subtask_name: string | null;
  mc_percent: number | null;
  mc_remaining_time: number | null;
  ams_humidity: string | null;
}

interface PrinterConfig {
  ip_address: string;
  access_code: string;
  serial: string;
  name?: string;
}

const PrinterStatus: React.FC = () => {
  const [status, setStatus] = useState<PrinterStatusData | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [config, setConfig] = useState<PrinterConfig>({
    ip_address: '',
    access_code: '',
    serial: ''
  });
  const toast = useToast();

  useEffect(() => {
    loadPrinterConfig();
    const interval = setInterval(readStatusFile, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadPrinterConfig = async () => {
    try {
      const db = await initializeDatabase();
      const printerOps = new PrinterOperations(db);
      const savedConfig = await printerOps.getPrinterConfig();
      if (savedConfig) {
        setConfig(savedConfig);
        startMonitoring(savedConfig);
      }
    } catch (error) {
      console.error('Failed to load printer config:', error);
    }
  };

  const readStatusFile = async () => {
    try {
      const data = await ipcRenderer.invoke('read-status-file', 'printer_status.json');
      if (data) {
        setStatus(JSON.parse(data));
      }
    } catch (error) {
      console.error('Failed to read status file:', error);
    }
  };

  const startMonitoring = async (printerConfig: PrinterConfig) => {
    try {
      const result = await ipcRenderer.invoke('start-printer-monitor', printerConfig);
      if (result.success) {
        toast({
          title: 'Printer monitoring started',
          status: 'success',
          duration: 3000
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: 'Failed to start monitoring',
        description: error.message,
        status: 'error',
        duration: 5000
      });
    }
  };

  const stopMonitoring = async () => {
    try {
      const result = await ipcRenderer.invoke('stop-printer-monitor');
      if (result.success) {
        toast({
          title: 'Printer monitoring stopped',
          status: 'info',
          duration: 3000
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      if (error instanceof Error) {
        toast({
          title: 'Failed to stop monitoring',
          description: error.message,
          status: 'error',
          duration: 5000
        });
      }
    }
  };

  const saveConfig = async () => {
    try {
      const db = await initializeDatabase();
      const printerOps = new PrinterOperations(db);
      await printerOps.savePrinterConfig(config);
      await startMonitoring(config);
      setIsConfigOpen(false);
    } catch (error) {
      toast({
        title: 'Failed to save config',
        description: error.message,
        status: 'error',
        duration: 5000
      });
    }
  };

  const getStatusColor = (status: PrinterStatusData | null) => {
    if (!status) return 'gray';
    if (!status.connected) return 'red';
    if (status.gcode_state === 'RUNNING') return 'green';
    return 'blue';
  };

  const reconnect = async () => {
    try {
      await stopMonitoring();
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await startMonitoring(config);
      
      toast({
        title: 'Reconnecting to printer',
        status: 'info',
        duration: 3000
      });
    } catch (error) {
      if (error instanceof Error) {
        toast({
          title: 'Failed to reconnect',
          description: error.message,
          status: 'error',
          duration: 5000
        });
      }
    }
  };

  return (
    <Box p={5}>
      <HStack justify="space-between" mb={5}>
        <Heading>Printer Status</Heading>
        <HStack spacing={4}>
          <Button 
            colorScheme={status?.connected ? "red" : "green"}
            onClick={status?.connected ? stopMonitoring : () => startMonitoring(config)}
          >
            {status?.connected ? "Stop Monitoring" : "Start Monitoring"}
          </Button>
          {status && !status.connected && (
            <Button 
              colorScheme="blue" 
              onClick={reconnect}
              isDisabled={!config.ip_address}
            >
              Reconnect
            </Button>
          )}
          <Button onClick={() => setIsConfigOpen(true)}>Configure Printer</Button>
        </HStack>
      </HStack>

      {/* Status visning */}
      {status ? (
        <VStack align="stretch" spacing={4}>
          <HStack justify="space-between">
            <Text fontWeight="bold">Connection:</Text>
            <Badge colorScheme={getStatusColor(status)}>
              {!status.connected ? 'Disconnected' : (status.gcode_state || 'Connected')}
            </Badge>
          </HStack>

          {status.error && (
            <Box bg="red.100" p={3} rounded="md">
              <Text color="red.600">{status.error}</Text>
            </Box>
          )}

          {status.connected && (
            <>
              <HStack justify="space-between">
                <Text fontWeight="bold">Print Job:</Text>
                <Text>{status.subtask_name || 'None'}</Text>
              </HStack>

              {status.mc_percent !== null && (
                <Box>
                  <Text fontWeight="bold" mb={2}>Progress:</Text>
                  <Progress value={status.mc_percent} />
                  <Text mt={1}>{status.mc_percent}%</Text>
                </Box>
              )}

              <HStack justify="space-between">
                <Text fontWeight="bold">Time Remaining:</Text>
                <Text>{status.mc_remaining_time ? `${status.mc_remaining_time} min` : 'N/A'}</Text>
              </HStack>

              <HStack justify="space-between">
                <Text fontWeight="bold">Nozzle Temperature:</Text>
                <Text>{status.nozzle_temper}°C</Text>
              </HStack>

              <HStack justify="space-between">
                <Text fontWeight="bold">Bed Temperature:</Text>
                <Text>{status.bed_temper}°C</Text>
              </HStack>

              <HStack justify="space-between">
                <Text fontWeight="bold">AMS Humidity:</Text>
                <Text>{status.ams_humidity}%</Text>
              </HStack>
            </>
          )}

          <Text fontSize="sm" color="gray.500">
            Last Updated: {new Date(status.last_update * 1000).toLocaleTimeString()}
          </Text>
        </VStack>
      ) : (
        <Text>Loading printer status...</Text>
      )}

      {/* Konfigurationsmodal */}
      <Modal isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Printer Configuration</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>IP Address</FormLabel>
                <Input 
                  value={config.ip_address}
                  onChange={(e) => setConfig(prev => ({ ...prev, ip_address: e.target.value }))}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Access Code</FormLabel>
                <Input 
                  value={config.access_code}
                  onChange={(e) => setConfig(prev => ({ ...prev, access_code: e.target.value }))}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Serial Number</FormLabel>
                <Input 
                  value={config.serial}
                  onChange={(e) => setConfig(prev => ({ ...prev, serial: e.target.value }))}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Printer Name (Optional)</FormLabel>
                <Input 
                  value={config.name || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={saveConfig}>
              Save
            </Button>
            <Button onClick={() => setIsConfigOpen(false)}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default PrinterStatus; 