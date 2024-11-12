import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box, Flex, Heading, Text, Button, Icon,
  Table, Thead, Tbody, Tr, Th, Td,
  useToast, InputGroup, InputLeftElement, Input,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter,
  FormControl, FormLabel, Select, NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper,
  VStack, Textarea, Badge, Divider, Checkbox, IconButton, Grid
} from '@chakra-ui/react';
import { PlusIcon, MagnifyingGlassIcon, ChevronUpIcon, ChevronDownIcon, CreditCardIcon, TrashIcon, MinusIcon, PrinterIcon } from '@heroicons/react/24/outline';
import initializeDatabase from '../database/setup';
import { SalesOperations, ProjectOperations, FilamentOperations } from '../database/operations';
import { PrintJobOperations } from '../database/operations';
import { CustomerOperations } from '../database/operations';
import { SettingsOperations } from '../database/operations';
import { useCurrency } from '../context/CurrencyContext';
import { Sale, SaleItem } from '../types/sales';
import { CustomerSelect } from '../components/sales/CustomerSelect';
import { PrintJobSelect } from '../components/sales/PrintJobSelect';
import { TotalCalculation } from '../components/sales/TotalCalculation';

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

interface DeleteSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale;
  onConfirm: () => Promise<void>;
}

interface GroupedSale {
  id: number;
  invoice_number: string;
  sale_date: string;
  customer_name: string | null;
  items: {
    project_name: string;
    quantity: number;
    total_price: number;
  }[];
  items_total: number;
  shipping_cost: number;
  total_price: number;
  payment_status: 'pending' | 'paid' | 'cancelled';
}

interface InvoiceData {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  customerInfo: {
    name: string;
    address: string;
    email: string;
    phone: string;
    vatId: string;
  } | null;
  companyInfo: {
    name: string;
    address: string;
    email: string;
    phone: string;
    vatId: string;
    bankDetails: string;
  };
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  shipping: number;
  subtotal: number;
  total: number;
  currency: string;
}

interface PrintInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceData: InvoiceData;
}

