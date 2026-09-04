export type Currency = 'YER' | 'SAR';

export type PaymentMethod = 'CASH' | 'CREDIT' | 'PARTIAL';

export type InvoiceMode = 'DETAILED' | 'FREE';

export interface InvoiceItem {
  id: string;
  name: string;
  qty: number;
  price: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. "INV-1001"
  date: string; // e.g. "2026/09/03"
  time: string; // e.g. "10:30 ص"
  customerName: string;
  customerId?: string;
  mode: InvoiceMode;
  freeDescription?: string;
  items: InvoiceItem[];
  grandTotal: number;
  paidAmount: number;
  remainingDebt: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  currency: Currency;
  createdAt: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  debt: number;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export type OperationType = 'DEBIT' | 'CREDIT' | 'SALE' | 'PAYMENT';

export interface CustomerOperation {
  id: string;
  customerId: string;
  customerName: string;
  type: 'DEBIT' | 'CREDIT'; // DEBIT = عليه (دين), CREDIT = له (سداد)
  amount: number;
  details: string;
  date: string;
  invoiceId?: string;
  currency: Currency;
  createdAt: number;
}

export interface Transaction {
  id: string;
  title: string;
  customerName: string;
  customerId?: string;
  type: 'SALE' | 'PAYMENT' | 'ADJUSTMENT';
  amount: number;
  paid: number;
  debt: number;
  date: string;
  notes?: string;
  invoiceId?: string;
  currency: Currency;
  createdAt: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  costPrice?: number;
  stock?: number;
  category?: string;
}
