import React, { useState, useEffect } from 'react';
import {
  Box, Flex, Heading, Text, Button, Icon,
  Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalFooter, ModalBody, ModalCloseButton,
  FormControl, FormLabel, Input, Select,
  NumberInput, NumberInputField, NumberInputStepper,
  NumberIncrementStepper, NumberDecrementStepper,
  useDisclosure, VStack, Switch,
  Table, Thead, Tbody, Tr, Th, Td,
  useToast, Editable, EditableInput, EditablePreview, useEditableControls, IconButton
} from '@chakra-ui/react';
import { PlusIcon, PencilIcon } from '@heroicons/react/24/outline';
import initializeDatabase from '../database/setup';
import { FilamentOperations, Filament as FilamentType } from '../database/operations';

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
}

const Filament: React.FC = () => {
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
    amsSlot: null
  });

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
        ams_slot: formData.useAms ? formData.amsSlot : null
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
        amsSlot: null
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
      loadFilaments(); // Genindlæs listen
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

      {/* Filament Table */}
      <Box bg="white" p={6} rounded="lg" shadow="sm">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Type</Th>
              <Th>Color</Th>
              <Th isNumeric>Weight (g)</Th>
              <Th isNumeric>Price/kg</Th>
              <Th isNumeric>Stock (g)</Th>
              <Th>AMS Slot</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filaments.map((filament) => (
              <Tr key={filament.id}>
                <Td>{filament.name}</Td>
                <Td>{filament.type}</Td>
                <Td>{filament.color}</Td>
                <Td isNumeric>
                  <Editable
                    defaultValue={filament.weight.toString()}
                    onSubmit={(value) => handleUpdate(filament.id!, { weight: parseInt(value) })}
                  >
                    <EditablePreview />
                    <EditableInput type="number" />
                  </Editable>
                </Td>
                <Td isNumeric>
                  <Editable
                    defaultValue={filament.price.toString()}
                    onSubmit={(value) => handleUpdate(filament.id!, { price: parseFloat(value) })}
                  >
                    <EditablePreview />
                    <EditableInput type="number" step="0.01" />
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
                <Td>
                  <Editable
                    defaultValue={filament.ams_slot?.toString() ?? 'None'}
                    onSubmit={(value) => {
                      const ams_slot = value === 'None' ? null : parseInt(value);
                      handleUpdate(filament.id!, { ams_slot });
                    }}
                  >
                    <EditablePreview />
                    <EditableInput type="number" min="1" max="16" />
                  </Editable>
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
                  value={formData.pricePerKg}
                  onChange={(value) => handleInputChange('pricePerKg', parseFloat(value))}
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
    </Box>
  );
};

export default Filament; 