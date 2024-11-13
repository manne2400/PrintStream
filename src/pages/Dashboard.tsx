import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, SimpleGrid, Flex, Text, Icon, Stat, StatLabel, StatNumber, StatHelpText,
  StatArrow, Table, Thead, Tbody, Tr, Th, Td, Badge
} from '@chakra-ui/react';
import { ChartBarIcon, CurrencyDollarIcon, ShoppingCartIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline';
import initializeDatabase from '../database/setup';
import { SalesOperations, FilamentOperations, PrintJobOperations } from '../database/operations';
import { useCurrency } from '../context/CurrencyContext';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Registrer Chart.js komponenter
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard: React.FC = () => {
  const { currency } = useCurrency();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalProfit: 0,
    totalOrders: 0,
    lowStockItems: 0,
    recentSales: [] as any[],
    recentActivity: [] as any[]
  });
  const [salesChartData, setSalesChartData] = useState<any>(null);
  const [productChartData, setProductChartData] = useState<any>(null);

  // Opdater chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false, // Dette er vigtigt for at kontrollere størrelsen
    animation: {
      duration: 0
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: any) => `${currency} ${value}`
        }
      }
    }
  };

  // Optimer data loading med useMemo
  const loadDashboardData = useCallback(async () => {
    try {
      const db = await initializeDatabase();
      const salesOps = new SalesOperations(db);
      const filamentOps = new FilamentOperations(db);
      const printJobOps = new PrintJobOperations(db);

      // Hent salgsdata
      const sales = await salesOps.getAllSales();
      const recentSales = sales.slice(0, 5); // Seneste 5 salg

      // Beregn total omsætning og profit
      const totalRevenue = sales.reduce((sum, sale) => sum + sale.total_price, 0);
      
      // Beregn profit
      const totalProfit = sales.reduce((sum, sale) => {
        const costPerUnit = (
          sale.material_cost + 
          sale.printing_cost + 
          sale.processing_cost + 
          sale.extra_costs
        );
        const totalCost = costPerUnit * sale.quantity;
        return sum + (sale.total_price - totalCost);
      }, 0);

      // Tæl unikke invoice numre for at få det korrekte antal ordrer
      const uniqueInvoices = new Set(sales.map(sale => sale.invoice_number)).size;

      setStats(prev => ({
        ...prev,
        totalRevenue,
        totalProfit,
        totalOrders: uniqueInvoices
      }));

      // Hent filament data
      const filaments = await filamentOps.getAllFilaments();
      const lowStockItems = filaments.filter(f => f.stock <= (f.low_stock_alert ?? 500)).length;

      // Hent print jobs
      const printJobs = await printJobOps.getAllPrintJobs();
      const recentPrintJobs = printJobs.slice(0, 5); // Seneste 5 print jobs

      // Kombiner aktiviteter og sorter efter dato
      const activities = [
        ...recentSales.map(sale => ({
          type: 'sale',
          date: new Date(sale.sale_date),
          data: sale
        })),
        ...recentPrintJobs.map(job => ({
          type: 'print',
          date: new Date(job.date),
          data: job
        }))
      ].sort((a, b) => b.date.getTime() - a.date.getTime())
       .slice(0, 10); // Vis kun de 10 seneste aktiviteter

      setStats(prev => ({
        ...prev,
        lowStockItems,
        recentSales,
        recentActivity: activities
      }));

      // Forbered data til sales chart
      const last5Days = Array.from({length: 5}, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
      }).reverse();

      const salesData = last5Days.map(date => {
        const daySales = sales.filter(s => s.sale_date.startsWith(date));
        return {
          date,
          revenue: daySales.reduce((sum, s) => sum + s.total_price, 0),
          profit: daySales.reduce((sum, s) => {
            const costPerUnit = (
              s.material_cost + 
              s.printing_cost + 
              s.processing_cost + 
              s.extra_costs
            );
            const totalCost = costPerUnit * s.quantity;
            return sum + (s.total_price - totalCost);
          }, 0)
        };
      });

      setSalesChartData({
        labels: salesData.map(d => new Date(d.date).toLocaleDateString()),
        datasets: [
          {
            label: 'Revenue',
            data: salesData.map(d => d.revenue),
            borderColor: 'rgb(53, 162, 235)',
            backgroundColor: 'rgba(53, 162, 235, 0.5)',
          },
          {
            label: 'Profit',
            data: salesData.map(d => d.profit),
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
          }
        ]
      });

      // Opret productMap før vi bruger det
      const productMap = new Map();
      sales.forEach(sale => {
        if (!productMap.has(sale.project_name)) {
          productMap.set(sale.project_name, {
            project_name: sale.project_name,
            total_revenue: 0,
            quantity: 0
          });
        }
        const product = productMap.get(sale.project_name);
        product.total_revenue += sale.total_price;
        product.quantity += sale.quantity;
      });

      // Forbered data til product chart
      const productData = Array.from(productMap.values())
        .sort((a, b) => b.total_revenue - a.total_revenue)
        .slice(0, 5);

      setProductChartData({
        labels: productData.map(p => p.project_name),
        datasets: [
          {
            label: 'Revenue',
            data: productData.map(p => p.total_revenue),
            backgroundColor: 'rgba(53, 162, 235, 0.5)',
          }
        ]
      });

    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  }, []);

  // Brug useEffect med cleanup
  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      if (mounted) {
        await loadDashboardData();
      }
    };
    
    loadData();
    
    return () => {
      mounted = false;
    };
  }, [loadDashboardData]);

  const getActivityBadge = (type: string) => {
    switch (type) {
      case 'sale':
        return <Badge colorScheme="green">Sale</Badge>;
      case 'print':
        return <Badge colorScheme="blue">Print</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  return (
    <Box p={4}>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={6}>
        <Box variant="stats-card">
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
                <StatLabel>Total Revenue</StatLabel>
                <StatNumber>{currency} {stats.totalRevenue.toFixed(2)}</StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  All time
                </StatHelpText>
              </Stat>
            </Box>
          </Flex>
        </Box>

        <Box variant="stats-card">
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
                <StatLabel>Total Profit</StatLabel>
                <StatNumber>{currency} {stats.totalProfit.toFixed(2)}</StatNumber>
                <StatHelpText>
                  {((stats.totalProfit / stats.totalRevenue) * 100).toFixed(1)}% margin
                </StatHelpText>
              </Stat>
            </Box>
          </Flex>
        </Box>

        <Box variant="stats-card">
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
                <StatLabel>Total Orders</StatLabel>
                <StatNumber>{stats.totalOrders}</StatNumber>
                <StatHelpText>
                  Lifetime orders
                </StatHelpText>
              </Stat>
            </Box>
          </Flex>
        </Box>

        <Box variant="stats-card">
          <Flex align="center">
            <Flex
              p={3}
              rounded="full"
              bg="orange.50"
              alignItems="center"
              justifyContent="center"
            >
              <Icon as={ArchiveBoxIcon} boxSize={6} color="orange.500" />
            </Flex>
            <Box ml={4}>
              <Stat>
                <StatLabel>Low Stock Items</StatLabel>
                <StatNumber>{stats.lowStockItems}</StatNumber>
                <StatHelpText>
                  Need attention
                </StatHelpText>
              </Stat>
            </Box>
          </Flex>
        </Box>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={6}>
        <Box variant="stats-card">
          <Text fontSize="lg" fontWeight="medium" mb={4}>Sales Overview</Text>
          <Box height="300px">
            {salesChartData && (
              <Line data={salesChartData} options={chartOptions} />
            )}
          </Box>
        </Box>

        <Box variant="stats-card">
          <Text fontSize="lg" fontWeight="medium" mb={4}>Top Products Revenue</Text>
          <Box height="300px">
            {productChartData && (
              <Bar data={productChartData} options={chartOptions} />
            )}
          </Box>
        </Box>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={6}>
        <Box variant="stats-card">
          <Text fontSize="lg" fontWeight="medium" mb={4}>Recent Sales</Text>
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th>Invoice #</Th>
                <Th>Customer</Th>
                <Th isNumeric>Amount</Th>
                <Th>Status</Th>
              </Tr>
            </Thead>
            <Tbody>
              {stats.recentSales.map((sale) => (
                <Tr key={sale.id}>
                  <Td>{sale.invoice_number}</Td>
                  <Td>{sale.customer_name || 'N/A'}</Td>
                  <Td isNumeric>{currency} {sale.total_price.toFixed(2)}</Td>
                  <Td>
                    <Badge
                      colorScheme={
                        sale.payment_status === 'paid' ? 'green' :
                        sale.payment_status === 'pending' ? 'yellow' :
                        'red'
                      }
                    >
                      {sale.payment_status}
                    </Badge>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>

        <Box variant="stats-card">
          <Text fontSize="lg" fontWeight="medium" mb={4}>Recent Activity</Text>
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th>Date</Th>
                <Th>Type</Th>
                <Th>Details</Th>
              </Tr>
            </Thead>
            <Tbody>
              {stats.recentActivity.map((activity, index) => (
                <Tr key={index}>
                  <Td>{activity.date.toLocaleDateString()}</Td>
                  <Td>{getActivityBadge(activity.type)}</Td>
                  <Td>
                    {activity.type === 'sale' 
                      ? `Sale: ${activity.data.project_name} to ${activity.data.customer_name || 'N/A'}`
                      : `Print started: ${activity.data.project_name}`
                    }
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </SimpleGrid>
    </Box>
  );
};

export default Dashboard;
