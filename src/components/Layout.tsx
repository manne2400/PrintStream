import React from 'react';
import { Box, Flex } from '@chakra-ui/react';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <Flex h="100vh" overflow="hidden">
      {/* Sidebar */}
      <Box w="64" bg="#1e2633" flexShrink={0}>
        <Sidebar />
      </Box>

      {/* Main Content */}
      <Flex flexDirection="column" flex="1" overflow="hidden">
        <Header />
        <Box 
          as="main"
          flex="1"
          overflow="auto"
          p={6}
          bg="gray.50"
        >
          {children}
        </Box>
      </Flex>
    </Flex>
  );
};

export default Layout; 