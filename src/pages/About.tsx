import React, { useState } from 'react';
import { 
  Box, VStack, Heading, Text, Link, Divider, 
  SimpleGrid, Icon, Flex, Button,
  Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalFooter, ModalBody, ModalCloseButton,
  useToast
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
  const [selectedGuide, setSelectedGuide] = useState<number | null>(null);
  const toast = useToast();

  const guideDetails = [
    {
      title: "Set Up Your Inventory",
      content: (
        <VStack align="start" spacing={4}>
          <Text fontWeight="bold">Detailed Guide for Setting Up Inventory:</Text>
          <VStack align="start" pl={4} spacing={2}>
            <Text>1. Navigate to the Filament & Resin page</Text>
            <Text>2. Click "Add New Material" button</Text>
            <Text>3. Fill in the material details:</Text>
            <VStack align="start" pl={8} spacing={1}>
              <Text>• Name and type of material</Text>
              <Text>• Color and price information</Text>
              <Text>• Weight per roll and initial stock</Text>
              <Text>• For Bambu Lab printers: AMS slot assignment</Text>
              <Text>• For resin: Exposure settings and other parameters</Text>
            </VStack>
            <Text>4. Set low stock alerts to manage inventory</Text>
            <Text>5. Use the info button to view detailed material settings</Text>
            <Text>6. Use the + button to add stock when receiving new materials</Text>
          </VStack>
          <Divider />
          <Text fontWeight="bold">Pro Tips:</Text>
          <VStack align="start" pl={4}>
            <Text>• Keep your stock levels updated for accurate tracking</Text>
            <Text>• Use the copy function to quickly add similar materials</Text>
            <Text>• Set appropriate low stock alerts based on usage</Text>
          </VStack>
        </VStack>
      )
    },
    {
      title: "Create Projects",
      content: (
        <VStack align="start" spacing={4}>
          <Text fontWeight="bold">How to Set Up Projects Effectively:</Text>
          <VStack align="start" pl={4} spacing={2}>
            <Text>1. Go to the Projects page</Text>
            <Text>2. Click "New Project" to create a project</Text>
            <Text>3. Define project specifications:</Text>
            <VStack align="start" pl={8} spacing={1}>
              <Text>• Project name and description</Text>
              <Text>• Required materials and quantities</Text>
              <Text>• Print time estimates</Text>
              <Text>• Post-processing requirements</Text>
              <Text>• Additional costs</Text>
            </VStack>
            <Text>4. Set up cost calculations:</Text>
            <VStack align="start" pl={8} spacing={1}>
              <Text>• Material costs are calculated automatically</Text>
              <Text>• Add labor costs for printing and post-processing</Text>
              <Text>• Include any extra costs</Text>
            </VStack>
          </VStack>
          <Divider />
          <Text fontWeight="bold">Pro Tips:</Text>
          <VStack align="start" pl={4}>
            <Text>• Be precise with time estimates for accurate pricing</Text>
            <Text>• Document special requirements in the description</Text>
            <Text>• Review and adjust costs regularly</Text>
          </VStack>
        </VStack>
      )
    },
    {
      title: "Manage Print Jobs",
      content: (
        <VStack align="start" spacing={4}>
          <Text fontWeight="bold">Print Job Management Guide:</Text>
          <VStack align="start" pl={4} spacing={2}>
            <Text>1. Access Print Inventory page</Text>
            <Text>2. Create new print jobs from projects</Text>
            <Text>3. Track print status:</Text>
            <VStack align="start" pl={8} spacing={1}>
              <Text>• Pending - Ready to print</Text>
              <Text>• Printing - Currently in production</Text>
              <Text>• Completed - Ready for post-processing/delivery</Text>
              <Text>• Cancelled - Terminated prints</Text>
            </VStack>
            <Text>4. Monitor and update:</Text>
            <VStack align="start" pl={8} spacing={1}>
              <Text>• Track material consumption</Text>
              <Text>• Update status as job progresses</Text>
              <Text>• Handle multiple prints efficiently</Text>
            </VStack>
          </VStack>
          <Divider />
          <Text fontWeight="bold">Pro Tips:</Text>
          <VStack align="start" pl={4}>
            <Text>• Use batch printing for multiple identical items</Text>
            <Text>• Keep status updated for accurate tracking</Text>
            <Text>• Monitor failed prints for quality control</Text>
          </VStack>
        </VStack>
      )
    },
    {
      title: "Handle Sales",
      content: (
        <VStack align="start" spacing={4}>
          <Text fontWeight="bold">Complete Sales Process Guide:</Text>
          <VStack align="start" pl={4} spacing={2}>
            <Text>1. Navigate to Sales page</Text>
            <Text>2. Create new sale:</Text>
            <VStack align="start" pl={8} spacing={1}>
              <Text>• Select customer (or create new)</Text>
              <Text>• Choose print jobs to include</Text>
              <Text>• Set quantities and prices</Text>
              <Text>• Add shipping costs if needed</Text>
            </VStack>
            <Text>3. Handle payments:</Text>
            <VStack align="start" pl={8} spacing={1}>
              <Text>• Set payment status (Paid/Pending/Cancelled)</Text>
              <Text>• Track payment due dates</Text>
              <Text>• Generate invoices</Text>
            </VStack>
            <Text>4. Monitor sales performance:</Text>
            <VStack align="start" pl={8} spacing={1}>
              <Text>• Track revenue and profits</Text>
              <Text>• Review customer history</Text>
              <Text>• Analyze sales trends</Text>
            </VStack>
          </VStack>
          <Divider />
          <Text fontWeight="bold">Pro Tips:</Text>
          <VStack align="start" pl={4}>
            <Text>• Keep payment status updated</Text>
            <Text>• Use the dashboard for sales overview</Text>
            <Text>• Regular review of sales metrics</Text>
          </VStack>
        </VStack>
      )
    }
  ];

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

          {/* Getting Started section */}
          <Box>
            <Heading size="lg" mb={6} textAlign="center">Getting Started</Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
              {[0, 1, 2, 3].map((index) => (
                <Box 
                  key={index}
                  p={6} 
                  borderRadius="lg" 
                  borderWidth="1px"
                  cursor="pointer"
                  onClick={() => setSelectedGuide(index)}
                  _hover={{ shadow: 'md' }}
                  transition="all 0.2s"
                >
                  <VStack align="start" spacing={4}>
                    <Flex align="center">
                      <Icon as={CubeIcon} color="blue.500" boxSize={5} mr={2} />
                      <Heading size="md">{`${index + 1}. ${
                        index === 0 ? "Set Up Your Inventory" :
                        index === 1 ? "Create Projects" :
                        index === 2 ? "Manage Print Jobs" :
                        "Handle Sales"
                      }`}</Heading>
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
              ))}
            </SimpleGrid>
          </Box>

          {/* Guide Modal */}
          <Modal 
            isOpen={selectedGuide !== null} 
            onClose={() => setSelectedGuide(null)}
            size="lg"
          >
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>
                {selectedGuide !== null && guideDetails[selectedGuide].title}
              </ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                {selectedGuide !== null && guideDetails[selectedGuide].content}
              </ModalBody>
              <ModalFooter>
                <Button colorScheme="blue" onClick={() => setSelectedGuide(null)}>
                  Close
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>

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
              mb={2}
            >
              Join Discord Community
            </Button>
            <Text 
              fontSize="sm" 
              color="gray.500" 
              mb={6}
              cursor="pointer"
              onClick={() => {
                navigator.clipboard.writeText("https://discord.gg/utXE9ER5yK");
                toast({
                  title: "Link copied",
                  description: "Discord link copied to clipboard",
                  status: "success",
                  duration: 2000,
                  isClosable: true,
                });
              }}
              _hover={{ textDecoration: 'underline' }}
            >
              @https://discord.gg/utXE9ER5yK
            </Text>
            <Text fontSize="sm">
              Version 0.3.3 | © 2024 PrintStream. All rights reserved.
            </Text>
          </Box>
        </VStack>
      </Box>
    </Box>
  );
};

export default About;