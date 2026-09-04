import React, { useState } from 'react';
import {
  Search,
  Plus,
  FileSpreadsheet,
  Phone,
  CreditCard,
  FileText,
  Edit2,
  Trash2,
  MessageCircle,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Customer, Currency } from '../types';
import { getCurrencySymbol, exportCustomersToExcel } from '../utils/storage';

interface CustomersScreenProps {
  currency: Currency;
  customers: Customer[];
  onSaveCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  onRecordPayment: (customerId: string, amount: number, notes: string) => void;
  onOpenStatement: (customer: Customer) => void;
}

export const CustomersScreen: React.FC<CustomersScreenProps> = ({
  currency,
  customers,
  onSaveCustomer,
  onDeleteCustomer,
  onRecordPayment,
  onOpenStatement,
}) => {
  const sym = getCurrencySymbol(currency);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'DEBTORS'>('ALL');

  // Add / Edit Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formDebt, setFormDebt] = useState<number | ''>(0);
  const [formNotes, setFormNotes] = useState('');

  // Debt Payment Modal state
  const [payingCustomer, setPayingCustomer] = useState<Customer | null>(null);
  const [payAmount, setPayAmount] = useState<number | ''>('');
  const [payNotes, setPayNotes] = useState('');

  // Filter customers
  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.notes && c.notes.toLowerCase().includes(search.toLowerCase()));

    if (filter === 'ALL') return matchesSearch;
    return matchesSearch && c.debt > 0;
  });

  const totalDebt = customers.reduce((acc, c) => acc + c.debt, 0);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormName('');
    setFormPhone('');
    setFormDebt(0);
    setFormNotes('');
    setShowAddModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormName(customer.name);
    setFormPhone(customer.phone);
    setFormDebt(customer.debt);
    setFormNotes(customer.notes || '');
    setShowAddModal(true);
  };

  // Save Customer
  const handleSubmitCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const customerData: Customer = {
      id: editingCustomer ? editingCustomer.id : `c-${Date.now()}`,
      name: formName.trim(),
      phone: formPhone.trim(),
      debt: typeof formDebt === 'number' ? formDebt : 0,
      notes: formNotes.trim(),
      createdAt: editingCustomer ? editingCustomer.createdAt : Date.now(),
      updatedAt: Date.now(),
    };

    onSaveCustomer(customerData);
    setShowAddModal(false);
  };

  // Open Payment Modal
  const handleOpenPayment = (customer: Customer) => {
    setPayingCustomer(customer);
    setPayAmount(customer.debt > 0 ? customer.debt : '');
    setPayNotes('سداد دفعة حساب نقداً');
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingCustomer) return;
    const amount = typeof payAmount === 'number' ? payAmount : 0;
    if (amount <= 0) {
      alert('يرجى كتابة مبلغ سداد صالح أكبر من الصفر');
      return;
    }

    onRecordPayment(payingCustomer.id, amount, payNotes.trim());
    setPayingCustomer(null);
  };

  // Direct WhatsApp Balance Reminder
  const handleSendWhatsAppReminder = (customer: Customer) => {
    const text = `السلام عليكم ورحمة الله وبركاته، الأخ العزيز *${customer.name}* المحترم.\nنود تذكيركم بأن رصيد حسابكم المتبقي لدى *بقالة العزي للمواد الغذائية* هو: *${customer.debt.toFixed(2)} ${sym}*.\nشاكرين ومقدرين حسن تعاونكم والتزامكم بالسداد 🙏💐`;
    const phone = customer.phone.replace(/\D/g, '');
    const url = phone
      ? `https://wa.me/${phone.startsWith('967') ? phone : '967' + phone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Top Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث باسم العميل أو رقم الهاتف..."
              className="w-full bg-slate-50 border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-800 outline-none transition"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => exportCustomersToExcel(customers, currency)}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold px-3 py-2.5 rounded-xl flex items-center gap-1.5 transition active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>كشف ديون إكسل</span>
            </button>

            <button
              type="button"
              onClick={handleOpenAdd}
              className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold px-4 py-2.5 rounded-xl text-sm flex items-center justify-center gap-1.5 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة عميل</span>
            </button>
          </div>
        </div>

        {/* Filter Pills and Total Debt */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <span>إجمالي ديون العملاء:</span>
            <span className="font-black text-red-600 text-sm sm:text-base font-mono">
              {totalDebt.toFixed(2)} {sym}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                filter === 'ALL'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              الكل ({customers.length})
            </button>

            <button
              type="button"
              onClick={() => setFilter('DEBTORS')}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                filter === 'DEBTORS'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              المدينون فقط ({customers.filter((c) => c.debt > 0).length})
            </button>
          </div>
        </div>
      </div>

      {/* Customers Cards Grid */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-400 text-xs border border-slate-200">
          <p className="text-2xl mb-1">👥</p>
          <p>لا يوجد عملاء يطابقون خيارات البحث</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 hover:border-emerald-300 transition flex flex-col justify-between gap-3"
            >
              {/* Customer Top Details */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-black text-slate-800 text-sm sm:text-base">
                    {customer.name}
                  </h3>
                  {customer.phone && (
                    <div className="flex items-center gap-1 text-xs text-slate-500 font-mono mt-0.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{customer.phone}</span>
                    </div>
                  )}
                  {customer.notes && (
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                      📝 {customer.notes}
                    </p>
                  )}
                </div>

                {/* Debt Badge */}
                <div
                  className={`text-left rounded-xl px-2.5 py-1.5 border font-mono ${
                    customer.debt > 0
                      ? 'bg-red-50 border-red-200 text-red-700'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  }`}
                >
                  <div className="text-[10px] font-bold text-slate-500">
                    {customer.debt > 0 ? 'رصيد دين عليه' : 'خالص الحساب'}
                  </div>
                  <div className="text-base sm:text-lg font-black">
                    {customer.debt.toFixed(2)} {sym}
                  </div>
                </div>
              </div>

              {/* Action Buttons for this Customer */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5">
                  {/* Record Payment Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenPayment(customer)}
                    className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-xs transition"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>سداد دين</span>
                  </button>

                  {/* Statement Button */}
                  <button
                    type="button"
                    onClick={() => onOpenStatement(customer)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 transition"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-700" />
                    <span>كشف حساب</span>
                  </button>

                  {/* WhatsApp Reminder */}
                  {customer.debt > 0 && (
                    <button
                      type="button"
                      onClick={() => handleSendWhatsAppReminder(customer)}
                      title="إرسال تذكير بالرصيد عبر واتساب"
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 p-2 rounded-xl transition text-xs"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {/* Edit */}
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(customer)}
                    title="تعديل بيانات العميل"
                    className="text-slate-400 hover:text-amber-700 p-1.5 rounded-lg transition"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          `هل أنت متأكد من حذف العميل "${customer.name}"؟ سيتم حذف جميع عملياته المرتبطة.`
                        )
                      ) {
                        onDeleteCustomer(customer.id);
                      }
                    }}
                    title="حذف العميل"
                    className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: ADD / EDIT CUSTOMER                             */}
      {/* ======================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base">
                {editingCustomer ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اسم العميل *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="مثال: يحيى صالح العزي"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  رقم الهاتف (لإرسال كشف الحساب والواتساب)
                </label>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="77xxxxxxx"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  رصيد الدين الحالي ({sym})
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formDebt}
                  onChange={(e) =>
                    setFormDebt(e.target.value === '' ? '' : parseFloat(e.target.value))
                  }
                  className="w-full bg-slate-50 border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ملاحظات العميل
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="مثال: يسدد أسبوعياً، طلبات البيت..."
                  className="w-full bg-slate-50 border border-slate-300 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-sm transition"
                >
                  حفظ البيانات
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 px-4 rounded-xl text-sm transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: RECORD CUSTOMER PAYMENT (سداد دين)              */}
      {/* ======================================================== */}
      {payingCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base">تسديد دين عميل</h3>
              <button
                type="button"
                onClick={() => setPayingCustomer(null)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="space-y-3">
              {/* Customer summary */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="text-xs text-slate-500">العميل:</div>
                <div className="font-bold text-slate-800 text-sm sm:text-base">
                  {payingCustomer.name}
                </div>
                <div className="mt-2 flex justify-between items-center text-xs">
                  <span className="text-slate-500">إجمالي الدين الحالي:</span>
                  <span className="font-black text-red-600 text-sm font-mono">
                    {payingCustomer.debt.toFixed(2)} {sym}
                  </span>
                </div>
              </div>

              {/* Amount input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  المبلغ المسدد الآن ({sym}) *
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  required
                  value={payAmount}
                  onChange={(e) =>
                    setPayAmount(e.target.value === '' ? '' : parseFloat(e.target.value))
                  }
                  className="w-full bg-white border-2 border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl px-3 py-2 text-lg font-black text-emerald-800 outline-none font-mono"
                />
              </div>

              {/* Full Payment Button */}
              <div className="text-left">
                <button
                  type="button"
                  onClick={() => setPayAmount(payingCustomer.debt)}
                  className="text-xs text-emerald-600 font-bold hover:underline"
                >
                  تسديد كامل المبلغ ({payingCustomer.debt.toFixed(2)} {sym}) ⚡
                </button>
              </div>

              {/* Debt After Payment */}
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex justify-between items-center text-xs">
                <span className="text-emerald-900 font-medium">الرصيد بعد السداد:</span>
                <span className="font-black text-emerald-800 text-sm font-mono">
                  {Math.max(
                    0,
                    payingCustomer.debt - (typeof payAmount === 'number' ? payAmount : 0)
                  ).toFixed(2)}{' '}
                  {sym}
                </span>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  بيان / ملاحظة السداد
                </label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="مثال: دفعة حساب أسبوعي نقداً"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-sm transition active:scale-95 shadow-sm"
                >
                  تأكيد السداد وتحديث الحساب
                </button>
                <button
                  type="button"
                  onClick={() => setPayingCustomer(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 px-3 rounded-xl text-sm transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
