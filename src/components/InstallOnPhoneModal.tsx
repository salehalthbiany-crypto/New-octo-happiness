import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Smartphone,
  X,
  Copy,
  Check,
  Share2,
  Download,
  ExternalLink,
  PackageCheck,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface InstallOnPhoneModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallOnPhoneModal: React.FC<InstallOnPhoneModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [copiedBuilder, setCopiedBuilder] = useState(false);
  const [activeTab, setActiveTab] = useState<'scan' | 'steps' | 'apk' | 'zip'>('scan');

  if (!isOpen) return null;

  // Use the public shared URL or the current window origin
  const appUrl =
    typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://ais-pre-ocsxf3fnn3v2qwy7vr5fds-657025363172.europe-west2.run.app';

  const builderUrl = `https://www.pwabuilder.com/?url=${encodeURIComponent(appUrl)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(appUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyBuilder = () => {
    navigator.clipboard.writeText(builderUrl);
    setCopiedBuilder(true);
    setTimeout(() => setCopiedBuilder(false), 2500);
  };

  const handleSendWhatsApp = () => {
    const text = encodeURIComponent(
      `🛒 رابط تطبيق "بقالة العزي للمواد الغذائية" للتثبيت على هاتفك كأبلكيشن:\n${appUrl}\n\n(افتح الرابط في متصفح هاتفك واضغط "تثبيت التطبيق")`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 no-print animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-l from-emerald-800 via-emerald-700 to-teal-800 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-emerald-950 flex items-center justify-center font-bold shadow-md">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg flex items-center gap-1.5">
                <span>تثبيت التطبيق على هاتفك المحمول</span>
                <span className="text-[10px] bg-amber-400 text-emerald-950 font-bold px-2 py-0.5 rounded-full">
                  تطبيق حقيقي
                </span>
              </h3>
              <p className="text-xs text-emerald-200">
                تثبيت مباشر بأيقونة على الشاشة الرئيسية بدون متصفح
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-emerald-200 hover:text-white p-1 rounded-xl transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-600">
          <button
            type="button"
            onClick={() => setActiveTab('scan')}
            className={`flex-1 py-3 text-center transition border-b-2 ${
              activeTab === 'scan'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            📱 امسح بالهاتف (QR)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('steps')}
            className={`flex-1 py-3 text-center transition border-b-2 ${
              activeTab === 'steps'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            📝 خطوات التثبيت (أندرويد/آيفون)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('apk')}
            className={`flex-1 py-3 text-center transition border-b-2 ${
              activeTab === 'apk'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            📦 ملف APK
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('zip')}
            className={`flex-1 py-3 text-center transition border-b-2 ${
              activeTab === 'zip'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            📥 تحميل الكود (ZIP)
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-slate-700 text-right">
          {/* TAB 1: SCAN QR CODE */}
          {activeTab === 'scan' && (
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="bg-emerald-50 p-4 rounded-3xl border-2 border-dashed border-emerald-300 inline-block shadow-inner">
                <QRCodeSVG
                  value={appUrl}
                  size={190}
                  level="H"
                  includeMargin={true}
                  imageSettings={{
                    src: '/logo.jpg',
                    x: undefined,
                    y: undefined,
                    height: 40,
                    width: 40,
                    excavate: true,
                  }}
                />
              </div>

              <div className="space-y-1">
                <h4 className="font-black text-slate-800 text-sm sm:text-base">
                  وجّه كاميرا هاتفك إلى الرمز أعلاه 📷
                </h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  سيفتح هاتفك التطبيق مباشرة، وسيظهر لك خيار "تثبيت التطبيق" ليكون كأيقونة على شاشتك!
                </p>
              </div>

              {/* Quick Actions for Link */}
              <div className="w-full space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
                >
                  <Share2 className="w-4 h-4 text-emerald-200" />
                  <span>إرسال الرابط إلى هاتفي عبر واتساب 💬</span>
                </button>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={appUrl}
                    className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-[11px] font-mono text-slate-600 select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 transition shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>تم النسخ</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>نسخ</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STEP BY STEP INSTALLATION */}
          {activeTab === 'steps' && (
            <div className="space-y-3 text-xs">
              {/* Android Card */}
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center gap-2 font-black text-emerald-900 text-sm">
                  <span className="text-lg">🤖</span>
                  <span>كيف يصبح تطبيقاً حقيقياً على الأندرويد (بدون متصفح):</span>
                </div>
                <div className="space-y-2 pr-1 text-slate-700 text-xs">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      1
                    </span>
                    <p>
                      افتح الرابط في متصفح <strong>Google Chrome</strong> على هاتفك.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      2
                    </span>
                    <p>
                      اضغط على زر <strong>(تثبيت التطبيق 📲)</strong> الذهبي الظاهر في الأعلى، أو اضغط على قائمة المتصفح <strong>(الثلاث نقاط ⋮)</strong> في أعلى الشاشة.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      3
                    </span>
                    <p>
                      اختر <strong>"تثبيت التطبيق" (Install App)</strong> ثم اضغط <strong>"تثبيت"</strong>.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      4
                    </span>
                    <p className="font-bold text-emerald-800">
                      مبروك! ستظهر أيقونة "بقالة العزي" على شاشة هاتفك مثل أي تطبيق من متجر بلاي، وتفتح بملء الشاشة وبدون متصفح تماماً وتعمل بدون إنترنت!
                    </p>
                  </div>
                </div>
              </div>

              {/* iOS Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
                  <span className="text-lg">🍎</span>
                  <span>لهواتف الآيفون (iPhone / Safari):</span>
                </div>
                <div className="space-y-1.5 pr-1 text-slate-700 text-xs">
                  <p>1. افتح الرابط في متصفح <strong>Safari</strong>.</p>
                  <p>2. اضغط على زر <strong>المشاركة (Share)</strong> أسفل الشاشة.</p>
                  <p>3. اختر <strong>"إضافة إلى الشاشة الرئيسية" (Add to Home Screen)</strong>.</p>
                  <p>4. اضغط <strong>"إضافة"</strong> في الأعلى وسيصبح تطبيقاً على شاشتك.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: APK BUILD GUIDE */}
          {activeTab === 'apk' && (
            <div className="space-y-3 text-xs">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 space-y-3 text-amber-950">
                <div className="flex items-center gap-2 font-black text-amber-900 text-sm">
                  <PackageCheck className="w-5 h-5 text-amber-700" />
                  <span>توليد ملف APK أندرويد عبر أداة PWABuilder</span>
                </div>
                <p className="leading-relaxed text-xs text-amber-900">
                  أداة <strong>PWABuilder</strong> الرسمية من مايكروسوفت تفحص التطبيق وتنتج لك ملف <strong>APK</strong> جاهزاً وموقعاً لتثبيته مباشرة على أي هاتف أندرويد:
                </p>

                {/* Box 1: Direct Builder Link with 1-click copy & open */}
                <div className="bg-white p-3.5 rounded-2xl border border-amber-300 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>رابط أداة Builder مع التطبيق (جاهز للفتح):</span>
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                      موصى به
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={builderUrl}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-[11px] font-mono text-slate-600 select-all"
                    />
                    <button
                      type="button"
                      onClick={handleCopyBuilder}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 transition shrink-0 shadow-xs active:scale-95"
                    >
                      {copiedBuilder ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>تم النسخ!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>نسخ الرابط</span>
                        </>
                      )}
                    </button>
                  </div>

                  <a
                    href={builderUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-amber-400 hover:bg-amber-500 text-amber-950 font-black py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-xs mt-1"
                  >
                    <span>فتح أداة PWABuilder الآن لتوليد الـ APK</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Box 2: Application URL alone */}
                <div className="bg-white p-3 rounded-2xl border border-slate-200 space-y-1.5">
                  <span className="font-bold text-slate-700 text-xs">
                    رابط التطبيق الخاص بك (إذا طلبته الأداة):
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={appUrl}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-[11px] font-mono text-slate-600 select-all"
                    />
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 transition shrink-0"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>تم</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>نسخ</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Box 3: Android Studio Alternative */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-600 text-[11px] leading-relaxed">
                  <p className="font-bold text-slate-800 text-xs mb-1">
                    أو عبر Android Studio من كود GitHub الأصلي:
                  </p>
                  افتح مستودعك الأصلي في أندرويد ستوديو، ثم اضغط على:
                  <br />
                  <code className="bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-800 font-mono text-[10px] mt-1 inline-block">
                    Build → Build Bundle(s) / APK(s) → Build APK(s)
                  </code>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DOWNLOAD FULL ZIP PROJECT */}
          {activeTab === 'zip' && (
            <div className="space-y-3.5 text-xs">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-black text-emerald-950 text-sm">
                    <Download className="w-5 h-5 text-emerald-700" />
                    <span>تحميل حزمة ملفات المشروع كاملة (ZIP)</span>
                  </div>
                  <span className="text-[10px] bg-emerald-700 text-white px-2 py-0.5 rounded-full font-bold">
                    حجم: 2.4 MB
                  </span>
                </div>

                <p className="text-emerald-900 text-xs leading-relaxed">
                  تم تجهيز وتجميع كافة ملفات التطبيق (كود React و TypeScript وواجهات نقاط البيع، الأيقونات، شاشات البداية، ملفات التهيئة ودليل التدريب) في ملف مضغوط واحد جاهز للتنزيل المباشر:
                </p>

                {/* Direct Download Button */}
                <a
                  href="/alozzi-pos-app.zip"
                  download="alozzi-pos-app.zip"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition active:scale-95 text-center"
                >
                  <Download className="w-5 h-5" />
                  <span>اضغط هنا لتحميل ملف alozzi-pos-app.zip مباشرة 📥</span>
                </a>
              </div>

              {/* Training and File Structure Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
                <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <span>📚</span>
                  <span>دليل محتويات الملف المضغوط (ملف التدريب):</span>
                </div>

                <div className="space-y-1.5 text-[11px] text-slate-600 pr-1">
                  <div className="flex items-start gap-1.5">
                    <span className="font-mono text-emerald-700 font-bold">📁 src/components/</span>
                    <span>: جميع واجهات وشاشات النظام (الفواتير، العملاء، الديون، التقارير، الإيصال الحراري).</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="font-mono text-emerald-700 font-bold">📁 src/utils/</span>
                    <span>: كود التخزين المحلي الآمن والنسخ الاحتياطي ومطابقة العملات.</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="font-mono text-emerald-700 font-bold">📁 public/</span>
                    <span>: الشعار الرسمي لبقالة العزي والأيقونات بمقاسات الهواتف وشاشة البداية.</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="font-mono text-emerald-700 font-bold">📄 README.md</span>
                    <span>: شرح شامل باللغة العربية لطريقة التثبيت والتشغيل خطوة بخطوة.</span>
                  </div>
                </div>

                {/* Quick Dev Commands */}
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 font-mono text-[10px] text-slate-800 space-y-1">
                  <p className="text-slate-500 font-sans font-bold text-[11px]">أوامر التشغيل بعد فك الضغط على جهازك:</p>
                  <div className="bg-slate-900 text-emerald-300 p-2 rounded-lg space-y-1">
                    <div># 1. تثبيت الحزم</div>
                    <div className="text-white">npm install</div>
                    <div># 2. تشغيل التطبيق محلياً</div>
                    <div className="text-white">npm run dev</div>
                  </div>
                </div>
              </div>

              {/* AI Studio Export Option */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3 text-[11px] text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <span>💡</span>
                  <span>طريقة ثانية للتحميل من واجهة Google AI Studio:</span>
                </p>
                <p>
                  يمكنك أيضاً الضغط على زر الإعدادات (Settings / الثلاث نقاط) في الزاوية العلوية لمنصة AI Studio واختيار <strong>Export to ZIP</strong> أو <strong>Export to GitHub</strong> لحفظ المشروع مباشرة في حسابك.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>آمن 100% ويعمل بدون الحاجة لإنترنت</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2 rounded-xl transition shadow-sm"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
