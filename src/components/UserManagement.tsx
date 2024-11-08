import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  VStack,
  IconButton,
  useDisclosure
} from '@chakra-ui/react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { UserOperations, User } from '../database/operations';
import { hashPassword } from '../utils/auth';
import initializeDatabase from '../database/setup';
import UserModal from './UserModal';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const loadUsers = async () => {
    try {
      const db = await initializeDatabase();
      const userOps = new UserOperations(db);
      const allUsers = await userOps.getAllUsers();
      setUsers(allUsers);
    } catch (err) {
      toast({
        title: 'Fejl',
        description: 'Kunne ikke indlæse brugere',
        status: 'error',
        duration: 3000,
      });
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleAddUser = async (formData: {
    username: string;
    password: string;
    full_name: string;
    email: string;
    role: 'admin' | 'user';
  }) => {
    try {
      const db = await initializeDatabase();
      const userOps = new UserOperations(db);
      
      const password_hash = await hashPassword(formData.password);
      await userOps.createUser({
        ...formData,
        password_hash
      });

      toast({
        title: 'Success',
        description: 'Bruger oprettet',
        status: 'success',
        duration: 3000,
      });
      
      loadUsers();
      onClose();
    } catch (err) {
      toast({
        title: 'Fejl',
        description: 'Kunne ikke oprette bruger',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleEditUser = async (userData: any) => {
    try {
      const db = await initializeDatabase();
      const userOps = new UserOperations(db);
      
      if (selectedUser) {
        if (userData.password_hash) {
          await userOps.changePassword(selectedUser.id!, userData.password_hash);
        }
        delete userData.password_hash;
        
        await userOps.updateUser(selectedUser.id!, userData);
        toast({
          title: 'Success',
          description: 'Bruger opdateret',
          status: 'success',
          duration: 3000,
        });
      }
      
      loadUsers();
      setSelectedUser(null);
    } catch (err) {
      toast({
        title: 'Fejl',
        description: 'Kunne ikke opdatere bruger',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm('Er du sikker på at du vil slette denne bruger?')) {
      return;
    }

    try {
      const db = await initializeDatabase();
      const userOps = new UserOperations(db);
      await userOps.deleteUser(userId);
      
      toast({
        title: 'Success',
        description: 'Bruger slettet',
        status: 'success',
        duration: 3000,
      });
      
      loadUsers();
    } catch (err) {
      toast({
        title: 'Fejl',
        description: 'Kunne ikke slette bruger',
        status: 'error',
        duration: 3000,
      });
    }
  };

  return (
    <Box p={4}>
      <Button colorScheme="blue" onClick={onOpen} mb={4}>
        Tilføj ny bruger
      </Button>

      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Brugernavn</Th>
            <Th>Navn</Th>
            <Th>Email</Th>
            <Th>Rolle</Th>
            <Th>Sidste login</Th>
            <Th>Handlinger</Th>
          </Tr>
        </Thead>
        <Tbody>
          {users.map(user => (
            <Tr key={user.id}>
              <Td>{user.username}</Td>
              <Td>{user.full_name}</Td>
              <Td>{user.email}</Td>
              <Td>{user.role}</Td>
              <Td>{user.last_login}</Td>
              <Td>
                <IconButton
                  aria-label="Rediger"
                  icon={<PencilIcon className="h-5 w-5" />}
                  size="sm"
                  mr={2}
                  onClick={() => {
                    setSelectedUser(user);
                    onOpen();
                  }}
                />
                <IconButton
                  aria-label="Slet"
                  icon={<TrashIcon className="h-5 w-5" />}
                  size="sm"
                  colorScheme="red"
                />
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      <UserModal
        isOpen={isOpen}
        onClose={() => {
          onClose();
          setSelectedUser(null);
        }}
        onSubmit={selectedUser ? handleEditUser : handleAddUser}
        editUser={selectedUser}
      />
    </Box>
  );
};

export default UserManagement; 