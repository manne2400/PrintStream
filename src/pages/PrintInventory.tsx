import React from 'react';
import { Box, Flex, Heading, Text, Button, Icon } from '@chakra-ui/react';
import { PlusIcon } from '@heroicons/react/24/outline';

const PrintInventory: React.FC = () => {
  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="lg" fontWeight="semibold" color="gray.800">
            Print Inventory
          </Heading>
          <Text mt={1} color="gray.500" fontSize="sm">
            Manage your printers and print jobs
          </Text>
        </Box>
        <Button
          leftIcon={<Icon as={PlusIcon} boxSize={5} />}
          colorScheme="blue"
          size="md"
        >
          New Print Job
        </Button>
      </Flex>

      <Box bg="white" p={6} rounded="lg" shadow="sm">
        <Text>Print inventory and job management will go here</Text>
      </Box>
    </Box>
  );
};

export default PrintInventory; 