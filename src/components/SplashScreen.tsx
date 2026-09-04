import React, { useEffect, useState } from 'react';
import { ShoppingBag, Sparkles } from 'lucide-react';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setFade(true);
    }, 1400);

    const timer2 = setTimeout(() => {
      onFinish();
    }, 1800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onFinish]);

  return (
    <div
      onClick={onFinish}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between py-12 px-6 bg-gradient-to-b from-emerald-900 via-emerald-800 to-teal-950 text-white transition-opacity duration-500 cursor-pointer ${
        fade ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background Graphic Accent */}
      <div className="absolute inset-0 opacity-15 overflow-hidden pointer-events-none">
        <img
          src="/splash_bg.jpg"
          alt="خلفية التطبيق"
          className="w-full h-full object-cover scale-105 filter blur-xs"
        />
      </div>

      {/* Top Badge */}
      <div className="relative z-10 bg-emerald-700/80 border border-emerald-500/40 text-emerald-100 text-xs font-bold px-3.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
        <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
        <span>نظام نقاط البيع وإدارة المحاسبة الذكية</span>
      </div>

      {/* Center Logo & Branding */}
      <div className="relative z-10 flex flex-col items-center text-center space-y-4 my-auto">
        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-amber-400 p-1.5 shadow-2xl border-2 border-amber-300 transform transition hover:scale-105">
          <div className="w-full h-full rounded-2xl overflow-hidden bg-white flex items-center justify-center">
            <img
              src="/logo.jpg"
              alt="بقالة العزي"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <ShoppingBag className="w-12 h-12 text-emerald-900 fallback-icon" />
          </div>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-md">
            بقالة العزي للمواد الغذائية
          </h1>
          <p className="text-sm text-emerald-200/90 font-medium">
            فواتير سريعة • حسابات العملاء • إيصالات حرارية
          </p>
        </div>

        {/* Loading indicator */}
        <div className="pt-4 flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-bounce"></div>
          <div
            className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-bounce"
            style={{ animationDelay: '0.15s' }}
          ></div>
          <div
            className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-bounce"
            style={{ animationDelay: '0.3s' }}
          ></div>
        </div>
      </div>

      {/* Bottom Footer Info */}
      <div className="relative z-10 text-center space-y-1 text-xs text-emerald-300/80">
        <p className="font-mono font-bold">نسخة التطبيق v2.0 • جاهز للاستخدام بدون إنترنت</p>
        <p className="text-[11px] text-emerald-400/60">اضغط في أي مكان لتخطي شاشة البداية</p>
      </div>
    </div>
  );
};
