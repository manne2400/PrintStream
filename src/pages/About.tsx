import React from 'react';
import { 
  Box, VStack, Heading, Text, Link, Divider, 
  SimpleGrid, Icon, Flex, Button 
} from '@chakra-ui/react';
import {
  CubeIcon, CircleStackIcon, UserGroupIcon, ChartBarIcon,
  CurrencyDollarIcon, ClockIcon, CogIcon, DocumentTextIcon
} from '@heroicons/react/24/outline';

const FeatureBox: React.FC<{
  icon: any;
  title: string;
  description: string;
  color: string;
}> = ({ icon, title, description, color }) => (
  <Box p={6} borderRadius="lg" borderWidth="1px" height="100%">
    <Flex direction="column" align="center" textAlign="center">
      <Flex
        w={12}
        h={12}
        align="center"
        justify="center"
        rounded="full"
        bg={`${color}.50`}
        mb={4}
      >
        <Icon as={icon} color={`${color}.500`} boxSize={6} />
      </Flex>
      <Heading size="md" mb={2}>{title}</Heading>
      <Text color="gray.500">{description}</Text>
    </Flex>
  </Box>
);

const About: React.FC = () => {
  return (
    <Box p={4}>
      <Box variant="stats-card">
        <VStack align="stretch" spacing={8}>
          {/* Introduktion */}
          <Box textAlign="center" py={8}>
            <Heading size="xl" mb={4}>Welcome to PrintStream</Heading>
            <Text fontSize="lg" maxW="2xl" mx="auto">
              Your complete solution for managing 3D printing business operations. 
              From inventory tracking to sales management, PrintStream helps you 
              streamline your workflow and grow your business.
            </Text>
          </Box>

          <Divider />

          {/* Hovedfunktioner */}
          <Box>
            <Heading size="lg" mb={6} textAlign="center">Core Features</Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
              <Box p={6} borderRadius="lg" borderWidth="1px" height="100%">
                <FeatureBox
                  icon={CircleStackIcon}
                  title="Filament Management"
                  description="Track inventory, manage AMS slots, and get low stock alerts"
                  color="blue"
                />
              </Box>
              <Box p={6} borderRadius="lg" borderWidth="1px" height="100%">
                <FeatureBox
                  icon={CubeIcon}
                  title="Print Jobs"
                  description="Organize prints, track status, and manage production"
                  color="green"
                />
              </Box>
              <Box p={6} borderRadius="lg" borderWidth="1px" height="100%">
                <FeatureBox
                  icon={UserGroupIcon}
                  title="Customer Relations"
                  description="Manage customers, track orders, and handle communications"
                  color="purple"
                />
              </Box>
              <Box p={6} borderRadius="lg" borderWidth="1px" height="100%">
                <FeatureBox
                  icon={ChartBarIcon}
                  title="Business Analytics"
                  description="Generate reports and track key performance metrics"
                  color="orange"
                />
              </Box>
            </SimpleGrid>
          </Box>

          {/* Hvordan man bruger appen */}
          <Box>
            <Heading size="lg" mb={6} textAlign="center">Getting Started</Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
              <Box p={6} borderRadius="lg" borderWidth="1px">
                <VStack align="start" spacing={4}>
                  <Flex align="center">
                    <Icon as={CubeIcon} color="blue.500" boxSize={5} mr={2} />
                    <Heading size="md">1. Set Up Your Inventory</Heading>
                  </Flex>
                  <Text>
                    Start by adding your filaments in the Filament section. Enter details like:
                    • Type and color
                    • Weight and price
                    • AMS slot (if applicable)
                    • Low stock alert threshold
                  </Text>
                </VStack>
              </Box>

              <Box p={6} borderRadius="lg" borderWidth="1px">
                <VStack align="start" spacing={4}>
                  <Flex align="center">
                    <Icon as={DocumentTextIcon} color="green.500" boxSize={5} mr={2} />
                    <Heading size="md">2. Create Projects</Heading>
                  </Flex>
                  <Text>
                    Set up your projects with:
                    • Print specifications
                    • Material requirements
                    • Time estimates
                    • Cost calculations
                  </Text>
                </VStack>
              </Box>

              <Box p={6} borderRadius="lg" borderWidth="1px">
                <VStack align="start" spacing={4}>
                  <Flex align="center">
                    <Icon as={ClockIcon} color="purple.500" boxSize={5} mr={2} />
                    <Heading size="md">3. Manage Print Jobs</Heading>
                  </Flex>
                  <Text>
                    Track your prints with:
                    • Status updates
                    • Material usage
                    • Time tracking
                    • Batch management
                  </Text>
                </VStack>
              </Box>

              <Box p={6} borderRadius="lg" borderWidth="1px">
                <VStack align="start" spacing={4}>
                  <Flex align="center">
                    <Icon as={CurrencyDollarIcon} color="orange.500" boxSize={5} mr={2} />
                    <Heading size="md">4. Handle Sales</Heading>
                  </Flex>
                  <Text>
                    Process sales including:
                    • Invoice generation
                    • Payment tracking
                    • Customer management
                    • Profit calculations
                  </Text>
                </VStack>
              </Box>
            </SimpleGrid>
          </Box>

          {/* Tips & Tricks */}
          <Box>
            <Heading size="lg" mb={6} textAlign="center">Pro Tips</Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              <Box p={6} borderRadius="lg" borderWidth="1px">
                <VStack align="start" spacing={3}>
                  <Icon as={CogIcon} color="blue.500" boxSize={6} />
                  <Heading size="md">Automatic Backups</Heading>
                  <Text>Enable auto-backup in Settings to protect your data. Backups are stored locally and can be restored if needed.</Text>
                </VStack>
              </Box>

              <Box p={6} borderRadius="lg" borderWidth="1px">
                <VStack align="start" spacing={3}>
                  <Icon as={ChartBarIcon} color="green.500" boxSize={6} />
                  <Heading size="md">Track Analytics</Heading>
                  <Text>Use the Reports section to monitor business performance, identify trends, and make data-driven decisions.</Text>
                </VStack>
              </Box>

              <Box p={6} borderRadius="lg" borderWidth="1px">
                <VStack align="start" spacing={3}>
                  <Icon as={UserGroupIcon} color="purple.500" boxSize={6} />
                  <Heading size="md">Customer Focus</Heading>
                  <Text>Maintain detailed customer profiles and track their preferences to provide better service.</Text>
                </VStack>
              </Box>
            </SimpleGrid>
          </Box>

          <Divider />

          {/* Support */}
          <Box textAlign="center" py={6}>
            <Heading size="lg" mb={4}>Need Help?</Heading>
            <Text mb={4}>Join our Discord community for support, tips, and updates:</Text>
            <Button
              as={Link}
              href="https://discord.gg/utXE9ER5yK"
              isExternal
              colorScheme="blue"
              size="lg"
              mb={6}
            >
              Join Discord Community
            </Button>
            <Text fontSize="sm">
              Version 0.2.7 | © 2024 PrintStream. All rights reserved.
            </Text>
          </Box>
        </VStack>
      </Box>
    </Box>
  );
};

export default About;