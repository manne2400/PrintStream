import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Flex, Heading, Text, Button, Icon,
  Table, Thead, Tbody, Tr, Th, Td,
  useToast, InputGroup, InputLeftElement, Input,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter,
  FormControl, FormLabel, Select, NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper,
  VStack, Textarea, Badge, Divider
} from '@chakra-ui/react';
import { PlusIcon, MagnifyingGlassIcon, ChevronUpIcon, ChevronDownIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import initializeDatabase from '../database/setup';
import { SalesOperations } from '../database/operations';
import { PrintJobOperations } from '../database/operations';
import { CustomerOperations } from '../database/operations';
import { SettingsOperations } from '../database/operations';
import { useCurrency } from '../context/CurrencyContext';

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

interface NewSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaleComplete: () => void;
}

interface CostBreakdown {
  materialCost: number;
  printingCost: number;
  postProcessingCost: number;
  extraCosts: number;
  totalCost: number;
  suggestedPrice: number;
  profitMargin: number;
  expectedProfit: number;
}

interface PaymentStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale;
  onSubmit: (id: number, status: 'pending' | 'paid' | 'cancelled') => void;
}

const NewSaleModal: React.FC<NewSaleModalProps> = ({ isOpen, onClose, onSaleComplete }) => {
  const [formData, setFormData] = useState({
    printJobId: '',
    customerId: '',
    quantity: 1,
    unitPrice: 0,
    saleDate: new Date().toISOString().split('T')[0],
    paymentDueDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
    notes: ''
  });
  const [printJobs, setPrintJobs] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedPrintJob, setSelectedPrintJob] = useState<any>(null);
  const { currency } = useCurrency();
  const toast = useToast();
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown | null>(null);

  useEffect(() => {
    loadPrintJobs();
    loadCustomers();
  }, []);

  const loadPrintJobs = async () => {
    try {
      const db = await initializeDatabase();
      const ops = new PrintJobOperations(db);
      const data = await ops.getAllPrintJobs();
      setPrintJobs(data);
    } catch (err) {
      console.error('Failed to load print jobs:', err);
    }
  };

  const loadCustomers = async () => {
    try {
      const db = await initializeDatabase();
      const ops = new CustomerOperations(db);
      const data = await ops.getAllCustomers();
      setCustomers(data);
    } catch (err) {
      console.error('Failed to load customers:', err);
    }
  };

  const handleSubmit = async () => {
    try {
      const db = await initializeDatabase();
      const ops = new SalesOperations(db);
      const printJobOps = new PrintJobOperations(db);
      const settingsOps = new SettingsOperations(db);
      
      // Hent print job og beregn omkostninger
      const printJob = printJobs.find(pj => pj.id === parseInt(formData.printJobId));
      if (!printJob) return;
      
      const costs = await printJobOps.calculateProjectCosts(printJob.project_id);
      const settings = await settingsOps.getSettings();
      
      // Generer fakturanummer
      const invoiceNumber = await ops.getNextInvoiceNumber();
      
      // Opret salg med snapshot data
      await ops.addSale({
        project_id: printJob.project_id,
        customer_id: formData.customerId ? parseInt(formData.customerId) : null,
        print_job_id: parseInt(formData.printJobId),
        invoice_number: invoiceNumber,
        sale_date: formData.saleDate,
        quantity: formData.quantity,
        unit_price: formData.unitPrice,
        total_price: formData.quantity * formData.unitPrice,
        payment_status: 'pending',
        payment_due_date: formData.paymentDueDate,
        notes: formData.notes,
        project_name: printJob.project_name,
        customer_name: customers.find(c => c.id === parseInt(formData.customerId))?.name || null,
        material_cost: costs.materialCost,
        printing_cost: costs.printingCost,
        processing_cost: costs.postProcessingCost,
        extra_costs: costs.extraCosts,
        currency: settings.currency
      });

      // Opdater print job quantity i stedet for at slette det
      const remainingQuantity = printJob.quantity - formData.quantity;
      if (remainingQuantity > 0) {
        await printJobOps.updatePrintJob(printJob.id!, { quantity: remainingQuantity });
      } else {
        // Kun slet hvis der ikke er flere prints tilbage
        await printJobOps.deletePrintJob(printJob.id!);
      }

      toast({
        title: 'Success',
        description: 'Sale created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onClose();
      if (onSaleComplete) onSaleComplete();
    } catch (err) {
      console.error('Failed to create sale:', err);
      toast({
        title: 'Error',
        description: 'Failed to create sale',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handlePrintJobChange = async (printJobId: string) => {
    try {
      const printJob = printJobs.find(pj => pj.id === parseInt(printJobId));
      if (!printJob) return;

      const db = await initializeDatabase();
      const printJobOps = new PrintJobOperations(db);
      const settingsOps = new SettingsOperations(db);
      
      // Hent omkostninger og settings
      const costs = await printJobOps.calculateProjectCosts(printJob.project_id);
      const settings = await settingsOps.getSettings();
      const profitMargin = settings.profit_margin ?? 30;
      
      // Beregn foreslået salgspris baseret på omkostninger og profit margin
      const totalCost = costs.totalCost / printJob.quantity; // Omkostning per enhed
      const suggestedPrice = totalCost * (1 + profitMargin / 100);
      const expectedProfit = suggestedPrice - totalCost;
      
      setCostBreakdown({
        materialCost: costs.materialCost / printJob.quantity,
        printingCost: costs.printingCost / printJob.quantity,
        postProcessingCost: costs.postProcessingCost / printJob.quantity,
        extraCosts: costs.extraCosts / printJob.quantity,
        totalCost,
        suggestedPrice,
        profitMargin,
        expectedProfit
      });
      
      // Sæt den foreslåede pris som standard
      setFormData(prev => ({
        ...prev,
        printJobId,
        unitPrice: suggestedPrice,
        quantity: 1 // Reset quantity når nyt print job vælges
      }));
    } catch (err) {
      console.error('Failed to calculate costs:', err);
    }
  };

  // Tilføj ny funktion til at håndtere quantity ændringer
  const handleQuantityChange = (newQuantity: number) => {
    if (!costBreakdown) return;

    // Opdater formData med ny quantity
    setFormData(prev => ({
      ...prev,
      quantity: newQuantity,
      // Behold samme unit price
      unitPrice: costBreakdown.suggestedPrice
    }));

    // Opdater cost breakdown med nye totaler
    setCostBreakdown(prev => {
      if (!prev) return prev;

      // Beregn totaler baseret på original pris per enhed
      const perUnit = {
        materialCost: prev.materialCost / formData.quantity,
        printingCost: prev.printingCost / formData.quantity,
        postProcessingCost: prev.postProcessingCost / formData.quantity,
        extraCosts: prev.extraCosts / formData.quantity,
        totalCost: prev.totalCost / formData.quantity,
      };

      // Gang med det nye antal
      return {
        materialCost: perUnit.materialCost * newQuantity,
        printingCost: perUnit.printingCost * newQuantity,
        postProcessingCost: perUnit.postProcessingCost * newQuantity,
        extraCosts: perUnit.extraCosts * newQuantity,
        totalCost: perUnit.totalCost * newQuantity,
        suggestedPrice: prev.suggestedPrice, // Denne forbliver den samme per enhed
        profitMargin: prev.profitMargin, // Denne forbliver den samme
        expectedProfit: (prev.suggestedPrice * newQuantity) - (perUnit.totalCost * newQuantity)
      };
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Create New Sale</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Print Job</FormLabel>
              <Select
                value={formData.printJobId}
                onChange={(e) => handlePrintJobChange(e.target.value)}
                placeholder="Select print job"
              >
                {printJobs.map(job => (
                  <option key={job.id} value={job.id}>
                    {job.project_name} ({job.quantity} units)
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Customer</FormLabel>
              <Select
                value={formData.customerId}
                onChange={(e) => setFormData(prev => ({ ...prev, customerId: e.target.value }))}
                placeholder="Select customer (optional)"
              >
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Quantity</FormLabel>
              <NumberInput
                value={formData.quantity}
                onChange={(value) => handleQuantityChange(parseInt(value))}
                min={1}
                max={selectedPrintJob?.quantity || 999999}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Unit Price ({currency})</FormLabel>
              <NumberInput
                value={formData.unitPrice}
                onChange={(value) => setFormData(prev => ({ ...prev, unitPrice: parseFloat(value) }))}
                min={0}
                precision={2}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Sale Date</FormLabel>
              <Input
                type="date"
                value={formData.saleDate}
                onChange={(e) => setFormData(prev => ({ ...prev, saleDate: e.target.value }))}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Payment Due Date</FormLabel>
              <Input
                type="date"
                value={formData.paymentDueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentDueDate: e.target.value }))}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Notes</FormLabel>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add any additional notes..."
              />
            </FormControl>

            {costBreakdown && (
              <Box width="100%" p={4} borderWidth={1} borderRadius="md">
                <Heading size="sm" mb={2}>Cost Breakdown (Total for {formData.quantity} units)</Heading>
                <VStack align="stretch" spacing={2}>
                  <Flex justify="space-between">
                    <Text>Material Cost:</Text>
                    <Text>{currency} {costBreakdown.materialCost.toFixed(2)}</Text>
                  </Flex>
                  <Flex justify="space-between">
                    <Text>Printing Cost:</Text>
                    <Text>{currency} {costBreakdown.printingCost.toFixed(2)}</Text>
                  </Flex>
                  <Flex justify="space-between">
                    <Text>Post-Processing Cost:</Text>
                    <Text>{currency} {costBreakdown.postProcessingCost.toFixed(2)}</Text>
                  </Flex>
                  <Flex justify="space-between">
                    <Text>Extra Costs:</Text>
                    <Text>{currency} {costBreakdown.extraCosts.toFixed(2)}</Text>
                  </Flex>
                  <Divider />
                  <Flex justify="space-between" fontWeight="bold">
                    <Text>Total Cost:</Text>
                    <Text>{currency} {costBreakdown.totalCost.toFixed(2)}</Text>
                  </Flex>
                  <Divider />
                  <Flex justify="space-between" color="green.500">
                    <Text>Profit Margin:</Text>
                    <Text>{costBreakdown.profitMargin}%</Text>
                  </Flex>
                  <Flex justify="space-between" fontWeight="bold" color="green.500">
                    <Text>Expected Profit:</Text>
                    <Text>{currency} {costBreakdown.expectedProfit.toFixed(2)}</Text>
                  </Flex>
                  <Divider />
                  <Flex justify="space-between" fontWeight="bold" fontSize="lg" color="blue.500">
                    <Text>Suggested Price (per unit):</Text>
                    <Text>{currency} {costBreakdown.suggestedPrice.toFixed(2)}</Text>
                  </Flex>
                  <Flex justify="space-between" fontWeight="bold" fontSize="lg" color="blue.500">
                    <Text>Total Price ({formData.quantity} units):</Text>
                    <Text>{currency} {(costBreakdown.suggestedPrice * formData.quantity).toFixed(2)}</Text>
                  </Flex>
                </VStack>
              </Box>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button 
            colorScheme="blue" 
            onClick={handleSubmit}
            isDisabled={!formData.printJobId || formData.unitPrice <= 0}
          >
            Create Sale
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const PaymentStatusModal: React.FC<PaymentStatusModalProps> = ({ isOpen, onClose, sale, onSubmit }) => {
  const { currency } = useCurrency();
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Update Payment Status</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <Text>
              Invoice #{sale.invoice_number} - {currency} {sale.total_price.toFixed(2)}
            </Text>
            <Text>Current Status: {sale.payment_status.toUpperCase()}</Text>
            <Box width="100%">
              <Button
                width="100%"
                colorScheme="green"
                mb={2}
                onClick={() => onSubmit(sale.id!, 'paid')}
              >
                Mark as Paid
              </Button>
              <Button
                width="100%"
                colorScheme="yellow"
                mb={2}
                onClick={() => onSubmit(sale.id!, 'pending')}
              >
                Mark as Pending
              </Button>
              <Button
                width="100%"
                colorScheme="red"
                onClick={() => onSubmit(sale.id!, 'cancelled')}
              >
                Mark as Cancelled
              </Button>
            </Box>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

const Sales: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'date', direction: 'desc' });
  const [sales, setSales] = useState<any[]>([]);
  const toast = useToast();
  const { currency } = useCurrency();
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    try {
      const db = await initializeDatabase();
      const ops = new SalesOperations(db);
      const data = await ops.getAllSales();
      setSales(data);
    } catch (err) {
      console.error('Failed to load sales:', err);
      toast({
        title: 'Error',
        description: 'Failed to load sales',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const renderSortIcon = (columnKey: string) => {
    if (sortConfig.key !== columnKey) {
      return null;
    }
    return sortConfig.direction === 'asc' ? 
      <Icon as={ChevronUpIcon} w={4} h={4} /> : 
      <Icon as={ChevronDownIcon} w={4} h={4} />;
  };

  const sortedSales = useMemo(() => {
    return [...sales].sort((a, b) => {
      if (sortConfig.key === 'date') {
        return sortConfig.direction === 'asc' ? a.sale_date - b.sale_date : b.sale_date - a.sale_date;
      } else if (sortConfig.key === 'customer') {
        return sortConfig.direction === 'asc' ? a.customer_name.localeCompare(b.customer_name) : b.customer_name.localeCompare(a.customer_name);
      } else if (sortConfig.key === 'project') {
        return sortConfig.direction === 'asc' ? a.project_name.localeCompare(b.project_name) : b.project_name.localeCompare(a.project_name);
      } else if (sortConfig.key === 'total') {
        return sortConfig.direction === 'asc' ? a.total_price - b.total_price : b.total_price - a.total_price;
      } else if (sortConfig.key === 'status') {
        return sortConfig.direction === 'asc' ? a.payment_status.localeCompare(b.payment_status) : b.payment_status.localeCompare(a.payment_status);
      }
      return 0;
    });
  }, [sales, sortConfig]);

  const handleUpdatePaymentStatus = async (id: number, status: 'pending' | 'paid' | 'cancelled') => {
    try {
      const db = await initializeDatabase();
      const ops = new SalesOperations(db);
      await ops.updatePaymentStatus(id, status);
      
      await loadSales();
      toast({
        title: 'Success',
        description: 'Payment status updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setSelectedSale(null);
    } catch (err) {
      console.error('Failed to update payment status:', err);
      toast({
        title: 'Error',
        description: 'Failed to update payment status',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="lg" fontWeight="semibold" color="gray.800">
            Sales
          </Heading>
          <Text mt={1} color="gray.500" fontSize="sm">
            Manage your sales
          </Text>
        </Box>
        <Button
          leftIcon={<Icon as={PlusIcon} boxSize={5} />}
          colorScheme="blue"
          size="md"
          onClick={() => setIsOpen(true)}
        >
          New Sale
        </Button>
      </Flex>

      <Box mb={4}>
        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <Icon as={MagnifyingGlassIcon} color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder="Search sales..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </InputGroup>
      </Box>

      <Box bg="white" p={6} rounded="lg" shadow="sm">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th cursor="pointer" onClick={() => handleSort('invoice_number')}>
                <Flex align="center">
                  Invoice # {renderSortIcon('invoice_number')}
                </Flex>
              </Th>
              <Th cursor="pointer" onClick={() => handleSort('sale_date')}>
                <Flex align="center">
                  Date {renderSortIcon('sale_date')}
                </Flex>
              </Th>
              <Th cursor="pointer" onClick={() => handleSort('customer_name')}>
                <Flex align="center">
                  Customer {renderSortIcon('customer_name')}
                </Flex>
              </Th>
              <Th cursor="pointer" onClick={() => handleSort('project_name')}>
                <Flex align="center">
                  Project {renderSortIcon('project_name')}
                </Flex>
              </Th>
              <Th isNumeric cursor="pointer" onClick={() => handleSort('total_price')}>
                <Flex align="center" justify="flex-end">
                  Total {renderSortIcon('total_price')}
                </Flex>
              </Th>
              <Th cursor="pointer" onClick={() => handleSort('payment_status')}>
                <Flex align="center">
                  Status {renderSortIcon('payment_status')}
                </Flex>
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {sortedSales.map((sale) => (
              <Tr key={sale.id}>
                <Td>{sale.invoice_number}</Td>
                <Td>{new Date(sale.sale_date).toLocaleDateString()}</Td>
                <Td>{sale.customer_name || 'N/A'}</Td>
                <Td>{sale.project_name}</Td>
                <Td isNumeric>{currency} {sale.total_price.toFixed(2)}</Td>
                <Td>
                  <Button
                    size="sm"
                    variant="ghost"
                    leftIcon={<Icon as={CreditCardIcon} />}
                    colorScheme={
                      sale.payment_status === 'paid' ? 'green' :
                      sale.payment_status === 'pending' ? 'yellow' :
                      'red'
                    }
                    onClick={() => setSelectedSale(sale)}
                  >
                    {sale.payment_status.toUpperCase()}
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      <NewSaleModal 
        isOpen={isOpen} 
        onClose={() => {
          setIsOpen(false);
        }}
        onSaleComplete={loadSales}
      />
      {selectedSale && (
        <PaymentStatusModal
          isOpen={selectedSale !== null}
          onClose={() => setSelectedSale(null)}
          sale={selectedSale}
          onSubmit={handleUpdatePaymentStatus}
        />
      )}
    </Box>
  );
};

export default Sales; 