const NewSaleModal: React.FC<NewSaleModalProps> = ({ isOpen, onClose, onSaleComplete }) => {
  const [formData, setFormData] = useState<FormData>({
    customerId: '',
    items: [],
    paymentStatus: 'pending',
    paymentDueDate: '',
    notes: ''
  });

  const [printJobs, setPrintJobs] = useState<Array<{ id: number; project_name: string }>>([]);
  const [customers, setCustomers] = useState<Array<{ id: number; name: string }>>([]);
  const toast = useToast();
  const { currency } = useCurrency();
  const [shippingCost, setShippingCost] = useState(0);

  useEffect(() => {
    loadPrintJobsAndCustomers();
  }, []);

  const loadPrintJobsAndCustomers = async () => {
    const db = await initializeDatabase();
    const printJobOps = new PrintJobOperations(db);
    const customerOps = new CustomerOperations(db);
    
    const jobs = await printJobOps.getAllPrintJobs();
    const custs = await customerOps.getAllCustomers();
    
    setPrintJobs(jobs);
    setCustomers(custs);
  };

  const handlePrintJobChange = async (value: number, index: number) => {
    try {
      const db = await initializeDatabase();
      const printJobOps = new PrintJobOperations(db);
      const settingsOps = new SettingsOperations(db);
      
      // Hent print job og settings
      const printJob = await printJobOps.getPrintJobById(value);
      const settings = await settingsOps.getSettings();
      if (!printJob) return;
      
      // Beregn omkostninger
      const costs = await printJobOps.calculateProjectCosts(printJob.project_id);
      const profitMargin = settings.profit_margin ?? 30;
      
      // Beregn foreslået pris baseret på profit margin
      const totalCostPerUnit = costs.materialCost + costs.printingCost + 
                             costs.postProcessingCost + costs.extraCosts;
      const suggestedPrice = Number((totalCostPerUnit / (1 - profitMargin / 100)).toFixed(2));
      
      const updatedItems = [...formData.items];
      updatedItems[index] = {
        ...updatedItems[index],
        printJobId: value,
        projectName: printJob.project_name || '',
        unitPrice: suggestedPrice,
        quantity: 1,
        totalPrice: suggestedPrice,
        costs: {
          materialCost: Number(costs.materialCost.toFixed(2)),
          printingCost: Number(costs.printingCost.toFixed(2)),
          postProcessingCost: Number(costs.postProcessingCost.toFixed(2)),
          extraCosts: Number(costs.extraCosts.toFixed(2))
        }
      };
      
      setFormData(prev => ({ ...prev, items: updatedItems }));
    } catch (err) {
      console.error('Failed to update print job:', err);
      toast({
        title: 'Error',
        description: 'Failed to load print job costs',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleQuantityChange = async (value: string, index: number) => {
    try {
      const numValue = Number(value);
      if (isNaN(numValue)) return;

      const db = await initializeDatabase();
      const printJobOps = new PrintJobOperations(db);
      
      // Hent print job og tilgængelig quantity
      const printJob = await printJobOps.getPrintJobById(formData.items[index].printJobId);
      const availableQuantity = await printJobOps.getAvailableQuantity(printJob.project_id);

      if (numValue > availableQuantity) {
        toast({
          title: 'Warning',
          description: `Only ${availableQuantity} units available in stock`,
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
        return;
      }
      
      const updatedItems = [...formData.items];
      updatedItems[index] = {
        ...updatedItems[index],
        quantity: numValue,
        totalPrice: numValue * updatedItems[index].unitPrice
      };
      setFormData(prev => ({ ...prev, items: updatedItems }));
    } catch (err) {
      console.error('Failed to update quantity:', err);
      toast({
        title: 'Error',
        description: 'Failed to validate stock quantity',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleUnitPriceChange = (value: string, index: number) => {
    const numValue = Number(value);
    if (isNaN(numValue)) return;
    
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      unitPrice: numValue,
      totalPrice: numValue * updatedItems[index].quantity
    };
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const addNewItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        printJobId: 0,
        projectName: '',
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
        costs: {
          materialCost: 0,
          printingCost: 0,
          postProcessingCost: 0,
          extraCosts: 0
        }
      }]
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const calculateTotals = useCallback(() => {
    const itemsTotal = formData.items.reduce((sum, item) => 
      sum + (item.quantity * item.unitPrice), 0
    );
    const total = itemsTotal + shippingCost;
    return {
      subtotal: itemsTotal,
      total: total
    };
  }, [formData.items, shippingCost]);

  const handleSubmit = async () => {
    try {
      const db = await initializeDatabase();
      const salesOps = new SalesOperations(db);
      const printJobOps = new PrintJobOperations(db);
      const totals = calculateTotals();
      
      const settingsOps = new SettingsOperations(db);
      const settings = await settingsOps.getSettings();
      const invoiceNumber = await salesOps.getNextInvoiceNumber();
      const now = new Date();
      const dueDate = new Date();
      dueDate.setDate(now.getDate() + 30);

      // Opret et salg for hvert item
      for (const item of formData.items) {
        await printJobOps.updatePrintJob(item.printJobId, {
          quantity: (await printJobOps.getPrintJobById(item.printJobId)).quantity - item.quantity
        });

        await salesOps.addSale({
          project_id: item.printJobId,
          customer_id: formData.customerId ? parseInt(formData.customerId) : null,
          print_job_id: item.printJobId,
          invoice_number: invoiceNumber,
          sale_date: now.toISOString(),
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_price: item.totalPrice,
          payment_status: formData.paymentStatus,
          payment_due_date: dueDate.toISOString(),
          notes: formData.notes,
          project_name: item.projectName,
          customer_name: customers.find(c => c.id.toString() === formData.customerId)?.name || null,
          material_cost: item.costs.materialCost,
          printing_cost: item.costs.printingCost,
          processing_cost: item.costs.postProcessingCost,
          extra_costs: item.costs.extraCosts,
          currency: settings.currency,
          shipping_cost: shippingCost
        });
      }

      toast({
        title: 'Success',
        description: 'Sale created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onSaleComplete();
      onClose();
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>New Sale</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            {/* Customer Selection */}
            <CustomerSelect 
              value={formData.customerId}
              onChange={(value) => setFormData(prev => ({ ...prev, customerId: value }))}
              customers={customers}
            />
            
            {/* Print Items List */}
            {formData.items.map((item, index) => (
              <Box key={index} p={4} borderWidth={1} borderRadius="md" w="100%" bg="whiteAlpha.50">
                <VStack spacing={4} align="stretch">
                  <Grid templateColumns="repeat(4, 1fr)" gap={4}>
                    <PrintJobSelect
                      value={item.printJobId}
                      onChange={(value) => handlePrintJobChange(value, index)}
                      printJobs={printJobs}
                    />
                    <FormControl>
                      <FormLabel>Quantity</FormLabel>
                      <NumberInput
                        value={item.quantity}
                        min={1}
                        onChange={(valueString) => handleQuantityChange(valueString, index)}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>
                    <FormControl>
                      <FormLabel>Unit Price</FormLabel>
                      <NumberInput
                        value={item.unitPrice}
                        min={0}
                        precision={2}
                        onChange={(valueString) => handleUnitPriceChange(valueString, index)}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>
                    <IconButton
                      aria-label="Remove item"
                      icon={<MinusIcon />}
                      onClick={() => removeItem(index)}
                      alignSelf="flex-end"
                    />
                  </Grid>

                  {/* Cost Breakdown */}
                  <Box p={4} bg="whiteAlpha.100" borderRadius="md">
                    <Text fontWeight="bold" mb={2}>Cost Breakdown</Text>
                    <Grid templateColumns="1fr auto" gap={2}>
                      <Text color="gray.400">Material Cost:</Text>
                      <Text>{currency} {item.costs.materialCost.toFixed(2)}</Text>
                      <Text color="gray.400">Printing Cost:</Text>
                      <Text>{currency} {item.costs.printingCost.toFixed(2)}</Text>
                      <Text color="gray.400">Post-Processing Cost:</Text>
                      <Text>{currency} {item.costs.postProcessingCost.toFixed(2)}</Text>
                      <Text color="gray.400">Extra Costs:</Text>
                      <Text>{currency} {item.costs.extraCosts.toFixed(2)}</Text>
                      <Divider my={2} />
                      <Text fontWeight="bold" color="gray.400">Total Cost per Unit:</Text>
                      <Text fontWeight="bold">
                        {currency} {(
                          item.costs.materialCost +
                          item.costs.printingCost +
                          item.costs.postProcessingCost +
                          item.costs.extraCosts
                        ).toFixed(2)}
                      </Text>
                    </Grid>
                  </Box>
                </VStack>
              </Box>
            ))}
            
            {/* Add Item Button */}
            <Button 
              leftIcon={<PlusIcon />}
              onClick={addNewItem}
              w="100%"
              variant="outline"
              _hover={{ bg: "whiteAlpha.200" }}
            >
              Add Print Item
            </Button>

            {/* Rest of the form */}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Box mt={4} px={6}>
            <FormControl>
              <FormLabel>Shipping Cost</FormLabel>
              <NumberInput
                value={shippingCost}
                onChange={(value) => setShippingCost(Number(value))}
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
          </Box>

          <Box mt={4} px={6}>
            <Flex justify="space-between" mb={2}>
              <Text>Subtotal:</Text>
              <Text>{currency} {calculateTotals().subtotal.toFixed(2)}</Text>
            </Flex>
            <Flex justify="space-between" mb={2}>
              <Text>Shipping:</Text>
              <Text>{currency} {shippingCost.toFixed(2)}</Text>
            </Flex>
            <Flex justify="space-between" fontWeight="bold">
              <Text>Total:</Text>
              <Text>{currency} {calculateTotals().total.toFixed(2)}</Text>
            </Flex>
          </Box>

          <Button colorScheme="blue" onClick={handleSubmit}>
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

const DeleteSaleModal: React.FC<DeleteSaleModalProps> = ({ isOpen, onClose, sale, onConfirm }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Delete Sale</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Text>
              Are you sure you want to delete sale "{sale.invoice_number}"? 
              This action cannot be undone.
            </Text>
            <Text color="orange.500" fontWeight="medium">
              Note: If you need the items back in stock, you must manually add them 
              to your print inventory after deleting the sale.
            </Text>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button 
            colorScheme="red" 
            onClick={onConfirm}
          >
            Delete
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const PrintInvoiceModal: React.FC<PrintInvoiceModalProps> = ({ isOpen, onClose, invoiceData }) => {
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoiceData.invoiceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .invoice-header { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .company-info { text-align: right; }
            .customer-info { margin-bottom: 40px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            .totals { text-align: right; }
            .totals div { margin: 5px 0; }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-header">
            <div>
              <h1>INVOICE</h1>
              <div>Invoice #: ${invoiceData.invoiceNumber}</div>
              <div>Date: ${invoiceData.date}</div>
              <div>Due Date: ${invoiceData.dueDate}</div>
            </div>
            <div class="company-info">
              <h3>${invoiceData.companyInfo.name}</h3>
              <div>${invoiceData.companyInfo.address}</div>
              <div>Phone: ${invoiceData.companyInfo.phone}</div>
              <div>Email: ${invoiceData.companyInfo.email}</div>
              <div>VAT: ${invoiceData.companyInfo.vatId}</div>
            </div>
          </div>

          <div class="customer-info">
            <h3>Bill To:</h3>
            ${invoiceData.customerInfo ? `
              <div>${invoiceData.customerInfo.name}</div>
              <div>${invoiceData.customerInfo.address}</div>
              <div>Phone: ${invoiceData.customerInfo.phone}</div>
              <div>Email: ${invoiceData.customerInfo.email}</div>
              <div>VAT: ${invoiceData.customerInfo.vatId}</div>
            ` : 'N/A'}
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoiceData.items.map(item => `
                <tr>
                  <td>${item.description}</td>
                  <td>${item.quantity}</td>
                  <td>${invoiceData.currency} ${item.unitPrice.toFixed(2)}</td>
                  <td>${invoiceData.currency} ${item.total.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <div>Subtotal: ${invoiceData.currency} ${invoiceData.subtotal.toFixed(2)}</div>
            <div>Shipping: ${invoiceData.currency} ${invoiceData.shipping.toFixed(2)}</div>
            <div><strong>Total: ${invoiceData.currency} ${invoiceData.total.toFixed(2)}</strong></div>
          </div>

          <div style="margin-top: 40px;">
            <h4>Payment Details:</h4>
            <div>${invoiceData.companyInfo.bankDetails}</div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Print Invoice</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text mb={4}>Review the invoice before printing:</Text>
          <Box p={4} borderWidth={1} borderRadius="md">
            <Text>Invoice #: {invoiceData.invoiceNumber}</Text>
            <Text>Date: {invoiceData.date}</Text>
            <Text>Customer: {invoiceData.customerInfo?.name || 'N/A'}</Text>
            <Text>Total: {invoiceData.currency} {invoiceData.total.toFixed(2)}</Text>
          </Box>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="blue" onClick={handlePrint}>
            Print Invoice
          </Button>
        </ModalFooter>
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
  const [deleteSale, setDeleteSale] = useState<Sale | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null);

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

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const searchLower = searchQuery.toLowerCase();
      return (
        sale.project_name?.toLowerCase().includes(searchLower) ||
        sale.customer_name?.toLowerCase().includes(searchLower) ||
        sale.invoice_number?.toLowerCase().includes(searchLower)
      );
    });
  }, [sales, searchQuery]);

  const groupedSales = useMemo(() => {
    const groups = new Map<string, GroupedSale>();
    
    filteredSales.forEach(sale => {
      const existing = groups.get(sale.invoice_number);
      if (existing) {
        // Tilføj til eksisterende gruppe
        existing.items.push({
          project_name: sale.project_name,
          quantity: sale.quantity,
          total_price: sale.total_price
        });
        existing.items_total += sale.total_price;
      } else {
        // Opret ny gruppe
        groups.set(sale.invoice_number, {
          id: sale.id!,
          invoice_number: sale.invoice_number,
          sale_date: sale.sale_date,
          customer_name: sale.customer_name,
          items: [{
            project_name: sale.project_name,
            quantity: sale.quantity,
            total_price: sale.total_price
          }],
          items_total: sale.total_price,
          shipping_cost: sale.shipping_cost || 0,
          total_price: 0,
          payment_status: sale.payment_status
        });
      }
    });

    // Beregn total_price for hver gruppe
    for (const group of groups.values()) {
      group.total_price = group.items_total + group.shipping_cost;
    }

    return Array.from(groups.values());
  }, [filteredSales]);

  const handleUpdatePaymentStatus = async (id: number, status: 'pending' | 'paid' | 'cancelled') => {
    try {
      const db = await initializeDatabase();
      const salesOps = new SalesOperations(db);
      
      // Hent invoice_number for det valgte salg
      const sale = await salesOps.getSaleById(id);
      if (!sale) throw new Error('Sale not found');
      
      // Opdater status for alle salg med samme invoice_number
      await salesOps.updatePaymentStatusByInvoice(sale.invoice_number, status);
      
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

  const handleDelete = async () => {
    if (!deleteSale) return;

    try {
      const db = await initializeDatabase();
      const ops = new SalesOperations(db);
      
      // Slet salget
      await ops.deleteSale(deleteSale.id!);
      
      toast({
        title: 'Success',
        description: 'Sale deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      setDeleteSale(null);
      loadSales();
    } catch (err) {
      console.error('Failed to delete sale:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete sale',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const getInvoiceData = async (sale: GroupedSale): Promise<InvoiceData> => {
    const db = await initializeDatabase();
    const settingsOps = new SettingsOperations(db);
    const customerOps = new CustomerOperations(db);
    
    const settings = await settingsOps.getSettings();
    let customerInfo = null;
    
    if (sale.customer_name) {
      const customer = await customerOps.getCustomerByName(sale.customer_name);
      if (customer) {
        customerInfo = {
          name: customer.name,
          address: customer.address,
          email: customer.email,
          phone: customer.phone,
          vatId: customer.vat_id
        };
      }
    }

    return {
      invoiceNumber: sale.invoice_number,
      date: new Date(sale.sale_date).toLocaleDateString(),
      dueDate: new Date(new Date(sale.sale_date).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      customerInfo,
      companyInfo: {
        name: settings.company_name,
        address: settings.company_address,
        email: settings.company_email,
        phone: settings.company_phone,
        vatId: settings.vat_id,
        bankDetails: settings.bank_details
      },
      items: sale.items.map(item => ({
        description: item.project_name,
        quantity: item.quantity,
        unitPrice: item.total_price / item.quantity,
        total: item.total_price
      })),
      shipping: sale.shipping_cost,
      subtotal: sale.items_total,
      total: sale.total_price,
      currency: settings.currency
    };
  };

  return (
    <Box p={4}>
      <Box variant="stats-card">
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

        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Invoice #</Th>
              <Th>Date</Th>
              <Th>Customer</Th>
              <Th>Projects</Th>
              <Th isNumeric>Shipping</Th>
              <Th isNumeric>Total</Th>
              <Th>Status</Th>
            </Tr>
          </Thead>
          <Tbody>
            {groupedSales.map((sale) => (
              <Tr key={sale.invoice_number}>
                <Td>{sale.invoice_number}</Td>
                <Td>{new Date(sale.sale_date).toLocaleDateString()}</Td>
                <Td>{sale.customer_name || 'N/A'}</Td>
                <Td>
                  {sale.items.map(item => 
                    `${item.project_name} (${item.quantity}x)`
                  ).join(', ')}
                </Td>
                <Td isNumeric>{currency} {sale.shipping_cost.toFixed(2)}</Td>
                <Td isNumeric>{currency} {sale.total_price.toFixed(2)}</Td>
                <Td>
                  <Flex gap={2}>
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<Icon as={CreditCardIcon} />}
                      colorScheme={
                        sale.payment_status === 'paid' ? 'green' :
                        sale.payment_status === 'pending' ? 'yellow' :
                        'red'
                      }
                      onClick={() => setSelectedSale(sale as any)}
                    >
                      {sale.payment_status.toUpperCase()}
                    </Button>
                    <IconButton
                      aria-label="Print invoice"
                      icon={<Icon as={PrinterIcon} />}
                      size="sm"
                      variant="ghost"
                      colorScheme="blue"
                      onClick={async () => {
                        const invoiceData = await getInvoiceData(sale);
                        setSelectedInvoice(invoiceData);
                      }}
                    />
                    <IconButton
                      aria-label="Delete sale"
                      icon={<Icon as={TrashIcon} />}
                      size="sm"
                      variant="ghost"
                      colorScheme="red"
                      onClick={() => setDeleteSale(sale as any)}
                    />
                  </Flex>
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
      {deleteSale && (
        <DeleteSaleModal
          isOpen={deleteSale !== null}
          onClose={() => setDeleteSale(null)}
          sale={deleteSale}
          onConfirm={handleDelete}
        />
      )}
      {selectedInvoice && (
        <PrintInvoiceModal
          isOpen={selectedInvoice !== null}
          onClose={() => setSelectedInvoice(null)}
          invoiceData={selectedInvoice}
        />
      )}
    </Box>
  );
};

export default Sales; 