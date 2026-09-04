import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Printer,
  Save,
  Image as ImageIcon,
  MessageCircle,
  FileDown,
  RotateCcw,
  Search,
  FileSpreadsheet,
  Zap,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
} from 'lucide-react';
import { Customer, Invoice, InvoiceItem, InvoiceMode, PaymentMethod, Product, Currency } from '../types';
import { getCurrencySymbol, exportInvoicesToExcel, generateInvoiceWhatsAppText } from '../utils/storage';

interface PosScreenProps {
  currency: Currency;
  customers: Customer[];
  products: Product[];
  invoices: Invoice[];
  currentInvoiceSeq: number;
  onSaveInvoice: (invoice: Invoice, isNewCustomer: boolean) => void;
  onDeleteInvoice: (id: string) => void;
  onOpenReceipt: (invoice: Invoice) => void;
  onAutoRegisterProduct: (name: string, price: number) => void;
}

export const PosScreen: React.FC<PosScreenProps> = ({
  currency,
  customers,
  products,
  invoices,
  currentInvoiceSeq,
  onSaveInvoice,
  onDeleteInvoice,
  onOpenReceipt,
  onAutoRegisterProduct,
}) => {
  const sym = getCurrencySymbol(currency);

  // Sub-tab: 'edit' or 'history'
  const [subTab, setSubTab] = useState<'edit' | 'history'>('edit');

  // Active invoice state
  const [invoiceNumber, setInvoiceNumber] = useState<string>(`INV-${currentInvoiceSeq}`);
  const [dateStr, setDateStr] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
  });
  const [invoiceMode, setInvoiceMode] = useState<InvoiceMode>('DETAILED');
  const [customerInput, setCustomerInput] = useState<string>('');
  const [generalNotes, setGeneralNotes] = useState<string>('');
  const [freeDescription, setFreeDescription] = useState<string>('');
  const [freeAmount, setFreeAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [paidAmount, setPaidAmount] = useState<number>(70);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);

  // Detailed items state
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', name: 'أرز الشعلان سيلا 5 كجم', qty: 1, price: 45.0 },
    { id: '2', name: 'سكر السعيد ناعم 5 كجم', qty: 1, price: 25.0 },
  ]);

  // History search & filter
  const [historySearch, setHistorySearch] = useState<string>('');
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'CASH' | 'CREDIT' | 'PARTIAL'>('ALL');

  // Customer match
  const matchedCustomer = customers.find(
    (c) => c.name.trim().toLowerCase() === customerInput.trim().toLowerCase()
  );

  // Calculations
  const grandTotal =
    invoiceMode === 'FREE'
      ? typeof freeAmount === 'number'
        ? freeAmount
        : 0
      : items.reduce((sum, item) => sum + item.qty * item.price, 0);

  const remainingDebt = Math.max(0, grandTotal - paidAmount);

  // Handle Mode Toggle
  const handleModeChange = (mode: InvoiceMode) => {
    setInvoiceMode(mode);
    if (mode === 'FREE') {
      if (typeof freeAmount !== 'number' || freeAmount === 0) {
        setFreeAmount(grandTotal > 0 ? grandTotal : '');
      }
    }
  };

  // Payment Method Change
  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setPaymentMethod(method);
    if (method === 'CASH') {
      setPaidAmount(grandTotal);
    } else if (method === 'CREDIT') {
      setPaidAmount(0);
    } else if (method === 'PARTIAL') {
      setPaidAmount(Math.round(grandTotal / 2));
    }
  };

  // When grandTotal changes and payment is CASH, update paidAmount
  const updateGrandTotalTrigger = (newTotal: number) => {
    if (paymentMethod === 'CASH') {
      setPaidAmount(newTotal);
    }
  };

  // Item modifications
  const handleAddItemRow = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      name: '',
      qty: 1,
      price: 0,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleRemoveItemRow = (index: number) => {
    setItems((prev) => {
      const updated = [...prev];
      updated.splice(index, 1);
      if (updated.length === 0) {
        return [{ id: Date.now().toString(), name: '', qty: 1, price: 0 }];
      }
      return updated;
    });
  };

  const handleUpdateItem = (
    index: number,
    field: 'name' | 'qty' | 'price',
    value: string | number
  ) => {
    setItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index] };

      if (field === 'name') {
        item.name = value as string;
        // Check if item exists in products catalog to auto-fill price
        const match = products.find((p) => p.name === value);
        if (match && item.price === 0) {
          item.price = match.price;
        }
      } else if (field === 'qty') {
        item.qty = Math.max(0.1, Number(value) || 0);
      } else if (field === 'price') {
        item.price = Math.max(0, Number(value) || 0);
      }

      updated[index] = item;
      return updated;
    });
  };

  const handleAddQuickProduct = (product: Product) => {
    if (invoiceMode === 'FREE') {
      setInvoiceMode('DETAILED');
    }
    setItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.name === product.name);
      if (existingIdx !== -1) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          qty: updated[existingIdx].qty + 1,
        };
        return updated;
      } else {
        // If last item is blank, fill it
        if (prev.length === 1 && prev[0].name.trim() === '' && prev[0].price === 0) {
          return [{ id: prev[0].id, name: product.name, qty: 1, price: product.price }];
        }
        return [
          ...prev,
          {
            id: Date.now().toString(),
            name: product.name,
            qty: 1,
            price: product.price,
          },
        ];
      }
    });
  };

  // Reset / New Invoice
  const handleReset = (confirmAlert = true) => {
    if (confirmAlert && !window.confirm('هل أنت متأكد من تفريغ الفاتورة وبدء فاتورة جديدة؟')) {
      return;
    }
    setEditingInvoiceId(null);
    setInvoiceNumber(`INV-${currentInvoiceSeq}`);
    const d = new Date();
    setDateStr(`${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`);
    setCustomerInput('');
    setGeneralNotes('');
    setFreeDescription('');
    setFreeAmount('');
    setItems([
      { id: '1', name: 'أرز الشعلان سيلا 5 كجم', qty: 1, price: 45.0 },
      { id: '2', name: 'سكر السعيد ناعم 5 كجم', qty: 1, price: 25.0 },
    ]);
    setPaymentMethod('CASH');
    setPaidAmount(70);
    setInvoiceMode('DETAILED');
  };

  // Save Invoice
  const handleSave = () => {
    if (grandTotal <= 0) {
      alert('يرجى إضافة أصناف أو تحديد مبلغ للفاتورة أولاً!');
      return;
    }

    if (remainingDebt > 0 && !customerInput.trim()) {
      alert('تنبيه: الفاتورة تحتوي على متبقي آجل (دين). يرجى كتابة أو اختيار اسم العميل لتسجيل الدين في حسابه!');
      return;
    }

    // Auto-register new products into catalog
    if (invoiceMode === 'DETAILED') {
      items.forEach((item) => {
        if (item.name.trim()) {
          onAutoRegisterProduct(item.name.trim(), item.price);
        }
      });
    }

    const timeStr = new Date().toLocaleTimeString('ar-YE', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const isNewCust = !matchedCustomer && !!customerInput.trim();

    const invoiceToSave: Invoice = {
      id: editingInvoiceId || `inv-${Date.now()}`,
      invoiceNumber: invoiceNumber,
      date: dateStr,
      time: timeStr,
      customerName: customerInput.trim() || 'عميل نقدي',
      customerId: matchedCustomer?.id,
      mode: invoiceMode,
      freeDescription: freeDescription.trim(),
      items: invoiceMode === 'DETAILED' ? items.filter((i) => i.name.trim() !== '') : [],
      grandTotal: grandTotal,
      paidAmount: paidAmount,
      remainingDebt: remainingDebt,
      paymentMethod: paymentMethod,
      notes: generalNotes.trim(),
      currency: currency,
      createdAt: Date.now(),
    };

    onSaveInvoice(invoiceToSave, isNewCust);
    onOpenReceipt(invoiceToSave);
  };

  // Edit an existing invoice from history
  const handleEditFromHistory = (inv: Invoice) => {
    setEditingInvoiceId(inv.id);
    setInvoiceNumber(inv.invoiceNumber);
    setDateStr(inv.date);
    setCustomerInput(inv.customerName === 'عميل نقدي' ? '' : inv.customerName);
    setGeneralNotes(inv.notes || '');
    setInvoiceMode(inv.mode);
    setFreeDescription(inv.freeDescription || '');
    setFreeAmount(inv.mode === 'FREE' ? inv.grandTotal : '');
    setItems(
      inv.items.length > 0
        ? inv.items
        : [{ id: Date.now().toString(), name: '', qty: 1, price: 0 }]
    );
    setPaymentMethod(inv.paymentMethod);
    setPaidAmount(inv.paidAmount);
    setSubTab('edit');
  };

  // Direct WhatsApp Share
  const handleDirectWhatsApp = () => {
    if (grandTotal <= 0) {
      alert('يرجى إدخال أصناف الفاتورة أولاً!');
      return;
    }
    const tempInv: Invoice = {
      id: 'temp',
      invoiceNumber: invoiceNumber,
      date: dateStr,
      time: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
      customerName: customerInput.trim() || 'عميل نقدي',
      mode: invoiceMode,
      freeDescription: freeDescription,
      items: items.filter((i) => i.name.trim() !== ''),
      grandTotal: grandTotal,
      paidAmount: paidAmount,
      remainingDebt: remainingDebt,
      paymentMethod: paymentMethod,
      notes: generalNotes,
      currency: currency,
      createdAt: Date.now(),
    };
    const text = generateInvoiceWhatsAppText(tempInv, matchedCustomer?.debt);
    const phone = matchedCustomer?.phone?.replace(/\D/g, '') || '';
    const url = phone
      ? `https://wa.me/${phone.startsWith('967') ? phone : '967' + phone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Filtered History
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(historySearch.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(historySearch.toLowerCase()) ||
      (inv.notes && inv.notes.toLowerCase().includes(historySearch.toLowerCase()));

    if (historyFilter === 'ALL') return matchesSearch;
    return matchesSearch && inv.paymentMethod === historyFilter;
  });

  return (
    <div className="space-y-3 pb-24">
      {/* Sub-tabs Header Bar (الفاتورة / السجل) */}
      <div className="flex items-center gap-1 bg-slate-200/90 p-1 rounded-2xl shadow-inner no-print">
        <button
          type="button"
          onClick={() => setSubTab('edit')}
          className={`flex-1 py-2 text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 active:scale-95 ${
            subTab === 'edit'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          <Edit3 className="w-4 h-4" />
          <span>الفاتورة</span>
          {editingInvoiceId && (
            <span className="text-[10px] bg-amber-400 text-amber-950 px-1.5 py-0.2 rounded-full font-bold">
              تعديل
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setSubTab('history')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 active:scale-95 ${
            subTab === 'history'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>سجل الفواتير</span>
          <span className="text-[10px] bg-emerald-800/80 text-emerald-100 px-2 py-0.5 rounded-full font-bold">
            {invoices.length}
          </span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* VIEW 1: ACTIVE INVOICE FORM                             */}
      {/* ======================================================== */}
      {subTab === 'edit' && (
        <div className="space-y-3">
          {/* Card 1: Invoice Header (Number, Date, Mode, Customer) */}
          <div className="bg-white rounded-2xl p-3.5 sm:p-4 shadow-xs border border-slate-200/80 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-black text-slate-800 text-sm">
                  فاتورة: <span className="text-emerald-700 font-mono">{invoiceNumber}</span>
                </span>
                {editingInvoiceId && (
                  <span className="text-[11px] bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2 py-0.5 rounded-md">
                    قيد التعديل ✏️
                  </span>
                )}
              </div>

              {/* Date Input */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl text-xs">
                <span className="text-slate-500 font-medium">📅 التاريخ:</span>
                <input
                  type="text"
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  className="bg-transparent font-bold text-slate-800 outline-none text-xs w-24 text-center font-mono"
                />
              </div>

              {/* Mode Toggle: Detailed vs Free Invoice */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => handleModeChange('DETAILED')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition ${
                    invoiceMode === 'DETAILED'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📋 أصناف
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('FREE')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition ${
                    invoiceMode === 'FREE'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ⚡ فاتورة حرة
                </button>
              </div>
            </div>

            {/* Customer Selection Row */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
              <div className="sm:col-span-8">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 whitespace-nowrap">العميل:</span>
                  <div className="relative flex-1">
                    <input
                      type="text"
                      list="customers-datalist"
                      value={customerInput}
                      onChange={(e) => setCustomerInput(e.target.value)}
                      placeholder="اختر من القائمة أو اكتب اسماً جديداً..."
                      className="w-full bg-slate-50 border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 outline-none font-medium transition"
                    />
                    <datalist id="customers-datalist">
                      {customers.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.phone ? `${c.phone} - ` : ''}رصيد دين: {c.debt.toFixed(2)} {sym}
                        </option>
                      ))}
                    </datalist>
                  </div>
                </div>
              </div>

              {/* Previous Debt Badge */}
              <div className="sm:col-span-4 flex items-center justify-between sm:justify-end gap-2">
                <div
                  className={`rounded-xl px-2.5 py-1.5 text-xs flex items-center gap-1.5 border ${
                    matchedCustomer && matchedCustomer.debt > 0
                      ? 'bg-red-50 border-red-200 text-red-700 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 font-medium'
                  }`}
                >
                  <span>الرصيد السابق:</span>
                  <span className="font-mono">
                    {matchedCustomer ? matchedCustomer.debt.toFixed(2) : '0.00'} {sym}
                  </span>
                </div>
              </div>
            </div>

            {/* General Statement / Notes */}
            <div>
              <input
                type="text"
                list="notes-datalist"
                value={generalNotes}
                onChange={(e) => setGeneralNotes(e.target.value)}
                placeholder="بيان / ملاحظة الفاتورة (اختياري)..."
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-3 py-1.5 text-xs text-slate-700 outline-none"
              />
              <datalist id="notes-datalist">
                <option value="مشتريات مواد غذائية" />
                <option value="حساب أسبوعي" />
                <option value="دفعة نقدية" />
                <option value="دبه زيت وسكر" />
                <option value="أرز وسكر ودقيق" />
                <option value="حق نيدو ومياه" />
              </datalist>
            </div>
          </div>

          {/* ======================================================== */}
          {/* FREE INVOICE CONTAINER (فاتورة حرة)                      */}
          {/* ======================================================== */}
          {invoiceMode === 'FREE' && (
            <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-4 shadow-xs border border-teal-200 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-teal-950 text-xs sm:text-sm flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>فاتورة حرة سريعة (مبلغ إجمالي مباشر بدون تفصيل أصناف)</span>
                </h3>
                <span className="text-[10px] bg-teal-200 text-teal-900 font-bold px-2 py-0.5 rounded-md">
                  إجمالي فوري
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-teal-900 mb-1">
                    بيان السلع والمشتريات:
                  </label>
                  <input
                    type="text"
                    list="notes-datalist"
                    value={freeDescription}
                    onChange={(e) => setFreeDescription(e.target.value)}
                    placeholder="مثال: دبه زيت وسكر وحليب ومياه..."
                    className="w-full bg-white border border-teal-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-teal-900 mb-1">
                    المبلغ الإجمالي الحر ({sym}) *:
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={freeAmount}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                      setFreeAmount(val);
                      if (typeof val === 'number') updateGrandTotalTrigger(val);
                    }}
                    placeholder="0.00"
                    className="w-full bg-white border-2 border-teal-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-200 rounded-xl px-3 py-2 text-base font-black text-emerald-800 outline-none font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* DETAILED ITEMS TABLE (جدول الأصناف والتفاصيل)            */}
          {/* ======================================================== */}
          {invoiceMode === 'DETAILED' && (
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs border-collapse">
                  <thead className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                    <tr>
                      <th className="p-2 border-l border-slate-200 w-5/12">التفاصيل (الصنف)</th>
                      <th className="p-2 border-l border-slate-200 w-2/12 text-center">الكمية</th>
                      <th className="p-2 border-l border-slate-200 w-2/12 text-center">السعر ({sym})</th>
                      <th className="p-2 border-l border-slate-200 w-2/12 text-center">عليه (الإجمالي)</th>
                      <th className="p-2 w-1/12 text-center">حذف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {items.map((item, idx) => {
                      const lineTotal = item.qty * item.price;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50 transition border-b border-slate-100">
                          {/* Item Name */}
                          <td className="p-1 sm:p-2 border-l border-slate-200">
                            <input
                              type="text"
                              list="products-datalist"
                              value={item.name}
                              onChange={(e) => handleUpdateItem(idx, 'name', e.target.value)}
                              placeholder="اسم الصنف أو السلعة..."
                              className="w-full bg-slate-50/70 border border-slate-200 focus:border-emerald-500 rounded-lg px-2 py-1 text-[11px] sm:text-xs text-slate-800 outline-none font-medium"
                            />
                          </td>

                          {/* Quantity */}
                          <td className="p-1 sm:p-2 border-l border-slate-200">
                            <input
                              type="number"
                              step="1"
                              min="0.1"
                              value={item.qty}
                              onChange={(e) => handleUpdateItem(idx, 'qty', e.target.value)}
                              className="w-full text-center bg-slate-50/70 border border-slate-200 focus:border-emerald-500 rounded-lg px-1.5 py-1 text-[11px] sm:text-xs font-bold text-slate-800 outline-none font-mono"
                            />
                          </td>

                          {/* Price */}
                          <td className="p-1 sm:p-2 border-l border-slate-200">
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              value={item.price}
                              onChange={(e) => handleUpdateItem(idx, 'price', e.target.value)}
                              className="w-full text-center bg-slate-50/70 border border-slate-200 focus:border-emerald-500 rounded-lg px-1.5 py-1 text-[11px] sm:text-xs font-bold text-slate-800 outline-none font-mono"
                            />
                          </td>

                          {/* Line Total */}
                          <td className="p-1 sm:p-2 border-l border-slate-200 text-center font-black text-emerald-800 text-[11px] sm:text-xs font-mono">
                            {lineTotal.toFixed(2)}
                          </td>

                          {/* Delete Item */}
                          <td className="p-1 sm:p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItemRow(idx)}
                              title="حذف هذا السطر"
                              className="text-slate-400 hover:text-red-600 transition p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5 mx-auto" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Datalist for Product Autocomplete */}
              <datalist id="products-datalist">
                {products.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name} - {p.price} {sym}
                  </option>
                ))}
              </datalist>

              {/* Add Row Button & Summary Bar */}
              <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleAddItemRow}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 transition shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة سطر</span>
                </button>

                <div className="text-[11px] text-slate-600 font-medium">
                  عدد البنود: <strong className="text-slate-900">{items.length}</strong> | إجمالي الكميات:{' '}
                  <strong className="text-slate-900">
                    {items.reduce((acc, i) => acc + i.qty, 0)}
                  </strong>
                </div>
              </div>

              {/* Quick Products Chips */}
              <div className="p-2.5 bg-white border-t border-slate-100">
                <div className="text-[11px] font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-500" />
                  <span>أصناف المخزن السريعة (اضغط للإضافة الفورية):</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {products.slice(0, 10).map((prod) => (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => handleAddQuickProduct(prod)}
                      className="bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 text-[11px] px-2.5 py-1 rounded-lg transition active:scale-95 shadow-2xs font-medium"
                    >
                      + {prod.name} ({prod.price} {sym})
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TOTALS, CASH RECEIVED, AND PAYMENT METHOD                */}
          {/* ======================================================== */}
          <div className="bg-white rounded-2xl p-3.5 sm:p-4 shadow-xs border border-slate-200/80 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Grand Total */}
              <div className="bg-emerald-50/80 p-3 rounded-2xl border border-emerald-200 flex flex-col justify-center">
                <span className="text-[11px] text-emerald-800 font-bold">إجمالي عليه:</span>
                <div className="text-xl sm:text-2xl font-black text-emerald-700 font-mono">
                  {grandTotal.toFixed(2)}{' '}
                  <span className="text-xs font-bold text-emerald-800">{sym}</span>
                </div>
              </div>

              {/* Paid Cash Input (الواصل) */}
              <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200 flex flex-col justify-center">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الواصل (المدفوع كاش):
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-white border border-emerald-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 rounded-xl px-2.5 py-1.5 text-base font-black text-slate-800 outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setPaidAmount(grandTotal)}
                    className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-bold px-2 py-2 rounded-lg whitespace-nowrap transition"
                    title="دفع كامل المبلغ"
                  >
                    كامل
                  </button>
                </div>
              </div>

              {/* Remaining Debt (الصافي المتبقي دين) */}
              <div
                className={`p-3 rounded-2xl border flex flex-col justify-center ${
                  remainingDebt > 0
                    ? 'bg-red-50/90 border-red-200 text-red-700'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <span className="text-[11px] font-bold">الصافي المتبقي (دين):</span>
                <div className="text-xl sm:text-2xl font-black font-mono">
                  {remainingDebt.toFixed(2)}{' '}
                  <span className="text-xs font-bold">{sym}</span>
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1.5">طريقة الدفع:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handlePaymentMethodChange('CASH')}
                  className={`border-2 py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    paymentMethod === 'CASH'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span>💵</span>
                  <span>نقداً (كاش)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePaymentMethodChange('CREDIT')}
                  className={`border-2 py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    paymentMethod === 'CREDIT'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span>📝</span>
                  <span>آجل (دين)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePaymentMethodChange('PARTIAL')}
                  className={`border-2 py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    paymentMethod === 'PARTIAL'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span>⚖️</span>
                  <span>دفعة جزئية</span>
                </button>
              </div>
            </div>

            {/* Warning if credit invoice without customer name */}
            {remainingDebt > 0 && !customerInput.trim() && (
              <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded-xl p-2.5 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>يرجى اختيار أو كتابة اسم العميل لتسجيل المتبقي ({remainingDebt.toFixed(2)} {sym}) كدين في حسابه!</span>
              </div>
            )}

            {/* PRIMARY ACTION BUTTONS (جديد، حفظ، طباعة، صورة، واتساب) */}
            <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 border-t border-slate-100">
              {/* Reset / New */}
              <button
                type="button"
                onClick={() => handleReset(true)}
                className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold py-2.5 px-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                <span>جديد</span>
              </button>

              {/* Save */}
              <button
                type="button"
                onClick={handleSave}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 px-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>{editingInvoiceId ? 'تحديث الفاتورة' : 'حفظ الفاتورة'}</span>
              </button>

              {/* Print Receipt */}
              <button
                type="button"
                onClick={() => {
                  if (grandTotal <= 0) {
                    alert('يرجى إدخال أصناف الفاتورة أولاً!');
                    return;
                  }
                  const tempInv: Invoice = {
                    id: editingInvoiceId || 'temp',
                    invoiceNumber: invoiceNumber,
                    date: dateStr,
                    time: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
                    customerName: customerInput.trim() || 'عميل نقدي',
                    mode: invoiceMode,
                    freeDescription: freeDescription,
                    items: items.filter((i) => i.name.trim() !== ''),
                    grandTotal: grandTotal,
                    paidAmount: paidAmount,
                    remainingDebt: remainingDebt,
                    paymentMethod: paymentMethod,
                    notes: generalNotes,
                    currency: currency,
                    createdAt: Date.now(),
                  };
                  onOpenReceipt(tempInv);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة إيصال</span>
              </button>

              {/* WhatsApp Share */}
              <button
                type="button"
                onClick={handleDirectWhatsApp}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold py-2.5 px-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>إرسال واتساب</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 2: INVOICE HISTORY (السجل)                          */}
      {/* ======================================================== */}
      {subTab === 'history' && (
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
            <div className="relative flex-1">
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="بحث برقم الفاتورة أو اسم العميل..."
                className="w-full bg-slate-50 border border-slate-300 focus:border-emerald-500 rounded-xl px-3 py-2 pr-9 text-xs sm:text-sm text-slate-800 outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={historyFilter}
                onChange={(e) => setHistoryFilter(e.target.value as any)}
                className="bg-slate-50 border border-slate-300 text-slate-700 text-xs rounded-xl px-2.5 py-2 outline-none font-bold"
              >
                <option value="ALL">جميع الفواتير</option>
                <option value="CASH">نقداً (كاش)</option>
                <option value="CREDIT">آجل (دين)</option>
                <option value="PARTIAL">دفعة جزئية</option>
              </select>

              <button
                type="button"
                onClick={() => exportInvoicesToExcel(invoices, currency)}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 transition shrink-0"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>تصدير إكسل</span>
              </button>
            </div>
          </div>

          {/* Invoices List */}
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs space-y-1">
              <p className="text-base">📭</p>
              <p>لا توجد فواتير تطابق البحث</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 hover:bg-slate-50/70 p-2 rounded-xl transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-mono font-bold text-xs shrink-0 border border-emerald-200">
                      🧾
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-xs sm:text-sm">
                          {inv.invoiceNumber}
                        </span>
                        <span className="font-bold text-slate-800 text-xs sm:text-sm">
                          {inv.customerName}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            inv.paymentMethod === 'CASH'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inv.paymentMethod === 'CREDIT'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {inv.paymentMethod === 'CASH'
                            ? 'نقداً'
                            : inv.paymentMethod === 'CREDIT'
                            ? 'آجل'
                            : 'جزئي'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{inv.date}</span>
                        {inv.time && <span>{inv.time}</span>}
                        {inv.mode === 'FREE' && (
                          <span className="text-teal-600 font-bold bg-teal-50 px-1 rounded">
                            فاتورة حرة: {inv.freeDescription || 'مشتريات'}
                          </span>
                        )}
                        {inv.notes && <span>• {inv.notes}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3">
                    <div className="text-left font-mono">
                      <div className="text-xs sm:text-sm font-black text-slate-800">
                        {inv.grandTotal.toFixed(2)} {getCurrencySymbol(inv.currency)}
                      </div>
                      {inv.remainingDebt > 0 && (
                        <div className="text-[10px] text-red-600 font-bold">
                          متبقي: {inv.remainingDebt.toFixed(2)} {getCurrencySymbol(inv.currency)}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onOpenReceipt(inv)}
                        title="عرض وطباعة الإيصال الحراري"
                        className="bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 p-2 rounded-xl transition text-xs flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-bold">إيصال</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleEditFromHistory(inv)}
                        title="تعديل الفاتورة"
                        className="bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-700 p-2 rounded-xl transition text-xs"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`هل أنت متأكد من حذف الفاتورة ${inv.invoiceNumber}؟`)) {
                            onDeleteInvoice(inv.id);
                          }
                        }}
                        title="حذف الفاتورة"
                        className="text-slate-400 hover:text-red-600 p-2 rounded-xl transition text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
