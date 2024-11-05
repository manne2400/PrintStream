import React from 'react';
import { Box, Flex } from '@chakra-ui/react';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Flex h="100vh">
      <Sidebar />
      <Flex flex="1" direction="column" bg="gray.50">
        <Header />
        <Box flex="1" p="6" overflowY="auto">
          {children}
        </Box>
      </Flex>
    </Flex>
  );
};

export default Layout; 