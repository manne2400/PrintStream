import React from 'react';
import { Box, Flex, Image, VStack, Text, Link as ChakraLink, Avatar, Divider } from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  CubeIcon,
  PrinterIcon,
  FolderIcon,
  UserGroupIcon,
  ShoppingCartIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import logo from '../assets/logo.png';

const Sidebar: React.FC = () => {
  const location = useLocation();
  
  const navigation = [
    { name: 'Dashboard', icon: HomeIcon, path: '/dashboard' },
    { name: 'Filament', icon: CubeIcon, path: '/filament' },
    { name: 'Print/Inventory', icon: PrinterIcon, path: '/print-inventory' },
    { name: 'Projects', icon: FolderIcon, path: '/projects' },
    { name: 'Customers', icon: UserGroupIcon, path: '/customers' },
    { name: 'Sales', icon: ShoppingCartIcon, path: '/sales' },
    { name: 'Reports', icon: ChartBarIcon, path: '/reports' },
    { name: 'Settings', icon: Cog6ToothIcon, path: '/settings' }
  ];

  return (
    <Flex direction="column" h="full" bg="#1e2633">
      {/* Logo Section - Opdateret højde fra h="12" til h="48" (4x større) */}
      <Box p="6">
        <Image src={logo} alt="PrintStream" h="48" mx="auto" />
      </Box>

      {/* Navigation */}
      <VStack flex="1" spacing="1" px="4" as="nav">
        {navigation.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ChakraLink
              key={item.name}
              as={RouterLink}
              to={item.path}
              w="full"
              px="4"
              py="3"
              rounded="lg"
              display="flex"
              alignItems="center"
              bg={isActive ? 'blue.600' : 'transparent'}
              color={isActive ? 'white' : 'gray.300'}
              _hover={{
                bg: isActive ? 'blue.700' : 'gray.700',
                color: 'white'
              }}
            >
              <Box as={item.icon} w="5" h="5" mr="3" />
              <Text fontSize="sm" fontWeight="medium">{item.name}</Text>
            </ChakraLink>
          );
        })}
      </VStack>

      {/* About Link */}
      <Box px="4" mb="4">
        <Divider my="4" borderColor="gray.700" />
        <ChakraLink
          as={RouterLink}
          to="/about"
          w="full"
          px="4"
          py="3"
          rounded="lg"
          display="flex"
          alignItems="center"
          bg={location.pathname === '/about' ? 'blue.600' : 'transparent'}
          color={location.pathname === '/about' ? 'white' : 'gray.300'}
          _hover={{
            bg: location.pathname === '/about' ? 'blue.700' : 'gray.700',
            color: 'white'
          }}
        >
          <Box as={InformationCircleIcon} w="5" h="5" mr="3" />
          <Text fontSize="sm" fontWeight="medium">About</Text>
        </ChakraLink>
      </Box>

      {/* User Section */}
      <Box p="4" borderTop="1px" borderColor="gray.700">
        <Flex align="center">
          <Avatar size="sm" name="Jacob Manscher" bg="gray.600" color="white" />
          <Box ml="3">
            <Text fontSize="sm" fontWeight="medium" color="white">Jacob Manscher</Text>
            <Text fontSize="xs" color="gray.400">Admin</Text>
          </Box>
        </Flex>
      </Box>
    </Flex>
  );
};

export default Sidebar; 