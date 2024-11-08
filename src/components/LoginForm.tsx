import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  useToast,
  Text
} from '@chakra-ui/react';
import { UserOperations } from '../database/operations';
import { verifyPassword } from '../utils/auth';
import initializeDatabase from '../database/setup';

interface LoginFormProps {
  onLoginSuccess: (userData: { id: number; username: string; role: string }) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const db = await initializeDatabase();
      const userOps = new UserOperations(db);
      const user = await userOps.getUserByUsername(username);

      if (!user) {
        toast({
          title: 'Fejl',
          description: 'Brugernavn eller adgangskode er forkert',
          status: 'error',
          duration: 3000,
        });
        return;
      }

      const isValid = await verifyPassword(password, user.password_hash);
      if (!isValid) {
        toast({
          title: 'Fejl',
          description: 'Brugernavn eller adgangskode er forkert',
          status: 'error',
          duration: 3000,
        });
        return;
      }

      // Opdater sidste login tidspunkt
      await userOps.updateLastLogin(user.id!);

      onLoginSuccess({
        id: user.id!,
        username: user.username,
        role: user.role
      });

    } catch (err) {
      toast({
        title: 'Fejl',
        description: 'Der opstod en fejl ved login',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box maxW="md" mx="auto" mt={8}>
      <form onSubmit={handleSubmit}>
        <VStack spacing={4}>
          <FormControl isRequired>
            <FormLabel>Brugernavn</FormLabel>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Adgangskode</FormLabel>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </FormControl>

          <Button
            type="submit"
            colorScheme="blue"
            width="full"
            isLoading={isLoading}
          >
            Log ind
          </Button>
        </VStack>
      </form>
    </Box>
  );
};

export default LoginForm; 