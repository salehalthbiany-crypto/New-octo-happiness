import * as XLSX from 'xlsx';
import { Customer, CustomerOperation, Invoice, Product, Transaction, Currency } from '../types';
import {
  DEFAULT_CUSTOMERS,
  DEFAULT_INVOICES,
  DEFAULT_OPERATIONS,
  DEFAULT_PRODUCTS,
  DEFAULT_TRANSACTIONS,
} from '../data/defaultData';

const STORAGE_KEYS = {
  CUSTOMERS: 'alazzi_pos_customers_v2',
  INVOICES: 'alazzi_pos_invoices_v2',
  OPERATIONS: 'alazzi_pos_operations_v2',
  TRANSACTIONS: 'alazzi_pos_transactions_v2',
  PRODUCTS: 'alazzi_pos_products_v2',
  CURRENCY: 'alazzi_pos_currency_v2',
  INV_SEQ: 'alazzi_pos_inv_seq_v2',
};

export const getCurrency = (): Currency => {
  try {
    const val = localStorage.getItem(STORAGE_KEYS.CURRENCY);
    return val === 'SAR' ? 'SAR' : 'YER';
  } catch {
    return 'YER';
  }
};

export const setCurrency = (c: Currency): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENCY, c);
  } catch (e) {
    console.error('Error saving currency preference', e);
  }
};

export const getCurrencySymbol = (c?: Currency): string => {
  const current = c || getCurrency();
  return current === 'YER' ? 'ر.ي' : 'ر.س';
};

export const getCurrencyLabel = (c?: Currency): string => {
  const current = c || getCurrency();
  return current === 'YER' ? 'ريال يمني' : 'ريال سعودي';
};

export const getStoredProducts = (): Product[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return DEFAULT_PRODUCTS;
};

export const saveStoredProducts = (products: Product[]): void => {
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
};

export const getStoredCustomers = (): Customer[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return DEFAULT_CUSTOMERS;
};

export const saveStoredCustomers = (customers: Customer[]): void => {
  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
};

export const getStoredInvoices = (): Invoice[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.INVOICES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return DEFAULT_INVOICES;
};

export const saveStoredInvoices = (invoices: Invoice[]): void => {
  localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
};

export const getStoredOperations = (): CustomerOperation[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.OPERATIONS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return DEFAULT_OPERATIONS;
};

export const saveStoredOperations = (ops: CustomerOperation[]): void => {
  localStorage.setItem(STORAGE_KEYS.OPERATIONS, JSON.stringify(ops));
};

export const getStoredTransactions = (): Transaction[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return DEFAULT_TRANSACTIONS;
};

export const saveStoredTransactions = (txs: Transaction[]): void => {
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txs));
};

export const getNextInvoiceSeq = (): number => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.INV_SEQ);
    if (raw) return parseInt(raw, 10);
  } catch (e) {
    console.error(e);
  }
  return 1004;
};

export const incrementInvoiceSeq = (): number => {
  const next = getNextInvoiceSeq() + 1;
  localStorage.setItem(STORAGE_KEYS.INV_SEQ, next.toString());
  return next;
};

