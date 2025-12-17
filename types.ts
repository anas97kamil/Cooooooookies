export type UnitType = 'piece' | 'kg';

export interface SaleItem {
  id: string;
  orderId: string;
  customerNumber: number;
  customerName?: string; // Added optional customer name
  name: string;
  price: number;
  quantity: number;
  unitType: UnitType;
  time: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
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
  totalItems: number;
  items: SaleItem[];
}