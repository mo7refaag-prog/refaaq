'use client';

import React, { useState } from 'react';
import { 
  UploadCloud, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Wallet, 
  TrendingUp, 
  Users, 
  Receipt,
  Package,
  HeartHandshake,
  BookOpen,
  ArrowLeft
} from 'lucide-react';
import { Profile } from '@/types/database';
import { useFundSummary, useTransactions, useAssets, useExpenses } from '@/lib/hooks/useCoopData';
import { ReceiptUploadModal } from './ReceiptUploadModal';

interface MemberDashboardProps {
  currentUser: Profile;
  onOpenRules?: () => void;
}

export function MemberDashboard({ currentUser, onOpenRules }: MemberDashboardProps) {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'assets' | 'expenses'>('overview');

  const { data: summary, isLoading: isSummaryLoading } = useFundSummary();
  const { data: allTransactions, isLoading: isTxLoading } = useTransactions();
  const { data: assets } = useAssets();
  const { data: expenses } = useExpenses();

  // تصفية معاملات العضو الحالي
  const myTransactions = allTransactions?.filter((t) => t.user_id === currentUser.id) || [];
  
  // حالة سداد العضو لشهر نوفمبر
  const myNovemberTx = myTransactions.find((t) => t.payment_month === '2026-11-01');
  const isPaidThisMonth = myNovemberTx?.status === 'approved';
  const pendingThisMonth = myNovemberTx?.status === 'pending';

  return (
    <div className="space-y-6 pb-24 text-slate-900">
      {/* 1. بطاقة البطل: حالة سداد العضو الحالي (Member Payment Status Hero Card) */}
      <div
        className={`p-6 md:p-8 rounded-3xl border shadow-sm transition-all ${
          isPaidThisMonth && !pendingThisMonth
            ? 'bg-gradient-to-br from-emerald-50 via-teal-50 to-white border-emerald-300'
            : pendingThisMonth
            ? 'bg-gradient-to-br from-amber-50 via-orange-50 to-white border-amber-300'
            : 'bg-gradient-to-br from-rose-50 via-red-50 to-white border-rose-300'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-black bg-white border border-emerald-300 text-emerald-950 shadow-xs">
              <span>اشتراك شهر نوفمبر 2026</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              <span>15,000 ج.س</span>
            </div>

            <div className="flex items-center gap-3">
              {isPaidThisMonth && !pendingThisMonth ? (
                <div className="p-3 bg-emerald-100 text-emerald-800 rounded-2xl border border-emerald-300">
                  <CheckCircle className="w-8 h-8 text-emerald-700" />
                </div>
              ) : pendingThisMonth ? (
                <div className="p-3 bg-amber-100 text-amber-900 rounded-2xl border border-amber-300">
                  <Clock className="w-8 h-8 text-amber-700" />
                </div>
              ) : (
                <div className="p-3 bg-rose-100 text-rose-900 rounded-2xl border border-rose-300">
                  <AlertTriangle className="w-8 h-8 text-rose-700" />
                </div>
              )}

              <div>
                <h2 className="text-2xl md:text-3xl font-black text-slate-950">
                  {isPaidThisMonth && !pendingThisMonth
                    ? 'تم سداد اشتراكك لهذا الشهر'
                    : pendingThisMonth
                    ? 'الإشعار قيد المراجعة والاعتماد'
                    : 'لم يتم سداد اشتراك هذا الشهر'}
                </h2>
                <p className="text-sm text-slate-800 font-medium">
                  {isPaidThisMonth && !pendingThisMonth
                    ? 'جزاك الله خيراً، مساهمتك تسند صندوق التكافل والخدمات في الحي'
                    : pendingThisMonth
                    ? 'تم استلام إشعارك وهو الآن لدى إدارة الجمعية للمطابقة'
                    : 'يرجى تحويل 15,000 ج.س ورفع الإشعار لتسجيل اشتراكك'}
                </p>
              </div>
            </div>
          </div>

          {/* زر رفع الإشعار البارز (Big CTA) */}
          <button
            onClick={() => setIsUploadOpen(true)}
            className="touch-button px-6 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-lg shadow-md shadow-emerald-950/15 flex items-center justify-center gap-3 whitespace-nowrap"
          >
            <UploadCloud className="w-6 h-6" />
            <span>رفع إشعار الدفع</span>
          </button>
        </div>
      </div>

      {/* بنر الوصول السريع لقوانين الجمعية والدستور */}
      {onOpenRules && (
        <div
          onClick={onOpenRules}
          className="p-4 rounded-2xl bg-white border border-emerald-200 hover:border-emerald-400 cursor-pointer transition shadow-xs flex items-center justify-between gap-3 group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-300 group-hover:scale-105 transition">
              <BookOpen className="w-5 h-5 text-emerald-800" />
            </div>
            <div>
              <div className="text-xs text-amber-900 font-black mb-0.5">
                القاعدة الذهبية: «كل من يسجل عليه ما علينا وله ما لنا»
              </div>
              <div className="text-sm font-black text-slate-950">
                دستور ولائحة صندوق رِفَاق والأهداف المستقبلية
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-emerald-900 font-black group-hover:translate-x-[-4px] transition">
            <span>تصفح اللائحة</span>
            <ArrowLeft className="w-4 h-4" />
          </div>
        </div>
      )}

      {/* 2. ويدجت الشفافية المالية (Transparency Widget) */}
      <div className="glass-card p-6 border border-emerald-200 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-900 rounded-xl">
              <Wallet className="w-5 h-5 text-emerald-700" />
            </div>
            <h3 className="font-black text-lg text-slate-950">صندوق الجمعية (تقرير الشفافية)</h3>
          </div>
          <span className="text-xs bg-emerald-100 text-emerald-950 px-3 py-1 rounded-full border border-emerald-300 font-black">
            {summary?.total_members || 24} عضواً مسجلاً
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* الرصيد الإجمالي */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="text-xs text-slate-800 font-bold mb-1">الرصيد المتاح بالصندوق</div>
            <div className="text-2xl font-black text-emerald-950">
              {isSummaryLoading ? '...' : `${summary?.balance.toLocaleString()} ج.س`}
            </div>
            <div className="text-xs text-emerald-900 mt-1 flex items-center gap-1 font-bold">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
              <span>جاهز لدعم المساعدات وأنشطة الحي</span>
            </div>
          </div>

          {/* المسددين لهذا الشهر */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="text-xs text-slate-800 font-bold mb-1">المسددين لشهر نوفمبر</div>
            <div className="text-2xl font-black text-teal-950">
              {isSummaryLoading ? '...' : `${summary?.paid_members_count} من أصل ${summary?.total_members}`}
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${((summary?.paid_members_count || 0) / (summary?.total_members || 1)) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* المتبقين دون كشف أسمائهم لحفظ الخصوصية */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="text-xs text-slate-800 font-bold mb-1">المتبقي من الاشتراكات</div>
            <div className="text-2xl font-black text-amber-950">
              {isSummaryLoading ? '...' : `${summary?.unpaid_members_count} أعضاء`}
            </div>
            <div className="text-xs text-amber-900 mt-1 flex items-center gap-1 font-bold">
              <Users className="w-3.5 h-3.5 text-amber-700" />
              <span>تبقى {(summary?.unpaid_members_count || 0) * 15000} ج.س</span>
            </div>
          </div>
        </div>
      </div>

      {/* التبديل بين التبويبات */}
      <div className="flex border-b border-emerald-200 gap-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-4 text-sm font-black transition border-b-2 ${
            activeTab === 'overview'
              ? 'border-emerald-700 text-emerald-950'
              : 'border-transparent text-slate-700 hover:text-slate-950'
          }`}
        >
          سجل مدفوعاتي السابقة
        </button>
        <button
          onClick={() => setActiveTab('assets')}
          className={`pb-3 px-4 text-sm font-black transition border-b-2 ${
            activeTab === 'assets'
              ? 'border-emerald-700 text-emerald-950'
              : 'border-transparent text-slate-700 hover:text-slate-950'
          }`}
        >
          أصول الجمعية (المتوفر للإعارة)
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`pb-3 px-4 text-sm font-black transition border-b-2 ${
            activeTab === 'expenses'
              ? 'border-emerald-700 text-emerald-950'
              : 'border-transparent text-slate-700 hover:text-slate-950'
          }`}
        >
          أوجه الصرف والمساعدات
        </button>
      </div>

      {/* محتوى التبويب: سجل المدفوعات */}
      {activeTab === 'overview' && (
        <div className="space-y-3">
          {isTxLoading ? (
            <div className="text-center py-8 text-slate-700 font-bold text-sm">جاري تحميل المعاملات...</div>
          ) : myTransactions && myTransactions.length > 0 ? (
            myTransactions.map((tx) => (
              <div
                key={tx.id}
                className="glass-card p-4 border border-slate-200 bg-white flex items-center justify-between shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <Receipt className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <div className="font-black text-base text-slate-950">
                      <span className="text-emerald-950">{Number(tx.amount).toLocaleString()} ج.س</span>
                      <span className="text-xs font-bold text-slate-700 mr-2">
                        ({tx.type === 'bank_transfer' ? 'تحويل بنكي' : 'نقداً كاش'})
                      </span>
                    </div>
                    <div className="text-xs text-slate-700 font-medium mt-0.5">
                      المرجع: <span className="font-mono text-slate-950 font-bold">{tx.reference_number || 'بدون'}</span> •{' '}
                      {new Date(tx.created_at).toLocaleDateString('ar-SD')}
                    </div>
                  </div>
                </div>

                <div className="text-left">
                  {tx.status === 'approved' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-950 border border-emerald-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                      معتمد
                    </span>
                  ) : tx.status === 'pending' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-950 border border-amber-300">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                      قيد المراجعة
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-950 border border-rose-300">
                      مرفوض
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 glass-card p-6 border border-slate-200 bg-white text-slate-700 font-bold text-sm">
              لا توجد دفعات مسجلة لك حتى الآن.
            </div>
          )}
        </div>
      )}

      {/* محتوى التبويب: أصول الجمعية */}
      {activeTab === 'assets' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {assets && assets.length > 0 ? (
            assets.map((asset) => (
              <div key={asset.id} className="glass-card p-4 border border-slate-200 bg-white flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-teal-50 text-teal-800 rounded-2xl border border-teal-200">
                    <Package className="w-6 h-6 text-teal-700" />
                  </div>
                  <div>
                    <h4 className="font-black text-base text-slate-950">{asset.name}</h4>
                    <div className="text-xs text-slate-700 font-bold mt-0.5">الكمية: {asset.quantity}</div>
                  </div>
                </div>
                <span
                  className={`text-xs px-3 py-1 rounded-full font-black ${
                    asset.status === 'available'
                      ? 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                      : 'bg-amber-100 text-amber-950 border border-amber-300'
                  }`}
                >
                  {asset.status === 'available' ? 'متوفر' : 'مُعار حالياً'}
                </span>
              </div>
            ))
          ) : (
            <div className="col-span-2 text-center py-10 glass-card p-6 border border-slate-200 bg-white text-slate-700 font-bold text-sm">
              لا توجد أصول مسجلة حالياً.
            </div>
          )}
        </div>
      )}

      {/* محتوى التبويب: المصروفات والمساعدات */}
      {activeTab === 'expenses' && (
        <div className="space-y-3">
          {expenses && expenses.length > 0 ? (
            expenses.map((exp) => (
              <div key={exp.id} className="glass-card p-4 border border-slate-200 bg-white flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-rose-50 text-rose-800 rounded-xl border border-rose-200">
                    <HeartHandshake className="w-5 h-5 text-rose-700" />
                  </div>
                  <div>
                    <div className="font-black text-slate-950 text-sm">{exp.description}</div>
                    <div className="text-xs text-slate-700 font-medium mt-0.5">
                      {exp.category === 'aid' ? 'مساعدة اجتماعية' : 'شراء أصول'} •{' '}
                      {new Date(exp.created_at).toLocaleDateString('ar-SD')}
                    </div>
                  </div>
                </div>
                <div className="font-black text-rose-950 text-base">
                  -{Number(exp.amount).toLocaleString()} ج.س
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 glass-card p-6 border border-slate-200 bg-white text-slate-700 font-bold text-sm">
              لا توجد منصرفات مسجلة حتى الآن.
            </div>
          )}
        </div>
      )}

      {/* نافذة رفع الإيصال */}
      <ReceiptUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        userId={currentUser.id}
      />
    </div>
  );
}
