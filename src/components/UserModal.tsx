import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  VStack,
  useToast
} from '@chakra-ui/react';
import { User } from '../database/operations';
import { hashPassword } from '../utils/auth';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userData: any) => Promise<void>;
  editUser?: User | null;
}

const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, onSubmit, editUser }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    email: '',
    role: 'user' as 'admin' | 'user'
  });
  const toast = useToast();

  useEffect(() => {
    if (editUser) {
      setFormData({
        username: editUser.username,
        password: '',
        full_name: editUser.full_name || '',
        email: editUser.email || '',
        role: editUser.role
      });
    } else {
      setFormData({
        username: '',
        password: '',
        full_name: '',
        email: '',
        role: 'user'
      });
    }
  }, [editUser]);

  const handleSubmit = async () => {
    try {
      if (!editUser && !formData.password) {
        toast({
          title: 'Fejl',
          description: 'Adgangskode er påkrævet for nye brugere',
          status: 'error',
          duration: 3000,
        });
        return;
      }

      const userData = { ...formData };
      if (formData.password) {
        userData.password_hash = await hashPassword(formData.password);
      }
      delete userData.password;

      await onSubmit(userData);
      onClose();
    } catch (err) {
      toast({
        title: 'Fejl',
        description: 'Der opstod en fejl',
        status: 'error',
        duration: 3000,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {editUser ? 'Rediger bruger' : 'Opret ny bruger'}
        </ModalHeader>
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Brugernavn</FormLabel>
              <Input
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                isReadOnly={!!editUser}
              />
            </FormControl>

            <FormControl isRequired={!editUser}>
              <FormLabel>{editUser ? 'Ny adgangskode' : 'Adgangskode'}</FormLabel>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={editUser ? 'Efterlad tom for at beholde nuværende' : ''}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Fulde navn</FormLabel>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Email</FormLabel>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Rolle</FormLabel>
              <Select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'user' })}
              >
                <option value="user">Bruger</option>
                <option value="admin">Administrator</option>
              </Select>
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Annuller
          </Button>
          <Button colorScheme="blue" onClick={handleSubmit}>
            {editUser ? 'Opdater' : 'Opret'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default UserModal; 