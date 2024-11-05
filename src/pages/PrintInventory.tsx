import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Flex, Heading, Text, Button, Icon,
  Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalFooter, ModalBody, ModalCloseButton,
  FormControl, FormLabel, Input, Select,
  NumberInput, NumberInputField, NumberInputStepper,
  NumberIncrementStepper, NumberDecrementStepper,
  VStack, Table, Thead, Tbody, Tr, Th, Td,
  useToast, Divider, IconButton
} from '@chakra-ui/react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import initializeDatabase from '../database/setup';
import { ProjectOperations, CustomerOperations, FilamentOperations, PrintJobOperations, Project, Customer } from '../database/operations';

interface PrintJobFormData {
  projectId: number;
  quantity: number;
}

interface CostBreakdown {
  materialCost: number;
  printingCost: number;
  postProcessingCost: number;
  extraCosts: number;
  totalCost: number;
}

// Tilføj interface for grupperede print jobs
interface GroupedPrintJob {
  project_id: number;
  project_name: string;
  customer_name?: string;
  date: string;
  total_quantity: number;
  prints: PrintJob[];
}

const PrintInventory: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown | null>(null);
  const toast = useToast();

  const [formData, setFormData] = useState<PrintJobFormData>({
    projectId: 0,
    quantity: 1
  });

  const [printJobs, setPrintJobs] = useState<Array<PrintJob & { project_name?: string, customer_name?: string }>>([]);

  // Tilføj state for edit og delete
  const [editModalData, setEditModalData] = useState<PrintJob | null>(null);
  const [deleteJob, setDeleteJob] = useState<PrintJob | null>(null);

  useEffect(() => {
    loadProjects();
    loadCustomers();
    loadPrintJobs();
  }, []);

  const loadProjects = async () => {
    try {
      const db = await initializeDatabase();
      const ops = new ProjectOperations(db);
      const data = await ops.getAllProjects();
      setProjects(data);
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  };

  const loadCustomers = async () => {
    try {
      const db = await initializeDatabase();
      const ops = new CustomerOperations(db);
      const data = await ops.getAllCustomers();
      setCustomers(data);
    } catch (err) {
      console.error('Failed to load customers:', err);
    }
  };

  const calculateCosts = async (projectId: number, quantity: number = 1) => {
    try {
      const db = await initializeDatabase();
      const ops = new PrintJobOperations(db);
      const baseCosts = await ops.calculateProjectCosts(projectId);
      
      // Beregn total omkostninger baseret på antal
      const totalCosts = {
        materialCost: baseCosts.materialCost * quantity,
        printingCost: baseCosts.printingCost * quantity,
        postProcessingCost: baseCosts.postProcessingCost * quantity,
        extraCosts: baseCosts.extraCosts * quantity,
        totalCost: baseCosts.totalCost * quantity
      };
      
      setCostBreakdown(totalCosts);
    } catch (err) {
      console.error('Failed to calculate costs:', err);
    }
  };

  const handleProjectChange = async (projectId: number) => {
    setFormData(prev => ({ ...prev, projectId }));
    if (projectId) {
      await calculateCosts(projectId);
    } else {
      setCostBreakdown(null);
    }
  };

  const handleQuantityChange = (quantity: number) => {
    setFormData(prev => ({ ...prev, quantity }));
    if (formData.projectId) {
      calculateCosts(formData.projectId, quantity);
    }
  };

  const handleSubmit = async () => {
    try {
      const db = await initializeDatabase();
      const ops = new PrintJobOperations(db);
      const filamentOps = new FilamentOperations(db);
      
      // Opret print job
      await ops.addPrintJob({
        project_id: formData.projectId,
        customer_id: null,
        date: new Date().toISOString().split('T')[0],
        quantity: formData.quantity,
        price_per_unit: 0 // Pris sættes ved salg
      });

      // Hent projekt og dets filamenter
      const projectOps = new ProjectOperations(db);
      const projectFilaments = await projectOps.getProjectFilaments(formData.projectId);

      // Opdater filament lager for hver filament der bruges
      for (const pf of projectFilaments) {
        const filament = await filamentOps.getAllFilaments();
        const currentFilament = filament.find(f => f.id === pf.filament_id);
        if (currentFilament) {
          const usedAmount = pf.amount * formData.quantity;
          const newStock = currentFilament.stock - usedAmount;
          await filamentOps.updateFilament(pf.filament_id, { stock: newStock });
        }
      }

      // Genindlæs print jobs med det samme
      await loadPrintJobs();

      toast({
        title: 'Success',
        description: 'Print job created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      setIsOpen(false);
      setFormData({
        projectId: 0,
        quantity: 1
      });
      setCostBreakdown(null);
    } catch (err) {
      console.error('Failed to create print job:', err);
      toast({
        title: 'Error',
        description: 'Failed to create print job',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const loadPrintJobs = async () => {
    try {
      const db = await initializeDatabase();
      const ops = new PrintJobOperations(db);
      const data = await ops.getAllPrintJobs();
      setPrintJobs(data);
    } catch (err) {
      console.error('Failed to load print jobs:', err);
      toast({
        title: 'Error',
        description: 'Failed to load print jobs',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Tilføj handleEdit funktion
  const handleEdit = async (id: number, updates: Partial<PrintJob>) => {
    try {
      const db = await initializeDatabase();
      const ops = new PrintJobOperations(db);
      await ops.updatePrintJob(id, updates);
      await loadPrintJobs();
      toast({
        title: 'Success',
        description: 'Print job updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setEditModalData(null);
    } catch (err) {
      console.error('Failed to update print job:', err);
      toast({
        title: 'Error',
        description: 'Failed to update print job',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Tilføj handleDelete funktion
  const handleDelete = (job: PrintJob) => {
    setDeleteJob(job);
  };

  // Tilføj confirmDelete funktion
  const confirmDelete = async () => {
    if (!deleteJob?.id) return;
    
    try {
      const db = await initializeDatabase();
      const ops = new PrintJobOperations(db);
      await ops.deletePrintJob(deleteJob.id);
      await loadPrintJobs();
      toast({
        title: 'Success',
        description: 'Print job deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setDeleteJob(null);
    } catch (err) {
      console.error('Failed to delete print job:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete print job',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // I PrintInventory komponenten, tilføj gruppering af print jobs
  const groupedPrintJobs = useMemo(() => {
    const groups = printJobs.reduce((acc: { [key: number]: GroupedPrintJob }, job) => {
      if (!acc[job.project_id]) {
        acc[job.project_id] = {
          project_id: job.project_id,
          project_name: job.project_name || '',
          customer_name: job.customer_name,
          date: job.date,
          total_quantity: 0,
          prints: []
        };
      }
      acc[job.project_id].total_quantity += job.quantity;
      acc[job.project_id].prints.push(job);
      return acc;
    }, {});

    return Object.values(groups);
  }, [printJobs]);

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="lg" fontWeight="semibold" color="gray.800">
            Print Inventory
          </Heading>
          <Text mt={1} color="gray.500" fontSize="sm">
            Manage your print jobs
          </Text>
        </Box>
        <Button
          leftIcon={<Icon as={PlusIcon} boxSize={5} />}
          colorScheme="blue"
          size="md"
          onClick={() => setIsOpen(true)}
        >
          New Print Job
        </Button>
      </Flex>

      <Box bg="white" p={6} rounded="lg" shadow="sm">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Project</Th>
              <Th>Customer</Th>
              <Th>Date</Th>
              <Th isNumeric>Quantity</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {groupedPrintJobs.map((group) => (
              <Tr key={group.project_id}>
                <Td>{group.project_name}</Td>
                <Td>{group.customer_name || 'N/A'}</Td>
                <Td>{group.date}</Td>
                <Td isNumeric>{group.total_quantity}</Td>
                <Td>In Progress</Td>
                <Td>
                  <Flex gap={2}>
                    <IconButton
                      aria-label="Edit print job"
                      icon={<Icon as={PencilIcon} />}
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditModalData(group.prints[0])}
                    />
                    <IconButton
                      aria-label="Delete print job"
                      icon={<Icon as={TrashIcon} />}
                      size="sm"
                      variant="ghost"
                      colorScheme="red"
                      onClick={() => handleDelete(group.prints[0])}
                    />
                  </Flex>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Print Job</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Project</FormLabel>
                <Select
                  value={formData.projectId}
                  onChange={(e) => handleProjectChange(parseInt(e.target.value))}
                  placeholder="Select project"
                >
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Quantity</FormLabel>
                <NumberInput
                  value={formData.quantity}
                  onChange={(value) => handleQuantityChange(parseInt(value))}
                  min={1}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              {costBreakdown && (
                <Box width="100%" p={4} borderWidth={1} borderRadius="md">
                  <Heading size="sm" mb={2}>Cost Breakdown</Heading>
                  <VStack align="stretch" spacing={2}>
                    <Flex justify="space-between">
                      <Text>Material Cost:</Text>
                      <Text>${costBreakdown.materialCost.toFixed(2)}</Text>
                    </Flex>
                    <Flex justify="space-between">
                      <Text>Printing Cost:</Text>
                      <Text>${costBreakdown.printingCost.toFixed(2)}</Text>
                    </Flex>
                    <Flex justify="space-between">
                      <Text>Post-Processing Cost:</Text>
                      <Text>${costBreakdown.postProcessingCost.toFixed(2)}</Text>
                    </Flex>
                    <Flex justify="space-between">
                      <Text>Extra Costs:</Text>
                      <Text>${costBreakdown.extraCosts.toFixed(2)}</Text>
                    </Flex>
                    <Divider />
                    <Flex justify="space-between" fontWeight="bold">
                      <Text>Total Cost:</Text>
                      <Text>${costBreakdown.totalCost.toFixed(2)}</Text>
                    </Flex>
                    <Flex justify="space-between" fontWeight="bold" color="blue.500">
                      <Text>Cost per Unit:</Text>
                      <Text>${(costBreakdown.totalCost / formData.quantity).toFixed(2)}</Text>
                    </Flex>
                  </VStack>
                </Box>
              )}
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleSubmit}
              isDisabled={!formData.projectId || formData.quantity < 1}
            >
              Create Print
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {editModalData && (
        <Modal isOpen={editModalData !== null} onClose={() => setEditModalData(null)} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Edit Print Job</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Project</FormLabel>
                  <Select
                    value={editModalData.project_id}
                    onChange={(e) => setEditModalData(prev => ({ ...prev!, project_id: parseInt(e.target.value) }))}
                  >
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Quantity</FormLabel>
                  <NumberInput
                    value={editModalData.quantity}
                    onChange={(value) => setEditModalData(prev => ({ ...prev!, quantity: parseInt(value) }))}
                    min={1}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={() => setEditModalData(null)}>
                Cancel
              </Button>
              <Button 
                colorScheme="blue" 
                onClick={() => handleEdit(editModalData.id!, editModalData)}
              >
                Save Changes
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {deleteJob && (
        <Modal isOpen={deleteJob !== null} onClose={() => setDeleteJob(null)}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Delete Print Job</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Text>
                Are you sure you want to delete this print job? 
                This action cannot be undone.
              </Text>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={() => setDeleteJob(null)}>
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

export default PrintInventory; 