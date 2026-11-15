'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  Download,
  Share2,
  Printer,
  X,
  Clock,
  Send,
  Loader2,
} from 'lucide-react';
import { Profile, TransactionWithProfile } from '@/types/database';
import { buildPdfFromJpegBlob, downloadBlob, shareOrSendToWhatsApp } from '@/lib/pdf-generator';

interface UnpaidReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Profile[] | undefined;
  transactions: TransactionWithProfile[] | undefined;
  selectedMonth?: string; // e.g. "2026-11"
}

export function UnpaidReportModal({
  isOpen,
  onClose,
  members = [],
  transactions = [],
  selectedMonth = '2026-11',
}: UnpaidReportModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const monthNamesArabic: Record<string, string> = {
    '01': 'يناير',
    '02': 'فبراير',
    '03': 'مارس',
    '04': 'أبريل',
    '05': 'مايو',
    '06': 'يونيو',
    '07': 'يوليو',
    '08': 'أغسطس',
    '09': 'سبتمبر',
    '10': 'أكتوبر',
    '11': 'نوفمبر',
    '12': 'ديسمبر',
  };

  const [yearStr, monthNum] = selectedMonth.split('-');
  const monthName = monthNamesArabic[monthNum] || selectedMonth;
  const todayArabic = new Date().toLocaleDateString('ar-SD', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // تحديد من سدد بنجاح في هذا الشهر
  const approvedThisMonth = transactions.filter(
    (t) => t.status === 'approved' && t.payment_month?.startsWith(selectedMonth)
  );
  const paidUserIds = new Set(approvedThisMonth.map((t) => t.user_id));

  // استخراج قائمة الأعضاء غير المسددين فقط (استثناء أمين المال إذا لم يكن مطالباً بالاشتراك أو تضمينه)
  // الأعضاء المطالبين هم جميع من دورهم 'member'
  const regularMembers = members.filter((m) => m.role === 'member');
  const unpaidMembers = regularMembers.filter((m) => !paidUserIds.has(m.id));

  const individualFee = 15000;
  const totalUnpaidAmount = unpaidMembers.length * individualFee;

  // نص الرسالة الرسمي الأخوي لمشاركته في قروب الواتساب
  const generateWhatsAppMessage = () => {
    const listString = unpaidMembers
      .map((m, idx) => `${idx + 1}. ${m.full_name}`)
      .join('\n');

    return `⚠️ *إشعار استعجال سداد الاشتراكات (انقضاء مهلة يوم 10)*
📍 *أم القرى، بورتسودان*
🗓️ *شهر: ${monthName} ${yearStr}م*
────────────────────────
السلام عليكم ورحمة الله وبركاته.. الإخوة الكرام أعضاء الجمعية،
تقبل الله طاعاتكم ووفقكم لكل خير.

نلفت عنايتكم الكريمة إلى *انقضاء المهلة النظامية المحددة باللائحة لسداد الاشتراكات الشهرية (اليوم العاشر من الشهر)*.

ونظراً لوجود التزامات ومصروفات وخدمات طارئة تتطلب تغطية الخزينة، نرجو من الإخوة الكرام الذين لم يتمكنوا من السداد حتى الآن التكرم بالإسراع في التحويل:

📋 *كشف بأسماء الإخوة غير المسددين لشهر ${monthName} فقط (${unpaidMembers.length} أعضاء):*
${listString || 'الحمد لله، جميع الأعضاء مسددين بالكامل!'}

💵 *قيمة الاشتراك الشهري:* 15,000 ج.س
💳 *حساب بنكك المعتمد للاستقبال:*
(يرجى التحويل ورفع الإشعار بالتطبيق أو إرساله لمدير الجمعية)

شاكرين ومقدرين للجميع حسن تعاونهم وحرصهم على استمرار مسيرة صندوقنا التكافلي.
✍️ *مدير الجمعية:* محمد حسن قديل
📌 *تطوير:* Mo7amed-Yagoub
📌 كشف الـ PDF الرسمي مرفق أعلاه.`;
  };

  // توليد ملف PDF عالي الجودة يحتوي على أسماء غير المسددين فقط
  const generatePdfBlob = async (): Promise<Blob> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');

    const scale = 2;
    const w = 800 * scale;
    const h = 1130 * scale;
    canvas.width = w;
    canvas.height = h;

    ctx.scale(scale, scale);
    ctx.direction = 'rtl';

    // 1. الخلفية العامة البيضاء
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 800, 1130);

    // ترويسة تنبيهية بلون كهرماني / عنّابي رسمي
    const grad = ctx.createLinearGradient(0, 0, 800, 0);
    grad.addColorStop(0, '#991b1b');
    grad.addColorStop(0.5, '#b45309');
    grad.addColorStop(1, '#92400e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 115);

    // نصوص الترويسة
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 23px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('كشف متأخري سداد الاشتراكات الشهرية', 400, 50);

    ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#fef3c7';
    ctx.fillText(`شهر: ${monthName} ${yearStr}م — تنبيه رسمي بعد يوم 10`, 400, 84);

    // خط فاصل
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(40, 130, 720, 2);

    // 2. إحصائيات سريعة
    const drawStat = (x: number, y: number, width: number, label: string, val: string, color: string) => {
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#f59e0b40';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x, y, width, 75, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(label, x + width - 16, y + 26);

      ctx.fillStyle = color;
      ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
      ctx.fillText(val, x + width - 16, y + 54);
    };

    drawStat(540, 155, 220, 'عدد غير المسددين', `${unpaidMembers.length} أعضاء`, '#f87171');
    drawStat(290, 155, 230, 'المبلغ الإجمالي المتأخر', `${totalUnpaidAmount.toLocaleString()} ج.س`, '#fbbf24');
    drawStat(40, 155, 230, 'اشتراك الفرد الشهري', '15,000 ج.س', '#38bdf8');

    // 3. نص الديباجة والتذكير الأخوي
    ctx.fillStyle = '#1e293b80';
    ctx.strokeStyle = '#f59e0b30';
    ctx.beginPath();
    ctx.roundRect(40, 245, 720, 75, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('تذكير نظامي استناداً إلى المادة (8) من لائحة الصندوق:', 740, 270);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'normal 11px system-ui, -apple-system, sans-serif';
    ctx.fillText(
      'انقضت المهلة النظامية المحددة في اليوم العاشر من الشهر. نلتمس من الإخوة الواردة أسماؤهم أدناه الإسراع',
      740,
      292
    );
    ctx.fillText(
      'في تسوية الاشتراكات وموافاة الأمانة المالية بإشعار التحويل البنكي أو السداد النقدي لضمان تغطية الصندوق لالتزاماته.',
      740,
      310
    );

    // 4. جدول أسماء غير المسددين فقط
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
    ctx.fillText(`كشف الأسماء غير المسددة فقط (${unpaidMembers.length} أعضاء):`, 760, 350);

    // ترويسة الجدول
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(40, 365, 720, 30);
    ctx.fillStyle = '#fef2f2';
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    ctx.fillText('#', 740, 385);
    ctx.fillText('اسم العضو', 710, 385);
    ctx.fillText('المبلغ المستحق', 450, 385);
    ctx.fillText('حالة السداد', 280, 385);
    ctx.fillText('المهلة المقررة', 120, 385);

    let rowY = 420;
    if (unpaidMembers.length === 0) {
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ما شاء الله! تم سداد اشتراكات جميع الأعضاء لشهر ' + monthName + ' بالكامل.', 400, 440);
    } else {
      unpaidMembers.forEach((m, idx) => {
        ctx.fillStyle = idx % 2 === 0 ? '#1e293b40' : 'transparent';
        ctx.fillRect(40, rowY - 18, 720, 24);

        ctx.fillStyle = '#f1f5f9';
        ctx.font = 'normal 11px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`${idx + 1}`, 740, rowY);
        ctx.fillText(m.full_name, 710, rowY);
        ctx.fillText('15,000 ج.س', 450, rowY);

        ctx.fillStyle = '#f87171';
        ctx.fillText('متأخر عن السداد', 280, rowY);

        ctx.fillStyle = '#94a3b8';
        ctx.fillText(`10 ${monthName} ${yearStr}`, 120, rowY);

        rowY += 24;
      });
    }

    // 5. تذييل واعتماد التقرير
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(40, 990, 720, 1);

    ctx.fillStyle = '#334155';
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`تاريخ استخراج الكشف: ${todayArabic}`, 760, 1025);
    ctx.fillText('إدارة الجمعية والمسؤول المالي:', 760, 1050);

    ctx.fillStyle = '#991b1b';
    ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
    ctx.fillText('محمد حسن قديل (مدير الجمعية)', 760, 1075);

    ctx.fillStyle = '#475569';
    ctx.font = 'normal 10px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('كشف رسمي للتوزيع والمتابعة', 180, 1035);
    ctx.fillText('أم القرى، بورتسودان • تطوير Mo7amed-Yagoub', 180, 1065);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        async (blob) => {
          if (!blob) return reject(new Error('Failed creating blob'));
          const arrayBuffer = await blob.arrayBuffer();
          const jpegBytes = new Uint8Array(arrayBuffer);
          const pdfBlob = buildPdfFromJpegBlob(jpegBytes, 800, 1130);
          resolve(pdfBlob);
        },
        'image/jpeg',
        0.92
      );
    });
  };

  const handleDownloadPdf = async () => {
    try {
      setIsGenerating(true);
      const blob = await generatePdfBlob();
      downloadBlob(blob, `كشف_المتأخرين_عن_السداد_شهر_${monthName}_${yearStr}.pdf`);
    } catch (err) {
      console.error('فشل إنشاء كشف الـ PDF:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShareWhatsApp = async () => {
    try {
      setIsGenerating(true);
      const blob = await generatePdfBlob();
      await shareOrSendToWhatsApp({
        title: `كشف المتأخرين عن السداد - شهر ${monthName}`,
        text: generateWhatsAppMessage(),
        pdfBlob: blob,
        fileName: `كشف_المتأخرين_عن_السداد_شهر_${monthName}_${yearStr}.pdf`,
      });
    } catch (err) {
      console.error('فشل إرسال الكشف إلى واتساب:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl glass-card border border-amber-200 text-slate-900 bg-white rounded-3xl shadow-2xl my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* شريط المودال العلوي */}
        <div className="flex items-center justify-between p-4 md:p-5 border-b border-amber-200/80 bg-amber-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-800 border border-amber-200">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg md:text-xl text-amber-950 flex items-center gap-2">
                <span>كشف المتأخرين عن السداد</span>
                <span className="text-xs bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-200 font-bold">
                  تنبيه ما بعد يوم 10
                </span>
              </h3>
              <p className="text-xs text-amber-800/80">
                كشف رسمي يتضمن أسماء الإخوة غير المسددين فقط لإرساله في قروب الواتساب
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-950 border border-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* أزرار المشاركة والتحميل */}
        <div className="p-4 bg-amber-50/40 border-b border-amber-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleShareWhatsApp}
              disabled={isGenerating}
              className="touch-button bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-4 py-2.5 flex items-center gap-2 shadow-xs disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
              <span>إرسال الكشف للقروب بالواتساب</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="touch-button bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs px-4 py-2.5 flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-amber-600" />
              <span>تحميل كشف PDF</span>
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="touch-button bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs px-3.5 py-2 flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4 text-amber-600" />
            <span className="hidden sm:inline">طباعة</span>
          </button>
        </div>

        {/* جسم المعاينة للكشف */}
        <div className="p-5 md:p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* الشعار المعتمد في ترويسة الكشف فقط */}
          <div className="text-center pb-3 border-b border-amber-200">
            <img
              src="/logo.png"
              alt="شعار رفاق"
              className="h-16 w-auto mx-auto object-contain mb-1"
            />
            <div className="text-base font-black text-slate-950 mt-1">
              كشف متأخري سداد الاشتراكات — شهر {monthName} {yearStr}م
            </div>
          </div>

          {/* بطاقة التنبيه والأرقام */}
          <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-300 flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <div className="font-black text-amber-950 text-sm">
                انقضاء مهلة السداد المقررة لشهر {monthName} (يوم 10):
              </div>
              <p className="text-slate-800 leading-relaxed font-medium">
                يوجد حالياً <strong className="text-slate-950 font-black">{unpaidMembers.length} أعضاء</strong> لم يسددوا اشتراك هذا الشهر، بإجمالي متأخرات قدرها{' '}
                <strong className="text-amber-950 font-black">{totalUnpaidAmount.toLocaleString()} ج.س</strong>.
              </p>
            </div>
          </div>

          {/* جدول أسماء غير المسددين فقط */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="font-black text-sm text-slate-950 flex items-center gap-2">
                <span>أسماء الأعضاء غير المسددين فقط:</span>
                <span className="text-xs text-rose-700 font-black">
                  ({unpaidMembers.length} أسماء)
                </span>
              </h5>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
              <table className="w-full text-xs text-right">
                <thead className="bg-rose-50 text-rose-950 border-b border-rose-200 font-black">
                  <tr>
                    <th className="p-3 w-12">#</th>
                    <th className="p-3">اسم العضو</th>
                    <th className="p-3">المبلغ المستحق</th>
                    <th className="p-3">حالة السداد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {unpaidMembers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-emerald-900 font-black">
                        🎉 ممتاز جداً! تم سداد اشتراك جميع أعضاء الجمعية لهذا الشهر بالكامل.
                      </td>
                    </tr>
                  ) : (
                    unpaidMembers.map((m, idx) => (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono text-slate-700 font-bold">{idx + 1}</td>
                        <td className="p-3 font-black text-slate-950">{m.full_name}</td>
                        <td className="p-3 font-mono text-amber-950 font-black">15,000 ج.س</td>
                        <td className="p-3 text-rose-800 font-black">غير مسدد</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* نص التذكير الأخوي الجاهز للمشاركة */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Send className="w-4 h-4 text-emerald-600" />
              <span>نص الرسالة التي ستُرسل إلى قروب الواتساب:</span>
            </div>
            <div className="p-3 rounded-xl bg-white border border-slate-200 text-[11px] text-slate-800 leading-relaxed font-sans whitespace-pre-line shadow-2xs">
              {generateWhatsAppMessage()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
