import React, { useState } from 'react';
import { ShoppingBag, Zap, Plus, Store, Info, Phone, MapPin, Download, Smartphone } from 'lucide-react';
import { Currency } from '../types';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface HeaderProps {
  currency: Currency;
  onToggleCurrency: () => void;
  onQuickFreeInvoice: () => void;
  onQuickNewInvoice: () => void;
  onOpenInstallModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currency,
  onToggleCurrency,
  onQuickFreeInvoice,
  onQuickNewInvoice,
  onOpenInstallModal,
}) => {
  const [showStoreInfo, setShowStoreInfo] = useState(false);
  const { isInstallable, isInstalled, install } = usePWAInstall();

  const handleInstallBtnClick = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (!outcome) {
        onOpenInstallModal();
      }
    } else {
      onOpenInstallModal();
    }
  };

  return (
    <>
      <header className="bg-gradient-to-l from-emerald-800 via-emerald-700 to-teal-900 text-white shadow-md sticky top-0 z-30 no-print">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between">
          {/* Logo & Store Title */}
          <div
            className="flex items-center gap-2.5 cursor-pointer select-none"
            onClick={() => setShowStoreInfo(true)}
            title="معلومات بقالة العزي"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-amber-400 text-emerald-950 flex items-center justify-center shadow-inner overflow-hidden border border-amber-300">
              <img
                src="/logo.jpg"
                alt="بقالة العزي"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <ShoppingBag className="w-5 h-5 text-emerald-950 fallback-icon" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5 leading-tight">
                بقالة العزي للمواد الغذائية
                <span className="text-[10px] bg-emerald-600/90 text-emerald-100 font-bold px-2 py-0.5 rounded-full border border-emerald-500/40">
                  🇾🇪 اليمن
                </span>
              </h1>
              <p className="text-[11px] text-emerald-200/90 hidden sm:block">
                فواتير سريعة • كشف حساب ومشاركة العمليات • نقاط البيع الذكية
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Install App button if not running in standalone */}
            {!isInstalled && (
              <button
                type="button"
                onClick={handleInstallBtnClick}
                title="تثبيت التطبيق على جهازك أو هاتفك"
                className="bg-amber-400 hover:bg-amber-300 text-emerald-950 text-xs font-black px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition shadow-sm active:scale-95 animate-pulse"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="text-[11px] sm:text-xs">تثبيت التطبيق</span>
              </button>
            )}

            {/* Currency Switcher */}
            <button
              type="button"
              onClick={onToggleCurrency}
              title="تغيير العملة الحالية"
              className="bg-emerald-900/80 hover:bg-emerald-900 border border-emerald-500/40 text-amber-300 text-xs font-bold px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 transition active:scale-95 shadow-sm"
            >
              <span>{currency === 'YER' ? '🇾🇪' : '🇸🇦'}</span>
              <span className="text-[11px] sm:text-xs">
                {currency === 'YER' ? 'يمني (ر.ي)' : 'سعودي (ر.س)'}
              </span>
            </button>

            {/* Quick Free Invoice */}
            <button
              type="button"
              onClick={onQuickFreeInvoice}
              title="فاتورة حرة سريعة بمبلغ إجمالي حر"
              className="bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition shadow-sm active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">فاتورة حرة</span>
            </button>

            {/* Quick Detailed Invoice */}
            <button
              type="button"
              onClick={onQuickNewInvoice}
              title="فاتورة جديدة تفصيلية"
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black px-3 py-1.5 rounded-xl flex items-center gap-1 transition shadow-sm active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">فاتورة جديدة</span>
            </button>

            {/* Store Info info button */}
            <button
              type="button"
              onClick={() => setShowStoreInfo(true)}
              className="bg-emerald-800 hover:bg-emerald-700 text-emerald-200 hover:text-white p-2 rounded-xl transition text-xs"
              title="معلومات المحل"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Store Info Dialog */}
      {showStoreInfo && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto text-3xl border border-emerald-200 overflow-hidden">
              <img
                src="/splash_bg.jpg"
                alt="بقالة العزي"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <Store className="w-8 h-8 text-emerald-700 fallback-icon" />
            </div>

            <div>
              <h3 className="font-black text-slate-800 text-lg">بقالة العزي للمواد الغذائية</h3>
              <p className="text-xs text-slate-500 mt-1">نظام المحاسبة وإدارة نقاط البيع الذكية ومتابعة الديون</p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 text-xs text-right space-y-2 text-slate-700">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>رقم التواصل والدعم: <strong>770000000</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>اليمن - صنعاء / خدمات التوصيل والدفع الآجل</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 text-center">💵</span>
                <span>العملات المعتمدة: <strong>ريال يمني (ر.ي) / ريال سعودي (ر.س)</strong></span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowStoreInfo(false)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-sm transition"
            >
              حسناً، فهمت
            </button>
          </div>
        </div>
      )}
    </>
  );
};
