import React from 'react';
import { FormControl, FormLabel, Select } from '@chakra-ui/react';

interface CustomerSelectProps {
  value: string;
  onChange: (value: string) => void;
  customers: Array<{ id: number; name: string }>;
}

export const CustomerSelect: React.FC<CustomerSelectProps> = ({ value, onChange, customers }) => {
  return (
    <FormControl>
      <FormLabel>Customer</FormLabel>
      <Select 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        placeholder="Select customer"
      >
        {customers.map(customer => (
          <option key={customer.id} value={customer.id}>
            {customer.name}
          </option>
        ))}
      </Select>
    </FormControl>
  );
}; 