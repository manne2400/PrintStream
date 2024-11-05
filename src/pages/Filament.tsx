import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Flex, Heading, Text, Button, Icon,
  Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalFooter, ModalBody, ModalCloseButton,
  FormControl, FormLabel, Input, Select,
  NumberInput, NumberInputField, NumberInputStepper,
  NumberIncrementStepper, NumberDecrementStepper,
  useDisclosure, VStack, Switch,
  Table, Thead, Tbody, Tr, Th, Td,
  useToast, Editable, EditableInput, EditablePreview, useEditableControls, IconButton, InputGroup, InputLeftElement
} from '@chakra-ui/react';
import { PlusIcon, PencilIcon, DocumentDuplicateIcon, TrashIcon, SearchIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import initializeDatabase from '../database/setup';
import { FilamentOperations, Filament as FilamentType } from '../database/operations';
import { useNotifications } from '../context/NotificationContext';

const FilamentTypes = [
  'PLA', 'PETG', 'ABS', 'TPU', 'ASA', 'PC', 'Nylon', 'HIPS', 'PVA', 'Other'
];

interface FilamentFormData {
  name: string;
  type: string;
  color: string;
  pricePerKg: number;
  weight: number;
  useAms: boolean;
  amsSlot: number | null;
  lowStockAlert: number;
}

interface AmsSlotCellProps {
  value: number | null;
  row: { original: FilamentType };
  onSave: (id: number, updates: Partial<FilamentType>) => Promise<void>;
}

const AmsSlotCell: React.FC<AmsSlotCellProps> = ({ value, row, onSave }) => {
  const toast = useToast();
  
  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (row?.original?.id) {
      try {
        await onSave(row.original.id, { 
          ams_slot: e.target.value === "none" ? null : Number(e.target.value) 
        });
      } catch (err) {
        // Vis fejlbesked hvis AMS slot er optaget
        toast({
          title: 'Error',
          description: err.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  const displayValue = value !== undefined && value !== null ? value.toString() : "none";

  return (
    <Select 
      value={displayValue}
      onChange={handleChange}
      size="sm"
    >
      <option value="none">None</option>
      {[...Array(16)].map((_, i) => (
        <option key={i + 1} value={(i + 1).toString()}>
          {i + 1}
        </option>
      ))}
    </Select>
  );
};

interface CopyModalProps {
  isOpen: boolean;
  onClose: () => void;
  filamentData: FilamentType;
  onSubmit: (data: Omit<FilamentType, 'id' | 'created_at'>) => void;
}

const CopyFilamentModal: React.FC<CopyModalProps> = ({ isOpen, onClose, filamentData, onSubmit }) => {
  const [copyData, setCopyData] = useState<FilamentFormData>({
    name: `${filamentData.name} (Copy)`,
    type: filamentData.type,
    color: filamentData.color,
    pricePerKg: filamentData.price,
    weight: filamentData.weight,
    useAms: filamentData.ams_slot !== null,
    amsSlot: filamentData.ams_slot,
    lowStockAlert: 500,
  });

  const handleSubmit = () => {
    onSubmit({
      name: copyData.name,
      type: copyData.type,
      color: copyData.color,
      weight: copyData.weight,
      price: copyData.pricePerKg,
      stock: copyData.weight,
      ams_slot: copyData.useAms ? copyData.amsSlot : null,
      low_stock_alert: copyData.lowStockAlert,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Copy Filament</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Name</FormLabel>
              <Input
                value={copyData.name}
                onChange={(e) => setCopyData(prev => ({ ...prev, name: e.target.value }))}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Type</FormLabel>
              <Select
                value={copyData.type}
                onChange={(e) => setCopyData(prev => ({ ...prev, type: e.target.value }))}
              >
                {FilamentTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </Select>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Color</FormLabel>
              <Input
                value={copyData.color}
                onChange={(e) => setCopyData(prev => ({ ...prev, color: e.target.value }))}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Price per kg (DKK)</FormLabel>
              <NumberInput
                value={copyData.pricePerKg}
                onChange={(value) => setCopyData(prev => ({ ...prev, pricePerKg: parseFloat(value) }))}
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

            <FormControl isRequired>
              <FormLabel>Weight (g)</FormLabel>
              <NumberInput
                value={copyData.weight}
                onChange={(value) => setCopyData(prev => ({ ...prev, weight: parseInt(value) }))}
                min={0}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>

            <FormControl display="flex" alignItems="center">
              <FormLabel mb="0">Use AMS</FormLabel>
              <Switch
                isChecked={copyData.useAms}
                onChange={(e) => {
                  setCopyData(prev => ({
                    ...prev,
                    useAms: e.target.checked,
                    amsSlot: e.target.checked ? 1 : null
                  }));
                }}
              />
            </FormControl>

            {copyData.useAms && (
              <FormControl isRequired>
                <FormLabel>AMS Slot</FormLabel>
                <NumberInput
                  value={copyData.amsSlot || 1}
                  onChange={(value) => setCopyData(prev => ({ ...prev, amsSlot: parseInt(value) }))}
                  min={1}
                  max={16}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
            )}

            <FormControl>
              <FormLabel>Low Stock Alert (g)</FormLabel>
              <NumberInput
                value={copyData.lowStockAlert}
                onChange={(value) => setCopyData(prev => ({ ...prev, lowStockAlert: parseInt(value) }))}
                min={0}
                defaultValue={500}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              <Text fontSize="sm" color="gray.500" mt={1}>
                You will be notified when stock falls below this amount
              </Text>
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="blue" onClick={handleSubmit}>
            Create Copy
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

// Hjælpefunktion til at normalisere decimal input
const normalizeDecimal = (value: string): number => {
  // Erstat komma med punktum og fjern alle andre ikke-numeriske tegn undtagen punktum
  const normalized = value.replace(',', '.').replace(/[^\d.]/g, '');
  return Number(normalized);
};

// Tilføj props type
interface FilamentProps {
  checkedFilaments: Set<number>;
  setCheckedFilaments: React.Dispatch<React.SetStateAction<Set<number>>>;
}

interface SortConfig {
  key: keyof FilamentType;
  direction: 'asc' | 'desc';
}

const Filament: React.FC<FilamentProps> = ({ checkedFilaments, setCheckedFilaments }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const [filaments, setFilaments] = useState<FilamentType[]>([]);
  const [formData, setFormData] = useState<FilamentFormData>({
    name: '',
    type: '',
    color: '',
    pricePerKg: 0,
    weight: 1000,
    useAms: false,
    amsSlot: null,
    lowStockAlert: 500,
  });
  const [copyModalData, setCopyModalData] = useState<FilamentType | null>(null);
  const [deleteFilament, setDeleteFilament] = useState<FilamentType | null>(null);
  const { addNotification } = useNotifications();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' });

  useEffect(() => {
    loadFilaments();
  }, []);

  const loadFilaments = async () => {
    try {
      const db = await initializeDatabase();
      const ops = new FilamentOperations(db);
      const data = await ops.getAllFilaments();
      setFilaments(data);
    } catch (err) {
      console.error('Failed to load filaments:', err);
      toast({
        title: 'Error',
        description: 'Failed to load filaments',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleInputChange = (field: keyof FilamentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAmsToggle = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      useAms: checked,
      amsSlot: checked ? 1 : null
    }));
  };

  const handleSubmit = async () => {
    try {
      const db = await initializeDatabase();
      const ops = new FilamentOperations(db);
      
      await ops.addFilament({
        name: formData.name,
        type: formData.type,
        color: formData.color,
        weight: formData.weight,
        price: formData.pricePerKg,
        stock: formData.weight,
        ams_slot: formData.useAms ? formData.amsSlot : null,
        low_stock_alert: formData.lowStockAlert,
      });

      toast({
        title: 'Success',
        description: 'Filament added successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      onClose();
      setFormData({
        name: '',
        type: '',
        color: '',
        pricePerKg: 0,
        weight: 1000,
        useAms: false,
        amsSlot: null,
        lowStockAlert: 500,
      });
      loadFilaments(); // Reload the list
    } catch (err) {
      console.error('Failed to add filament:', err);
      toast({
        title: 'Error',
        description: 'Failed to add filament',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleUpdate = async (id: number, updates: Partial<FilamentType>) => {
    try {
      const db = await initializeDatabase();
      const ops = new FilamentOperations(db);
      await ops.updateFilament(id, updates);
      
      // Hvis stock opdateres til over alert niveau, fjern fra notificerede
      if (updates.stock !== undefined) {
        const filament = filaments.find(f => f.id === id);
        if (filament && updates.stock > (filament.low_stock_alert ?? 500)) {
          setCheckedFilaments(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
          });
        }
      }
      
      loadFilaments();
      toast({
        title: 'Success',
        description: 'Filament updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Failed to update filament:', err);
      toast({
        title: 'Error',
        description: 'Failed to update filament',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleCopy = (filament: FilamentType) => {
    setCopyModalData(filament);
  };

  const handleCopySubmit = async (data: Omit<FilamentType, 'id' | 'created_at'>) => {
    try {
      const db = await initializeDatabase();
      const ops = new FilamentOperations(db);
      await ops.addFilament(data);
      loadFilaments();
      toast({
        title: 'Success',
        description: 'Filament copied successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setCopyModalData(null);
    } catch (err) {
      console.error('Failed to copy filament:', err);
      toast({
        title: 'Error',
        description: 'Failed to copy filament',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDelete = async (filament: FilamentType) => {
    setDeleteFilament(filament);
  };

  const confirmDelete = async () => {
    if (!deleteFilament?.id) return;
    
    try {
      const db = await initializeDatabase();
      const ops = new FilamentOperations(db);
      await ops.deleteFilament(deleteFilament.id);
      loadFilaments();
      toast({
        title: 'Success',
        description: 'Filament deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setDeleteFilament(null);
    } catch (err) {
      console.error('Failed to delete filament:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete filament',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Tilføj søgefunktion
  const filteredFilaments = useMemo(() => {
    return filaments.filter(filament => {
      const searchLower = searchQuery.toLowerCase();
      return (
        filament.name.toLowerCase().includes(searchLower) ||
        filament.type.toLowerCase().includes(searchLower) ||
        filament.color.toLowerCase().includes(searchLower)
      );
    });
  }, [filaments, searchQuery]);

  // Tilføj sorteringsfunktion
  const sortedFilaments = useMemo(() => {
    const sorted = [...filteredFilaments].sort((a, b) => {
      if (a[sortConfig.key] === null) return 1;
      if (b[sortConfig.key] === null) return -1;

      let comparison = 0;
      if (typeof a[sortConfig.key] === 'string') {
        comparison = (a[sortConfig.key] as string).localeCompare(b[sortConfig.key] as string);
      } else {
        comparison = (a[sortConfig.key] as number) - (b[sortConfig.key] as number);
      }
      
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [filteredFilaments, sortConfig]);

  const handleSort = (key: keyof FilamentType) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Tilføj søge- og sorteringskomponenter over tabellen
  const renderSortIcon = (columnKey: keyof FilamentType) => {
    if (sortConfig.key !== columnKey) {
      return null;
    }
    return sortConfig.direction === 'asc' ? 
      <Icon as={ChevronUpIcon} w={4} h={4} /> : 
      <Icon as={ChevronDownIcon} w={4} h={4} />;
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="lg" fontWeight="semibold" color="gray.800">
            Filament
          </Heading>
          <Text mt={1} color="gray.500" fontSize="sm">
            Manage your filaments
          </Text>
        </Box>
        <Button
          leftIcon={<Icon as={PlusIcon} boxSize={5} />}
          colorScheme="blue"
          size="md"
          onClick={onOpen}
        >
          Add Filament
        </Button>
      </Flex>

      {/* Søgefelt */}
      <Box mb={4}>
        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <Icon as={SearchIcon} color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder="Search filaments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </InputGroup>
      </Box>

      {/* Filament Table */}
      <Box bg="white" p={6} rounded="lg" shadow="sm">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th cursor="pointer" onClick={() => handleSort('name')}>
                <Flex align="center">
                  Name {renderSortIcon('name')}
                </Flex>
              </Th>
              <Th cursor="pointer" onClick={() => handleSort('type')}>
                <Flex align="center">
                  Type {renderSortIcon('type')}
                </Flex>
              </Th>
              <Th cursor="pointer" onClick={() => handleSort('color')}>
                <Flex align="center">
                  Color {renderSortIcon('color')}
                </Flex>
              </Th>
              <Th isNumeric cursor="pointer" onClick={() => handleSort('price')}>
                <Flex align="center" justify="flex-end">
                  Price/kg {renderSortIcon('price')}
                </Flex>
              </Th>
              <Th isNumeric cursor="pointer" onClick={() => handleSort('stock')}>
                <Flex align="center" justify="flex-end">
                  Stock (g) {renderSortIcon('stock')}
                </Flex>
              </Th>
              <Th isNumeric cursor="pointer" onClick={() => handleSort('low_stock_alert')}>
                <Flex align="center" justify="flex-end">
                  Alert at (g) {renderSortIcon('low_stock_alert')}
                </Flex>
              </Th>
              <Th cursor="pointer" onClick={() => handleSort('ams_slot')}>
                <Flex align="center">
                  AMS Slot {renderSortIcon('ams_slot')}
                </Flex>
              </Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {/* Opdater filaments.map til sortedFilaments.map */}
            {sortedFilaments.map((filament) => (
              <Tr key={filament.id}>
                <Td>{filament.name}</Td>
                <Td>{filament.type}</Td>
                <Td>{filament.color}</Td>
                <Td isNumeric>
                  <Editable
                    defaultValue={filament.price.toFixed(2).replace('.', ',')}
                    onSubmit={(value) => handleUpdate(filament.id!, { price: normalizeDecimal(value) })}
                  >
                    <EditablePreview />
                    <EditableInput 
                      type="text" 
                      pattern="[0-9]*[.,]?[0-9]*"
                    />
                  </Editable>
                </Td>
                <Td isNumeric>
                  <Editable
                    defaultValue={filament.stock.toString()}
                    onSubmit={(value) => handleUpdate(filament.id!, { stock: parseInt(value) })}
                  >
                    <EditablePreview />
                    <EditableInput type="number" />
                  </Editable>
                </Td>
                <Td isNumeric>
                  <Editable
                    defaultValue={filament.low_stock_alert?.toString() ?? "500"}
                    onSubmit={(value) => handleUpdate(filament.id!, { low_stock_alert: parseInt(value) })}
                  >
                    <EditablePreview />
                    <EditableInput type="number" min="0" />
                  </Editable>
                </Td>
                <Td>
                  <AmsSlotCell 
                    value={filament.ams_slot} 
                    row={{ original: filament }} 
                    onSave={handleUpdate} 
                  />
                </Td>
                <Td>
                  <Flex gap={2}>
                    <IconButton
                      aria-label="Copy filament"
                      icon={<Icon as={DocumentDuplicateIcon} />}
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopy(filament)}
                    />
                    <IconButton
                      aria-label="Delete filament"
                      icon={<Icon as={TrashIcon} />}
                      size="sm"
                      variant="ghost"
                      colorScheme="red"
                      onClick={() => handleDelete(filament)}
                    />
                  </Flex>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      {/* Add Filament Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add New Filament</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Name</FormLabel>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter filament name"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Type</FormLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  placeholder="Select filament type"
                >
                  {FilamentTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Color</FormLabel>
                <Input
                  value={formData.color}
                  onChange={(e) => handleInputChange('color', e.target.value)}
                  placeholder="Enter color"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Price per kg (DKK)</FormLabel>
                <NumberInput
                  value={formData.pricePerKg.toFixed(2).replace('.', ',')}
                  onChange={(valueString) => {
                    const numericValue = normalizeDecimal(valueString);
                    handleInputChange('pricePerKg', numericValue);
                  }}
                  min={0}
                  precision={2}
                  step={0.01}
                  format={(val) => val.replace('.', ',')}
                  parse={(val) => normalizeDecimal(val)}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Weight (g)</FormLabel>
                <NumberInput
                  value={formData.weight}
                  onChange={(value) => handleInputChange('weight', parseInt(value))}
                  min={0}
                  defaultValue={1000}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <FormControl display="flex" alignItems="center">
                <FormLabel mb="0">Use AMS</FormLabel>
                <Switch
                  isChecked={formData.useAms}
                  onChange={(e) => handleAmsToggle(e.target.checked)}
                />
              </FormControl>

              {formData.useAms && (
                <FormControl isRequired>
                  <FormLabel>AMS Slot</FormLabel>
                  <NumberInput
                    value={formData.amsSlot || 1}
                    onChange={(value) => handleInputChange('amsSlot', parseInt(value))}
                    min={1}
                    max={16}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
              )}

              <FormControl>
                <FormLabel>Low Stock Alert (g)</FormLabel>
                <NumberInput
                  value={formData.lowStockAlert}
                  onChange={(value) => handleInputChange('lowStockAlert', parseInt(value))}
                  min={0}
                  defaultValue={500}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <Text fontSize="sm" color="gray.500" mt={1}>
                  You will be notified when stock falls below this amount
                </Text>
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleSubmit}>
              Add Filament
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {copyModalData && (
        <CopyFilamentModal
          isOpen={copyModalData !== null}
          onClose={() => setCopyModalData(null)}
          filamentData={copyModalData}
          onSubmit={handleCopySubmit}
        />
      )}

      {deleteFilament && (
        <Modal isOpen={deleteFilament !== null} onClose={() => setDeleteFilament(null)}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Delete Filament</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Text>
                Are you sure you want to delete the filament "{deleteFilament.name}"? 
                This action cannot be undone.
              </Text>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={() => setDeleteFilament(null)}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={confirmDelete}>
                Delete
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </Box>
  );
};

export default Filament; 