import React from 'react';
import { Box, Flex, Heading, IconButton, useColorModeValue } from '@chakra-ui/react';
import { BellIcon } from '@heroicons/react/24/outline';
import { useLocation } from 'react-router-dom';

const Header: React.FC = () => {
  const location = useLocation();
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  const getPageTitle = () => {
    const path = location.pathname.split('/')[1];
    if (!path) return 'Dashboard';
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  return (
    <Box 
      as="header"
      bg="white" 
      borderBottom="1px" 
      borderColor={borderColor}
      h="16"
      px="6"
    >
      <Flex h="full" align="center" justify="space-between">
        <Heading size="lg" fontWeight="semibold" color="gray.800">
          {getPageTitle()}
        </Heading>
        <IconButton
          aria-label="Notifications"
          icon={<BellIcon className="h-6 w-6" />}
          variant="ghost"
          colorScheme="gray"
          borderRadius="full"
        />
      </Flex>
    </Box>
  );
};

export default Header; 