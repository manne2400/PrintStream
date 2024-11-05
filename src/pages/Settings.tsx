import React from 'react';
import { Box, Flex, Heading, Text } from '@chakra-ui/react';

const Settings: React.FC = () => {
  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="lg" fontWeight="semibold" color="gray.800">
            Settings
          </Heading>
          <Text mt={1} color="gray.500" fontSize="sm">
            Manage your preferences
          </Text>
        </Box>
      </Flex>

      <Box bg="white" p={6} rounded="lg" shadow="sm">
        <Text>Settings content will go here</Text>
      </Box>
    </Box>
  );
};

export default Settings; 