import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Flex, Heading, Text, Button, Icon,
  Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalFooter, ModalBody, ModalCloseButton,
  FormControl, FormLabel, Input, Select,
  NumberInput, NumberInputField, NumberInputStepper,
  NumberIncrementStepper, NumberDecrementStepper,
  VStack, Table, Thead, Tbody, Tr, Th, Td,
  useToast, Divider, IconButton, InputGroup, InputLeftElement, Editable, EditablePreview, EditableInput
} from '@chakra-ui/react';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import initializeDatabase from '../database/setup';
import { ProjectOperations, CustomerOperations, FilamentOperations, PrintJobOperations, Project, Customer } from '../database/operations';
import { useCurrency } from '../context/CurrencyContext';

interface PrintJobFormData {
  projectId: number;
  quantity: number;
  status: PrintStatus;
}

interface CostBreakdown {
  materialCost: number;
  printingCost: number;
  postProcessingCost: number;
  extraCosts: number;
  totalCost: number;
}

// Tilføj PrintStatus type
type PrintStatus = 'pending' | 'printing' | 'completed' | 'cancelled';

const PrintInventory: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown | null>(null);
  const toast = useToast();

  const [formData, setFormData] = useState<PrintJobFormData>({
    projectId: 0,
    quantity: 1,
    status: 'pending'
  });

  const [printJobs, setPrintJobs] = useState<PrintJob[]>([]);

  // Tilføj state for edit og delete
  const [editModalData, setEditModalData] = useState<PrintJob | null>(null);
  const [deleteJob, setDeleteJob] = useState<PrintJob | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'project_id', direction: 'asc' });

  const { currency } = useCurrency();

  // Tilføj status farver og labels
  const statusColors: Record<PrintStatus, string> = {
    pending: 'yellow.500',
    printing: 'blue.500',
    completed: 'green.500',
    cancelled: 'red.500'
  };

  const statusLabels: Record<PrintStatus, string> = {
    pending: 'Pending',
    printing: 'Printing',
    completed: 'Completed',
    cancelled: 'Cancelled'
  };

  // Tilføj ny state for status modal
  const [statusModalData, setStatusModalData] = useState<PrintJob | null>(null);

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
        status: formData.status,
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
        quantity: 1,
        status: 'pending'
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

  const handleStatusChange = async (id: number, newStatus: PrintStatus) => {
    try {
      const db = await initializeDatabase();
      const ops = new PrintJobOperations(db);
      
      // Opdater status
      await ops.updatePrintJob(id, { status: newStatus });
      
      // Konsolider print jobs med samme status
      await ops.consolidatePrintJobs();
      
      // Genindlæs print jobs
      await loadPrintJobs();
      
      toast({
        title: 'Status Updated',
        description: `Print job status changed to ${statusLabels[newStatus]}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      setStatusModalData(null);
    } catch (err) {
      console.error('Failed to update status:', err);
      toast({
        title: 'Error',
        description: 'Failed to update print job status',
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

  // Opdater handleDelete funktionen
  const handleDelete = (group: GroupedPrintJob) => {
    setDeleteJob({
      ...group.prints[0],
      project_name: group.project_name,
      quantity: group.total_quantity
    });
  };

  // Opdater confirmDelete funktionen
  const confirmDelete = async () => {
    if (!deleteJob?.project_id) return;
    
    try {
      const db = await initializeDatabase();
      const ops = new PrintJobOperations(db);
      
      // Slet alle prints for dette projekt
      await ops.deleteProjectPrints(deleteJob.project_id);
      
      await loadPrintJobs();
      toast({
        title: 'Success',
        description: 'Print jobs deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setDeleteJob(null);
    } catch (err) {
      console.error('Failed to delete print jobs:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete print jobs',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Tilføj filtrering af print jobs
  const filteredPrintJobs = useMemo(() => {
    return printJobs.filter(job => {
      const searchLower = searchQuery.toLowerCase();
      return (
        job.project_name?.toLowerCase().includes(searchLower) ||
        job.customer_name?.toLowerCase().includes(searchLower) ||
        job.status.toLowerCase().includes(searchLower)
      );
    });
  }, [printJobs, searchQuery]);

  // Tilføj sorteringsfunktion
  const sortedPrintJobs = useMemo(() => {
    return [...filteredPrintJobs].sort((a, b) => {
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
  }, [filteredPrintJobs, sortConfig]);

  const handleSort = (key: keyof PrintJob) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const renderSortIcon = (columnKey: keyof PrintJob) => {
    if (sortConfig.key !== columnKey) {
      return null;
    }
    return sortConfig.direction === 'asc' ? 
      <Icon as={ChevronUpIcon} w={4} h={4} /> : 
      <Icon as={ChevronDownIcon} w={4} h={4} />;
  };

  return (
    <Box p={4}>
      <Box variant="stats-card">
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
            onClick={() => setIsOpen(true)}
          >
            Add New Print Job
          </Button>
        </Flex>

        <Box mb={4}>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <Icon as={MagnifyingGlassIcon} color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Search print jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </InputGroup>
        </Box>

        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Project</Th>
              <Th>Date</Th>
              <Th>Quantity</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredPrintJobs.map((job) => (
              <Tr key={job.id}>
                <Td>{job.project_name}</Td>
                <Td>{job.date}</Td>
                <Td>{job.quantity}</Td>
                <Td onClick={() => setStatusModalData(job)} style={{ cursor: 'pointer' }}>
                  <Text color={statusColors[job.status]} fontWeight="medium">
                    {statusLabels[job.status]}
                  </Text>
                </Td>
                <Td>
                  <Flex gap={2}>
                    <IconButton
                      aria-label="Edit print job"
                      icon={<Icon as={PencilIcon} />}
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditModalData(job)}
                    />
                    <IconButton
                      aria-label="Delete print job"
                      icon={<Icon as={TrashIcon} />}
                      size="sm"
                      variant="ghost"
                      colorScheme="red"
                      onClick={() => setDeleteJob(job)}
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

              <FormControl isRequired>
                <FormLabel>Status</FormLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    status: e.target.value as PrintStatus 
                  }))}
                >
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </FormControl>

              {costBreakdown && (
                <Box width="100%" p={4} borderWidth={1} borderRadius="md">
                  <Heading size="sm" mb={2}>Cost Breakdown</Heading>
                  <VStack align="stretch" spacing={2}>
                    <Flex justify="space-between">
                      <Text>Material Cost:</Text>
                      <Text>{currency} {costBreakdown.materialCost.toFixed(2)}</Text>
                    </Flex>
                    <Flex justify="space-between">
                      <Text>Printing Cost:</Text>
                      <Text>{currency} {costBreakdown.printingCost.toFixed(2)}</Text>
                    </Flex>
                    <Flex justify="space-between">
                      <Text>Post-Processing Cost:</Text>
                      <Text>{currency} {costBreakdown.postProcessingCost.toFixed(2)}</Text>
                    </Flex>
                    <Flex justify="space-between">
                      <Text>Extra Costs:</Text>
                      <Text>{currency} {costBreakdown.extraCosts.toFixed(2)}</Text>
                    </Flex>
                    <Divider />
                    <Flex justify="space-between" fontWeight="bold">
                      <Text>Total Cost:</Text>
                      <Text>{currency} {costBreakdown.totalCost.toFixed(2)}</Text>
                    </Flex>
                    <Flex justify="space-between" fontWeight="bold" color="blue.500">
                      <Text>Cost per Unit:</Text>
                      <Text>{currency} {(costBreakdown.totalCost / formData.quantity).toFixed(2)}</Text>
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

                <FormControl isRequired>
                  <FormLabel>Status</FormLabel>
                  <Select
                    value={editModalData.status}
                    onChange={(e) => setEditModalData(prev => ({
                      ...prev!,
                      status: e.target.value as PrintStatus
                    }))}
                  >
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
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
            <ModalHeader>Delete Print Jobs</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Text>
                Are you sure you want to delete all prints ({deleteJob.quantity} items) for project "{deleteJob.project_name}"? 
                This action cannot be undone.
              </Text>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={() => setDeleteJob(null)}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={confirmDelete}>
                Delete All
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {statusModalData && (
        <Modal isOpen={statusModalData !== null} onClose={() => setStatusModalData(null)}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Update Print Status</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <Text>
                  Current status: <Text as="span" color={statusColors[statusModalData.status]} fontWeight="bold">
                    {statusLabels[statusModalData.status]}
                  </Text>
                </Text>
                <FormControl>
                  <FormLabel>New Status</FormLabel>
                  <Select
                    value={statusModalData.status}
                    onChange={(e) => setStatusModalData(prev => ({
                      ...prev!,
                      status: e.target.value as PrintStatus
                    }))}
                  >
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={() => setStatusModalData(null)}>
                Cancel
              </Button>
              <Button
                colorScheme="blue"
                onClick={() => handleStatusChange(statusModalData.id!, statusModalData.status)}
              >
                Update Status
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </Box>
  );
};

export default PrintInventory; 