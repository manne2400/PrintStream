import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Flex, Heading, Text, Button, Icon,
  Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalFooter, ModalBody, ModalCloseButton,
  FormControl, FormLabel, Input, Textarea,
  VStack, Table, Thead, Tbody, Tr, Th, Td,
  useToast, IconButton, InputGroup, InputLeftElement
} from '@chakra-ui/react';
import { PlusIcon, PencilIcon, DocumentDuplicateIcon, TrashIcon, MagnifyingGlassIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import initializeDatabase from '../database/setup';
import { CustomerOperations, Customer } from '../database/operations';

interface CustomerFormData {
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  vatId: string;
}

interface SortConfig {
  key: keyof Customer;
  direction: 'asc' | 'desc';
}

// Tilføj EditCustomerModal komponent
interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerData: Customer;
  onSubmit: (id: number, data: Partial<Customer>) => void;
}

const EditCustomerModal: React.FC<EditModalProps> = ({ isOpen, onClose, customerData, onSubmit }) => {
  const [editData, setEditData] = useState<CustomerFormData>({
    name: customerData.name,
    contactPerson: customerData.contact_person,
    email: customerData.email,
    phone: customerData.phone,
    address: customerData.address,
    vatId: customerData.vat_id
  });

  const handleSubmit = () => {
    onSubmit(customerData.id!, {
      name: editData.name,
      contact_person: editData.contactPerson,
      email: editData.email,
      phone: editData.phone,
      address: editData.address,
      vat_id: editData.vatId
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Edit Customer</ModalHeader>
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
              <FormLabel>Contact Person</FormLabel>
              <Input
                value={editData.contactPerson}
                onChange={(e) => setEditData(prev => ({ ...prev, contactPerson: e.target.value }))}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Email</FormLabel>
              <Input
                type="email"
                value={editData.email}
                onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Phone</FormLabel>
              <Input
                value={editData.phone}
                onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Address</FormLabel>
              <Textarea
                value={editData.address}
                onChange={(e) => setEditData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Enter address"
                rows={5}
                resize="vertical"
              />
            </FormControl>

            <FormControl>
              <FormLabel>VAT ID</FormLabel>
              <Input
                value={editData.vatId}
                onChange={(e) => setEditData(prev => ({ ...prev, vatId: e.target.value }))}
              />
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

const Customers: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' });
  const toast = useToast();

  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    vatId: ''
  });

  const [editModalData, setEditModalData] = useState<Customer | null>(null);
  const [deleteCustomer, setDeleteCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const db = await initializeDatabase();
      const ops = new CustomerOperations(db);
      const data = await ops.getAllCustomers();
      setCustomers(data);
    } catch (err) {
      console.error('Failed to load customers:', err);
      toast({
        title: 'Error',
        description: 'Failed to load customers',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleSubmit = async () => {
    try {
      const db = await initializeDatabase();
      const ops = new CustomerOperations(db);
      
      await ops.addCustomer({
        name: formData.name,
        contact_person: formData.contactPerson,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        vat_id: formData.vatId
      });

      toast({
        title: 'Success',
        description: 'Customer added successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      setIsOpen(false);
      loadCustomers();
      setFormData({
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        vatId: ''
      });
    } catch (err) {
      console.error('Failed to add customer:', err);
      toast({
        title: 'Error',
        description: 'Failed to add customer',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Søgefunktion
  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      const searchLower = searchQuery.toLowerCase();
      return (
        customer.name.toLowerCase().includes(searchLower) ||
        customer.email.toLowerCase().includes(searchLower) ||
        customer.phone.toLowerCase().includes(searchLower) ||
        customer.address.toLowerCase().includes(searchLower) ||
        customer.vat_id.toLowerCase().includes(searchLower)
      );
    });
  }, [customers, searchQuery]);

  // Sorteringsfunktion
  const sortedCustomers = useMemo(() => {
    return [...filteredCustomers].sort((a, b) => {
      if (a[sortConfig.key] === null) return 1;
      if (b[sortConfig.key] === null) return -1;

      const comparison = (a[sortConfig.key] as string).localeCompare(b[sortConfig.key] as string);
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredCustomers, sortConfig]);

  const handleSort = (key: keyof Customer) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const renderSortIcon = (columnKey: keyof Customer) => {
    if (sortConfig.key !== columnKey) {
      return null;
    }
    return sortConfig.direction === 'asc' ? 
      <Icon as={ChevronUpIcon} w={4} h={4} /> : 
      <Icon as={ChevronDownIcon} w={4} h={4} />;
  };

  // Tilføj handleEdit funktion
  const handleEdit = (customer: Customer) => {
    setEditModalData(customer);
  };

  // Tilføj handleCopy funktion
  const handleCopy = async (customer: Customer) => {
    try {
      const db = await initializeDatabase();
      const ops = new CustomerOperations(db);
      
      await ops.addCustomer({
        name: `${customer.name} (Copy)`,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        vat_id: customer.vat_id
      });

      await loadCustomers();
      toast({
        title: 'Success',
        description: 'Customer copied successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Failed to copy customer:', err);
      toast({
        title: 'Error',
        description: 'Failed to copy customer',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Tilføj handleDelete funktion
  const handleDelete = (customer: Customer) => {
    setDeleteCustomer(customer);
  };

  // Tilføj confirmDelete funktion
  const confirmDelete = async () => {
    if (!deleteCustomer?.id) return;
    
    try {
      const db = await initializeDatabase();
      const ops = new CustomerOperations(db);
      await ops.deleteCustomer(deleteCustomer.id);
      await loadCustomers();
      toast({
        title: 'Success',
        description: 'Customer deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setDeleteCustomer(null);
    } catch (err) {
      console.error('Failed to delete customer:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete customer',
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
            Customers
          </Heading>
          <Text mt={1} color="gray.500" fontSize="sm">
            Manage your customers
          </Text>
        </Box>
        <Button
          leftIcon={<Icon as={PlusIcon} boxSize={5} />}
          colorScheme="blue"
          size="md"
          onClick={() => setIsOpen(true)}
        >
          Add Customer
        </Button>
      </Flex>

      <Box mb={4}>
        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <Icon as={MagnifyingGlassIcon} color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </InputGroup>
      </Box>

      <Box bg="white" p={6} rounded="lg" shadow="sm">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th cursor="pointer" onClick={() => handleSort('name')}>
                <Flex align="center">
                  Name {renderSortIcon('name')}
                </Flex>
              </Th>
              <Th cursor="pointer" onClick={() => handleSort('email')}>
                <Flex align="center">
                  Email {renderSortIcon('email')}
                </Flex>
              </Th>
              <Th cursor="pointer" onClick={() => handleSort('phone')}>
                <Flex align="center">
                  Phone {renderSortIcon('phone')}
                </Flex>
              </Th>
              <Th cursor="pointer" onClick={() => handleSort('address')}>
                <Flex align="center">
                  Address {renderSortIcon('address')}
                </Flex>
              </Th>
              <Th cursor="pointer" onClick={() => handleSort('vat_id')}>
                <Flex align="center">
                  VAT ID {renderSortIcon('vat_id')}
                </Flex>
              </Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {sortedCustomers.map((customer) => (
              <Tr key={customer.id}>
                <Td>{customer.name}</Td>
                <Td>{customer.email}</Td>
                <Td>{customer.phone}</Td>
                <Td>
                  <Text whiteSpace="pre-line">
                    {customer.address}
                  </Text>
                </Td>
                <Td>{customer.vat_id}</Td>
                <Td>
                  <Flex gap={2}>
                    <IconButton
                      aria-label="Edit customer"
                      icon={<Icon as={PencilIcon} />}
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(customer)}
                    />
                    <IconButton
                      aria-label="Copy customer"
                      icon={<Icon as={DocumentDuplicateIcon} />}
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopy(customer)}
                    />
                    <IconButton
                      aria-label="Delete customer"
                      icon={<Icon as={TrashIcon} />}
                      size="sm"
                      variant="ghost"
                      colorScheme="red"
                      onClick={() => handleDelete(customer)}
                    />
                  </Flex>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add New Customer</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Name</FormLabel>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter customer name"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Contact Person</FormLabel>
                <Input
                  value={formData.contactPerson}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                  placeholder="Enter contact person"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Phone</FormLabel>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter phone number"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Address</FormLabel>
                <Textarea
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter address"
                  rows={5}
                  resize="vertical"
                />
              </FormControl>

              <FormControl>
                <FormLabel>VAT ID</FormLabel>
                <Input
                  value={formData.vatId}
                  onChange={(e) => setFormData(prev => ({ ...prev, vatId: e.target.value }))}
                  placeholder="Enter VAT ID"
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleSubmit}>
              Add Customer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {editModalData && (
        <EditCustomerModal
          isOpen={editModalData !== null}
          onClose={() => setEditModalData(null)}
          customerData={editModalData}
          onSubmit={async (id, updates) => {
            try {
              const db = await initializeDatabase();
              const ops = new CustomerOperations(db);
              await ops.updateCustomer(id, updates);
              await loadCustomers();
              toast({
                title: 'Success',
                description: 'Customer updated successfully',
                status: 'success',
                duration: 3000,
                isClosable: true,
              });
              setEditModalData(null);
            } catch (err) {
              console.error('Failed to update customer:', err);
              toast({
                title: 'Error',
                description: 'Failed to update customer',
                status: 'error',
                duration: 5000,
                isClosable: true,
              });
            }
          }}
        />
      )}

      {deleteCustomer && (
        <Modal isOpen={deleteCustomer !== null} onClose={() => setDeleteCustomer(null)}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Delete Customer</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Text>
                Are you sure you want to delete the customer "{deleteCustomer.name}"? 
                This action cannot be undone.
              </Text>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={() => setDeleteCustomer(null)}>
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

export default Customers; 