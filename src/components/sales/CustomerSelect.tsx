import React, { useState, useEffect } from 'react';
import {
  Select,
  Input,
  Box,
  VStack,
  Text,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Icon } from '@chakra-ui/react';

interface CustomerSelectProps {
  value: string;
  onChange: (value: string) => void;
  customers: Array<{ id: number; name: string }>;
}

export const CustomerSelect: React.FC<CustomerSelectProps> = ({
  value,
  onChange,
  customers
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <VStack spacing={2} align="stretch">
      <InputGroup size="md" mb={2}>
        <InputLeftElement pointerEvents="none">
          <Icon as={MagnifyingGlassIcon} color="gray.400" />
        </InputLeftElement>
        <Input
          placeholder="Search customers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          bg="whiteAlpha.100"
        />
      </InputGroup>
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Select customer"
        bg="whiteAlpha.100"
      >
        {filteredCustomers.map(customer => (
          <option key={customer.id} value={customer.id.toString()}>
            {customer.name}
          </option>
        ))}
      </Select>
    </VStack>
  );
}; 