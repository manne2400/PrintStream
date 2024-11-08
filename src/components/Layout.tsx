import React from 'react';
import { Box, Flex, useColorModeValue } from '@chakra-ui/react';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const bg = useColorModeValue('white', 'gray.800');

  return (
    <Flex h="100vh">
      <Box w="250px" bg="#1e2633" color="white">
        <Sidebar />
      </Box>
      <Box flex="1" bg={bg}>
        <Header />
        <Box p="6" overflowY="auto" h="calc(100vh - 64px)" bg={bg}>
          {children}
        </Box>
      </Box>
    </Flex>
  );
};

export default Layout; 