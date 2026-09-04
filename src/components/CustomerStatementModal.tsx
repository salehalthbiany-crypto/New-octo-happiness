import React, { useState } from 'react';
import {
  ArrowRight,
  Printer,
  FileSpreadsheet,
  MessageCircle,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { Customer, CustomerOperation, Currency } from '../types';
import {
  getCurrencySymbol,
  exportStatementToExcel,
  generateStatementWhatsAppText,
} from '../utils/storage';

interface CustomerStatementModalProps {
  currency: Currency;
  customer: Customer;
  operations: CustomerOperation[];
  onClose: () => void;
  onAddOperation: (op: Omit<CustomerOperation, 'id' | 'createdAt'>) => void;
  onDeleteOperation: (opId: string) => void;
}

export const CustomerStatementModal: React.FC<CustomerStatementModalProps> = ({
  currency,
  customer,
  operations,
  onClose,
  onAddOperation,
  onDeleteOperation,
}) => {
  const sym = getCurrencySymbol(currency);

  const [periodFilter, setPeriodFilter] = useState<'ALL' | 'MONTH' | 'YEAR' | 'PREV'>('ALL');
  const [showAddOpModal, setShowAddOpModal] = useState(false);

  // Add Op form state
  const [opAmount, setOpAmount] = useState<number | ''>('');
  const [opDetails, setOpDetails] = useState('');
  const [opDate, setOpDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
  });

  // Filter operations by period
  const filteredOps = operations.filter((op) => {
    if (periodFilter === 'ALL') return true;
    const opYear = op.date.slice(0, 4);
    const curYear = new Date().getFullYear().toString();
    const opMonth = op.date.slice(5, 7);
    const curMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');

    if (periodFilter === 'MONTH') {
      return opYear === curYear && opMonth === curMonth;
    }
    if (periodFilter === 'YEAR') {
      return opYear === curYear;
    }
    if (periodFilter === 'PREV') {
      return opYear < curYear;
    }
    return true;
  });

  const totalDebit = filteredOps
    .filter((o) => o.type === 'DEBIT')
    .reduce((sum, o) => sum + o.amount, 0);

  const totalCredit = filteredOps
    .filter((o) => o.type === 'CREDIT')
    .reduce((sum, o) => sum + o.amount, 0);

  const netBalance = customer.debt;

  // Handle submit operation (له / عليه)
  const handleSubmitOp = (type: 'DEBIT' | 'CREDIT') => {
    const amount = typeof opAmount === 'number' ? opAmount : 0;
    if (amount <= 0) {
      alert('يرجى كتابة مبلغ صالح');
      return;
    }

    onAddOperation({
      customerId: customer.id,
      customerName: customer.name,
      type: type,
      amount: amount,
      details: opDetails.trim() || (type === 'DEBIT' ? 'مشتريات بالدين' : 'سداد نقدي'),
      date: opDate,
      currency: currency,
    });

    setOpAmount('');
    setOpDetails('');
    setShowAddOpModal(false);
  };

  // WhatsApp Share
  const handleShareWhatsApp = () => {
    const text = generateStatementWhatsAppText(customer, filteredOps, currency);
    const phone = customer.phone.replace(/\D/g, '');
    const url = phone
      ? `https://wa.me/${phone.startsWith('967') ? phone : '967' + phone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Print Statement
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs z-50 flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl max-h-[94vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Header Bar */}
        <div className="bg-gradient-to-l from-emerald-800 via-emerald-700 to-teal-800 text-white p-3.5 sm:p-4 flex items-center justify-between shadow-md no-print">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="bg-white/15 hover:bg-white/25 text-white p-2 rounded-xl transition active:scale-95 text-sm"
              title="رجوع"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <div>
              <h3 className="font-black text-base sm:text-lg flex items-center gap-1.5">
                <span>📑 كشف حساب:</span>
                <span className="text-amber-300">{customer.name}</span>
              </h3>
              <div className="text-xs text-emerald-200 font-mono">
                {customer.phone || 'بدون هاتف مسجل'}
              </div>
            </div>
          </div>

          {/* Export & Action Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              title="مشاركة كشف الحساب عبر واتساب"
              className="bg-emerald-500 hover:bg-emerald-400 text-white p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition active:scale-95 shadow-xs"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">واتساب</span>
            </button>

            <button
              type="button"
              onClick={() => exportStatementToExcel(customer, filteredOps, currency)}
              title="تصدير كشف الحساب إكسل"
              className="bg-teal-600 hover:bg-teal-500 text-white p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition active:scale-95 shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">إكسل</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              title="طباعة كشف الحساب"
              className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition active:scale-95 shadow-xs"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Header (Visible only during print) */}
        <div className="hidden print:block p-4 text-center border-b border-slate-300">
          <h2 className="text-xl font-black">بقالة العزي للمواد الغذائية</h2>
          <p className="text-xs">كشف حساب العميل: {customer.name} - هاتف: {customer.phone}</p>
          <p className="text-[10px] text-slate-500">التاريخ: {new Date().toLocaleDateString('ar-YE')}</p>
        </div>

        {/* Period Filter Bar */}
        <div className="bg-slate-100 p-2 sm:p-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs no-print">
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setPeriodFilter('ALL')}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                periodFilter === 'ALL'
                  ? 'bg-emerald-700 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              الكل
            </button>
            <button
              type="button"
              onClick={() => setPeriodFilter('MONTH')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                periodFilter === 'MONTH'
                  ? 'bg-emerald-700 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              شهري
            </button>
            <button
              type="button"
              onClick={() => setPeriodFilter('YEAR')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                periodFilter === 'YEAR'
                  ? 'bg-emerald-700 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              سنوي
            </button>
            <button
              type="button"
              onClick={() => setPeriodFilter('PREV')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                periodFilter === 'PREV'
                  ? 'bg-emerald-700 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              رصيد سابق
            </button>
          </div>

          <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-slate-200 font-bold text-emerald-800">
            <span>العملة:</span>
            <span>{sym}</span>
          </div>
        </div>

        {/* Operations Table Body */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-2">
          {filteredOps.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              <p className="text-2xl mb-1">📭</p>
              <p>لا توجد عمليات مسجلة في هذه الفترة</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
              <table className="w-full text-right text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="p-2.5 border-l border-slate-200 text-center w-3/12">النوع والتاريخ</th>
                    <th className="p-2.5 border-l border-slate-200 text-center w-2/12">المبلغ ({sym})</th>
                    <th className="p-2.5 border-l border-slate-200 w-5/12">التفاصيل والبيان</th>
                    <th className="p-2.5 text-center w-2/12 no-print">حذف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredOps.map((op) => (
                    <tr key={op.id} className="hover:bg-slate-50 transition">
                      {/* Type & Date */}
                      <td className="p-2 border-l border-slate-200 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            op.type === 'DEBIT'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {op.type === 'DEBIT' ? (
                            <>
                              <TrendingDown className="w-3 h-3" />
                              <span>عليه (دين)</span>
                            </>
                          ) : (
                            <>
                              <TrendingUp className="w-3 h-3" />
                              <span>له (سداد)</span>
                            </>
                          )}
                        </span>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {op.date}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="p-2 border-l border-slate-200 text-center font-black text-sm font-mono">
                        <span className={op.type === 'DEBIT' ? 'text-red-600' : 'text-emerald-600'}>
                          {op.amount.toFixed(2)}
                        </span>
                      </td>

                      {/* Details */}
                      <td className="p-2 border-l border-slate-200 text-slate-700 font-medium">
                        {op.details}
                      </td>

                      {/* Delete button */}
                      <td className="p-2 text-center no-print">
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('هل تريد حذف هذه العملية من كشف الحساب؟')) {
                              onDeleteOperation(op.id);
                            }
                          }}
                          className="text-slate-400 hover:text-red-600 transition p-1"
                          title="حذف العملية"
                        >
                          <Trash2 className="w-3.5 h-3.5 mx-auto" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Bottom Summary Bar */}
        <div className="bg-slate-50 border-t border-slate-200 p-2.5 sm:p-3 flex flex-col sm:flex-row items-center justify-between gap-2.5 shadow-inner">
          <div className="flex items-center gap-2 sm:gap-3 text-xs font-bold w-full sm:w-auto justify-around sm:justify-start">
            <div className="bg-red-50 text-red-700 border border-red-200 px-2.5 py-1.5 rounded-xl font-mono">
              عليه: <span className="font-black">{totalDebit.toFixed(2)}</span> {sym}
            </div>
            <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1.5 rounded-xl font-mono">
              له: <span className="font-black">{totalCredit.toFixed(2)}</span> {sym}
            </div>
            <div
              className={`px-3 py-1.5 rounded-xl font-mono shadow-xs text-white ${
                netBalance > 0 ? 'bg-red-700' : 'bg-emerald-700'
              }`}
            >
              الرصيد النهائي: <span className="font-black">{netBalance.toFixed(2)}</span> {sym}
            </div>
          </div>

          {/* Add Operation Button */}
          <button
            type="button"
            onClick={() => setShowAddOpModal(true)}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-2.5 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 no-print"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة عملية (له / عليه)</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL: ADD OPERATION (له / عليه) - دفتر الحسابات         */}
      {/* ======================================================== */}
      {showAddOpModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
                <span>💵</span>
                <span>إضافة حركة مالية جديدة</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddOpModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                ✕
              </button>
            </div>

            <div>
              <span className="text-xs text-slate-500">حساب العميل:</span>
              <div className="font-bold text-slate-800 text-sm sm:text-base">
                {customer.name}
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                المبلغ ({sym}) *
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                required
                placeholder="0.00"
                value={opAmount}
                onChange={(e) =>
                  setOpAmount(e.target.value === '' ? '' : parseFloat(e.target.value))
                }
                className="w-full bg-slate-50 border-2 border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-2xl px-4 py-2.5 text-lg font-black text-emerald-800 outline-none font-mono"
              />
            </div>

            {/* Details */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                التفاصيل والبيان
              </label>
              <input
                type="text"
                placeholder="مثال: دبه زيت، سداد نقدي، حق نيدو..."
                value={opDetails}
                onChange={(e) => setOpDetails(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 outline-none"
              />
            </div>

            {/* Quick Chips */}
            <div className="flex flex-wrap gap-1">
              {['سداد نقدي (دفعة حساب)', 'دبه زيت', 'مشتريات مواد غذائية', 'حق نيدو وسكر'].map(
                (chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setOpDetails(chip)}
                    className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md transition"
                  >
                    {chip}
                  </button>
                )
              )}
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">التاريخ</label>
              <input
                type="text"
                value={opDate}
                onChange={(e) => setOpDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-mono text-center"
              />
            </div>

            {/* Prominent Action Buttons: له vs عليه */}
            <div className="pt-2 grid grid-cols-2 gap-3">
              {/* له (CREDIT - سداد من العميل / أخضر) */}
              <button
                type="button"
                onClick={() => handleSubmitOp('CREDIT')}
                className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black py-3 px-2 rounded-2xl text-sm flex flex-col items-center justify-center gap-0.5 shadow-md transition"
              >
                <span className="text-base flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" /> له (سداد)
                </span>
                <span className="text-[10px] font-normal opacity-90">يخصم من الدين</span>
              </button>

              {/* عليه (DEBIT - مشتريات بالدين / أحمر) */}
              <button
                type="button"
                onClick={() => handleSubmitOp('DEBIT')}
                className="bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black py-3 px-2 rounded-2xl text-sm flex flex-col items-center justify-center gap-0.5 shadow-md transition"
              >
                <span className="text-base flex items-center gap-1">
                  <TrendingDown className="w-4 h-4" /> عليه (دين)
                </span>
                <span className="text-[10px] font-normal opacity-90">يضاف إلى حسابه</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
