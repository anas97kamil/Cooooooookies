
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

export interface Employee {
  id: string;
  name: string;
  position?: string;
}

export interface SalaryPayment {
  id: string;
  employeeId: string;
  employeeName: string;
  amount: number;
  date: string;
  month: string;
  notes?: string;
}

export interface GeneralExpense {
  id: string;
  category: string;
  amount: number;
  date: string;
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
  costPrice: number; 
  quantity: number;
  unitType: UnitType;
  time: string;
  date: string; 
  barcode?: string;
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
  wholesalePrice: number; 
  costPrice: number; 
  unitType: UnitType;
  barcode?: string;
}

export interface StockItem {
  id: string;
  name: string;
  currentQuantity: number;
  unitType: UnitType;
  minThreshold: number; 
  lastUpdated: string;
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
  salaryPayments?: SalaryPayment[];
  generalExpenses?: GeneralExpense[];
}
