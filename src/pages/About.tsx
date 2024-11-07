import React from 'react';
import { Box, VStack, Heading, Text, Link, Divider } from '@chakra-ui/react';

const About: React.FC = () => {
  return (
    <Box>
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="lg" mb={2}>PrintStream</Heading>
          <Text>
            PrintStream is a complete management system designed specifically for 3D printing businesses. 
            The program helps you keep track of everything from filament inventory management to customer orders and finances.
          </Text>
        </Box>

        <Divider />

        <Box>
          <Heading size="md" mb={3}>Main Features</Heading>
          
          <VStack spacing={4} align="stretch">
            <Box>
              <Heading size="sm" mb={2}>🧵 Filament Management</Heading>
              <Text>
                Keep track of your filament inventory with detailed tracking of type, color, weight, and price. 
                The program automatically notifies you when stock is running low and supports 
                integration with the Bambu Lab AMS system.
              </Text>
              <Text mt={2} fontSize="sm" color="gray.600">
                Features:
                - Automatic inventory tracking and low stock alerts
                - AMS slot assignment and management (1-16)
                - Price per kg with automatic material usage calculation
                - Filament grouping by type and color
                - Quick addition of new rolls with "Add Full Roll" function
              </Text>
            </Box>

            <Box>
              <Heading size="sm" mb={2}>📦 Print Inventory</Heading>
              <Text>
                Manage your print jobs efficiently. View status of ongoing prints, 
                material usage, and costs. The system automatically manages inventory 
                and updates stock levels when prints are started.
              </Text>
              <Text mt={2} fontSize="sm" color="gray.600">
                Features:
                - Automatic material usage calculation per print
                - Real-time inventory updates when printing starts
                - Grouping of identical prints
                - Detailed cost breakdown per print job
                - Integration with project and customer management
              </Text>
            </Box>

            <Box>
              <Heading size="sm" mb={2}>📋 Project Management</Heading>
              <Text>
                Create and manage projects with detailed information about print time, 
                post-processing, and materials. Get automatically calculated costs and suggested 
                selling prices based on your settings.
              </Text>
              <Text mt={2} fontSize="sm" color="gray.600">
                Features:
                - Detailed cost calculation including materials, print time, and post-processing
                - Automatic profit margin calculation
                - Filament tracking per project
                - Copying of existing projects
                - Print job history per project
              </Text>
            </Box>

            <Box>
              <Heading size="sm" mb={2}>👥 Customer Management</Heading>
              <Text>
                Keep track of your customers with a complete CRM system. Store contact information, 
                order history, and special notes for each customer.
              </Text>
              <Text mt={2} fontSize="sm" color="gray.600">
                Features:
                - Complete customer database with contact information
                - Integration with sales and invoicing
                - Customer-specific notes and details
                - VAT/Tax ID handling
                - Order history per customer
              </Text>
            </Box>

            <Box>
              <Heading size="sm" mb={2}>💰 Sales and Invoicing</Heading>
              <Text>
                Handle sales and monitor payment status. The system automatically calculates prices 
                based on material costs, print time, and your desired profit margin.
              </Text>
              <Text mt={2} fontSize="sm" color="gray.600">
                Features:
                - Automatic invoice numbering (YYYY-XXXX format)
                - Detailed cost breakdown at point of sale
                - Profit margin calculation per sale
                - Payment status tracking (Pending/Paid/Cancelled)
                - Snapshot of all prices and data at time of sale
              </Text>
            </Box>

            <Box>
              <Heading size="sm" mb={2}>📊 Reports and Statistics</Heading>
              <Text>
                Get an overview of your business with detailed reports on sales, 
                material usage, customer activity, and profit. View trends and analyses 
                that help you optimize your business.
              </Text>
              <Text mt={2} fontSize="sm" color="gray.600">
                Features:
                - Revenue and profit reports
                - Most sold products
                - Customer statistics and activity
                - Inventory statistics and material usage
                - Selectable period (week/month/year)
              </Text>
            </Box>
          </VStack>
        </Box>

        <Divider />

        <Box>
          <Heading size="md" mb={3}>Support</Heading>
          <Text>
            For support and help with PrintStream, contact us on Discord:
          </Text>
          <Link href="https://discord.gg/utXE9ER5yK" color="blue.500" isExternal>
            Join our Discord server
          </Link>
        </Box>

        <Box>
          <Heading size="md" mb={3}>Version</Heading>
          <Text>PrintStream version 0.2.5b</Text>
          <Text fontSize="sm" color="gray.500">
            Developed by Jacob M (M4NN3DK)
          </Text>
        </Box>
      </VStack>
    </Box>
  );
};

export default About;