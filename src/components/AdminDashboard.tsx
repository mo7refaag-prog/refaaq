'use client';

import React, { useState } from 'react';
import {
  Wallet,
  Users,
  XCircle,
  TrendingDown,
  Layers,
  Eye,
  Check,
  X,
  DollarSign,
  Package,
  FileText,
  AlertTriangle,
  Share2,
  UserPlus,
  Trash2,
  Key,
} from 'lucide-react';
import {
  useFundSummary,
  useTransactions,
  useMembers,
  useExpenses,
  useAssets,
  useApproveTransaction,
  useRejectTransaction,
  useAddCashPayment,
  useAddExpense,
  useAddAsset,
  useAddMember,
  useCleanDatabase,
} from '@/lib/hooks/useCoopData';
import { TransactionWithProfile } from '@/types/database';
import { MonthlyReportModal } from '@/components/MonthlyReportModal';
import { UnpaidReportModal } from '@/components/UnpaidReportModal';

export function AdminDashboard() {
  const { data: summary } = useFundSummary();
  const { data: allTransactions, isLoading: isTxLoading } = useTransactions(undefined, true);
  const { data: members } = useMembers();
  const { data: expenses } = useExpenses();
  const { data: assets } = useAssets();

  const approveTxMutation = useApproveTransaction();
  const rejectTxMutation = useRejectTransaction();
  const addCashMutation = useAddCashPayment();
  const addExpenseMutation = useAddExpense();
  const addAssetMutation = useAddAsset();
  const addMemberMutation = useAddMember();
  const cleanDbMutation = useCleanDatabase();

  // نماذج المودال
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isCleanDbOpen, setIsCleanDbOpen] = useState(false);
  const [isMonthlyReportOpen, setIsMonthlyReportOpen] = useState(false);
  const [isUnpaidReportOpen, setIsUnpaidReportOpen] = useState(false);
  const [inspectingTx, setInspectingTx] = useState<TransactionWithProfile | null>(null);

  // حقول إضافة عضو جديد
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberPin, setNewMemberPin] = useState('1234');
  const [memberSuccessNotice, setMemberSuccessNotice] = useState<string | null>(null);

  // توليد رمز PIN عشوائي من 4 أرقام عند فتح نافذة العضو الجديد
  const handleOpenAddMember = () => {
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
    setNewMemberPin(randomPin);
    setNewMemberName('');
    setNewMemberPhone('');
    setMemberSuccessNotice(null);
    setIsAddMemberOpen(true);
  };

  const handleSaveMember = async () => {
    if (!newMemberName.trim()) return;
    await addMemberMutation.mutateAsync({
      fullName: newMemberName.trim(),
      phone: newMemberPhone.trim() || null,
      pinCode: newMemberPin.trim() || '1234',
      role: 'member',
    });
    setMemberSuccessNotice(`تمت إضافة العضو "${newMemberName.trim()}" بنجاح! رمز مروره الخاص هو: ${newMemberPin}`);
    setNewMemberName('');
    setNewMemberPhone('');
    setTimeout(() => {
      setIsAddMemberOpen(false);
      setMemberSuccessNotice(null);
    }, 2500);
  };

  const handleConfirmCleanDb = async () => {
    await cleanDbMutation.mutateAsync();
    setIsCleanDbOpen(false);
  };

  // التحقق من تاريخ اليوم (هل تجاوز اليوم العاشر من الشهر؟)
  const currentDayOfMonth = new Date().getDate();
  const isPastDay10 = currentDayOfMonth >= 10;

  // حقول دفع الكاش
  const [cashUserId, setCashUserId] = useState<string>('');
  const [cashMonth, setCashMonth] = useState<string>('2026-11-01');

  // حقول المصروفات
  const [expAmount, setExpAmount] = useState<number>(10000);
  const [expCategory, setExpCategory] = useState<'aid' | 'asset_purchase' | 'other'>('aid');
  const [expDesc, setExpDesc] = useState<string>('');

  // حقول الأصول
  const [assetName, setAssetName] = useState<string>('');
  const [assetQty, setAssetQty] = useState<number>(1);

  // تصفية الإيصالات المعلقة (Pending Queue)
  const pendingTransactions = allTransactions?.filter((t) => t.status === 'pending') || [];
  const processedTransactions = allTransactions?.filter((t) => t.status !== 'pending') || [];

  const handleApprove = async (id: string) => {
    await approveTxMutation.mutateAsync(id);
    if (inspectingTx?.id === id) setInspectingTx(null);
  };

  const handleReject = async (id: string) => {
    await rejectTxMutation.mutateAsync(id);
    if (inspectingTx?.id === id) setInspectingTx(null);
  };

  const handleSaveCash = async () => {
    if (!cashUserId) return;
    await addCashMutation.mutateAsync({
      userId: cashUserId,
      amount: 15000,
      paymentMonth: cashMonth,
    });
    setIsCashModalOpen(false);
    setCashUserId('');
  };

  const handleSaveExpense = async () => {
    if (!expDesc.trim() || !expAmount) return;
    await addExpenseMutation.mutateAsync({
      amount: Number(expAmount),
      category: expCategory,
      description: expDesc.trim(),
    });
    setIsExpenseModalOpen(false);
    setExpDesc('');
  };

  const handleSaveAsset = async () => {
    if (!assetName.trim()) return;
    await addAssetMutation.mutateAsync({
      name: assetName.trim(),
      quantity: Number(assetQty) || 1,
      status: 'available',
    });
    setIsAssetModalOpen(false);
    setAssetName('');
  };

  return (
    <div className="space-y-6 pb-24">
      {/* 1. بطاقات الملخص الرئيسية (Summary Cards) - ثيم أبيض مائل للأخضر الفاتح */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* رصيد الصندوق */}
        <div className="glass-card p-5 border border-emerald-200 bg-white">
          <div className="flex items-center justify-between text-slate-800 text-xs font-bold mb-2">
            <span>الرصيد الفعلي المتوفر</span>
            <Wallet className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-xl md:text-2xl font-black text-emerald-950">
            {summary?.balance.toLocaleString()} ج.س
          </div>
          <div className="text-xs text-emerald-900 font-bold mt-1">شامل التحويلات والكاش</div>
        </div>

        {/* المسددين لهذا الشهر */}
        <div className="glass-card p-5 border border-teal-200 bg-white">
          <div className="flex items-center justify-between text-slate-800 text-xs font-bold mb-2">
            <span>مسددي هذا الشهر</span>
            <Users className="w-4 h-4 text-teal-700" />
          </div>
          <div className="text-xl md:text-2xl font-black text-teal-950">
            {summary?.paid_members_count} / {summary?.total_members}
          </div>
          <div className="text-xs text-teal-900 font-bold mt-1">نسبة السداد: {Math.round(((summary?.paid_members_count || 0) / (summary?.total_members || 1)) * 100)}%</div>
        </div>

        {/* المتبقين (المتعثرين) */}
        <div className="glass-card p-5 border border-amber-200 bg-white">
          <div className="flex items-center justify-between text-slate-800 text-xs font-bold mb-2">
            <span>المتبقي تحصيله</span>
            <XCircle className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-xl md:text-2xl font-black text-amber-950">
            {summary?.unpaid_members_count} أعضاء
          </div>
          <div className="text-xs text-amber-900 font-bold mt-1">{(summary?.unpaid_members_count || 0) * 15000} ج.س متبقية</div>
        </div>

        {/* إجمالي المصروفات */}
        <div className="glass-card p-5 border border-rose-200 bg-white">
          <div className="flex items-center justify-between text-slate-800 text-xs font-bold mb-2">
            <span>إجمالي المنصرفات</span>
            <TrendingDown className="w-4 h-4 text-rose-700" />
          </div>
          <div className="text-xl md:text-2xl font-black text-rose-950">
            {summary?.total_expenses.toLocaleString()} ج.س
          </div>
          <div className="text-xs text-rose-900 font-bold mt-1">مساعدات + شراء أصول</div>
        </div>
      </div>

      {/* شريط تنبيه ما بعد يوم 10 من الشهر (المتأخرين عن السداد) */}
      {(summary?.unpaid_members_count || 0) > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-300 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-200 text-amber-900 border border-amber-300 shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-800" />
            </div>
            <div>
              <div className="text-sm font-black text-amber-950 flex items-center gap-2">
                <span>تنبيه نظامي: تجاوز مهلة سداد الاشتراكات (يوم 10)</span>
                {isPastDay10 && (
                  <span className="text-[10px] bg-red-100 text-red-800 border border-red-300 px-2 py-0.5 rounded-full font-bold">
                    انقضت المهلة
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-800 font-medium mt-0.5">
                يوجد <strong className="text-amber-950 font-black">{summary?.unpaid_members_count} أعضاء</strong> لم يسددوا اشتراك هذا الشهر حتى الآن (المتبقي: {(summary?.unpaid_members_count || 0) * 15000} ج.س).
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsUnpaidReportOpen(true)}
            className="touch-button bg-amber-700 hover:bg-amber-600 text-white font-bold text-xs px-4 py-2.5 flex items-center justify-center gap-1.5 shrink-0 shadow-xs"
          >
            <Share2 className="w-4 h-4" />
            <span>كشف غير المسددين (PDF للواتساب)</span>
          </button>
        </div>
      )}

      {/* قسم التقارير الرسمية لمدير الجمعية (تصدير PDF ومشاركة واتساب) */}
      <div className="p-4 rounded-2xl glass-card border border-emerald-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h4 className="font-black text-base text-slate-950 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-700" />
            <span>تقارير إدارة الجمعية الرسمية (PDF & WhatsApp)</span>
          </h4>
          <p className="text-xs text-slate-700 font-medium mt-0.5">
            توليد ومشاركة التقارير الدورية وكشوفات التحصيل مباشرة في قروب الجمعية
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsMonthlyReportOpen(true)}
            className="touch-button bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs px-4 py-2.5 flex items-center gap-2 shadow-xs"
          >
            <FileText className="w-4 h-4" />
            <span>تقرير مدير الجمعية الشهري (PDF)</span>
          </button>

          <button
            onClick={() => setIsUnpaidReportOpen(true)}
            className="touch-button bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-900 font-bold text-xs px-4 py-2.5 flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>كشف غير المسددين فقط</span>
          </button>
        </div>
      </div>

      {/* 2. أزرار الإجراءات السريعة لمدير الجمعية */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
            لوحة الإجراءات والإدارة
          </h4>
          <button
            onClick={() => setIsCleanDbOpen(true)}
            className="text-xs text-rose-700 hover:text-rose-900 font-bold flex items-center gap-1 p-1.5 rounded-lg hover:bg-rose-50 transition"
            title="تفريغ المعاملات والمصروفات والأصول لبدء تجربة فعلية جديدة"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>تصفير الجداول للبدء الفعلي</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={handleOpenAddMember}
            className="touch-button bg-emerald-700 hover:bg-emerald-600 text-white font-bold shadow-xs flex items-center justify-center gap-2 col-span-2 sm:col-span-1"
          >
            <UserPlus className="w-4 h-4" />
            <span>إضافة عضو جديد</span>
          </button>

          <button
            onClick={() => setIsCashModalOpen(true)}
            className="touch-button bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-950 font-bold shadow-xs flex items-center justify-center gap-2"
          >
            <DollarSign className="w-4 h-4 text-emerald-700" />
            <span>تسجيل دفع كاش</span>
          </button>

          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="touch-button bg-white hover:bg-rose-50 border border-rose-300 text-rose-950 font-bold shadow-xs flex items-center justify-center gap-2"
          >
            <TrendingDown className="w-4 h-4 text-rose-700" />
            <span>تسجيل منصرف</span>
          </button>

          <button
            onClick={() => setIsAssetModalOpen(true)}
            className="touch-button bg-white hover:bg-purple-50 border border-purple-300 text-purple-950 font-bold shadow-xs flex items-center justify-center gap-2"
          >
            <Package className="w-4 h-4 text-purple-700" />
            <span>إضافة أصل</span>
          </button>
        </div>
      </div>

      {/* 3. طابور مراجعة الإيصالات المعلقة (Receipts Queue) */}
      <div className="glass-card p-6 border border-emerald-100 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
              <Layers className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-950">طابور مراجعة الإيصالات (OCR Review)</h3>
              <p className="text-xs text-slate-700 font-medium">
                مطابقة قراءة الإشعار الذكية مع الصورة قبل الاعتماد
              </p>
            </div>
          </div>
          <span className="text-xs bg-amber-100 text-amber-950 px-3 py-1 rounded-full font-black border border-amber-300">
            {pendingTransactions.length} قيد الانتظار
          </span>
        </div>

        {pendingTransactions.length === 0 ? (
          <div className="text-center py-8 text-slate-700 font-bold text-sm">
            ممتاز! لا توجد إيصالات معلقة بانتظار المراجعة حالياً.
          </div>
        ) : (
          <div className="space-y-3">
            {pendingTransactions.map((tx) => (
              <div
                key={tx.id}
                className="p-4 rounded-2xl bg-white border border-slate-300 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  {tx.receipt_image_url ? (
                    <img
                      src={tx.receipt_image_url}
                      alt="الإشعار"
                      className="w-14 h-14 object-cover rounded-xl border border-slate-300 cursor-pointer hover:opacity-80 transition"
                      onClick={() => setInspectingTx(tx)}
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-slate-200 flex items-center justify-center text-slate-700 font-bold">
                      لا صورة
                    </div>
                  )}

                  <div>
                    <h4 className="font-black text-slate-950 text-base">
                      {tx.profiles?.full_name || 'عضو غير معروف'}
                    </h4>
                    <div className="text-xs text-slate-800 flex items-center gap-2 mt-0.5 font-medium">
                      <span>المبلغ المستخرج: <strong className="text-emerald-950 font-black">{Number(tx.amount).toLocaleString()} ج.س</strong></span>
                      <span>•</span>
                      <span>المرجع: <strong className="font-mono text-slate-950 font-bold">{tx.reference_number || 'غير محدد'}</strong></span>
                    </div>
                    <div className="text-xs text-slate-700 font-medium mt-1">
                      هاتف: {tx.profiles?.phone || 'غير مسجل'} • لشهر {tx.payment_month}
                    </div>
                  </div>
                </div>

                {/* أزرار المطابقة والاعتماد السريع */}
                <div className="flex items-center gap-2 self-end md:self-center">
                  {tx.receipt_image_url && (
                    <button
                      onClick={() => setInspectingTx(tx)}
                      className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-800 border border-slate-300"
                      title="معاينة الصورة"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => handleReject(tx.id)}
                    disabled={rejectTxMutation.isPending}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-300 rounded-xl text-sm font-bold flex items-center gap-1.5 transition"
                  >
                    <X className="w-4 h-4" />
                    <span>رفض</span>
                  </button>

                  <button
                    onClick={() => handleApprove(tx.id)}
                    disabled={approveTxMutation.isPending}
                    className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold flex items-center gap-1.5 shadow-sm transition"
                  >
                    <Check className="w-4 h-4" />
                    <span>اعتماد الإشعار</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. سجل العمليات السابقة والمعتمدة */}
      <div className="glass-card p-6 border border-emerald-200 bg-white">
        <h3 className="font-black text-lg text-slate-950 mb-4">أحدث العمليات المسجلة</h3>
        <div className="space-y-2">
          {processedTransactions.slice(0, 8).map((tx) => (
            <div
              key={tx.id}
              className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-sm shadow-xs"
            >
              <div>
                <span className="font-black text-slate-950">{tx.profiles?.full_name}</span>
                <span className="text-xs text-slate-700 font-bold mr-2">
                  ({tx.type === 'bank_transfer' ? 'تحويل بنكي' : 'كاش نقدي'})
                </span>
                <div className="text-xs text-slate-700 font-mono font-medium mt-0.5">
                  مرجع: {tx.reference_number || 'CSH'} • {new Date(tx.created_at).toLocaleDateString('ar-SD')}
                </div>
              </div>
              <div className="text-left">
                <div className="font-black text-emerald-950 text-base">{Number(tx.amount).toLocaleString()} ج.س</div>
                <span className="text-xs text-emerald-900 font-bold">معتمد</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* نافذة معاينة صورة الإشعار للمطابقة */}
      {inspectingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-lg glass-card p-6 border border-slate-300 bg-white text-slate-950 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-lg text-slate-950">مطابقة إشعار: {inspectingTx.profiles?.full_name}</h3>
              <button
                onClick={() => setInspectingTx(null)}
                className="p-1 rounded-full bg-slate-100 text-slate-700 hover:text-slate-950"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {inspectingTx.receipt_image_url && (
              <div className="mb-4 bg-slate-900 rounded-xl overflow-hidden max-h-80 flex items-center justify-center p-2">
                <img
                  src={inspectingTx.receipt_image_url}
                  alt="الإشعار الأصلي"
                  className="max-h-72 w-auto object-contain rounded-lg"
                />
              </div>
            )}

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5 mb-5 text-slate-800">
              <div>المبلغ المطلوب اعتماده: <strong className="text-emerald-950 font-black text-base">{Number(inspectingTx.amount).toLocaleString()} ج.س</strong></div>
              <div>الرقم المرجعي المقروء: <strong className="font-mono text-slate-950 font-bold">{inspectingTx.reference_number}</strong></div>
              <div className="text-slate-700 font-medium">تاريخ الرفع: {new Date(inspectingTx.created_at).toLocaleString('ar-SD')}</div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleApprove(inspectingTx.id)}
                className="flex-1 touch-button bg-emerald-700 hover:bg-emerald-600 text-white font-bold"
              >
                مطابق، اعتماد
              </button>
              <button
                onClick={() => handleReject(inspectingTx.id)}
                className="flex-1 touch-button bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-300 font-bold"
              >
                رفض الإشعار
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة تسجيل كاش نقدي */}
      {isCashModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md glass-card p-6 border border-emerald-300 bg-white text-slate-950 shadow-2xl">
            <h3 className="font-black text-xl text-slate-950 mb-1">تسجيل سداد نقدي (كاش)</h3>
            <p className="text-xs text-slate-700 font-medium mb-4">يتم الاعتماد والإدراج في الصندوق فوراً</p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">اختر العضو المسدد</label>
                <select
                  value={cashUserId}
                  onChange={(e) => setCashUserId(e.target.value)}
                  className="w-full glass-input bg-white text-slate-950 border-slate-300 font-semibold"
                >
                  <option value="" className="text-slate-500">-- اضغط لاختيار اسم العضو --</option>
                  {members?.map((m) => (
                    <option key={m.id} value={m.id} className="text-slate-900">
                      {m.full_name} ({m.phone || 'بدون هاتف'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">المبلغ المقرر</label>
                <input
                  type="text"
                  disabled
                  value="15,000 ج.س"
                  className="w-full glass-input bg-slate-100 text-emerald-950 font-black text-lg border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">شهر السداد</label>
                <select
                  value={cashMonth}
                  onChange={(e) => setCashMonth(e.target.value)}
                  className="w-full glass-input bg-white text-slate-950 border-slate-300 font-semibold"
                >
                  <option value="2026-11-01">نوفمبر 2026</option>
                  <option value="2026-10-01">أكتوبر 2026</option>
                  <option value="2026-12-01">ديسمبر 2026</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSaveCash}
                disabled={!cashUserId || addCashMutation.isPending}
                className="flex-1 touch-button bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold"
              >
                تأكيد وقبض الكاش
              </button>
              <button
                onClick={() => setIsCashModalOpen(false)}
                className="px-4 touch-button bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold border border-slate-300"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة تسجيل منصرف / مساعدة */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md glass-card p-6 border border-rose-300 bg-white text-slate-950 shadow-2xl">
            <h3 className="font-black text-xl text-slate-950 mb-1">تسجيل منصرف من الصندوق</h3>
            <p className="text-xs text-slate-700 font-medium mb-4">مساعدة زواج، علاج، أو صيانة معدات</p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">المبلغ (ج.س)</label>
                <input
                  type="number"
                  value={expAmount}
                  onChange={(e) => setExpAmount(Number(e.target.value))}
                  className="w-full glass-input text-rose-950 font-black text-xl border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">التصنيف</label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value as 'aid' | 'asset_purchase' | 'other')}
                  className="w-full glass-input bg-white text-slate-950 border-slate-300 font-semibold"
                >
                  <option value="aid">مساعدة اجتماعية / علاجية</option>
                  <option value="asset_purchase">شراء أصل أو معدات للجمعية</option>
                  <option value="other">مصروفات أخرى</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">الوصف والتفاصيل</label>
                <textarea
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  placeholder="مثال: مساعدة زواج للعضو فلان..."
                  rows={3}
                  className="w-full glass-input text-slate-950 border-slate-300 font-medium"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSaveExpense}
                disabled={!expDesc.trim() || addExpenseMutation.isPending}
                className="flex-1 touch-button bg-rose-700 hover:bg-rose-600 disabled:opacity-50 text-white font-bold"
              >
                خصم وتسجيل المنصرف
              </button>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="px-4 touch-button bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold border border-slate-300"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة إضافة أصل */}
      {isAssetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md glass-card p-6 border border-purple-300 bg-white text-slate-950 shadow-2xl">
            <h3 className="font-black text-xl text-slate-950 mb-1">إضافة أصل جديد للجمعية</h3>
            <p className="text-xs text-slate-700 font-medium mb-4">لتسجيل الخيام، الكراسي، المبردات وغيرها</p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">اسم الأصل</label>
                <input
                  type="text"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  placeholder="مثال: خيمة مناسبات 6×4م"
                  className="w-full glass-input text-slate-950 border-slate-300 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">الكمية</label>
                <input
                  type="number"
                  min="1"
                  value={assetQty}
                  onChange={(e) => setAssetQty(Number(e.target.value))}
                  className="w-full glass-input text-slate-950 border-slate-300 font-bold"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSaveAsset}
                disabled={!assetName.trim() || addAssetMutation.isPending}
                className="flex-1 touch-button bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white font-bold"
              >
                إضافة الأصل
              </button>
              <button
                onClick={() => setIsAssetModalOpen(false)}
                className="px-4 touch-button bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold border border-slate-300"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة إضافة عضو جديد من قبل مدير الجمعية */}
      {isAddMemberOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md glass-card p-6 border border-emerald-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                  <UserPlus className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg text-emerald-950">إضافة عضو جديد للجمعية</h3>
              </div>
              <button
                onClick={() => setIsAddMemberOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              إدراج عضو جديد في قائمة الصندوق وتحديد رمز المرور (PIN) الخاص به
            </p>

            {memberSuccessNotice ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs text-center space-y-2 mb-4 animate-in fade-in">
                <div className="font-bold text-sm">🎉 {memberSuccessNotice}</div>
                <div className="text-[11px] text-emerald-700">يمكن للعضو الآن الدخول مباشرة للتطبيق.</div>
              </div>
            ) : (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الاسم الكامل / الرباعي *
                  </label>
                  <input
                    type="text"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    placeholder="مثال: عثمان محمد علي"
                    className="w-full glass-input"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    رقم الهاتف (اختياري)
                  </label>
                  <input
                    type="tel"
                    value={newMemberPhone}
                    onChange={(e) => setNewMemberPhone(e.target.value)}
                    placeholder="مثال: 0912345678"
                    className="w-full glass-input font-mono"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      رمز المرور السريع (PIN) *
                    </label>
                    <span className="text-[11px] text-emerald-700 font-medium">
                      4 أرقام خاصة به
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={6}
                      value={newMemberPin}
                      onChange={(e) => setNewMemberPin(e.target.value)}
                      placeholder="1234"
                      className="w-full glass-input font-mono text-center tracking-widest text-lg font-bold text-emerald-800"
                    />
                    <Key className="w-4 h-4 text-emerald-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    onClick={handleSaveMember}
                    disabled={!newMemberName.trim() || addMemberMutation.isPending}
                    className="flex-1 touch-button bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm"
                  >
                    {addMemberMutation.isPending ? 'جارٍ الحفظ...' : 'حفظ وإضافة العضو'}
                  </button>
                  <button
                    onClick={() => setIsAddMemberOpen(false)}
                    className="px-4 touch-button bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* نافذة تأكيد تصفير الجداول للبدء الفعلي */}
      {isCleanDbOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md glass-card p-6 border border-rose-200 bg-white shadow-2xl">
            <div className="flex items-center gap-2.5 mb-2 text-rose-600">
              <Trash2 className="w-6 h-6" />
              <h3 className="font-bold text-lg text-rose-950">تصفير بيانات الجداول للبدء الفعلي</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              هل أنت متأكد من تصفير المعاملات والمصروفات والأصول السابقة للبدء بتجربة فعلية حقيقية؟
              <br />
              <strong className="text-emerald-800 font-bold">ملاحظة هامة:</strong> جدول أسماء الأعضاء (24 عضواً) ثابت ومحفوظ ولن يُمس نهائياً.
            </p>

            <div className="flex gap-2.5">
              <button
                onClick={handleConfirmCleanDb}
                disabled={cleanDbMutation.isPending}
                className="flex-1 touch-button bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm"
              >
                {cleanDbMutation.isPending ? 'جارٍ التصفير...' : 'نعم، تصفير والبدء من الصفر'}
              </button>
              <button
                onClick={() => setIsCleanDbOpen(false)}
                className="px-4 touch-button bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold"
              >
                تراجع
              </button>
            </div>
          </div>
        </div>
      )}

      {/* تقرير مدير الجمعية الشهري (PDF & WhatsApp) */}
      <MonthlyReportModal
        isOpen={isMonthlyReportOpen}
        onClose={() => setIsMonthlyReportOpen(false)}
        summary={summary}
        transactions={allTransactions}
        expenses={expenses}
        assets={assets}
        selectedMonth="2026-11"
      />

      {/* كشف المتأخرين عن السداد (بعد يوم 10) */}
      <UnpaidReportModal
        isOpen={isUnpaidReportOpen}
        onClose={() => setIsUnpaidReportOpen(false)}
        members={members}
        transactions={allTransactions}
        selectedMonth="2026-11"
      />
    </div>
  );
}
