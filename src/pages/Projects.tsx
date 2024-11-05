import React from 'react';
import { Box, Flex, Heading, Text, Button, Icon } from '@chakra-ui/react';
import { PlusIcon } from '@heroicons/react/24/outline';

const Projects: React.FC = () => {
  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="lg" fontWeight="semibold" color="gray.800">
            Projects
          </Heading>
          <Text mt={1} color="gray.500" fontSize="sm">
            Manage your print projects
          </Text>
        </Box>
        <Button
          leftIcon={<Icon as={PlusIcon} boxSize={5} />}
          colorScheme="blue"
          size="md"
        >
          New Project
        </Button>
      </Flex>

      <Box bg="white" p={6} rounded="lg" shadow="sm">
        <Text>Projects content will go here</Text>
      </Box>
    </Box>
  );
};

export default Projects; 