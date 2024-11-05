import React from 'react';
import { Box, SimpleGrid, Flex, Text, Icon, Stat, StatLabel, StatNumber } from '@chakra-ui/react';
import { ChartBarIcon, CurrencyDollarIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';

const Dashboard: React.FC = () => {
  return (
    <Box>
      {/* Stats Section */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} mb={6}>
        <Box bg="white" p={6} rounded="lg" shadow="sm">
          <Flex align="center">
            <Flex
              p={3}
              rounded="full"
              bg="blue.50"
              alignItems="center"
              justifyContent="center"
            >
              <Icon as={CurrencyDollarIcon} boxSize={6} color="blue.500" />
            </Flex>
            <Box ml={4}>
              <Stat>
                <StatLabel color="gray.500" fontSize="sm">Total Sales</StatLabel>
                <StatNumber fontSize="2xl">$12,345</StatNumber>
              </Stat>
            </Box>
          </Flex>
        </Box>

        <Box bg="white" p={6} rounded="lg" shadow="sm">
          <Flex align="center">
            <Flex
              p={3}
              rounded="full"
              bg="green.50"
              alignItems="center"
              justifyContent="center"
            >
              <Icon as={ChartBarIcon} boxSize={6} color="green.500" />
            </Flex>
            <Box ml={4}>
              <Stat>
                <StatLabel color="gray.500" fontSize="sm">Profit</StatLabel>
                <StatNumber fontSize="2xl">$5,432</StatNumber>
              </Stat>
            </Box>
          </Flex>
        </Box>

        <Box bg="white" p={6} rounded="lg" shadow="sm">
          <Flex align="center">
            <Flex
              p={3}
              rounded="full"
              bg="purple.50"
              alignItems="center"
              justifyContent="center"
            >
              <Icon as={ShoppingCartIcon} boxSize={6} color="purple.500" />
            </Flex>
            <Box ml={4}>
              <Stat>
                <StatLabel color="gray.500" fontSize="sm">Orders</StatLabel>
                <StatNumber fontSize="2xl">25</StatNumber>
              </Stat>
            </Box>
          </Flex>
        </Box>
      </SimpleGrid>

      {/* Charts Section */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={6}>
        <Box bg="white" p={6} rounded="lg" shadow="sm">
          <Text fontSize="lg" fontWeight="medium" mb={4}>Sales Overview</Text>
          {/* Chart vil blive tilføjet her */}
        </Box>

        <Box bg="white" p={6} rounded="lg" shadow="sm">
          <Text fontSize="lg" fontWeight="medium" mb={4}>Top Products</Text>
          {/* Chart vil blive tilføjet her */}
        </Box>
      </SimpleGrid>

      {/* Recent Activity */}
      <Box bg="white" p={6} rounded="lg" shadow="sm">
        <Text fontSize="lg" fontWeight="medium" mb={4}>Recent Activity</Text>
        <Box overflowX="auto">
          {/* Aktivitetstabel vil blive tilføjet her */}
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
