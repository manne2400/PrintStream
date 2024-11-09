export interface SaleItem {
  printJobId: number;
  projectName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  costs: {
    materialCost: number;
    printingCost: number;
    postProcessingCost: number;
    extraCosts: number;
  };
}

export interface Sale {
  id?: number;
  project_id: number;
  customer_id: number | null;
  print_job_id: number;
  invoice_number: string;
  sale_date: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  payment_status: 'pending' | 'paid' | 'cancelled';
  payment_due_date: string;
  notes: string;
  project_name: string;
  customer_name: string | null;
  material_cost: number;
  printing_cost: number;
  processing_cost: number;
  extra_costs: number;
  currency: string;
  created_at?: string;
} 