import React, { useState } from 'react';
import {
  TrendingUp,
  CreditCard,
  Receipt,
  Download,
  Upload,
  RotateCcw,
  Search,
  FileSpreadsheet,
  AlertCircle,
  Clock,
  Trash2,
} from 'lucide-react';
import { Customer, Invoice, Transaction, Currency } from '../types';
import {
  getCurrencySymbol,
  exportFullBackup,
  importFullBackup,
  resetAllToDefaults,
} from '../utils/storage';

interface ReportsScreenProps {
  currency: Currency;
  customers: Customer[];
  invoices: Invoice[];
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
  onDataReload: () => void;
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({
  currency,
  customers,
  invoices,
  transactions,
  onDeleteTransaction,
  onDataReload,
}) => {
  const sym = getCurrencySymbol(currency);

  const [txSearch, setTxSearch] = useState('');
  const [txFilter, setTxFilter] = useState<'ALL' | 'SALE' | 'PAYMENT'>('ALL');

  // KPI calculations
  const totalSales = invoices.reduce((acc, inv) => acc + inv.grandTotal, 0);
  const totalDebts = customers.reduce((acc, c) => acc + c.debt, 0);
  const totalCashCollected = invoices.reduce((acc, inv) => acc + inv.paidAmount, 0);

  // Filtered transactions
  const filteredTxs = transactions.filter((tx) => {
    const matchesSearch =
      tx.title.toLowerCase().includes(txSearch.toLowerCase()) ||
      tx.customerName.toLowerCase().includes(txSearch.toLowerCase()) ||
      (tx.notes && tx.notes.toLowerCase().includes(txSearch.toLowerCase()));

    if (txFilter === 'ALL') return matchesSearch;
    return matchesSearch && tx.type === txFilter;
  });

  // Handle backup import file
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      if (content) {
        const success = importFullBackup(content);
        if (success) {
          alert('تم استعادة النسخة الاحتياطية بنجاح!');
          onDataReload();
        } else {
          alert('فشل استعادة النسخة الاحتياطية. يرجى التأكد من صحة الملف.');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetData = () => {
    if (
      window.confirm(
        'تحذير: هل أنت متأكد من إعادة تعيين جميع البيانات إلى البيانات الافتراضية؟ سيتم مسح التعديلات الجديدة.'
      )
    ) {
      resetAllToDefaults();
      onDataReload();
      alert('تم إعادة ضبط البيانات إلى الوضع الافتراضي.');
    }
  };

  return (
    <div className="space-y-4 pb-24">
      {/* KPI Cards Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total Sales */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-bold">إجمالي المبيعات</span>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 font-mono">
              {totalSales.toFixed(2)}{' '}
              <span className="text-xs font-bold text-slate-500">{sym}</span>
            </div>
            <div className="text-[11px] text-slate-400">إجمالي قيمة الفواتير المصدرة</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Total Market Debts */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-bold">إجمالي الديون في السوق</span>
            <div className="text-xl sm:text-2xl font-black text-red-600 font-mono">
              {totalDebts.toFixed(2)}{' '}
              <span className="text-xs font-bold text-slate-500">{sym}</span>
            </div>
            <div className="text-[11px] text-slate-400">المتبقي على الزبائن والعملاء</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-red-50 text-red-700 flex items-center justify-center border border-red-200">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        {/* Cash Collected */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-bold">المبالغ المقبوضة (كاش)</span>
            <div className="text-xl sm:text-2xl font-black text-teal-700 font-mono">
              {totalCashCollected.toFixed(2)}{' '}
              <span className="text-xs font-bold text-slate-500">{sym}</span>
            </div>
            <div className="text-[11px] text-slate-400">النقد الفعلي في الصندوق</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200">
            <Receipt className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Transactions Ledger Card */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-black text-slate-800 text-sm sm:text-base flex items-center gap-2">
              <span>📋</span>
              <span>دفتر اليومية وسجل العمليات المالية</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              جميع الحركات المالية من فواتير مبيعات وسدادات نقدية
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={txFilter}
              onChange={(e) => setTxFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-300 text-slate-700 text-xs rounded-xl px-2.5 py-1.5 outline-none font-bold"
            >
              <option value="ALL">جميع الحركات</option>
              <option value="SALE">فواتير مبيعات</option>
              <option value="PAYMENT">سندات سداد</option>
            </select>
          </div>
        </div>

        {/* Transactions List */}
        {filteredTxs.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            <p className="text-xl mb-1">📭</p>
            <p>لا توجد حركات مسجلة</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTxs.map((tx) => (
              <div
                key={tx.id}
                className="py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50/70 p-2 rounded-xl transition"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0 border ${
                      tx.type === 'SALE'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {tx.type === 'SALE' ? '🧾' : '💵'}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">
                        {tx.title}
                      </span>
                      <span className="text-slate-600 text-xs font-medium">
                        ({tx.customerName})
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                      <span>{tx.date}</span>
                      {tx.notes && <span>• {tx.notes}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-left font-mono">
                    <div className="text-xs sm:text-sm font-black text-slate-900">
                      {tx.amount.toFixed(2)} {getCurrencySymbol(tx.currency || currency)}
                    </div>
                    {tx.debt > 0 ? (
                      <div className="text-[10px] text-red-600 font-bold">
                        دين: {tx.debt.toFixed(2)} {getCurrencySymbol(tx.currency || currency)}
                      </div>
                    ) : (
                      <div className="text-[10px] text-emerald-600 font-bold">مدفوع كاش</div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('هل أنت متأكد من حذف هذا القيد؟')) {
                        onDeleteTransaction(tx.id);
                      }
                    }}
                    title="حذف هذا القيد"
                    className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Download Full Application Source Code ZIP */}
      <div className="bg-gradient-to-l from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-emerald-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xl">📦</span>
            <h3 className="font-black text-sm sm:text-base text-white">
              تحميل حزمة كود التطبيق كاملة (ZIP)
            </h3>
            <span className="text-[10px] bg-amber-400 text-emerald-950 font-black px-2 py-0.5 rounded-full">
              جاهز للتحميل
            </span>
          </div>
          <p className="text-xs text-emerald-200/90 leading-relaxed max-w-xl">
            ملف مضغوط يحتوي على جميع ملفات المشروع البرمجية (React + TypeScript + PWA + الأيقونات وشاشات البداية والـ README ودليل التدريب) لتشغيله محلياً أو تحويله إلى APK.
          </p>
        </div>

        <a
          href="/alozzi-pos-app.zip"
          download="alozzi-pos-app.zip"
          className="bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2 transition active:scale-95 shrink-0 w-full sm:w-auto"
        >
          <Download className="w-4 h-4" />
          <span>تحميل ملف alozzi-pos-app.zip</span>
        </a>
      </div>

      {/* Backup and Data Maintenance Card */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 space-y-3">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <span>⚙️</span>
          <span>النسخ الاحتياطي وإدارة البيانات</span>
        </h3>
        <p className="text-xs text-slate-500">
          يمكنك تصدير نسخة احتياطية كاملة لبيانات المتجر (فواتير، عملاء، ديون، مخزون) أو استعادتها في أي وقت.
        </p>

        <div className="pt-2 flex flex-wrap items-center gap-2">
          {/* Export Backup */}
          <button
            type="button"
            onClick={exportFullBackup}
            className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>تنزيل نسخة احتياطية (JSON)</span>
          </button>

          {/* Import Backup */}
          <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition">
            <Upload className="w-4 h-4" />
            <span>استعادة نسخة احتياطية</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>

          {/* Reset to defaults */}
          <button
            type="button"
            onClick={handleResetData}
            className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition mr-auto"
          >
            <RotateCcw className="w-4 h-4" />
            <span>استعادة البيانات الافتراضية</span>
          </button>
        </div>
      </div>
    </div>
  );
};
