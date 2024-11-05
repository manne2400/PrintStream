import React, { useState, useEffect } from 'react';
import {
  Box, Flex, Heading, Text, Grid, GridItem,
  Table, Thead, Tbody, Tr, Th, Td,
  Select, Card, CardHeader, CardBody,
  Stat, StatLabel, StatNumber, StatHelpText,
  StatArrow, Divider, Progress
} from '@chakra-ui/react';
import initializeDatabase from '../database/setup';
import { SalesOperations, PrintJobOperations, CustomerOperations, FilamentOperations } from '../database/operations';
import { useCurrency } from '../context/CurrencyContext';

interface SalesStats {
  totalRevenue: number;
  totalProfit: number;
  totalSales: number;
  averageOrderValue: number;
  profitMargin: number;
}

interface TopProduct {
  project_name: string;
  total_quantity: number;
  total_revenue: number;
  profit: number;
}

const Reports: React.FC = () => {
  const [timeFrame, setTimeFrame] = useState<'week' | 'month' | 'year'>('month');
  const [salesStats, setSalesStats] = useState<SalesStats>({
    totalRevenue: 0,
    totalProfit: 0,
    totalSales: 0,
    averageOrderValue: 0,
    profitMargin: 0
  });
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const { currency } = useCurrency();

  // Tilføj state for kundestatistik
  const [customerStats, setCustomerStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0, // Kunder med køb i den valgte periode
    topCustomers: [] as Array<{
      name: string;
      total_purchases: number;
      total_spent: number;
    }>
  });

  // Tilføj state for lagerstatistik
  const [inventoryStats, setInventoryStats] = useState({
    totalFilaments: 0,
    totalStock: 0,
    lowStockItems: 0,
    stockValue: 0,
    mostUsedFilaments: [] as Array<{
      name: string;
      type: string;
      color: string;
      usage: number;
      stock: number;
    }>
  });

  useEffect(() => {
    loadReportData();
  }, [timeFrame]);

  const loadReportData = async () => {
    try {
      const db = await initializeDatabase();
      const salesOps = new SalesOperations(db);
      const customerOps = new CustomerOperations(db);
      const filamentOps = new FilamentOperations(db);
      
      // Hent salgsdata som før...
      const sales = await salesOps.getAllSales();
      
      // Filtrer baseret på valgt tidsperiode
      const now = new Date();
      const filteredSales = sales.filter(sale => {
        const saleDate = new Date(sale.sale_date);
        if (timeFrame === 'week') {
          return now.getTime() - saleDate.getTime() <= 7 * 24 * 60 * 60 * 1000;
        } else if (timeFrame === 'month') {
          return now.getTime() - saleDate.getTime() <= 30 * 24 * 60 * 60 * 1000;
        } else {
          return now.getTime() - saleDate.getTime() <= 365 * 24 * 60 * 60 * 1000;
        }
      });

      // Beregn statistik
      const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total_price, 0);
      const totalCosts = filteredSales.reduce((sum, sale) => 
        sum + sale.material_cost + sale.printing_cost + sale.processing_cost + sale.extra_costs, 
        0
      );
      const totalProfit = totalRevenue - totalCosts;
      
      setSalesStats({
        totalRevenue,
        totalProfit,
        totalSales: filteredSales.length,
        averageOrderValue: filteredSales.length ? totalRevenue / filteredSales.length : 0,
        profitMargin: totalRevenue ? (totalProfit / totalRevenue) * 100 : 0
      });

      // Beregn top produkter
      const productMap = new Map<string, TopProduct>();
      filteredSales.forEach(sale => {
        const existing = productMap.get(sale.project_name) || {
          project_name: sale.project_name,
          total_quantity: 0,
          total_revenue: 0,
          profit: 0
        };

        const costs = sale.material_cost + sale.printing_cost + sale.processing_cost + sale.extra_costs;
        const profit = sale.total_price - costs;

        productMap.set(sale.project_name, {
          ...existing,
          total_quantity: existing.total_quantity + sale.quantity,
          total_revenue: existing.total_revenue + sale.total_price,
          profit: existing.profit + profit
        });
      });

      setTopProducts(Array.from(productMap.values())
        .sort((a, b) => b.total_revenue - a.total_revenue)
        .slice(0, 5));

      // Beregn kundestatistik
      const customers = await customerOps.getAllCustomers();
      const activeCustomerIds = new Set(filteredSales.map(sale => sale.customer_id));
      
      // Beregn top kunder
      const customerPurchases = filteredSales.reduce((acc, sale) => {
        if (!sale.customer_id) return acc;
        if (!acc[sale.customer_id]) {
          acc[sale.customer_id] = {
            name: sale.customer_name || 'Unknown',
            total_purchases: 0,
            total_spent: 0
          };
        }
        acc[sale.customer_id].total_purchases++;
        acc[sale.customer_id].total_spent += sale.total_price;
        return acc;
      }, {} as Record<string, { name: string; total_purchases: number; total_spent: number; }>);

      const topCustomers = Object.values(customerPurchases)
        .sort((a, b) => b.total_spent - a.total_spent)
        .slice(0, 5);

      setCustomerStats({
        totalCustomers: customers.length,
        activeCustomers: activeCustomerIds.size,
        topCustomers
      });

      // Beregn lagerstatistik
      const filaments = await filamentOps.getAllFilaments();
      const totalStock = filaments.reduce((sum, f) => sum + f.stock, 0);
      const stockValue = filaments.reduce((sum, f) => sum + (f.stock * f.price / 1000), 0);
      const lowStockItems = filaments.filter(f => f.stock <= (f.low_stock_alert ?? 500)).length;

      // Beregn mest brugte filamenter
      const filamentUsage = filaments.map(f => ({
        name: f.name,
        type: f.type,
        color: f.color,
        usage: f.weight - f.stock,
        stock: f.stock
      })).sort((a, b) => b.usage - a.usage).slice(0, 5);

      setInventoryStats({
        totalFilaments: filaments.length,
        totalStock,
        lowStockItems,
        stockValue,
        mostUsedFilaments: filamentUsage
      });

    } catch (err) {
      console.error('Failed to load report data:', err);
    }
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="lg" fontWeight="semibold" color="gray.800">
            Reports
          </Heading>
          <Text mt={1} color="gray.500" fontSize="sm">
            Business analytics and insights
          </Text>
        </Box>
        <Select
          width="200px"
          value={timeFrame}
          onChange={(e) => setTimeFrame(e.target.value as 'week' | 'month' | 'year')}
        >
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
          <option value="year">Last 365 Days</option>
        </Select>
      </Flex>

      <Grid templateColumns="repeat(4, 1fr)" gap={6} mb={8}>
        <GridItem>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Total Revenue</StatLabel>
                <StatNumber>{currency} {salesStats.totalRevenue.toFixed(2)}</StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  {timeFrame === 'week' ? '7 days' : timeFrame === 'month' ? '30 days' : '365 days'}
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>

        <GridItem>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Total Profit</StatLabel>
                <StatNumber>{currency} {salesStats.totalProfit.toFixed(2)}</StatNumber>
                <StatHelpText>
                  Margin: {salesStats.profitMargin.toFixed(1)}%
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>

        <GridItem>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Number of Sales</StatLabel>
                <StatNumber>{salesStats.totalSales}</StatNumber>
                <StatHelpText>
                  Avg. {currency} {salesStats.averageOrderValue.toFixed(2)}
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>

        <GridItem>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Profit Margin</StatLabel>
                <StatNumber>{salesStats.profitMargin.toFixed(1)}%</StatNumber>
                <StatHelpText>
                  Of total revenue
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>

      {/* Customer Statistics */}
      <Box bg="white" p={6} rounded="lg" shadow="sm" mb={8}>
        <Heading size="md" mb={4}>Customer Statistics</Heading>
        <Grid templateColumns="repeat(3, 1fr)" gap={6} mb={6}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Total Customers</StatLabel>
                <StatNumber>{customerStats.totalCustomers}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Active Customers</StatLabel>
                <StatNumber>{customerStats.activeCustomers}</StatNumber>
                <StatHelpText>
                  {((customerStats.activeCustomers / customerStats.totalCustomers) * 100).toFixed(1)}% active
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Average Order Value</StatLabel>
                <StatNumber>{currency} {salesStats.averageOrderValue.toFixed(2)}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
        </Grid>

        <Heading size="sm" mb={3}>Top Customers</Heading>
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th>Customer</Th>
              <Th isNumeric>Orders</Th>
              <Th isNumeric>Total Spent</Th>
            </Tr>
          </Thead>
          <Tbody>
            {customerStats.topCustomers.map((customer, index) => (
              <Tr key={`${customer.name}-${index}`}>
                <Td>{customer.name}</Td>
                <Td isNumeric>{customer.total_purchases}</Td>
                <Td isNumeric>{currency} {customer.total_spent.toFixed(2)}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      {/* Inventory Statistics */}
      <Box bg="white" p={6} rounded="lg" shadow="sm" mb={8}>
        <Heading size="md" mb={4}>Inventory Statistics</Heading>
        <Grid templateColumns="repeat(4, 1fr)" gap={6} mb={6}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Total Filaments</StatLabel>
                <StatNumber>{inventoryStats.totalFilaments}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Total Stock</StatLabel>
                <StatNumber>{inventoryStats.totalStock.toFixed(1)}g</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Low Stock Items</StatLabel>
                <StatNumber>{inventoryStats.lowStockItems}</StatNumber>
                <StatHelpText color={inventoryStats.lowStockItems > 0 ? "red.500" : "green.500"}>
                  {((inventoryStats.lowStockItems / inventoryStats.totalFilaments) * 100).toFixed(1)}% of total
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Stock Value</StatLabel>
                <StatNumber>{currency} {inventoryStats.stockValue.toFixed(2)}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
        </Grid>

        <Heading size="sm" mb={3}>Most Used Filaments</Heading>
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th>Filament</Th>
              <Th>Type</Th>
              <Th>Color</Th>
              <Th isNumeric>Usage</Th>
              <Th>Stock Level</Th>
            </Tr>
          </Thead>
          <Tbody>
            {inventoryStats.mostUsedFilaments.map((filament, index) => (
              <Tr key={`${filament.name}-${index}`}>
                <Td>{filament.name}</Td>
                <Td>{filament.type}</Td>
                <Td>{filament.color}</Td>
                <Td isNumeric>{filament.usage.toFixed(1)}g</Td>
                <Td>
                  <Progress 
                    value={(filament.stock / 1000) * 100} 
                    colorScheme={filament.stock < 500 ? "red" : "green"}
                    size="sm"
                  />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      <Box bg="white" p={6} rounded="lg" shadow="sm" mb={8}>
        <Heading size="md" mb={4}>Top Products</Heading>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Product</Th>
              <Th isNumeric>Quantity Sold</Th>
              <Th isNumeric>Revenue</Th>
              <Th isNumeric>Profit</Th>
              <Th isNumeric>Margin</Th>
            </Tr>
          </Thead>
          <Tbody>
            {topProducts.map((product, index) => (
              <Tr key={`${product.project_name}-${index}`}>
                <Td>{product.project_name}</Td>
                <Td isNumeric>{product.total_quantity}</Td>
                <Td isNumeric>{currency} {product.total_revenue.toFixed(2)}</Td>
                <Td isNumeric>{currency} {product.profit.toFixed(2)}</Td>
                <Td isNumeric>
                  {((product.profit / product.total_revenue) * 100).toFixed(1)}%
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </Box>
  );
};

export default Reports; 