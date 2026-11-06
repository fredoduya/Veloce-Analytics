export interface SaleRecord {
  id: string;
  orderNumber: string;
  product: string;
  price: number;
  date: string; // YYYY-MM-DD
  paymentMethod: 'Credit Card' | 'Debit Card' | 'eWallet' | 'Cash' | string;
}

export type ViewTab = 'overview' | 'charts' | 'products' | 'temporal' | 'builder' | 'table';

export interface FilterState {
  searchQuery: string;
  dateRange: 'all' | 'aug2025' | 'sep2025' | 'oct2025' | 'custom';
  startDate: string;
  endDate: string;
  products: string[];
  paymentMethods: string[];
  minPrice: number;
  maxPrice: number;
}

export interface KPIStats {
  totalRevenue: number;
  totalUnits: number;
  totalOrders: number;
  avgOrderValue: number;
  avgItemPrice: number;
  topProduct: { name: string; revenue: number; units: number };
  topPaymentMethod: { name: string; revenue: number; share: number };
  multiItemOrdersCount: number;
}
