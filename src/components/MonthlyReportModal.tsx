'use client';

import React, { useRef, useState } from 'react';
import {
  FileText,
  Download,
  Share2,
  Printer,
  X,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { FundSummary, TransactionWithProfile, Expense, Asset } from '@/types/database';
import { buildPdfFromJpegBlob, downloadBlob, shareOrSendToWhatsApp } from '@/lib/pdf-generator';

interface MonthlyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: FundSummary | undefined;
  transactions: TransactionWithProfile[] | undefined;
  expenses: Expense[] | undefined;
  assets: Asset[] | undefined;
  selectedMonth?: string; // e.g. "2026-11"
}

export function MonthlyReportModal({
  isOpen,
  onClose,
  summary,
  transactions = [],
  expenses = [],
  assets = [],
  selectedMonth = '2026-11',
}: MonthlyReportModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const printableRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // استخراج اسم الشهر العربي
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

  // تصفية المعاملات المعتمدة للشهر المحدد
  const currentMonthApproved = transactions.filter(
    (t) => t.status === 'approved' && t.payment_month?.startsWith(selectedMonth)
  );

  const totalCollected = currentMonthApproved.reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const currentBalance = summary?.balance ?? totalCollected - totalExpenses;
  const isSafetyBufferMaintained = currentBalance >= 100000;

  // نص التقرير المخصص لمشاركته على قروب الواتساب
  const generateWhatsAppMessage = () => {
    return `📊 *تقرير مدير الجمعية الشهري - صندوق رِفَاق*
📍 *أم القرى، بورتسودان*
🗓️ *شهر: ${monthName} ${yearStr}*
────────────────────────
💰 *الموقف المالي للخزينة:*
• إجمالي الإيرادات المحصلة: *${(summary?.total_income || totalCollected).toLocaleString()} ج.س*
• إجمالي المنصرفات والمساعدات: *${(summary?.total_expenses || totalExpenses).toLocaleString()} ج.س*
• 🟢 *صافي الرصيد الحالي المتوفر:* *${currentBalance.toLocaleString()} ج.س*
• حالة حد أمان الخزينة (الحد الأدنى 100,000 ج.س): ${
      isSafetyBufferMaintained ? '✅ آمن ومستقر' : '⚠️ أقل من حد الأمان'
    }

👥 *حالة سداد الاشتراكات (شهر ${monthName}):*
• المسددين: *${summary?.paid_members_count || currentMonthApproved.length} من أصل ${
      summary?.total_members || 24
    } عضو*
• نسبة التحصيل: *${Math.round(
      ((summary?.paid_members_count || currentMonthApproved.length) / (summary?.total_members || 24)) * 100
    )}%*
• المتبقي تحصيله: *${summary?.unpaid_members_count || 0} أعضاء*

📦 *أصول وممتلكات الجمعية المتوفرة:*
${assets.map((a) => `• ${a.name} (${a.quantity})`).join('\n') || '• لا توجد أصول مسجلة حالياً'}

✍️ *مدير الجمعية:* محمد حسن قديل
📌 *تطوير:* Mo7amed-Yagoub
📌 تفاصيل التقرير الكامل في ملف الـ PDF المرفق أعلاه`;
  };

  // رسم تقرير عالي الدقة على Canvas وتحويله لملف PDF حقيقي
  const generatePdfBlob = async (): Promise<Blob> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');

    // أبعاد صفحة A4 بدقة عالية (2x Retina Scale)
    const scale = 2;
    const w = 800 * scale;
    const h = 1130 * scale;
    canvas.width = w;
    canvas.height = h;

    ctx.scale(scale, scale);
    ctx.direction = 'rtl';

    // 1. الخلفية العامة البيضاء الراقية
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 800, 1130);

    // ترويسة زمردية بالأعلى
    const grad = ctx.createLinearGradient(0, 0, 800, 0);
    grad.addColorStop(0, '#064e3b');
    grad.addColorStop(0.5, '#047857');
    grad.addColorStop(1, '#0f766e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 115);

    // نصوص الترويسة
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('التقرير المالي الدوري لإدارة الجمعية', 400, 52);

    ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#d1fae5';
    ctx.fillText(`تقرير شهر: ${monthName} ${yearStr}م`, 400, 86);

    // خط فاصل
    ctx.fillStyle = '#059669';
    ctx.fillRect(40, 130, 720, 2);

    // 2. بطاقات الأرقام الكبرى
    const drawCard = (x: number, y: number, width: number, height: number, label: string, val: string, sub: string, color: string) => {
      ctx.fillStyle = '#0b261d';
      ctx.strokeStyle = '#10b98133';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(label, x + width - 16, y + 26);

      ctx.fillStyle = color;
      ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
      ctx.fillText(val, x + width - 16, y + 54);

      ctx.fillStyle = '#6ee7b7';
      ctx.font = 'normal 10px system-ui, -apple-system, sans-serif';
      ctx.fillText(sub, x + width - 16, y + 74);
    };

    drawCard(550, 150, 210, 85, 'الرصيد الفعلي المتوفر', `${currentBalance.toLocaleString()} ج.س`, 'جاهز للصرف المعتمد', '#34d399');
    drawCard(310, 150, 220, 85, 'إجمالي الإيرادات المحصلة', `${(summary?.total_income || totalCollected).toLocaleString()} ج.س`, `سدد ${summary?.paid_members_count || 0} عضو`, '#2dd4bf');
    drawCard(40, 150, 250, 85, 'إجمالي المنصرفات', `${(summary?.total_expenses || totalExpenses).toLocaleString()} ج.س`, 'مساعدات وشراء أصول', '#f87171');

    // 3. تنبيه حد الأمان للخزينة
    ctx.fillStyle = isSafetyBufferMaintained ? '#064e3b40' : '#88133740';
    ctx.strokeStyle = isSafetyBufferMaintained ? '#10b98160' : '#f43f5e60';
    ctx.beginPath();
    ctx.roundRect(40, 250, 720, 44, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isSafetyBufferMaintained ? '#a7f3d0' : '#fecdd3';
    ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'right';
    const safetyText = isSafetyBufferMaintained
      ? `✓ الخزينة ملتزمة بحد الأمان الإلزامي (الحد الأدنى 100,000 ج.س متوفر بحساب الخزينة).`
      : `⚠️ تنبيه: رصيد الخزينة يقل عن الحد الأدنى الإلزامي (100,000 ج.س). يُحظر الصرف غير الطارئ.`;
    ctx.fillText(safetyText, 740, 277);

    // 4. جدول الأعضاء المسددين لهذا الشهر
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
    ctx.fillText(`بيان الأعضاء المسددين لشهر ${monthName} (${currentMonthApproved.length} أعضاء):`, 760, 325);

    // ترويسة الجدول
    ctx.fillStyle = '#0f382a';
    ctx.fillRect(40, 340, 720, 28);
    ctx.fillStyle = '#6ee7b7';
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    ctx.fillText('#', 740, 358);
    ctx.fillText('اسم العضو', 710, 358);
    ctx.fillText('المبلغ', 480, 358);
    ctx.fillText('نوع السداد', 360, 358);
    ctx.fillText('رقم المرجع / الإشعار', 240, 358);
    ctx.fillText('تاريخ السداد', 100, 358);

    let rowY = 388;
    currentMonthApproved.slice(0, 10).forEach((tx, idx) => {
      ctx.fillStyle = idx % 2 === 0 ? '#0b261d50' : 'transparent';
      ctx.fillRect(40, rowY - 18, 720, 24);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'normal 11px system-ui, -apple-system, sans-serif';
      ctx.fillText(`${idx + 1}`, 740, rowY);
      ctx.fillText(tx.profiles?.full_name || 'عضو الصندوق', 710, rowY);
      ctx.fillText(`${Number(tx.amount).toLocaleString()} ج.س`, 480, rowY);
      ctx.fillText(tx.type === 'cash' ? 'نقدي (كاش)' : 'بنكك (تحويل)', 360, rowY);
      ctx.fillText(tx.reference_number || 'مقبول', 240, rowY);
      ctx.fillText(new Date(tx.created_at).toLocaleDateString('en-GB'), 100, rowY);
      rowY += 24;
    });

    if (currentMonthApproved.length > 10) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'italic 11px system-ui, -apple-system, sans-serif';
      ctx.fillText(`... وباقي عدد ${currentMonthApproved.length - 10} أعضاء آخرين مسددين وموثقين بالنظام.`, 760, rowY + 5);
      rowY += 25;
    }

    // 5. بيان المنصرفات المسجلة
    rowY += 15;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
    ctx.fillText(`بيان المنصرفات والمساعدات الاجتماعية (${expenses.length} بنود):`, 760, rowY);

    rowY += 18;
    ctx.fillStyle = '#0f382a';
    ctx.fillRect(40, rowY, 720, 28);
    ctx.fillStyle = '#fca5a5';
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    ctx.fillText('#', 740, rowY + 18);
    ctx.fillText('بيان المنصرف / المساعدة', 710, rowY + 18);
    ctx.fillText('التصنيف', 430, rowY + 18);
    ctx.fillText('المبلغ المنصرف', 240, rowY + 18);
    ctx.fillText('التاريخ', 100, rowY + 18);

    rowY += 38;
    if (expenses.length === 0) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'normal 11px system-ui, -apple-system, sans-serif';
      ctx.fillText('لا توجد منصرفات أو مساعدات مسجلة حتى تاريخه.', 710, rowY);
      rowY += 25;
    } else {
      expenses.slice(0, 4).forEach((exp, idx) => {
        ctx.fillStyle = '#e2e8f0';
        ctx.font = 'normal 11px system-ui, -apple-system, sans-serif';
        ctx.fillText(`${idx + 1}`, 740, rowY);
        ctx.fillText(exp.description, 710, rowY);
        ctx.fillText(exp.category === 'aid' ? 'مساعدة اجتماعية' : 'شراء أصل', 430, rowY);
        ctx.fillText(`${Number(exp.amount).toLocaleString()} ج.س`, 240, rowY);
        ctx.fillText(new Date(exp.created_at).toLocaleDateString('en-GB'), 100, rowY);
        rowY += 24;
      });
    }

    // 6. تذييل واعتماد التقرير
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(40, 990, 720, 1);

    ctx.fillStyle = '#334155';
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`صدر بتاريخ: ${todayArabic}`, 760, 1025);
    ctx.fillText('إدارة الجمعية والمسؤول المالي:', 760, 1050);

    ctx.fillStyle = '#064e3b';
    ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
    ctx.fillText('محمد حسن قديل (مدير الجمعية)', 760, 1075);

    ctx.fillStyle = '#475569';
    ctx.font = 'normal 10px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('«كل من يسجل عليه ما علينا وله ما لنا»', 180, 1035);
    ctx.fillText('أم القرى، بورتسودان • تطوير Mo7amed-Yagoub', 180, 1065);

    // تحويل الكانفاس لصورة ثم ملف PDF قياسي
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
      downloadBlob(blob, `تقرير_مدير_الجمعية_شهر_${monthName}_${yearStr}.pdf`);
    } catch (err) {
      console.error('فشل إنشاء ملف الـ PDF:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShareWhatsApp = async () => {
    try {
      setIsGenerating(true);
      const blob = await generatePdfBlob();
      await shareOrSendToWhatsApp({
        title: `تقرير مدير الجمعية - شهر ${monthName}`,
        text: generateWhatsAppMessage(),
        pdfBlob: blob,
        fileName: `تقرير_مدير_الجمعية_شهر_${monthName}_${yearStr}.pdf`,
      });
    } catch (err) {
      console.error('فشل إرسال التقرير لواتساب:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl glass-card border border-emerald-100 text-slate-900 bg-white rounded-3xl shadow-2xl my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* شريط الإجراءات العلوي للمودال */}
        <div className="flex items-center justify-between p-4 md:p-5 border-b border-emerald-100 bg-emerald-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-800 border border-emerald-200">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg md:text-xl text-emerald-950 flex items-center gap-2">
                <span>تقرير مدير الجمعية الشهري</span>
                <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200 font-bold">
                  شهر {monthName} {yearStr}
                </span>
              </h3>
              <p className="text-xs text-emerald-700/80">
                جاهز للمعاينة الفورية والتحميل والمشاركة المباشرة في قروب الواتساب
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-900 border border-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* أزرار التفاعل والإجراءات الفورية */}
        <div className="p-4 bg-emerald-50/30 border-b border-emerald-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleShareWhatsApp}
              disabled={isGenerating}
              className="touch-button bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-4 py-2.5 flex items-center gap-2 shadow-xs disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
              <span>مشاركة ملف PDF بالواتساب</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="touch-button bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs px-4 py-2.5 flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>تحميل كملف PDF</span>
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="touch-button bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs px-3.5 py-2 flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">طباعة مباشرة</span>
          </button>
        </div>

        {/* جسم المعاينة التفاعلية للتقرير */}
        <div ref={printableRef} className="p-5 md:p-8 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* ترويسة التقرير الرسمية مع الشعار فقط */}
          <div className="text-center pb-5 border-b border-emerald-200 space-y-2">
            <img
              src="/logo.png"
              alt="شعار رفاق"
              className="h-16 w-auto mx-auto object-contain mb-1 drop-shadow-xs"
            />
            <h4 className="text-xl font-black text-slate-950">
              التقرير المالي الدوري لإدارة الجمعية — شهر {monthName} {yearStr}م
            </h4>
          </div>

          {/* بطاقات المؤشرات المالية */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-white border border-emerald-300 shadow-xs">
              <div className="text-xs text-slate-800 font-bold mb-1">الرصيد الفعلي المتوفر بالخزينة</div>
              <div className="text-2xl font-black text-emerald-950">
                {currentBalance.toLocaleString()} ج.س
              </div>
              <div className="text-xs text-emerald-900 mt-1 font-bold">شامل التحويلات والكاش</div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-teal-300 shadow-xs">
              <div className="text-xs text-slate-800 font-bold mb-1">إجمالي الإيرادات المحصلة</div>
              <div className="text-2xl font-black text-teal-950">
                {(summary?.total_income || totalCollected).toLocaleString()} ج.س
              </div>
              <div className="text-xs text-teal-900 mt-1 font-bold">
                سدد {summary?.paid_members_count || 0} من أصل {summary?.total_members || 24} عضو
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-rose-300 shadow-xs">
              <div className="text-xs text-slate-800 font-bold mb-1">إجمالي المنصرفات والمساعدات</div>
              <div className="text-2xl font-black text-rose-950">
                {(summary?.total_expenses || totalExpenses).toLocaleString()} ج.س
              </div>
              <div className="text-xs text-rose-900 mt-1 font-bold">مساعدات اجتماعية + شراء أصول</div>
            </div>
          </div>

          {/* تنبيه حد الأمان للخزينة */}
          <div
            className={`p-3.5 rounded-2xl border flex items-center gap-3 text-xs ${
              isSafetyBufferMaintained
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            {isSafetyBufferMaintained ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <div>
              <span className="font-bold">حد الأمان المالي للخزينة (المادة 4 من اللائحة): </span>
              <span>
                {isSafetyBufferMaintained
                  ? 'رصيد الخزينة يتجاوز الحد الأدنى الإلزامي (100,000 ج.س)، والوضع المالي للصندوق آمن ومستقر.'
                  : 'تنبيه حرج: رصيد الخزينة أقل من 100,000 ج.س. تماشياً مع اللائحة، لا يجوز صرف أي مبالغ حتى تغذية الخزينة.'}
              </span>
            </div>
          </div>

          {/* جدول المسددين لهذا الشهر */}
          <div className="space-y-3">
            <h5 className="font-bold text-sm text-slate-900 flex items-center justify-between">
              <span>قائمة الأعضاء المسددين لشهر {monthName}:</span>
              <span className="text-xs text-emerald-700 font-bold">
                {currentMonthApproved.length} أعضاء مسددين
              </span>
            </h5>
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
              <table className="w-full text-xs text-right">
                <thead className="bg-emerald-50 text-emerald-900 border-b border-emerald-100 font-bold">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">اسم العضو</th>
                    <th className="p-3">المبلغ</th>
                    <th className="p-3">طريقة السداد</th>
                    <th className="p-3">رقم المرجع</th>
                    <th className="p-3">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentMonthApproved.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-slate-400">
                        لم يتم توثيق أي سداد لشهر {monthName} حتى الآن.
                      </td>
                    </tr>
                  ) : (
                    currentMonthApproved.map((tx, idx) => (
                      <tr key={tx.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-3 font-bold text-slate-900">{tx.profiles?.full_name || 'عضو الصندوق'}</td>
                        <td className="p-3 font-mono text-emerald-700 font-bold">{Number(tx.amount).toLocaleString()} ج.س</td>
                        <td className="p-3">
                          {tx.type === 'cash' ? (
                            <span className="text-teal-700 font-medium">نقدي (كاش)</span>
                          ) : (
                            <span className="text-emerald-700 font-medium">تحويل بنكك</span>
                          )}
                        </td>
                        <td className="p-3 font-mono text-slate-600 text-[11px]">{tx.reference_number || '—'}</td>
                        <td className="p-3 text-slate-500">{new Date(tx.created_at).toLocaleDateString('ar-SD')}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* بيان المنصرفات */}
          <div className="space-y-3">
            <h5 className="font-bold text-sm text-slate-900">بيان المصروفات والمساعدات المعتمدة:</h5>
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
              <table className="w-full text-xs text-right">
                <thead className="bg-rose-50 text-rose-900 border-b border-rose-100 font-bold">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">بيان المنصرف</th>
                    <th className="p-3">التصنيف</th>
                    <th className="p-3">المبلغ</th>
                    <th className="p-3">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-slate-400">
                        لا توجد منصرفات مسجلة في هذا الشهر.
                      </td>
                    </tr>
                  ) : (
                    expenses.map((exp, idx) => (
                      <tr key={exp.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-3 font-bold text-slate-900">{exp.description}</td>
                        <td className="p-3 text-slate-600">
                          {exp.category === 'aid' ? 'مساعدة اجتماعية' : 'شراء أصل للجمعية'}
                        </td>
                        <td className="p-3 font-mono text-rose-600 font-bold">{Number(exp.amount).toLocaleString()} ج.س</td>
                        <td className="p-3 text-slate-500">{new Date(exp.created_at).toLocaleDateString('ar-SD')}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* التوقيع الرسمي */}
          <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
            <div>
              <span>تاريخ استخراج التقرير: </span>
              <strong className="text-slate-900 font-bold">{todayArabic}</strong>
            </div>
            <div className="text-left">
              <div>إدارة الجمعية والمسؤول المالي:</div>
              <div className="text-sm font-black text-emerald-800 mt-0.5">محمد حسن قديل (مدير الجمعية)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
