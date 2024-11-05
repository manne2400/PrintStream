import React from 'react';
import { Box, Flex, Heading, Text } from '@chakra-ui/react';

const Sales: React.FC = () => {
  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="lg" fontWeight="semibold" color="gray.800">
            Sales
          </Heading>
          <Text mt={1} color="gray.500" fontSize="sm">
            Track your sales and prints
          </Text>
        </Box>
      </Flex>

      <Box bg="white" p={6} rounded="lg" shadow="sm">
        <Text>Sales content will go here</Text>
      </Box>
    </Box>
  );
};

export default Sales; 