import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Text,
  Badge,
  useToast,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select
} from '@chakra-ui/react';
const { ipcRenderer } = window.require('electron');

interface Printer {
  id: number;
  name: string;
  ip_address: string;
  port: number;
  printer_type: string;
  status: string;
}

const PrinterMonitor: React.FC = () => {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const toast = useToast();

  useEffect(() => {
    loadPrinters();
    
    // Lyt efter printer status updates
    ipcRenderer.on('printer-status-update', (event, printerData) => {
      setPrinters(current => 
        current.map(p => 
          p.id === printerData.id 
            ? { ...p, status: printerData.status }
            : p
        )
      );
    });

    return () => {
      ipcRenderer.removeAllListeners('printer-status-update');
    };
  }, []);

  const loadPrinters = async () => {
    const db = await initializeDatabase();
    const printerOps = new PrinterOperations(db);
    const loadedPrinters = await printerOps.getAllPrinters();
    setPrinters(loadedPrinters);
    
    // Start monitoring
    ipcRenderer.invoke('start-printer-monitoring', loadedPrinters);
  };

  return (
    <Box p={5}>
      <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={6}>
        {printers.map(printer => (
          <Box 
            key={printer.id}
            p={5}
            shadow="md"
            borderWidth="1px"
            borderRadius="lg"
          >
            <Text fontSize="xl">{printer.name}</Text>
            <Badge colorScheme={printer.status === 'online' ? 'green' : 'red'}>
              {printer.status}
            </Badge>
            <Text mt={2}>IP: {printer.ip_address}:{printer.port}</Text>
            <Text>Type: {printer.printer_type}</Text>
          </Box>
        ))}
      </Grid>
      
      {/* Tilføj printer modal og form her */}
    </Box>
  );
};

export default PrinterMonitor; 