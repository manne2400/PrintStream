import React, { useState, useEffect } from 'react';
import {
  Box, Flex, Heading, Text, Button, Icon,
  Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalFooter, ModalBody, ModalCloseButton,
  FormControl, FormLabel, Input, Textarea,
  NumberInput, NumberInputField, NumberInputStepper,
  NumberIncrementStepper, NumberDecrementStepper,
  VStack, Table, Thead, Tbody, Tr, Th, Td,
  useToast, Select, IconButton
} from '@chakra-ui/react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import initializeDatabase from '../database/setup';
import { ProjectOperations, FilamentOperations, Project, Filament } from '../database/operations';

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

  return (
    <Box>
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
          size="md"
          onClick={() => setIsOpen(true)}
        >
          New Project
        </Button>
      </Flex>

      <Box bg="white" p={6} rounded="lg" shadow="sm">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Description</Th>
              <Th isNumeric>Print Time</Th>
              <Th isNumeric>Post-Processing</Th>
              <Th isNumeric>Extra Costs</Th>
              <Th>Filaments</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {projects.map(project => (
              <Tr key={project.id}>
                <Td>{project.name}</Td>
                <Td>{project.description}</Td>
                <Td isNumeric>{project.print_time} min</Td>
                <Td isNumeric>{project.post_processing_time} min</Td>
                <Td isNumeric>${project.extra_costs}</Td>
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
                <Td>Actions</Td>
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
    </Box>
  );
};

export default Projects; 