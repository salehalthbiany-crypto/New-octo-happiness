import React, { useState } from 'react';
import { Smartphone, Download, X, HelpCircle, Check, Share2, PlusSquare } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallBannerProps {
  onDismiss?: () => void;
  onOpenInstallModal?: () => void;
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({
  onDismiss,
  onOpenInstallModal,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // If already running as standalone installed app or user dismissed
  if (isInstalled || dismissed) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (!success) {
        if (onOpenInstallModal) {
          onOpenInstallModal();
        } else {
          setShowGuideModal(true);
        }
      }
    } else {
      if (onOpenInstallModal) {
        onOpenInstallModal();
      } else {
        setShowGuideModal(true);
      }
    }
  };

  return (
    <>
      {/* Prominent Mobile App Install Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-amber-950 p-2.5 sm:p-3 rounded-2xl shadow-md border border-amber-300 flex flex-col sm:flex-row items-center justify-between gap-2.5 my-2 no-print transition-all">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-900 text-amber-100 flex items-center justify-center shrink-0 shadow-inner">
            <Smartphone className="w-6 h-6 text-amber-300 animate-pulse" />
          </div>
          <div>
            <h4 className="font-black text-xs sm:text-sm flex items-center gap-1.5">
              <span>تثبيت تطبيق "بقالة العزي" على هاتفك 📲</span>
              <span className="text-[10px] bg-amber-900 text-amber-200 font-bold px-2 py-0.5 rounded-full">
                تطبيق كامل
              </span>
            </h4>
            <p className="text-[11px] text-amber-900 font-medium">
              استخدمه كتطبيق جوال حقيقي: أيقونة على الشاشة، بدون شريط متصفح، ويعمل بدون إنترنت!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={handleInstallClick}
            className="bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs px-4 py-2 rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition active:scale-95 flex-1 sm:flex-none"
          >
            <Download className="w-4 h-4" />
            <span>تثبيت التطبيق الآن</span>
          </button>

          <button
            type="button"
            onClick={() => (onOpenInstallModal ? onOpenInstallModal() : setShowGuideModal(true))}
            className="bg-amber-300/80 hover:bg-amber-300 text-amber-950 p-2 rounded-xl text-xs font-bold transition"
            title="طريقة التثبيت ومسح QR"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              setDismissed(true);
              onDismiss?.();
            }}
            className="text-amber-900/70 hover:text-amber-950 p-1.5 rounded-lg transition"
            title="إغلاق مؤقت"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Installation Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4 text-right">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-600" />
                <span>طريقة تثبيت التطبيق على الجوال</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              {/* Android Guide */}
              <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200 space-y-1.5">
                <div className="font-black text-emerald-900 text-xs flex items-center gap-1.5">
                  <span>🤖</span>
                  <span>لهواتف الأندرويد (Chrome / Samsung):</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-emerald-800 pr-1 leading-relaxed">
                  <li>اضغط على زر القائمة <strong>(⋮ الثلاث نقاط)</strong> أعلى المتصفح.</li>
                  <li>
                    اختر <strong>"تثبيت التطبيق"</strong> أو <strong>"إضافة إلى الشاشة الرئيسية"</strong>.
                  </li>
                  <li>
                    ستظهر أيقونة <strong>"بقالة العزي"</strong> على شاشة هاتفك مثل أي تطبيق من متجر Google Play!
                  </li>
                </ol>
              </div>

              {/* iPhone / iPad Guide */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1.5">
                <div className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                  <span>🍎</span>
                  <span>لهواتف الآيفون (Safari):</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-700 pr-1 leading-relaxed">
                  <li>
                    اضغط على زر <strong>المشاركة <Share2 className="w-3 h-3 inline text-blue-600" /></strong> في أسفل شريط Safari.
                  </li>
                  <li>
                    مرر للأسفل واضغط على <strong>"إضافة إلى الشاشة الرئيسية" <PlusSquare className="w-3 h-3 inline" /></strong>.
                  </li>
                  <li>اضغط <strong>"إضافة"</strong> بالأعلى.</li>
                </ol>
              </div>
            </div>

            <div className="pt-2">
              {isInstallable ? (
                <button
                  type="button"
                  onClick={async () => {
                    await install();
                    setShowGuideModal(false);
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>بدء التثبيت التلقائي الآن</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowGuideModal(false)}
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 rounded-xl text-xs transition"
                >
                  تم، فهمت الخطوات
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
