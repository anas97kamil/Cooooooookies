export type UnitType = 'piece' | 'kg';
export type SaleType = 'retail' | 'wholesale';
export type PaymentStatus = 'paid' | 'credit';

export interface Customer {
  id: string;
  name: string;
  phone?: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  notes?: string;
}

export interface SaleItem {
  id: string;
  orderId: string;
  customerNumber: number;
  customerName?: string; 
  customerId?: string; 
  saleType: SaleType; 
  name: string;
  price: number;
  costPrice: number; // Added for profit calculation
  quantity: number;
  unitType: UnitType;
  time: string;
}

export interface PurchaseItem {
  id: string;
  name: string;
  quantity: number;
  cost: number;
  total: number;
}

export interface PurchaseInvoice {
  id: string;
  supplierName: string;
  date: string;
  timestamp: number;
  items: PurchaseItem[];
  totalAmount: number;
  paymentStatus: PaymentStatus; 
}

export interface Product {
  id: string;
  name: string;
  price: number;
  costPrice: number; // Added for profit calculation
  unitType: UnitType;
}

export interface SummaryData {
  totalItems: number;
  totalRevenue: number;
}

export interface ArchivedDay {
  id: string;
  date: string;
  timestamp: number;
  totalRevenue: number;
  totalExpenses: number; 
  totalItems: number;
  items: SaleItem[];
  purchaseInvoices: PurchaseInvoice[];
}