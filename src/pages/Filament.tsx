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
  useToast, Editable, EditableInput, EditablePreview, useEditableControls, IconButton, InputGroup, InputLeftElement,
  Grid
} from '@chakra-ui/react';
import { PlusIcon, PencilIcon, DocumentDuplicateIcon, TrashIcon, MagnifyingGlassIcon, ChevronUpIcon, ChevronDownIcon, ArrowPathIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import initializeDatabase from '../database/setup';
import { FilamentOperations, Filament as FilamentType } from '../database/operations';
import { useNotifications } from '../context/NotificationContext';
import { useCurrency } from '../context/CurrencyContext';

const FilamentTypes = [
  'PLA', 'PETG', 'ABS', 'TPU', 'ASA', 'PC', 'Nylon', 'HIPS', 'PVA', 
  'Resin (Standard)', 'Resin (Tough)', 'Resin (Flexible)', 'Resin (Casting)', 'Other'
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
  isResin: boolean;
  resinSettings?: {
    exposure: number;
    bottomExposure: number;
    liftDistance: number;
    liftSpeed: number;
  };
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
      } catch (err: any) {
        // Tjek om fejlen er relateret til AMS slot
        if (err.message && err.message.includes('AMS slot')) {
          toast({
            title: 'AMS Slot in use',
            description: err.message,
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
        } else {
          toast({
            title: 'Error',
            description: 'Failed to update filament',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
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
    isResin: filamentData.is_resin,
    resinSettings: filamentData.resin_settings,
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
      is_resin: copyData.isResin,
      resin_settings: copyData.resinSettings,
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
              <Editable
                placeholder="0,00"
                defaultValue={copyData.pricePerKg.toFixed(2).replace('.', ',')}
                onChange={(value) => {
                  const cleanValue = value.replace(/[^\d,.]/g, '').replace(/,/g, '.');
                  const parts = cleanValue.split('.');
                  const finalValue = parts.length > 1 
                    ? `${parts[0]}.${parts[1].slice(0, 2)}`
                    : cleanValue;
                  
                  const numericValue = parseFloat(finalValue);
                  if (!isNaN(numericValue)) {
                    setCopyData(prev => ({ ...prev, pricePerKg: numericValue }));
                  }
                }}
                startWithEditView
              >
                <EditablePreview />
                <EditableInput />
              </Editable>
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

// Tilføj EditFilamentModal komponent
interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  filamentData: FilamentType;
  onSubmit: (id: number, data: Partial<FilamentType>) => void;
}

const EditFilamentModal: React.FC<EditModalProps> = ({ isOpen, onClose, filamentData, onSubmit }) => {
  const [editData, setEditData] = useState<FilamentFormData>({
    name: filamentData.name,
    type: filamentData.type,
    color: filamentData.color,
    pricePerKg: filamentData.price,
    weight: filamentData.weight,
    useAms: filamentData.ams_slot !== null,
    amsSlot: filamentData.ams_slot ?? null,
    lowStockAlert: filamentData.low_stock_alert ?? 500,
    isResin: filamentData.is_resin,
    resinSettings: filamentData.resin_settings,
  });

  const handleSubmit = () => {
    onSubmit(filamentData.id!, {
      name: editData.name,
      type: editData.type,
      color: editData.color,
      price: editData.pricePerKg,
      ams_slot: editData.useAms ? editData.amsSlot : null,
      low_stock_alert: editData.lowStockAlert,
      is_resin: editData.isResin,
      resin_settings: editData.resinSettings,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Edit Filament</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Name</FormLabel>
              <Input
                value={editData.name}
                onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Type</FormLabel>
              <Select
                value={editData.type}
                onChange={(e) => setEditData(prev => ({ ...prev, type: e.target.value }))}
              >
                {FilamentTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </Select>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Color</FormLabel>
              <Input
                value={editData.color}
                onChange={(e) => setEditData(prev => ({ ...prev, color: e.target.value }))}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Price per kg (DKK)</FormLabel>
              <Editable
                placeholder="0,00"
                defaultValue={editData.pricePerKg.toFixed(2).replace('.', ',')}
                onChange={(value) => {
                  const cleanValue = value.replace(/[^\d,.]/g, '').replace(/,/g, '.');
                  const parts = cleanValue.split('.');
                  const finalValue = parts.length > 1 
                    ? `${parts[0]}.${parts[1].slice(0, 2)}`
                    : cleanValue;
                  
                  const numericValue = parseFloat(finalValue);
                  if (!isNaN(numericValue)) {
                    setEditData(prev => ({ ...prev, pricePerKg: numericValue }));
                  }
                }}
                startWithEditView
              >
                <EditablePreview />
                <EditableInput />
              </Editable>
            </FormControl>

            <FormControl display="flex" alignItems="center">
              <FormLabel mb="0">Use AMS</FormLabel>
              <Switch
                isChecked={editData.useAms}
                onChange={(e) => {
                  setEditData(prev => ({
                    ...prev,
                    useAms: e.target.checked,
                    amsSlot: e.target.checked ? prev.amsSlot || 1 : null
                  }));
                }}
              />
            </FormControl>

            {editData.useAms && (
              <FormControl isRequired>
                <FormLabel>AMS Slot</FormLabel>
                <NumberInput
                  value={editData.amsSlot || 1}
                  onChange={(value) => setEditData(prev => ({ ...prev, amsSlot: parseInt(value) }))}
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
                value={editData.lowStockAlert}
                onChange={(value) => setEditData(prev => ({ ...prev, lowStockAlert: parseInt(value) }))}
                min={0}
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
            Save Changes
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

// Tilføj AddStockModal komponent
interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  filament: FilamentType;
  onSubmit: (id: number, newStock: number) => void;
}

const AddStockModal: React.FC<AddStockModalProps> = ({ isOpen, onClose, filament, onSubmit }) => {
  const [additionalStock, setAdditionalStock] = useState<number>(0);

  const handleSubmit = async () => {
    const newTotalStock = filament.stock + additionalStock;
    
    // Opdater filaments array direkte med den nye total
    await onSubmit(filament.id!, newTotalStock);
    
    // Reset input og luk modal
    setAdditionalStock(0);
    onClose();
  };

  const handleAddFullRoll = () => {
    setAdditionalStock(filament.weight);
  };

  // Beregn den nye total
  const newTotal = filament.stock + additionalStock;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Add Stock to {filament.name}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl>
              <FormLabel>Current Stock</FormLabel>
              <Input value={`${filament.stock}g`} isReadOnly />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Additional Stock (g)</FormLabel>
              <NumberInput
                value={additionalStock}
                onChange={(value) => setAdditionalStock(parseInt(value))}
                min={0}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
            <Button 
              width="100%" 
              colorScheme="green" 
              variant="outline"
              onClick={handleAddFullRoll}
            >
              Add Full Roll ({filament.weight}g)
            </Button>
            <Box width="100%" pt={2}>
              <Text fontWeight="bold">
                New Total: {newTotal}g
              </Text>
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button 
            colorScheme="blue" 
            onClick={handleSubmit}
            isDisabled={additionalStock <= 0}
          >
            Add Stock
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

// Tilføj InfoModal komponent
interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  filament: FilamentType;
}

const FilamentInfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose, filament }) => {
  const { currency } = useCurrency();
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Filament Information</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Box>
              <Text fontWeight="bold" mb={2}>Basic Information</Text>
              <Grid templateColumns="1fr 1fr" gap={4}>
                <Text>Name:</Text>
                <Text>{filament.name}</Text>
                <Text>Type:</Text>
                <Text>{filament.type}</Text>
                <Text>Color:</Text>
                <Text>{filament.color}</Text>
                <Text>Price per kg:</Text>
                <Text>{currency} {filament.price.toFixed(2)}</Text>
                <Text>Roll Weight:</Text>
                <Text>{filament.weight}g</Text>
                <Text>Current Stock:</Text>
                <Text>{filament.stock}g</Text>
                <Text>Low Stock Alert:</Text>
                <Text>{filament.low_stock_alert}g</Text>
                {filament.ams_slot !== null && (
                  <>
                    <Text>AMS Slot:</Text>
                    <Text>{filament.ams_slot}</Text>
                  </>
                )}
              </Grid>
            </Box>

            {filament.is_resin && (
              <Box>
                <Text fontWeight="bold" mb={2}>Resin Settings</Text>
                <Grid templateColumns="1fr 1fr" gap={4}>
                  <Text>Normal Exposure:</Text>
                  <Text>{filament.resin_exposure} seconds</Text>
                  <Text>Bottom Exposure:</Text>
                  <Text>{filament.resin_bottom_exposure} seconds</Text>
                  <Text>Lift Distance:</Text>
                  <Text>{filament.resin_lift_distance} mm</Text>
                  <Text>Lift Speed:</Text>
                  <Text>{filament.resin_lift_speed} mm/min</Text>
                </Grid>
              </Box>
            )}

            <Box>
              <Text fontWeight="bold" mb={2}>Additional Information</Text>
              <Grid templateColumns="1fr 1fr" gap={4}>
                <Text>Created At:</Text>
                <Text>{new Date(filament.created_at!).toLocaleString()}</Text>
                <Text>Material Type:</Text>
                <Text>{filament.is_resin ? 'Resin' : 'Filament'}</Text>
              </Grid>
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

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
    isResin: false,
    resinSettings: {
      exposure: 2.5,
      bottomExposure: 30,
      liftDistance: 5,
      liftSpeed: 180
    }
  });
  const [copyModalData, setCopyModalData] = useState<FilamentType | null>(null);
  const [deleteFilament, setDeleteFilament] = useState<FilamentType | null>(null);
  const { addNotification } = useNotifications();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' });
  const [editModalData, setEditModalData] = useState<FilamentType | null>(null);
  const [addStockModalData, setAddStockModalData] = useState<FilamentType | null>(null);
  const { currency } = useCurrency();
  const [rolls, setRolls] = useState<number>(1);
  const [infoModalData, setInfoModalData] = useState<FilamentType | null>(null);

  useEffect(() => {
    loadFilaments();
  }, []);

  const loadFilaments = async () => {
    try {
      const db = await initializeDatabase();
      const ops = new FilamentOperations(db);
      const data = await ops.getAllFilaments();
      setFilaments(data);
      toast({
        title: 'Success',
        description: 'Data refreshed successfully',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
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

  const handleRefresh = async () => {
    try {
      const db = await initializeDatabase();
      const ops = new FilamentOperations(db);
      const data = await ops.getAllFilaments();
      setFilaments(data);
    } catch (err) {
      console.error('Failed to refresh filaments:', err);
      toast({
        title: 'Error',
        description: 'Failed to refresh data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleInputChange = (field: keyof FilamentFormData, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Hvis type ændres, opdater isResin
      if (field === 'type') {
        newData.isResin = isResinType(value);
        // Nulstil AMS hvis det er resin
        if (newData.isResin) {
          newData.useAms = false;
          newData.amsSlot = null;
        }
      }
      
      return newData;
    });
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
        stock: formData.weight * rolls,
        ams_slot: formData.useAms ? formData.amsSlot : null,
        low_stock_alert: formData.lowStockAlert,
        is_resin: formData.isResin,
        resin_exposure: formData.resinSettings?.exposure,
        resin_bottom_exposure: formData.resinSettings?.bottomExposure,
        resin_lift_distance: formData.resinSettings?.liftDistance,
        resin_lift_speed: formData.resinSettings?.liftSpeed
      });

      await loadFilaments(); // Genindlæs data

      toast({
        title: 'Success',
        description: 'Filament added successfully',
        status: 'success',
        duration: 3000,
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
        isResin: false,
        resinSettings: {
          exposure: 2.5,
          bottomExposure: 30,
          liftDistance: 5,
          liftSpeed: 180
        }
      });
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
      
      // Opdater filaments array direkte
      setFilaments(prevFilaments => 
        prevFilaments.map(filament => 
          filament.id === id 
            ? { ...filament, ...updates }
            : filament
        )
      );
      
      // Vis kun én toast besked ved stock opdatering
      if (updates.stock !== undefined) {
        const filament = filaments.find(f => f.id === id);
        if (filament) {
          if (updates.stock > (filament.low_stock_alert ?? 500)) {
            setCheckedFilaments(prev => {
              const newSet = new Set(prev);
              newSet.delete(id);
              return newSet;
            });
          }
          
          toast({
            title: 'Stock Updated',
            description: `New stock level: ${updates.stock}g`,
            status: 'success',
            duration: 2000,
            isClosable: true,
          });
        }
      }
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
      
      await loadFilaments(); // Genindlæs data
      
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
      
      await loadFilaments(); // Genindlæs data
      
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

  const renderSortIcon = (columnKey: keyof FilamentType) => {
    if (sortConfig.key !== columnKey) {
      return null;
    }
    return sortConfig.direction === 'asc' ? 
      <Icon as={ChevronUpIcon} w={4} h={4} /> : 
      <Icon as={ChevronDownIcon} w={4} h={4} />;
  };

  const handleEdit = (filament: FilamentType) => {
    setEditModalData(filament);
  };

  const handleAddStock = (filament: FilamentType) => {
    setAddStockModalData(filament);
  };

  // Tilføj helper funktion til at tjekke om det er resin
  const isResinType = (type: string) => type.toLowerCase().includes('resin');

  return (
    <Box p={4}>
      <Box variant="stats-card">
        <Flex justify="space-between" align="center" mb={6}>
          <Box>
            <Heading size="lg" fontWeight="semibold" color="gray.800">
              Filaments
            </Heading>
            <Text mt={1} color="gray.500" fontSize="sm">
              Manage your filament inventory
            </Text>
          </Box>
          <Flex gap={2}>
            <IconButton
              aria-label="Refresh"
              icon={<Icon as={ArrowPathIcon} />}
              onClick={handleRefresh}
            />
            <Button
              leftIcon={<Icon as={PlusIcon} boxSize={5} />}
              colorScheme="blue"
              onClick={onOpen}
            >
              Add New Material
            </Button>
          </Flex>
        </Flex>

        <Box mb={4}>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <Icon as={MagnifyingGlassIcon} color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Search filaments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </InputGroup>
        </Box>

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
              <Th isNumeric cursor="pointer" onClick={() => handleSort('weight')}>
                <Flex align="center" justify="flex-end">
                  Roll Weight (g/mL) {renderSortIcon('weight')}
                </Flex>
              </Th>
              <Th isNumeric cursor="pointer" onClick={() => handleSort('stock')}>
                <Flex align="center" justify="flex-end">
                  Stock (g/mL) {renderSortIcon('stock')}
                </Flex>
              </Th>
              <Th isNumeric cursor="pointer" onClick={() => handleSort('low_stock_alert')}>
                <Flex align="center" justify="flex-end">
                  Alert at (g/mL) {renderSortIcon('low_stock_alert')}
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
            {sortedFilaments.map((filament) => (
              <Tr key={filament.id}>
                <Td>{filament.name}</Td>
                <Td>{filament.type}</Td>
                <Td>{filament.color}</Td>
                <Td isNumeric>
                  <Editable
                    defaultValue={filament.price.toFixed(2).replace('.', ',')}
                    onSubmit={(value) => {
                      const numericValue = parseFloat(value.replace(',', '.'));
                      if (!isNaN(numericValue)) {
                        handleUpdate(filament.id!, { price: numericValue });
                      }
                    }}
                  >
                    <EditablePreview />
                    <EditableInput 
                      type="text"
                      pattern="\d*,?\d{0,2}"
                    />
                  </Editable>
                </Td>
                <Td isNumeric>
                  <Flex justify="flex-end" align="center">
                    <Editable
                      defaultValue={filament.weight.toString()}
                      onSubmit={(value) => handleUpdate(filament.id!, { weight: parseInt(value) })}
                    >
                      <EditablePreview />
                      <EditableInput type="number" min="0" />
                    </Editable>
                    <Text ml={1}>{filament.is_resin ? 'mL' : 'g'}</Text>
                  </Flex>
                </Td>
                <Td isNumeric>
                  <Flex justify="flex-end" align="center">
                    <Editable
                      defaultValue={filament.stock.toString()}
                      onSubmit={(value) => handleUpdate(filament.id!, { stock: parseInt(value) })}
                    >
                      <EditablePreview />
                      <EditableInput type="number" />
                    </Editable>
                    <Text ml={1}>{filament.is_resin ? 'mL' : 'g'}</Text>
                  </Flex>
                </Td>
                <Td isNumeric>
                  <Flex justify="flex-end" align="center">
                    <Editable
                      defaultValue={filament.low_stock_alert?.toString() ?? "500"}
                      onSubmit={(value) => handleUpdate(filament.id!, { low_stock_alert: parseInt(value) })}
                    >
                      <EditablePreview />
                      <EditableInput type="number" min="0" />
                    </Editable>
                    <Text ml={1}>{filament.is_resin ? 'mL' : 'g'}</Text>
                  </Flex>
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
                      aria-label="View filament info"
                      icon={<Icon as={InformationCircleIcon} />}
                      size="sm"
                      variant="ghost"
                      colorScheme="blue"
                      onClick={() => setInfoModalData(filament)}
                    />
                    <IconButton
                      aria-label="Add stock"
                      icon={<Icon as={PlusIcon} />}
                      size="sm"
                      variant="ghost"
                      colorScheme="green"
                      onClick={() => handleAddStock(filament)}
                    />
                    <IconButton
                      aria-label="Edit filament"
                      icon={<Icon as={PencilIcon} />}
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(filament)}
                    />
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
                <FormLabel>Price per kg ({currency})</FormLabel>
                <Editable
                  placeholder="0,00"
                  defaultValue={formData.pricePerKg.toFixed(2).replace('.', ',')}
                  onChange={(value) => {
                    const cleanValue = value.replace(/[^\d,.]/g, '').replace(/,/g, '.');
                    const parts = cleanValue.split('.');
                    const finalValue = parts.length > 1 
                      ? `${parts[0]}.${parts[1].slice(0, 2)}`
                      : cleanValue;
                    
                    const numericValue = parseFloat(finalValue);
                    if (!isNaN(numericValue)) {
                      handleInputChange('pricePerKg', numericValue);
                    }
                  }}
                  startWithEditView
                >
                  <EditablePreview />
                  <EditableInput />
                </Editable>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Weight per Roll ({formData.isResin ? 'mL' : 'g'})</FormLabel>
                <NumberInput
                  value={formData.weight}
                  onChange={(value) => setFormData(prev => ({ ...prev, weight: parseInt(value) }))}
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

              <FormControl isRequired>
                <FormLabel>Number of Rolls</FormLabel>
                <NumberInput
                  value={rolls}
                  onChange={(value) => setRolls(parseInt(value))}
                  min={1}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <Text fontSize="sm" color="gray.500" mt={1}>
                  Total stock: {(formData.weight * rolls).toLocaleString()}{formData.isResin ? 'mL' : 'g'}
                </Text>
              </FormControl>

              {/* Vis resin indstillinger hvis det er en resin type */}
              {formData.isResin && (
                <Box width="100%" p={4} borderWidth={1} borderRadius="md">
                  <Heading size="sm" mb={4}>Resin Settings</Heading>
                  <VStack spacing={3}>
                    <FormControl>
                      <FormLabel>Normal Exposure (seconds)</FormLabel>
                      <NumberInput
                        value={formData.resinSettings?.exposure}
                        onChange={(value) => setFormData(prev => ({
                          ...prev,
                          resinSettings: {
                            ...prev.resinSettings!,
                            exposure: parseFloat(value)
                          }
                        }))}
                        step={0.1}
                        precision={1}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Bottom Exposure (seconds)</FormLabel>
                      <NumberInput
                        value={formData.resinSettings?.bottomExposure}
                        onChange={(value) => setFormData(prev => ({
                          ...prev,
                          resinSettings: {
                            ...prev.resinSettings!,
                            bottomExposure: parseFloat(value)
                          }
                        }))}
                        precision={1}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Lift Distance (mm)</FormLabel>
                      <NumberInput
                        value={formData.resinSettings?.liftDistance}
                        onChange={(value) => setFormData(prev => ({
                          ...prev,
                          resinSettings: {
                            ...prev.resinSettings!,
                            liftDistance: parseFloat(value)
                          }
                        }))}
                        precision={1}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Lift Speed (mm/min)</FormLabel>
                      <NumberInput
                        value={formData.resinSettings?.liftSpeed}
                        onChange={(value) => setFormData(prev => ({
                          ...prev,
                          resinSettings: {
                            ...prev.resinSettings!,
                            liftSpeed: parseFloat(value)
                          }
                        }))}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>
                  </VStack>
                </Box>
              )}

              {/* Skjul AMS muligheden for resin */}
              {!formData.isResin && (
                <FormControl display="flex" alignItems="center">
                  <FormLabel mb="0">Use AMS</FormLabel>
                  <Switch
                    isChecked={formData.useAms}
                    onChange={(e) => handleAmsToggle(e.target.checked)}
                  />
                </FormControl>
              )}

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
                <FormLabel>Low Stock Alert ({formData.isResin ? 'mL' : 'g'})</FormLabel>
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

      {editModalData && (
        <EditFilamentModal
          isOpen={editModalData !== null}
          onClose={() => setEditModalData(null)}
          filamentData={editModalData}
          onSubmit={handleUpdate}
        />
      )}

      {addStockModalData && (
        <AddStockModal
          isOpen={addStockModalData !== null}
          onClose={() => {
            setAddStockModalData(null);
            loadFilaments(); // Genindlæs data når modalen lukkes
          }}
          filament={addStockModalData}
          onSubmit={async (id, newStock) => {
            await handleUpdate(id, { stock: newStock });
            await loadFilaments();
          }}
        />
      )}

      {infoModalData && (
        <FilamentInfoModal
          isOpen={infoModalData !== null}
          onClose={() => setInfoModalData(null)}
          filament={infoModalData}
        />
      )}
    </Box>
  );
};

export default Filament; 