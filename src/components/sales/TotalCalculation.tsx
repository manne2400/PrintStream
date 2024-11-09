import React from 'react';
import { Box, Text, VStack, Divider } from '@chakra-ui/react';
import { useCurrency } from '../../context/CurrencyContext';
import { SaleItem } from '../../types/sales';

interface TotalCalculationProps {
  items: SaleItem[];
}

export const TotalCalculation: React.FC<TotalCalculationProps> = ({ items }) => {
  const { currency } = useCurrency();
  
  const totals = items.reduce((acc, item) => ({
    subtotal: acc.subtotal + item.totalPrice,
    totalCost: acc.totalCost + (
      (item.costs.materialCost + 
       item.costs.printingCost + 
       item.costs.postProcessingCost + 
       item.costs.extraCosts) * item.quantity
    )
  }), { subtotal: 0, totalCost: 0 });

  const profit = totals.subtotal - totals.totalCost;
  const margin = totals.subtotal ? (profit / totals.subtotal) * 100 : 0;

  return (
    <Box w="100%" mb={4}>
      <VStack align="stretch" spacing={2}>
        <Text>Subtotal: {currency} {totals.subtotal.toFixed(2)}</Text>
        <Text>Total Cost: {currency} {totals.totalCost.toFixed(2)}</Text>
        <Divider />
        <Text fontWeight="bold">
          Profit: {currency} {profit.toFixed(2)} ({margin.toFixed(1)}%)
        </Text>
      </VStack>
    </Box>
  );
}; 