import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Navigation, MainTab } from './components/Navigation';
import { PosScreen } from './components/PosScreen';
import { CustomersScreen } from './components/CustomersScreen';
import { CustomerStatementModal } from './components/CustomerStatementModal';
import { ProductsScreen } from './components/ProductsScreen';
import { ReportsScreen } from './components/ReportsScreen';
import { ThermalReceiptModal } from './components/ThermalReceiptModal';
import { SplashScreen } from './components/SplashScreen';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { OfflineIndicator } from './components/OfflineIndicator';
import { InstallOnPhoneModal } from './components/InstallOnPhoneModal';
import {
  Currency,
  Customer,
  CustomerOperation,
  Invoice,
  Product,
  Transaction,
} from './types';
import {
  getCurrency,
  setCurrency as setStoredCurrency,
  getStoredCustomers,
  saveStoredCustomers,
  getStoredProducts,
  saveStoredProducts,
  getStoredInvoices,
  saveStoredInvoices,
  getStoredOperations,
  saveStoredOperations,
  getStoredTransactions,
  saveStoredTransactions,
  getNextInvoiceSeq,
  incrementInvoiceSeq,
} from './utils/storage';

export const App: React.FC = () => {
  // Global State
  const [currency, setCurrencyState] = useState<Currency>(() => getCurrency());
  const [activeTab, setActiveTab] = useState<MainTab>('invoices');

  const [customers, setCustomers] = useState<Customer[]>(() => getStoredCustomers());
  const [products, setProducts] = useState<Product[]>(() => getStoredProducts());
  const [invoices, setInvoices] = useState<Invoice[]>(() => getStoredInvoices());
  const [operations, setOperations] = useState<CustomerOperation[]>(() => getStoredOperations());
  const [transactions, setTransactions] = useState<Transaction[]>(() => getStoredTransactions());
  const [currentInvoiceSeq, setCurrentInvoiceSeq] = useState<number>(() => getNextInvoiceSeq());

  // Modal states
  const [activeReceiptInvoice, setActiveReceiptInvoice] = useState<Invoice | null>(null);
  const [activeStatementCustomer, setActiveStatementCustomer] = useState<Customer | null>(null);
  const [showSplash, setShowSplash] = useState<boolean>(() => !sessionStorage.getItem('splash_seen'));
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);

  // Sync to local storage
  const reloadAllData = () => {
    setCurrencyState(getCurrency());
    setCustomers(getStoredCustomers());
    setProducts(getStoredProducts());
    setInvoices(getStoredInvoices());
    setOperations(getStoredOperations());
    setTransactions(getStoredTransactions());
    setCurrentInvoiceSeq(getNextInvoiceSeq());
  };

  // Currency Toggle
  const handleToggleCurrency = () => {
    const next: Currency = currency === 'YER' ? 'SAR' : 'YER';
    setCurrencyState(next);
    setStoredCurrency(next);
  };

  // Auto Register Product from Invoice
  const handleAutoRegisterProduct = (name: string, price: number) => {
    setProducts((prev) => {
      const exists = prev.some((p) => p.name.trim().toLowerCase() === name.trim().toLowerCase());
      if (exists) return prev;
      const updated = [
        ...prev,
        {
          id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name: name.trim(),
          price: price,
          category: 'مواد غذائية',
        },
      ];
      saveStoredProducts(updated);
      return updated;
    });
  };

  // Save Invoice (from PosScreen)
  const handleSaveInvoice = (invoice: Invoice, isNewCustomer: boolean) => {
    // 1. Update or create Customer if credit is involved or if new customer
    let updatedCustomerList = [...customers];
    let customerObj: Customer | undefined;

    if (invoice.customerName && invoice.customerName !== 'عميل نقدي') {
      const existingIdx = updatedCustomerList.findIndex(
        (c) => c.name.trim().toLowerCase() === invoice.customerName.trim().toLowerCase()
      );

      if (existingIdx !== -1) {
        customerObj = {
          ...updatedCustomerList[existingIdx],
          debt: updatedCustomerList[existingIdx].debt + invoice.remainingDebt,
          updatedAt: Date.now(),
        };
        updatedCustomerList[existingIdx] = customerObj;
      } else if (isNewCustomer || invoice.remainingDebt > 0) {
        customerObj = {
          id: `c-${Date.now()}`,
          name: invoice.customerName,
          phone: '',
          debt: invoice.remainingDebt,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        updatedCustomerList.push(customerObj);
      }

      setCustomers(updatedCustomerList);
      saveStoredCustomers(updatedCustomerList);
    }

    // 2. Save Invoice
    const existingInvIdx = invoices.findIndex((i) => i.id === invoice.id);
    let updatedInvoices = [...invoices];
    if (existingInvIdx !== -1) {
      updatedInvoices[existingInvIdx] = invoice;
    } else {
      updatedInvoices = [invoice, ...updatedInvoices];
      // Increment invoice sequence
      const nextSeq = incrementInvoiceSeq();
      setCurrentInvoiceSeq(nextSeq);
    }
    setInvoices(updatedInvoices);
    saveStoredInvoices(updatedInvoices);

    // 3. Create Transaction Record
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      title: `فاتورة ${invoice.mode === 'FREE' ? 'حرة' : 'مبيعات'} #${invoice.invoiceNumber}`,
      customerName: invoice.customerName,
      customerId: customerObj?.id || invoice.customerId,
      type: 'SALE',
      amount: invoice.grandTotal,
      paid: invoice.paidAmount,
      debt: invoice.remainingDebt,
      date: invoice.date,
      notes: invoice.notes || invoice.freeDescription,
      invoiceId: invoice.id,
      currency: invoice.currency,
      createdAt: Date.now(),
    };
    const updatedTxs = [newTx, ...transactions];
    setTransactions(updatedTxs);
    saveStoredTransactions(updatedTxs);

    // 4. If Customer associated, record operations (Debit for items, Credit for cash paid)
    if (customerObj) {
      const newOps: CustomerOperation[] = [];

      // Debit operation for invoice total
      newOps.push({
        id: `op-${Date.now()}-1`,
        customerId: customerObj.id,
        customerName: customerObj.name,
        type: 'DEBIT',
        amount: invoice.grandTotal,
        details: `فاتورة مبيعات ${invoice.invoiceNumber} (${
          invoice.mode === 'FREE'
            ? invoice.freeDescription || 'فاتورة حرة'
            : invoice.items.map((i) => i.name).slice(0, 3).join('، ')
        })`,
        date: invoice.date,
        invoiceId: invoice.id,
        currency: invoice.currency,
        createdAt: Date.now(),
      });

      // Credit operation if customer paid cash
      if (invoice.paidAmount > 0) {
        newOps.push({
          id: `op-${Date.now()}-2`,
          customerId: customerObj.id,
          customerName: customerObj.name,
          type: 'CREDIT',
          amount: invoice.paidAmount,
          details: `واصل نقداً مع الفاتورة ${invoice.invoiceNumber}`,
          date: invoice.date,
          invoiceId: invoice.id,
          currency: invoice.currency,
          createdAt: Date.now() + 1,
        });
      }

      const updatedOps = [...newOps, ...operations];
      setOperations(updatedOps);
      saveStoredOperations(updatedOps);
    }
  };

  // Delete Invoice
  const handleDeleteInvoice = (id: string) => {
    const updated = invoices.filter((i) => i.id !== id);
    setInvoices(updated);
    saveStoredInvoices(updated);
  };

  // Save Customer (Add / Edit)
  const handleSaveCustomer = (customer: Customer) => {
    setCustomers((prev) => {
      const idx = prev.findIndex((c) => c.id === customer.id);
      let updated: Customer[];
      if (idx !== -1) {
        updated = [...prev];
        updated[idx] = customer;
      } else {
        updated = [...prev, customer];
      }
      saveStoredCustomers(updated);
      return updated;
    });
  };

  // Delete Customer
  const handleDeleteCustomer = (id: string) => {
    const updatedCust = customers.filter((c) => c.id !== id);
    setCustomers(updatedCust);
    saveStoredCustomers(updatedCust);

    // Also remove operations
    const updatedOps = operations.filter((o) => o.customerId !== id);
    setOperations(updatedOps);
    saveStoredOperations(updatedOps);
  };

  // Customer Debt Payment (سداد دين)
  const handleRecordPayment = (customerId: string, amount: number, notes: string) => {
    const custIdx = customers.findIndex((c) => c.id === customerId);
    if (custIdx === -1) return;

    const cust = customers[custIdx];
    const newDebt = Math.max(0, cust.debt - amount);

    const updatedCust = {
      ...cust,
      debt: newDebt,
      updatedAt: Date.now(),
    };

    const updatedCustomers = [...customers];
    updatedCustomers[custIdx] = updatedCust;
    setCustomers(updatedCustomers);
    saveStoredCustomers(updatedCustomers);

    const todayStr = `${new Date().getFullYear()}/${new Date().getMonth() + 1}/${new Date().getDate()}`;

    // Add Credit Operation
    const newOp: CustomerOperation = {
      id: `op-${Date.now()}`,
      customerId: cust.id,
      customerName: cust.name,
      type: 'CREDIT',
      amount: amount,
      details: notes || 'سداد نقدي خفض رصيد الدين',
      date: todayStr,
      currency: currency,
      createdAt: Date.now(),
    };
    const updatedOps = [newOp, ...operations];
    setOperations(updatedOps);
    saveStoredOperations(updatedOps);

    // Add Transaction
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      title: 'سند قبض / سداد نقدي',
      customerName: cust.name,
      customerId: cust.id,
      type: 'PAYMENT',
      amount: amount,
      paid: amount,
      debt: 0,
      date: todayStr,
      notes: notes,
      currency: currency,
      createdAt: Date.now(),
    };
    const updatedTxs = [newTx, ...transactions];
    setTransactions(updatedTxs);
    saveStoredTransactions(updatedTxs);
  };

  // Add Operation from Statement Modal (له / عليه)
  const handleAddOperation = (opData: Omit<CustomerOperation, 'id' | 'createdAt'>) => {
    const custIdx = customers.findIndex((c) => c.id === opData.customerId);
    if (custIdx === -1) return;

    const cust = customers[custIdx];
    // DEBIT: increases debt (عليه)
    // CREDIT: decreases debt (له)
    const delta = opData.type === 'DEBIT' ? opData.amount : -opData.amount;
    const newDebt = Math.max(0, cust.debt + delta);

    const updatedCustomer: Customer = {
      ...cust,
      debt: newDebt,
      updatedAt: Date.now(),
    };

    const updatedCustList = [...customers];
    updatedCustList[custIdx] = updatedCustomer;
    setCustomers(updatedCustList);
    saveStoredCustomers(updatedCustList);

    const newOp: CustomerOperation = {
      ...opData,
      id: `op-${Date.now()}`,
      createdAt: Date.now(),
    };
    const updatedOps = [newOp, ...operations];
    setOperations(updatedOps);
    saveStoredOperations(updatedOps);

    // Also record transaction
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      title: opData.type === 'DEBIT' ? 'قيد مشتريات (عليه)' : 'سند سداد (له)',
      customerName: cust.name,
      customerId: cust.id,
      type: opData.type === 'DEBIT' ? 'SALE' : 'PAYMENT',
      amount: opData.amount,
      paid: opData.type === 'CREDIT' ? opData.amount : 0,
      debt: opData.type === 'DEBIT' ? opData.amount : 0,
      date: opData.date,
      notes: opData.details,
      currency: opData.currency,
      createdAt: Date.now(),
    };
    const updatedTxs = [newTx, ...transactions];
    setTransactions(updatedTxs);
    saveStoredTransactions(updatedTxs);

    // If active statement modal is open for this customer, update state
    if (activeStatementCustomer && activeStatementCustomer.id === cust.id) {
      setActiveStatementCustomer(updatedCustomer);
    }
  };

  // Delete Operation
  const handleDeleteOperation = (opId: string) => {
    const updated = operations.filter((o) => o.id !== opId);
    setOperations(updated);
    saveStoredOperations(updated);
  };

  // Products Handlers
  const handleSaveProduct = (prod: Product) => {
    setProducts((prev) => {
      const idx = prev.findIndex((p) => p.id === prod.id);
      let updated: Product[];
      if (idx !== -1) {
        updated = [...prev];
        updated[idx] = prod;
      } else {
        updated = [...prev, prod];
      }
      saveStoredProducts(updated);
      return updated;
    });
  };

  const handleDeleteProduct = (id: string) => {
    const updated = products.filter((p) => p.id !== id);
    setProducts(updated);
    saveStoredProducts(updated);
  };

  // Delete Transaction
  const handleDeleteTransaction = (id: string) => {
    const updated = transactions.filter((t) => t.id !== id);
    setTransactions(updated);
    saveStoredTransactions(updated);
  };

  // Header quick actions
  const handleQuickFreeInvoice = () => {
    setActiveTab('invoices');
  };

  const handleQuickNewInvoice = () => {
    setActiveTab('invoices');
  };

  const debtorsCount = customers.filter((c) => c.debt > 0).length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Mobile App Native Splash Screen */}
      {showSplash && (
        <SplashScreen
          onFinish={() => {
            sessionStorage.setItem('splash_seen', 'true');
            setShowSplash(false);
          }}
        />
      )}

      {/* Global Header */}
      <Header
        currency={currency}
        onToggleCurrency={handleToggleCurrency}
        onQuickFreeInvoice={handleQuickFreeInvoice}
        onQuickNewInvoice={handleQuickNewInvoice}
        onOpenInstallModal={() => setShowInstallModal(true)}
      />

      {/* Connectivity Status Toast */}
      <OfflineIndicator />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-4 py-2 sm:py-4">
        {/* Prominent App Install Banner */}
        <PWAInstallBanner onOpenInstallModal={() => setShowInstallModal(true)} />

        {activeTab === 'invoices' && (
          <PosScreen
            currency={currency}
            customers={customers}
            products={products}
            invoices={invoices}
            currentInvoiceSeq={currentInvoiceSeq}
            onSaveInvoice={handleSaveInvoice}
            onDeleteInvoice={handleDeleteInvoice}
            onOpenReceipt={(inv) => setActiveReceiptInvoice(inv)}
            onAutoRegisterProduct={handleAutoRegisterProduct}
          />
        )}

        {activeTab === 'customers' && (
          <CustomersScreen
            currency={currency}
            customers={customers}
            onSaveCustomer={handleSaveCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            onRecordPayment={handleRecordPayment}
            onOpenStatement={(cust) => setActiveStatementCustomer(cust)}
          />
        )}

        {activeTab === 'products' && (
          <ProductsScreen
            currency={currency}
            products={products}
            onSaveProduct={handleSaveProduct}
            onDeleteProduct={handleDeleteProduct}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsScreen
            currency={currency}
            customers={customers}
            invoices={invoices}
            transactions={transactions}
            onDeleteTransaction={handleDeleteTransaction}
            onDataReload={reloadAllData}
          />
        )}
      </main>

      {/* Thermal Receipt Modal */}
      {activeReceiptInvoice && (
        <ThermalReceiptModal
          invoice={activeReceiptInvoice}
          customer={customers.find((c) => c.name === activeReceiptInvoice.customerName)}
          currency={currency}
          onClose={() => setActiveReceiptInvoice(null)}
        />
      )}

      {/* Customer Account Statement Modal */}
      {activeStatementCustomer && (
        <CustomerStatementModal
          currency={currency}
          customer={activeStatementCustomer}
          operations={operations.filter((o) => o.customerId === activeStatementCustomer.id)}
          onClose={() => setActiveStatementCustomer(null)}
          onAddOperation={handleAddOperation}
          onDeleteOperation={handleDeleteOperation}
        />
      )}

      {/* Install On Phone Modal (QR Code & Direct Instructions) */}
      <InstallOnPhoneModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />

      {/* Bottom Navigation */}
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        debtorsCount={debtorsCount}
      />
    </div>
  );
};

export default App;

