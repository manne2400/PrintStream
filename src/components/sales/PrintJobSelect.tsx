import React from 'react';
import { FormControl, FormLabel, Select } from '@chakra-ui/react';

interface PrintJobSelectProps {
  value: number;
  onChange: (value: number) => void;
  printJobs: Array<{ id: number; project_name: string }>;
}

export const PrintJobSelect: React.FC<PrintJobSelectProps> = ({ value, onChange, printJobs }) => {
  // Filtrer kun completed print jobs
  const completedJobs = printJobs.filter(job => job.status === 'completed');

  return (
    <FormControl>
      <FormLabel>Print Job</FormLabel>
      <Select 
        value={value} 
        onChange={(e) => onChange(Number(e.target.value))}
        placeholder="Select print job"
      >
        {completedJobs.map(job => (
          <option key={job.id} value={job.id}>
            {job.project_name}
          </option>
        ))}
      </Select>
    </FormControl>
  );
}; 