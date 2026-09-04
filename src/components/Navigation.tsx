import React from 'react';
import { ReceiptText, Users, Package, BarChart3 } from 'lucide-react';

export type MainTab = 'invoices' | 'customers' | 'products' | 'reports';

interface NavigationProps {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  debtorsCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  debtorsCount,
}) => {
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 py-1.5 px-3 z-30 shadow-lg no-print">
      <div className="max-w-md mx-auto grid grid-cols-4 gap-1.5">
        {/* Tab 1: Invoices */}
        <button
          type="button"
          onClick={() => onTabChange('invoices')}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition ${
            activeTab === 'invoices'
              ? 'text-emerald-700 font-black bg-emerald-50 shadow-xs'
              : 'text-slate-500 font-medium hover:text-slate-800'
          }`}
        >
          <ReceiptText className="w-5 h-5" />
          <span className="text-[11px] mt-0.5">الفواتير</span>
        </button>

        {/* Tab 2: Customers & Debts */}
        <button
          type="button"
          onClick={() => onTabChange('customers')}
          className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition ${
            activeTab === 'customers'
              ? 'text-emerald-700 font-black bg-emerald-50 shadow-xs'
              : 'text-slate-500 font-medium hover:text-slate-800'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[11px] mt-0.5">العملاء والديون</span>
          {debtorsCount > 0 && (
            <span className="absolute top-1 right-2 bg-red-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
              {debtorsCount}
            </span>
          )}
        </button>

        {/* Tab 3: Products / Inventory */}
        <button
          type="button"
          onClick={() => onTabChange('products')}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition ${
            activeTab === 'products'
              ? 'text-emerald-700 font-black bg-emerald-50 shadow-xs'
              : 'text-slate-500 font-medium hover:text-slate-800'
          }`}
        >
          <Package className="w-5 h-5" />
          <span className="text-[11px] mt-0.5">المخزون</span>
        </button>

        {/* Tab 4: Reports / Ledger */}
        <button
          type="button"
          onClick={() => onTabChange('reports')}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition ${
            activeTab === 'reports'
              ? 'text-emerald-700 font-black bg-emerald-50 shadow-xs'
              : 'text-slate-500 font-medium hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[11px] mt-0.5">السجلات</span>
        </button>
      </div>
    </nav>
  );
};
