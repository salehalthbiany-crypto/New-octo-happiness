import React, { useRef } from 'react';
import { Printer, MessageCircle, Download, X, Check, Image as ImageIcon } from 'lucide-react';
import { Invoice, Customer, Currency } from '../types';
import { getCurrencySymbol, generateInvoiceWhatsAppText } from '../utils/storage';

interface ThermalReceiptModalProps {
  invoice: Invoice;
  customer?: Customer;
  currency: Currency;
  onClose: () => void;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({
  invoice,
  customer,
  currency,
  onClose,
}) => {
  const sym = getCurrencySymbol(invoice.currency || currency);
  const receiptRef = useRef<HTMLDivElement>(null);

  // Trigger browser print for #printable-receipt
  const handlePrint = () => {
    window.print();
  };

  // WhatsApp share
  const handleWhatsAppShare = () => {
    const text = generateInvoiceWhatsAppText(invoice, customer?.debt);
    const phone = customer?.phone?.replace(/\D/g, '') || '';
    const url = phone
      ? `https://wa.me/${phone.startsWith('967') ? phone : '967' + phone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Canvas Image Download
  const handleDownloadImage = () => {
    // Generate a high quality 2D canvas representation of the receipt
    const canvas = document.createElement('canvas');
    const width = 600;
    const padding = 40;
    const lineHeight = 30;

    // Estimate height
    const itemsCount = invoice.mode === 'FREE' ? 1 : Math.max(1, invoice.items.length);
    const height = 480 + itemsCount * lineHeight + 180;

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Text configuration
    ctx.textAlign = 'center';
    ctx.fillStyle = '#111827';

    let y = 60;
    ctx.font = 'bold 28px Tajawal, sans-serif';
    ctx.fillText('بقالة العزي للمواد الغذائية', width / 2, y);

    y += 32;
    ctx.font = '18px Tajawal, sans-serif';
    ctx.fillStyle = '#4b5563';
    ctx.fillText('بيع كافة المواد الغذائية والتموينية', width / 2, y);

    y += 26;
    ctx.fillText('هاتف: 770000000 • صنعاء', width / 2, y);

    // Divider
    y += 30;
    ctx.fillStyle = '#9ca3af';
    ctx.font = '16px monospace';
    ctx.fillText('------------------------------------------------', width / 2, y);

    // Invoice Meta
    y += 35;
    ctx.textAlign = 'right';
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 20px Tajawal, sans-serif';
    ctx.fillText(`فاتورة رقم: ${invoice.invoiceNumber}`, width - padding, y);

    ctx.textAlign = 'left';
    ctx.font = '18px monospace';
    ctx.fillText(`${invoice.date} ${invoice.time || ''}`, padding, y);

    y += 32;
    ctx.textAlign = 'right';
    ctx.font = 'bold 18px Tajawal, sans-serif';
    ctx.fillText(`العميل: ${invoice.customerName}`, width - padding, y);

    ctx.textAlign = 'left';
    const payLabel =
      invoice.paymentMethod === 'CASH'
        ? 'نقداً (كاش)'
        : invoice.paymentMethod === 'CREDIT'
        ? 'آجل (دين)'
        : 'دفعة جزئية';
    ctx.fillText(`الدفع: ${payLabel}`, padding, y);

    // Divider
    y += 28;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#9ca3af';
    ctx.font = '16px monospace';
    ctx.fillText('------------------------------------------------', width / 2, y);

    // Table Header
    y += 32;
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 18px Tajawal, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('الصنف والسلعة', width - padding, y);
    ctx.textAlign = 'center';
    ctx.fillText('الكمية', width / 2, y);
    ctx.textAlign = 'left';
    ctx.fillText(`المبلغ (${sym})`, padding, y);

    y += 18;
    ctx.fillStyle = '#9ca3af';
    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -', width / 2, y);

    // Items
    ctx.fillStyle = '#111827';
    ctx.font = '18px Tajawal, sans-serif';

    if (invoice.mode === 'FREE') {
      y += 32;
      ctx.textAlign = 'right';
      ctx.fillText(invoice.freeDescription || 'مشتريات مواد غذائية', width - padding, y);
      ctx.textAlign = 'center';
      ctx.fillText('1', width / 2, y);
      ctx.textAlign = 'left';
      ctx.fillText(invoice.grandTotal.toFixed(2), padding, y);
    } else {
      invoice.items.forEach((item) => {
        y += 32;
        ctx.textAlign = 'right';
        ctx.fillText(item.name.slice(0, 22), width - padding, y);
        ctx.textAlign = 'center';
        ctx.fillText(item.qty.toString(), width / 2, y);
        ctx.textAlign = 'left';
        ctx.fillText((item.qty * item.price).toFixed(2), padding, y);
      });
    }

    // Divider
    y += 30;
    ctx.fillStyle = '#9ca3af';
    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('================================================', width / 2, y);

    // Totals
    y += 36;
    ctx.textAlign = 'right';
    ctx.font = 'bold 22px Tajawal, sans-serif';
    ctx.fillStyle = '#111827';
    ctx.fillText('إجمالي الفاتورة:', width - padding, y);
    ctx.textAlign = 'left';
    ctx.fillText(`${invoice.grandTotal.toFixed(2)} ${sym}`, padding, y);

    y += 32;
    ctx.textAlign = 'right';
    ctx.font = '18px Tajawal, sans-serif';
    ctx.fillStyle = '#047857';
    ctx.fillText('الواصل (المدفوع):', width - padding, y);
    ctx.textAlign = 'left';
    ctx.fillText(`${invoice.paidAmount.toFixed(2)} ${sym}`, padding, y);

    y += 32;
    ctx.textAlign = 'right';
    ctx.font = 'bold 20px Tajawal, sans-serif';
    ctx.fillStyle = invoice.remainingDebt > 0 ? '#b91c1c' : '#047857';
    ctx.fillText('المتبقي (دين):', width - padding, y);
    ctx.textAlign = 'left';
    ctx.fillText(`${invoice.remainingDebt.toFixed(2)} ${sym}`, padding, y);

    if (customer && customer.debt > 0) {
      y += 32;
      ctx.textAlign = 'right';
      ctx.font = 'bold 18px Tajawal, sans-serif';
      ctx.fillStyle = '#4b5563';
      ctx.fillText('إجمالي رصيد حسابك:', width - padding, y);
      ctx.textAlign = 'left';
      ctx.fillText(`${customer.debt.toFixed(2)} ${sym}`, padding, y);
    }

    // Footer
    y += 45;
    ctx.fillStyle = '#9ca3af';
    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('------------------------------------------------', width / 2, y);

    y += 30;
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 18px Tajawal, sans-serif';
    ctx.fillText('شكراً لتعاملكم مع بقالة العزي! 🙏✨', width / 2, y);

    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `فاتورة_${invoice.invoiceNumber}_بقالة_العزي.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden border border-slate-200 flex flex-col my-auto max-h-[95vh]">
        {/* Modal Top Control Bar */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <span className="text-base">🧾</span>
            <span className="font-bold text-sm">إيصال حراري (80mm)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ======================================================== */}
        {/* PRINTABLE THERMAL RECEIPT CONTAINER                      */}
        {/* ======================================================== */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-100 flex justify-center">
          <div
            id="printable-receipt"
            ref={receiptRef}
            className="bg-white text-slate-900 p-4 rounded-xl shadow-md font-sans w-full max-w-[320px] text-xs border border-slate-200 space-y-2.5 select-text"
          >
            {/* Header / Store Branding */}
            <div className="text-center space-y-1 pb-2">
              <div className="w-12 h-12 rounded-xl bg-amber-400 text-emerald-950 mx-auto flex items-center justify-center overflow-hidden font-black text-sm mb-1 shadow-inner">
                <img
                  src="/logo.jpg"
                  alt="بقالة العزي"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <span className="text-xs fallback-icon">العزي</span>
              </div>
              <h2 className="font-black text-base text-slate-950 tracking-tight">
                بقالة العزي للمواد الغذائية
              </h2>
              <p className="text-[10px] text-slate-500">بيع كافة المواد الغذائية والتموينية</p>
              <p className="text-[10px] text-slate-500 font-mono">هاتف: 770000000 • صنعاء</p>
              <div className="text-slate-300 font-mono text-[10px] overflow-hidden select-none">
                ------------------------------------------------
              </div>
            </div>

            {/* Invoice Meta */}
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">رقم الفاتورة:</span>
                <span className="font-black font-mono text-slate-900">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">التاريخ والوقت:</span>
                <span className="font-mono text-slate-700">
                  {invoice.date} {invoice.time}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">العميل:</span>
                <span className="font-bold text-slate-900">{invoice.customerName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">طريقة الدفع:</span>
                <span className="font-bold text-slate-800">
                  {invoice.paymentMethod === 'CASH'
                    ? 'نقداً (كاش)'
                    : invoice.paymentMethod === 'CREDIT'
                    ? 'آجل (دين)'
                    : 'دفعة جزئية'}
                </span>
              </div>
            </div>

            <div className="text-slate-300 font-mono text-[10px] overflow-hidden select-none">
              ------------------------------------------------
            </div>

            {/* Items Table */}
            <div>
              <table className="w-full text-right text-[11px]">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 font-bold pb-1">
                    <th className="py-1">الصنف</th>
                    <th className="py-1 text-center">ك</th>
                    <th className="py-1 text-center">السعر</th>
                    <th className="py-1 text-left">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoice.mode === 'FREE' ? (
                    <tr>
                      <td colSpan={3} className="py-1.5 font-medium text-slate-800">
                        {invoice.freeDescription || 'مشتريات مواد غذائية'}
                      </td>
                      <td className="py-1.5 text-left font-bold font-mono">
                        {invoice.grandTotal.toFixed(2)}
                      </td>
                    </tr>
                  ) : (
                    invoice.items.map((item) => (
                      <tr key={item.id} className="text-slate-800">
                        <td className="py-1 font-medium">{item.name}</td>
                        <td className="py-1 text-center font-mono">{item.qty}</td>
                        <td className="py-1 text-center font-mono">{item.price}</td>
                        <td className="py-1 text-left font-bold font-mono">
                          {(item.qty * item.price).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="text-slate-300 font-mono text-[10px] overflow-hidden select-none">
              ================================================
            </div>

            {/* Totals */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between items-center font-bold text-slate-900 text-sm">
                <span>الإجمالي:</span>
                <span className="font-black font-mono">
                  {invoice.grandTotal.toFixed(2)} {sym}
                </span>
              </div>
              <div className="flex justify-between items-center text-emerald-800 font-medium text-[11px]">
                <span>الواصل (المدفوع):</span>
                <span className="font-bold font-mono">
                  {invoice.paidAmount.toFixed(2)} {sym}
                </span>
              </div>
              <div className="flex justify-between items-center text-red-700 font-bold text-[11px]">
                <span>المتبقي (دين):</span>
                <span className="font-black font-mono">
                  {invoice.remainingDebt.toFixed(2)} {sym}
                </span>
              </div>

              {customer && customer.debt > 0 && (
                <div className="flex justify-between items-center text-slate-600 text-[11px] pt-1 border-t border-slate-200">
                  <span>إجمالي رصيد حسابك:</span>
                  <span className="font-bold font-mono">
                    {customer.debt.toFixed(2)} {sym}
                  </span>
                </div>
              )}
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="bg-slate-50 p-2 rounded-lg text-[10px] text-slate-600 border border-slate-200">
                <span>ملاحظة: {invoice.notes}</span>
              </div>
            )}

            {/* Receipt Footer */}
            <div className="text-center pt-2 space-y-1 text-slate-500">
              <div className="text-slate-300 font-mono text-[10px] overflow-hidden select-none">
                ------------------------------------------------
              </div>
              <p className="font-bold text-slate-800 text-[11px]">
                شكراً لتعاملكم مع بقالة العزي! 🙏✨
              </p>
              <p className="text-[9px] text-slate-400 font-mono">نظام نقاط البيع وإدارة المحاسبة</p>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-3 bg-white border-t border-slate-200 grid grid-cols-3 gap-2 no-print">
          {/* Print */}
          <button
            type="button"
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold py-2.5 px-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة 🖨️</span>
          </button>

          {/* WhatsApp */}
          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold py-2.5 px-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
          >
            <MessageCircle className="w-4 h-4" />
            <span>واتساب 💬</span>
          </button>

          {/* Image Download */}
          <button
            type="button"
            onClick={handleDownloadImage}
            className="bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold py-2.5 px-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
          >
            <ImageIcon className="w-4 h-4" />
            <span>صورة 🖼️</span>
          </button>
        </div>
      </div>
    </div>
  );
};
