import React from 'react';
import { Box, Flex, Heading, Text, VStack, Image, Link } from '@chakra-ui/react';
import logo from '../assets/logo.png';

const About: React.FC = () => {
  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="lg" fontWeight="semibold" color="gray.800">
            About PrintStream
          </Heading>
          <Text mt={1} color="gray.500" fontSize="sm">
            Information about the application
          </Text>
        </Box>
      </Flex>

      <Box bg="white" p={8} rounded="lg" shadow="sm">
        <VStack spacing={6} align="start">
          <Flex align="center" width="full">
            <Image src={logo} alt="PrintStream Logo" boxSize="100px" />
            <Box ml={6}>
              <Heading size="md" mb={2}>PrintStream v1.0.0</Heading>
              <Text color="gray.600">
                A comprehensive 3D printing management system
              </Text>
            </Box>
          </Flex>

          <Box>
            <Heading size="sm" mb={2}>Description</Heading>
            <Text color="gray.600">
              PrintStream is designed to help you manage your 3D printing business efficiently. 
              Track inventory, manage projects, monitor sales, and analyze performance all in one place.
            </Text>
          </Box>

          <Box>
            <Heading size="sm" mb={2}>Developer</Heading>
            <Text color="gray.600">Jacob Manscher</Text>
            <Text color="gray.500" fontSize="sm">jacobm@printstream.app</Text>
            <Link 
              href="https://discord.gg/utXE9ER5yK" 
              color="blue.500" 
              fontSize="sm"
              isExternal
              _hover={{ textDecoration: 'underline' }}
              mt={1}
            >
              Join our Discord Community
            </Link>
          </Box>

          <Box>
            <Heading size="sm" mb={2}>Technologies</Heading>
            <Text color="gray.600">
              Built with Electron, React, TypeScript, and Chakra UI
            </Text>
          </Box>
        </VStack>
      </Box>
    </Box>
  );
};

export default About; 