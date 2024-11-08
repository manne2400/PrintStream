import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Flex, Heading, Text, Button, Icon,
  Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalFooter, ModalBody, ModalCloseButton,
  FormControl, FormLabel, Input, Textarea,
  NumberInput, NumberInputField, NumberInputStepper,
  NumberIncrementStepper, NumberDecrementStepper,
  VStack, Table, Thead, Tbody, Tr, Th, Td,
  useToast, Select, IconButton, InputGroup, InputLeftElement
} from '@chakra-ui/react';
import { PlusIcon, TrashIcon, MagnifyingGlassIcon, ChevronUpIcon, ChevronDownIcon, ArrowPathIcon, PencilIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import initializeDatabase from '../database/setup';
import { ProjectOperations, FilamentOperations, Project, Filament } from '../database/operations';
import { useCurrency } from '../context/CurrencyContext';

interface ProjectFormData {
  name: string;
  description: string;
  printTime: number;
  postProcessingTime: number;
  extraCosts: number;
  filaments: Array<{
    filamentId: number;
    amount: number;
  }>;
}

// Tilføj FilamentsModal komponent
interface FilamentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  projectName: string;
}

const FilamentsModal: React.FC<FilamentsModalProps> = ({ isOpen, onClose, projectId, projectName }) => {
  const [filaments, setFilaments] = useState<Array<ProjectFilament & { filament_name?: string, filament_type?: string, filament_color?: string }>>([]);
  const toast = useToast();

  useEffect(() => {
    loadFilaments();
  }, [projectId]);

  const loadFilaments = async () => {
    try {
      const db = await initializeDatabase();
      const ops = new ProjectOperations(db);
      const data = await ops.getProjectFilaments(projectId);
      setFilaments(data);
    } catch (err) {
      console.error('Failed to load project filaments:', err);
      toast({
        title: 'Error',
        description: 'Failed to load filaments',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Filaments for {projectName}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Type</Th>
                <Th>Color</Th>
                <Th isNumeric>Amount (g)</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filaments.map((filament) => (
                <Tr key={filament.id}>
                  <Td>{filament.filament_name}</Td>
                  <Td>{filament.filament_type}</Td>
                  <Td>{filament.filament_color}</Td>
                  <Td isNumeric>{filament.amount.toFixed(1)}g</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

interface SortConfig {
  key: keyof Project;
  direction: 'asc' | 'desc';
}

// Tilføj EditProjectModal komponent
interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectData: Project;
  onSubmit: (id: number, data: Partial<Project>) => void;
}

const EditProjectModal: React.FC<EditProjectModalProps> = ({ isOpen, onClose, projectData, onSubmit }) => {
  const [editData, setEditData] = useState<ProjectFormData>({
    name: projectData.name,
    description: projectData.description,
    printTime: projectData.print_time,
    postProcessingTime: projectData.post_processing_time,
    extraCosts: projectData.extra_costs,
    filaments: []  // Vi vil hente de eksisterende filamenter i useEffect
  });

  const [availableFilaments, setAvailableFilaments] = useState<Filament[]>([]);

  // Hent eksisterende filament data når modalen åbnes
  useEffect(() => {
    const loadData = async () => {
      try {
        const db = await initializeDatabase();
        const ops = new ProjectOperations(db);
        const filamentOps = new FilamentOperations(db);
        
        // Hent projektets filamenter
        const projectFilaments = await ops.getProjectFilaments(projectData.id!);
        setEditData(prev => ({
          ...prev,
          filaments: projectFilaments.map(pf => ({
            filamentId: pf.filament_id,
            amount: pf.amount
          }))
        }));

        // Hent alle tilgængelige filamenter
        const allFilaments = await filamentOps.getAllFilaments();
        setAvailableFilaments(allFilaments);
      } catch (err) {
        console.error('Failed to load project data:', err);
      }
    };
    loadData();
  }, [projectData.id]);

  const handleSubmit = async () => {
    try {
      const db = await initializeDatabase();
      const ops = new ProjectOperations(db);
      
      // Opdater projekt detaljer
      await ops.updateProject(projectData.id!, {
        name: editData.name,
        description: editData.description,
        print_time: editData.printTime,
        post_processing_time: editData.postProcessingTime,
        extra_costs: editData.extraCosts
      });

      // Slet eksisterende filaments for projektet
      const existingFilaments = await ops.getProjectFilaments(projectData.id!);
      for (const filament of existingFilaments) {
        await ops.deleteProjectFilament(filament.id!);
      }

      // Tilføj de nye filaments
      for (const filament of editData.filaments) {
        await ops.addProjectFilament({
          project_id: projectData.id!,
          filament_id: filament.filamentId,
          amount: filament.amount
        });
      }

      onSubmit(projectData.id!, {
        name: editData.name,
        description: editData.description,
        print_time: editData.printTime,
        post_processing_time: editData.postProcessingTime,
        extra_costs: editData.extraCosts
      });
      
    } catch (err) {
      console.error('Failed to update project filaments:', err);
      toast({
        title: 'Error',
        description: 'Failed to update project filaments',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleAddFilament = () => {
    setEditData(prev => ({
      ...prev,
      filaments: [...prev.filaments, { filamentId: 0, amount: 0 }]
    }));
  };

  const handleRemoveFilament = (index: number) => {
    setEditData(prev => ({
      ...prev,
      filaments: prev.filaments.filter((_, i) => i !== index)
    }));
  };

  const handleFilamentChange = (index: number, field: 'filamentId' | 'amount', value: number) => {
    setEditData(prev => ({
      ...prev,
      filaments: prev.filaments.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Edit Project</ModalHeader>
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

            <FormControl>
              <FormLabel>Description</FormLabel>
              <Textarea
                value={editData.description}
                onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Print Time (minutes)</FormLabel>
              <NumberInput
                value={editData.printTime}
                onChange={(value) => setEditData(prev => ({ ...prev, printTime: parseInt(value) }))}
                min={0}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Post-Processing Time (minutes)</FormLabel>
              <NumberInput
                value={editData.postProcessingTime}
                onChange={(value) => setEditData(prev => ({ ...prev, postProcessingTime: parseInt(value) }))}
                min={0}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Extra Costs ($)</FormLabel>
              <NumberInput
                value={editData.extraCosts}
                onChange={(value) => setEditData(prev => ({ ...prev, extraCosts: parseFloat(value) }))}
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
              <FormLabel>Filaments</FormLabel>
              <VStack spacing={2} align="stretch">
                {editData.filaments.map((filament, index) => (
                  <Flex key={index} gap={2}>
                    <Select
                      value={filament.filamentId}
                      onChange={(e) => handleFilamentChange(index, 'filamentId', parseInt(e.target.value))}
                    >
                      {availableFilaments.map(f => (
                        <option key={f.id} value={f.id}>
                          {f.name} - {f.color} ({f.type})
                        </option>
                      ))}
                    </Select>
                    <NumberInput
                      value={filament.amount}
                      onChange={(value) => handleFilamentChange(index, 'amount', parseFloat(value))}
                      min={0}
                      precision={1}
                      width="150px"
                    >
                      <NumberInputField placeholder="Grams" />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                    <IconButton
                      aria-label="Remove filament"
                      icon={<Icon as={TrashIcon} />}
                      onClick={() => handleRemoveFilament(index)}
                      colorScheme="red"
                      variant="ghost"
                    />
                  </Flex>
                ))}
                <Button
                  leftIcon={<Icon as={PlusIcon} />}
                  onClick={handleAddFilament}
                  size="sm"
                  variant="outline"
                >
                  Add Filament
                </Button>
              </VStack>
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

const Projects: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [availableFilaments, setAvailableFilaments] = useState<Filament[]>([]);
  const toast = useToast();
  
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    printTime: 0,
    postProcessingTime: 0,
    extraCosts: 0,
    filaments: []
  });

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' });

  // Tilføj state for modals
  const [editModalData, setEditModalData] = useState<Project | null>(null);
  const [deleteProject, setDeleteProject] = useState<Project | null>(null);
  const [copyModalData, setCopyModalData] = useState<Project | null>(null);

  // Tilføj currency hook
  const { currency } = useCurrency();

  useEffect(() => {
    loadProjects();
    loadFilaments();
  }, []);

  const loadProjects = async () => {
    try {
      const db = await initializeDatabase();
      const ops = new ProjectOperations(db);
      const data = await ops.getAllProjects();
      setProjects(data);
    } catch (err) {
      console.error('Failed to load projects:', err);
      toast({
        title: 'Error',
        description: 'Failed to load projects',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const loadFilaments = async () => {
    try {
      const db = await initializeDatabase();
      const ops = new FilamentOperations(db);
      const data = await ops.getAllFilaments();
      setAvailableFilaments(data);
    } catch (err) {
      console.error('Failed to load filaments:', err);
    }
  };

  const handleAddFilament = () => {
    setFormData(prev => ({
      ...prev,
      filaments: [...prev.filaments, { filamentId: 0, amount: 0 }]
    }));
  };

  const handleRemoveFilament = (index: number) => {
    setFormData(prev => ({
      ...prev,
      filaments: prev.filaments.filter((_, i) => i !== index)
    }));
  };

  const handleFilamentChange = (index: number, field: 'filamentId' | 'amount', value: number) => {
    setFormData(prev => ({
      ...prev,
      filaments: prev.filaments.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleSubmit = async () => {
    try {
      const db = await initializeDatabase();
      const ops = new ProjectOperations(db);
      
      // Tilføj projekt
      const projectId = await ops.addProject({
        name: formData.name,
        description: formData.description,
        print_time: formData.printTime,
        post_processing_time: formData.postProcessingTime,
        extra_costs: formData.extraCosts
      });

      // Tilføj filamenter til projektet
      for (const filament of formData.filaments) {
        await ops.addProjectFilament({
          project_id: projectId,
          filament_id: filament.filamentId,
          amount: filament.amount
        });
      }

      toast({
        title: 'Success',
        description: 'Project created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      setIsOpen(false);
      loadProjects();
      setFormData({
        name: '',
        description: '',
        printTime: 0,
        postProcessingTime: 0,
        extraCosts: 0,
        filaments: []
      });
    } catch (err) {
      console.error('Failed to create project:', err);
      toast({
        title: 'Error',
        description: 'Failed to create project',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleViewFilaments = (project: Project) => {
    setSelectedProject(project);
  };

  // Tilføj søgefunktion
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const searchLower = searchQuery.toLowerCase();
      return (
        project.name.toLowerCase().includes(searchLower) ||
        project.description?.toLowerCase().includes(searchLower)
      );
    });
  }, [projects, searchQuery]);

  // Tilføj sorteringsfunktion
  const sortedProjects = useMemo(() => {
    return [...filteredProjects].sort((a, b) => {
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
  }, [filteredProjects, sortConfig]);

  const handleSort = (key: keyof Project) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const renderSortIcon = (columnKey: keyof Project) => {
    if (sortConfig.key !== columnKey) {
      return null;
    }
    return sortConfig.direction === 'asc' ? 
      <Icon as={ChevronUpIcon} w={4} h={4} /> : 
      <Icon as={ChevronDownIcon} w={4} h={4} />;
  };

  const handleEdit = (project: Project) => {
    setEditModalData(project);
  };

  const handleCopy = async (project: Project) => {
    try {
      const db = await initializeDatabase();
      const ops = new ProjectOperations(db);
      
      // Kopier projekt
      const newProjectId = await ops.addProject({
        name: `${project.name} (Copy)`,
        description: project.description,
        print_time: project.print_time,
        post_processing_time: project.post_processing_time,
        extra_costs: project.extra_costs
      });

      // Hent og kopier filaments
      const projectFilaments = await ops.getProjectFilaments(project.id!);
      for (const filament of projectFilaments) {
        await ops.addProjectFilament({
          project_id: newProjectId,
          filament_id: filament.filament_id,
          amount: filament.amount
        });
      }

      await loadProjects();
      toast({
        title: 'Success',
        description: 'Project copied successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Failed to copy project:', err);
      toast({
        title: 'Error',
        description: 'Failed to copy project',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDelete = (project: Project) => {
    setDeleteProject(project);
  };

  const confirmDelete = async () => {
    if (!deleteProject?.id) return;
    
    try {
      const db = await initializeDatabase();
      const ops = new ProjectOperations(db);
      await ops.deleteProject(deleteProject.id);
      await loadProjects();
      toast({
        title: 'Success',
        description: 'Project deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setDeleteProject(null);
    } catch (err) {
      console.error('Failed to delete project:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete project',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box p={4}>
      <Box variant="stats-card">
        <Flex justify="space-between" align="center" mb={6}>
          <Box>
            <Heading size="lg" fontWeight="semibold" color="gray.800">
              Projects
            </Heading>
            <Text mt={1} color="gray.500" fontSize="sm">
              Manage your print projects
            </Text>
          </Box>
          <Button
            leftIcon={<Icon as={PlusIcon} boxSize={5} />}
            colorScheme="blue"
            onClick={() => setIsOpen(true)}
          >
            Add New Project
          </Button>
        </Flex>

        <Box mb={4}>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <Icon as={MagnifyingGlassIcon} color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Search projects..."
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
              <Th cursor="pointer" onClick={() => handleSort('description')}>
                <Flex align="center">
                  Description {renderSortIcon('description')}
                </Flex>
              </Th>
              <Th isNumeric cursor="pointer" onClick={() => handleSort('print_time')}>
                <Flex align="center" justify="flex-end">
                  Print Time {renderSortIcon('print_time')}
                </Flex>
              </Th>
              <Th isNumeric cursor="pointer" onClick={() => handleSort('post_processing_time')}>
                <Flex align="center" justify="flex-end">
                  Post-Processing {renderSortIcon('post_processing_time')}
                </Flex>
              </Th>
              <Th isNumeric cursor="pointer" onClick={() => handleSort('extra_costs')}>
                <Flex align="center" justify="flex-end">
                  Extra Costs {renderSortIcon('extra_costs')}
                </Flex>
              </Th>
              <Th>Filaments</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {sortedProjects.map(project => (
              <Tr key={project.id}>
                <Td>{project.name}</Td>
                <Td>{project.description}</Td>
                <Td isNumeric>{project.print_time} min</Td>
                <Td isNumeric>{project.post_processing_time} min</Td>
                <Td isNumeric>{currency} {project.extra_costs.toFixed(2)}</Td>
                <Td>
                  <Button
                    size="sm"
                    variant="link"
                    colorScheme="blue"
                    onClick={() => handleViewFilaments(project)}
                  >
                    View Filaments
                  </Button>
                </Td>
                <Td>
                  <Flex gap={2}>
                    <IconButton
                      aria-label="Edit project"
                      icon={<Icon as={PencilIcon} />}
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(project)}
                    />
                    <IconButton
                      aria-label="Copy project"
                      icon={<Icon as={DocumentDuplicateIcon} />}
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopy(project)}
                    />
                    <IconButton
                      aria-label="Delete project"
                      icon={<Icon as={TrashIcon} />}
                      size="sm"
                      variant="ghost"
                      colorScheme="red"
                      onClick={() => handleDelete(project)}
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
          <ModalHeader>Create New Project</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Name</FormLabel>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter project name"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter project description"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Print Time (minutes)</FormLabel>
                <NumberInput
                  value={formData.printTime}
                  onChange={(value) => setFormData(prev => ({ ...prev, printTime: parseInt(value) }))}
                  min={0}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Post-Processing Time (minutes)</FormLabel>
                <NumberInput
                  value={formData.postProcessingTime}
                  onChange={(value) => setFormData(prev => ({ ...prev, postProcessingTime: parseInt(value) }))}
                  min={0}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Extra Costs ($)</FormLabel>
                <NumberInput
                  value={formData.extraCosts}
                  onChange={(value) => setFormData(prev => ({ ...prev, extraCosts: parseFloat(value) }))}
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
                <FormLabel>Filaments</FormLabel>
                <VStack spacing={2} align="stretch">
                  {formData.filaments.map((filament, index) => (
                    <Flex key={index} gap={2}>
                      <Select
                        value={filament.filamentId}
                        onChange={(e) => handleFilamentChange(index, 'filamentId', parseInt(e.target.value))}
                        placeholder="Select filament"
                      >
                        {availableFilaments.map(f => (
                          <option key={f.id} value={f.id}>
                            {f.name} - {f.color} ({f.type})
                          </option>
                        ))}
                      </Select>
                      <NumberInput
                        value={filament.amount}
                        onChange={(value) => handleFilamentChange(index, 'amount', parseFloat(value))}
                        min={0}
                        precision={1}
                        width="150px"
                      >
                        <NumberInputField placeholder="Grams" />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                      <IconButton
                        aria-label="Remove filament"
                        icon={<Icon as={TrashIcon} />}
                        onClick={() => handleRemoveFilament(index)}
                        colorScheme="red"
                        variant="ghost"
                      />
                    </Flex>
                  ))}
                  <Button
                    leftIcon={<Icon as={PlusIcon} />}
                    onClick={handleAddFilament}
                    size="sm"
                    variant="outline"
                  >
                    Add Filament
                  </Button>
                </VStack>
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleSubmit}>
              Create Project
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {selectedProject && (
        <FilamentsModal
          isOpen={selectedProject !== null}
          onClose={() => setSelectedProject(null)}
          projectId={selectedProject.id!}
          projectName={selectedProject.name}
        />
      )}

      {deleteProject && (
        <Modal isOpen={deleteProject !== null} onClose={() => setDeleteProject(null)}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Delete Project</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Text>
                Are you sure you want to delete the project "{deleteProject.name}"? 
                This action cannot be undone and will also delete all associated filament records.
              </Text>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={() => setDeleteProject(null)}>
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
        <EditProjectModal
          isOpen={editModalData !== null}
          onClose={() => setEditModalData(null)}
          projectData={editModalData}
          onSubmit={async (id, updates) => {
            try {
              const db = await initializeDatabase();
              const ops = new ProjectOperations(db);
              await ops.updateProject(id, updates);
              await loadProjects();
              toast({
                title: 'Success',
                description: 'Project updated successfully',
                status: 'success',
                duration: 3000,
                isClosable: true,
              });
              setEditModalData(null);
            } catch (err) {
              console.error('Failed to update project:', err);
              toast({
                title: 'Error',
                description: 'Failed to update project',
                status: 'error',
                duration: 5000,
                isClosable: true,
              });
            }
          }}
        />
      )}
    </Box>
  );
};

export default Projects; 