// Excel Exporters using xlsx
export const exportInvoicesToExcel = (invoices: Invoice[], currency: Currency): void => {
  const data = invoices.map(inv => ({
    'رقم الفاتورة': inv.invoiceNumber,
    'التاريخ': inv.date,
    'الوقت': inv.time,
    'اسم العميل': inv.customerName,
    'النوع': inv.mode === 'FREE' ? 'فاتورة حرة' : 'تفصيلية',
    'إجمالي الفاتورة': inv.grandTotal,
    'المدفوع (كاش)': inv.paidAmount,
    'المتبقي (دين)': inv.remainingDebt,
    'طريقة الدفع': inv.paymentMethod === 'CASH' ? 'نقداً' : inv.paymentMethod === 'CREDIT' ? 'آجل' : 'جزئي',
    'العملة': getCurrencySymbol(inv.currency || currency),
    'ملاحظات': inv.notes || (inv.mode === 'FREE' ? inv.freeDescription : ''),
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'الفواتير');
  XLSX.writeFile(wb, `بقالة_العزي_فواتير_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

export const exportCustomersToExcel = (customers: Customer[], currency: Currency): void => {
  const data = customers.map(c => ({
    'اسم العميل': c.name,
    'رقم الهاتف': c.phone || 'غير مسجل',
    'رصيد الدين': c.debt,
    'العملة': getCurrencySymbol(currency),
    'ملاحظات': c.notes || '',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'كشف_ديون_العملاء');
  XLSX.writeFile(wb, `بقالة_العزي_العملاء_والديون_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

export const exportStatementToExcel = (
  customer: Customer,
  operations: CustomerOperation[],
  currency: Currency
): void => {
  const data = operations.map(op => ({
    'التاريخ': op.date,
    'نوع العملية': op.type === 'DEBIT' ? 'عليه (دين)' : 'له (سداد)',
    'المبلغ': op.amount,
    'البيان والتفاصيل': op.details,
    'العملة': getCurrencySymbol(op.currency || currency),
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `كشف_${customer.name.slice(0, 15)}`);
  XLSX.writeFile(wb, `كشف_حساب_${customer.name}_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

// WhatsApp Sharing helper
export const generateInvoiceWhatsAppText = (inv: Invoice, customerDebt?: number): string => {
  const sym = getCurrencySymbol(inv.currency);
  let text = `🛒 *بقالة العزي للمواد الغذائية*\n`;
  text += `📍 هاتف: 770000000\n`;
  text += `──────────────────────\n`;
  text += `🧾 *فاتورة مبيعات:* ${inv.invoiceNumber}\n`;
  text += `📅 *التاريخ:* ${inv.date} ${inv.time || ''}\n`;
  text += `👤 *العميل:* ${inv.customerName}\n`;
  text += `💳 *طريقة الدفع:* ${inv.paymentMethod === 'CASH' ? 'نقداً (كاش)' : inv.paymentMethod === 'CREDIT' ? 'آجل (دين)' : 'دفعة جزئية'}\n`;
  text += `──────────────────────\n`;

  if (inv.mode === 'FREE') {
    text += `📦 *البيان:* ${inv.freeDescription || 'مشتريات مواد غذائية'}\n`;
    text += `💰 *المبلغ الإجمالي:* ${inv.grandTotal.toFixed(2)} ${sym}\n`;
  } else {
    text += `📋 *تفاصيل الأصناف:*\n`;
    inv.items.forEach((item, idx) => {
      text += `${idx + 1}) ${item.name} × ${item.qty} = ${(item.qty * item.price).toFixed(2)} ${sym}\n`;
    });
    text += `──────────────────────\n`;
    text += `💵 *إجمالي الفاتورة:* ${inv.grandTotal.toFixed(2)} ${sym}\n`;
  }

  text += `✅ *الواصل (المدفوع):* ${inv.paidAmount.toFixed(2)} ${sym}\n`;
  text += `⚠️ *المتبقي (دين):* ${inv.remainingDebt.toFixed(2)} ${sym}\n`;

  if (customerDebt !== undefined) {
    text += `📊 *إجمالي رصيد حسابك الحالي:* ${customerDebt.toFixed(2)} ${sym}\n`;
  }

  if (inv.notes) {
    text += `📝 *ملاحظة:* ${inv.notes}\n`;
  }

  text += `──────────────────────\n`;
  text += `شكراً لتعاملكم مع بقالة العزي! 🙏✨`;
  return text;
};

export const generateStatementWhatsAppText = (
  customer: Customer,
  operations: CustomerOperation[],
  currency: Currency
): string => {
  const sym = getCurrencySymbol(currency);
  let text = `🛒 *بقالة العزي للمواد الغذائية*\n`;
  text += `📑 *كشف حساب العميل:* ${customer.name}\n`;
  text += `📱 هاتف: ${customer.phone || 'غير مسجل'}\n`;
  text += `📅 التاريخ: ${new Date().toLocaleDateString('ar-YE')}\n`;
  text += `──────────────────────\n`;

  const totalDebit = operations.filter(o => o.type === 'DEBIT').reduce((s, o) => s + o.amount, 0);
  const totalCredit = operations.filter(o => o.type === 'CREDIT').reduce((s, o) => s + o.amount, 0);

  text += `📋 *سجل العمليات الأخير:*\n`;
  operations.slice(-8).forEach(op => {
    const symbol = op.type === 'DEBIT' ? '🔴 عليه (دين)' : '🟢 له (سداد)';
    text += `• ${op.date}: ${symbol} ${op.amount.toFixed(2)} ${sym} - ${op.details}\n`;
  });

  text += `──────────────────────\n`;
  text += `🔴 *إجمالي عليه (مشتريات):* ${totalDebit.toFixed(2)} ${sym}\n`;
  text += `🟢 *إجمالي له (سدادات):* ${totalCredit.toFixed(2)} ${sym}\n`;
  text += `⚖️ *الرصيد المتبقي الحالي (المطلوب):* ${customer.debt.toFixed(2)} ${sym}\n`;
  text += `──────────────────────\n`;
  text += `شاكرين حسن تعاملكم والتزامكم بالسداد 🙏`;
  return text;
};

// Full Backup and Restore
export const exportFullBackup = (): void => {
  const backup = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    currency: getCurrency(),
    customers: getStoredCustomers(),
    products: getStoredProducts(),
    invoices: getStoredInvoices(),
    operations: getStoredOperations(),
    transactions: getStoredTransactions(),
    invoiceSeq: getNextInvoiceSeq(),
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `بقالة_العزي_نسخة_احتياطية_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const importFullBackup = (jsonString: string): boolean => {
  try {
    const data = JSON.parse(jsonString);
    if (data.customers && Array.isArray(data.customers)) {
      saveStoredCustomers(data.customers);
    }
    if (data.products && Array.isArray(data.products)) {
      saveStoredProducts(data.products);
    }
    if (data.invoices && Array.isArray(data.invoices)) {
      saveStoredInvoices(data.invoices);
    }
    if (data.operations && Array.isArray(data.operations)) {
      saveStoredOperations(data.operations);
    }
    if (data.transactions && Array.isArray(data.transactions)) {
      saveStoredTransactions(data.transactions);
    }
    if (data.currency) {
      setCurrency(data.currency);
    }
    if (data.invoiceSeq) {
      localStorage.setItem(STORAGE_KEYS.INV_SEQ, data.invoiceSeq.toString());
    }
    return true;
  } catch (e) {
    console.error('Failed to import backup:', e);
    return false;
  }
};

export const resetAllToDefaults = (): void => {
  saveStoredCustomers(DEFAULT_CUSTOMERS);
  saveStoredProducts(DEFAULT_PRODUCTS);
  saveStoredInvoices(DEFAULT_INVOICES);
  saveStoredOperations(DEFAULT_OPERATIONS);
  saveStoredTransactions(DEFAULT_TRANSACTIONS);
  localStorage.setItem(STORAGE_KEYS.INV_SEQ, '1004');
  setCurrency('YER');
};
