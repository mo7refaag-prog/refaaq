'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  Scale,
  Calendar,
  Target,
  Sparkles,
  Printer,
  Share2,
  ArrowRight,
  Landmark,
  Users2,
} from 'lucide-react';
import { shareOrSendToWhatsApp } from '@/lib/pdf-generator';

interface RulesPageProps {
  onBack?: () => void;
}

export function RulesPage({ onBack }: RulesPageProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'membership' | 'finance' | 'governance' | 'future' | 'proposals'>('all');

  const handleShareWhatsApp = async () => {
    const summaryText = `📜 *دستور ولائحة صندوق جمعية رِفَاق التعاونية*
📍 *حي أم القرى - بورتسودان*
────────────────────────
القاعدة الذهبية: «كل من يسجل عليه ما علينا وله ما لنا»

🔹 *أهم الضوابط المالية والتنظيمية:*
• الاشتراك الشهري: 15,000 ج.س يُسدد في موعد أقصاه يوم 10 من كل شهر.
• المسجل الجديد: يدخل مباشرة ويسدد اشتراك الشهر كاملاً حتى لو في منتصفه.
• العضو المنسحب العائد: يسدد غرامة تعويضية محسوبة بأثر رجعي عن فترة انقطاعه برسوم كل فترة زمنية.
• سقف المناسبات (عرس / تسمية مولود / طوارئ): 100,000 ج.س كحد أقصى.
• الحد الأدنى الإلزامي للخزينة: لا يتم صرف أي مليم إذا قل رصيد الخزينة عن 100,000 ج.س.
• الاجتماعات وتدوير المهام: كل 3 أشهر مع تغيير المسؤوليات وإسنادها لأعضاء جدد.
• الزيادات السنوية: تتم بعد تشاور وموافقة أعضاء الجمعية.

📌 للإطلاع على اللائحة الكاملة والأهداف المستقبلية:
تطبيق رِفَاق التعاوني`;

    await shareOrSendToWhatsApp({
      title: 'دستور ولائحة صندوق رفاق التعاوني',
      text: summaryText,
    });
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-200">
      {/* الشريط العلوي للتحكم والتنقل */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl glass-card border border-emerald-100 bg-white">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-950 transition"
              title="العودة للوحة الرئيسية"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
          <img
            src="/logo.png"
            alt="شعار رفاق"
            className="h-11 md:h-12 w-auto object-contain"
          />
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-950 flex items-center gap-2">
              <span>دستور ولائحة صندوق رِفَاق</span>
              <span className="text-[11px] bg-emerald-100 text-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-300 font-bold">
                معتمدة 2026
              </span>
            </h2>
            <p className="text-xs text-slate-700 font-medium">
              الضوابط المنظمة، الحقوق والواجبات، والأهداف المستقبلية
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShareWhatsApp}
            className="touch-button bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3.5 py-2 flex items-center gap-1.5 shadow-xs"
          >
            <Share2 className="w-4 h-4" />
            <span>مشاركة في قروب الواتساب</span>
          </button>
          <button
            onClick={handlePrint}
            className="touch-button bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs px-3 py-2 flex items-center gap-1.5"
            title="طباعة اللائحة"
          >
            <Printer className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">طباعة</span>
          </button>
        </div>
      </div>

      {/* بطاقة المبدأ التأسيسي العام للجمعية */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-white border border-emerald-200 shadow-xs relative overflow-hidden">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0 text-emerald-700">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>المبدأ التأسيسي العام (القاعدة الذهبية)</span>
            </div>
            <h3 className="text-lg md:text-xl font-black text-slate-900 leading-relaxed">
              «كل من يسجل في هذا الصندوق.. عليه ما علينا، وله ما لنا»
            </h3>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-medium">
              تأسس صندوق رِفَاق ليكون مظلة تكافلية اجتماعية جامعة لأبناء الحي؛ تتساوى فيها الرؤوس وتتكاتف فيها السواعد في السراء والضراء، وتُدار كافة أمواله وممتلكاته بأعلى درجات الأمانة والشفافية التامة أمام الجميع دون استثناء.
            </p>
          </div>
        </div>
      </div>

      {/* أزرار التبويب لتصفح الأبواب */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition font-bold ${
            activeTab === 'all'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
          }`}
        >
          كافة البنود
        </button>
        <button
          onClick={() => setActiveTab('membership')}
          className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition font-bold ${
            activeTab === 'membership'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
          }`}
        >
          👤 العضوية والانضمام
        </button>
        <button
          onClick={() => setActiveTab('finance')}
          className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition font-bold ${
            activeTab === 'finance'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
          }`}
        >
          💰 الضوابط المالية والخزينة
        </button>
        <button
          onClick={() => setActiveTab('governance')}
          className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition font-bold ${
            activeTab === 'governance'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
          }`}
        >
          🔄 الاجتماعات وتدوير المهام
        </button>
        <button
          onClick={() => setActiveTab('future')}
          className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition font-bold ${
            activeTab === 'future'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
          }`}
        >
          🎯 الأهداف المستقبلية
        </button>
        <button
          onClick={() => setActiveTab('proposals')}
          className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition font-bold ${
            activeTab === 'proposals'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
          }`}
        >
          ⚡ ضوابط النمو والتنظيم
        </button>
      </div>

      {/* ========================================================================= */}
      {/* الباب الأول: ضوابط العضوية والانضمام */}
      {/* ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'membership') && (
        <div className="glass-card p-6 border border-emerald-100 bg-white space-y-4">
          <div className="flex items-center gap-2.5 text-emerald-800 border-b border-emerald-100 pb-3">
            <Users2 className="w-5 h-5 text-emerald-600" />
            <h4 className="font-black text-base text-slate-900">الباب الأول: شروط العضوية وضوابط الانضمام والعودة</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* البند 1 */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <h5 className="font-bold text-slate-900 text-sm">انضمام الأعضاء الجدد والسداد الفوري</h5>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                يُقبل أي عضو جديد من أبناء الحي فور استيفاء البيانات، ويدخل في التغطية التكافلية مباشرة. ويلتزم العضو الجديد بسداد رسوم اشتراك الشهر الحالي كاملاً (15,000 ج.س) حتى لو تم انضمامه في منتصف الشهر أو أواخره دون تجزئة.
              </p>
            </div>

            {/* البند 2 */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 hover:border-amber-300 transition">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-lg bg-amber-200 text-amber-900 text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <h5 className="font-bold text-amber-950 text-sm">شروط إعادة انضمام العضو المنسحب (المنقطع)</h5>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                العضو الذي كان مسجلاً بالصندوق ثم انسحب أو انقطع عنه ورغب لاحقاً في العودة، يُشترط لقبوله سداد <strong className="text-amber-900">غرامة تعويضية تسوية</strong> تُحسب بمقدار المدة الزمنية التي قضاها خارج الصندوق من تاريخ خروجه وحتى يوم عودته. وبما أن رسوم الاشتراك تخضع لزيادات سنوية، فيلتزم العضو بسداد اشتراكات الفترة التي خرج منها وفقاً للتعرفة والرسوم المعتمدة في كل فترة زمنية بأثر رجعي لضمان العدالة مع من واصلوا الالتزام.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* الباب الثاني: الضوابط المالية الصارمة وحدود الصرف والخزينة */}
      {/* ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'finance') && (
        <div className="glass-card p-6 border border-emerald-100 bg-white space-y-4">
          <div className="flex items-center gap-2.5 text-emerald-800 border-b border-emerald-100 pb-3">
            <Landmark className="w-5 h-5 text-emerald-600" />
            <h4 className="font-black text-base text-slate-900">الباب الثاني: الضوابط المالية وسقوف الصرف وحد أمان الخزينة</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* البند 3: سقف الصرف للمناسبات والأفراح */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center">
                  3
                </span>
                <h5 className="font-bold text-slate-900 text-sm">سقف الصرف للمناسبات والأفراح</h5>
              </div>
              <div className="text-lg font-black text-emerald-700 mb-1">100,000 ج.س</div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                حُدد الحد الأقصى للمساهمة النقدية في المناسبات السعيدة (زواج العضو، عقيقة وتسمية المولود) أو الحالات الطارئة بمبلغ <strong>100 ألف جنيه سوداني</strong> كحد أقصى موحد لا يقبل التجاوز، حفاظاً على التوازن المالي للصندوق.
              </p>
            </div>

            {/* البند 4: الحد الأدنى الإلزامي للخزينة */}
            <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-lg bg-rose-200 text-rose-900 text-xs font-bold flex items-center justify-center">
                  4
                </span>
                <h5 className="font-bold text-rose-950 text-sm">الحد الأدنى الإلزامي للخزينة (خط الأمان)</h5>
              </div>
              <div className="text-lg font-black text-rose-700 mb-1">100,000 ج.س (حد حرج)</div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                إذا بلغ رصيد الخزينة أقل من <strong>100 ألف جنيه</strong>، يُمنع منعاً باتاً صرف أي مبالغ مهما كانت الدواعي، ويُعتبر هذا المبلغ هو الخط الأحمر والاحتياطي الاستراتيجي الدائم الذي لا يُمس لحماية الصندوق من الإفلاس أو العجز.
              </p>
            </div>

            {/* البند 5: الزيادات السنوية في الاشتراكات */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">
                  5
                </span>
                <h5 className="font-bold text-slate-900 text-sm">الزيادات السنوية في الاشتراكات</h5>
              </div>
              <div className="text-lg font-black text-teal-700 mb-1">سنوياً بإجماع الأعضاء</div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                تُراجع قيمة الاشتراك الشهري دورياً بصورة سنوية لمواكبة التضخم وتغير تكاليف الخدمات المعيشية. ولا تُقر أي زيادة في الاشتراكات إلا بعد طرحها في الاجتماع العام والاتفاق المباشر وموافقة أغلبية الأعضاء.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* الباب الثالث: الاجتماعات الدورية وتدوير المهام الإدارية */}
      {/* ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'governance') && (
        <div className="glass-card p-6 border border-emerald-100 bg-white space-y-4">
          <div className="flex items-center gap-2.5 text-emerald-800 border-b border-emerald-100 pb-3">
            <Calendar className="w-5 h-5 text-emerald-600" />
            <h4 className="font-black text-base text-slate-900">الباب الثالث: الاجتماعات الدورية وتدوير المهام والمسؤوليات</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* البند 6 */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center">
                  6
                </span>
                <h5 className="font-bold text-slate-900 text-sm">دورية الاجتماعات العامة (كل 3 أشهر)</h5>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                تُعقد الجمعية العمومية اجتماعاً دورياً رسمياً كل <strong>ثلاثة أشهر (ربع سنوي)</strong> بحضور الأعضاء لمناقشة التقرير المالي المرفوع من إدارة الصندوق، ومراجعة المنصرفات والإيرادات، والتصديق على أية مقترحات تطويرية تخدم الجمعية والحي.
              </p>
            </div>

            {/* البند 7 */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center">
                  7
                </span>
                <h5 className="font-bold text-slate-900 text-sm">تدوير المسؤوليات وإسناد المهام لأعضاء جدد</h5>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                في الاجتماع الدوري الربعي، يتم تقييم الأداء وإسناد المهام الإدارية (أمانة المال، متابعة التحصيل، الإشراف على الأصول، لجان الطوارئ) لأعضاء جدد بالتناوب؛ لتعزيز روح المشاركة الجماعية، وضخ دماء جديدة، ومنع احتكار المناصب والمسؤوليات.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* الباب الرابع: الأهداف المستقبلية الاستراتيجية للجمعية */}
      {/* ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'future') && (
        <div className="glass-card p-6 border border-teal-200 bg-teal-50/30 space-y-4">
          <div className="flex items-center gap-2.5 text-teal-800 border-b border-teal-200 pb-3">
            <Target className="w-5 h-5 text-teal-600" />
            <h4 className="font-black text-base text-slate-900">الباب الرابع: الأهداف المستقبلية الاستراتيجية لصندوق رِفَاق</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* هدف 1 */}
            <div className="p-4 rounded-2xl bg-white border border-teal-200 flex flex-col justify-between shadow-2xs">
              <div>
                <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-black text-xs mb-3">
                  01
                </div>
                <h5 className="font-bold text-slate-900 text-sm mb-1.5">صندوق التكافل الصحي الطارئ</h5>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  تطوير محفظة صحية مخصصة للوقوف مع أعضاء الجمعية وأسرهم في العمليات الجراحية العاجلة، وشراء الأدوية المنقذة للحياة، ودعم الفحوصات الحرجة.
                </p>
              </div>
            </div>

            {/* هدف 2 */}
            <div className="p-4 rounded-2xl bg-white border border-teal-200 flex flex-col justify-between shadow-2xs">
              <div>
                <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-black text-xs mb-3">
                  02
                </div>
                <h5 className="font-bold text-slate-900 text-sm mb-1.5">توسيع الأصول الخدمية المشتركة</h5>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  شراء أصول خدمية متكاملة لخدمة مناسبات الحي (خيم إضافية، مولد كهربائي للحي في فترات الطوارئ، أجهزة صوتيات، كراسي، ومبردات مياه حديثة).
                </p>
              </div>
            </div>

            {/* هدف 3 */}
            <div className="p-4 rounded-2xl bg-white border border-teal-200 flex flex-col justify-between shadow-2xs">
              <div>
                <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-black text-xs mb-3">
                  03
                </div>
                <h5 className="font-bold text-slate-900 text-sm mb-1.5">مشاريع استثمارية تعاونية</h5>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  تأسيس أنشطة استثمارية جماعية صغيرة مدرّة للدخل بتمويل من فوائض الصندوق، بهدف تنمية رأس المال وتخفيف عبء الاشتراكات الشهرية عن الأعضاء مستقبلاً.
                </p>
              </div>
            </div>

            {/* هدف 4 */}
            <div className="p-4 rounded-2xl bg-white border border-teal-200 flex flex-col justify-between shadow-2xs">
              <div>
                <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-black text-xs mb-3">
                  04
                </div>
                <h5 className="font-bold text-slate-900 text-sm mb-1.5">دعم التعليم والتكريم المجتمعي</h5>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  المساهمة في سداد الرسوم المدرسية لأبناء الأسر المتعففة في الحي وتكريم المتفوقين في الشهادات الدراسية لغرس روح التميز والارتقاء بالمجتمع.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* الباب الخامس: لوائح وقوانين تنظيمية مقترحة لضبط الجمعية ونموها وثباتها */}
      {/* ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'proposals') && (
        <div className="glass-card p-6 border border-emerald-100 bg-white space-y-4">
          <div className="flex items-center gap-2.5 text-emerald-800 border-b border-emerald-100 pb-3">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h4 className="font-black text-base text-slate-900">الباب الخامس: ضوابط إضافية مقترحة لضبط الجمعية والنمو والاستدامة</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* مقترح 1: المهلة النظامية للسداد */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center">
                  8
                </span>
                <h5 className="font-bold text-slate-900 text-sm">مهلة السداد حتى اليوم العاشر (10) من كل شهر</h5>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                الموعد النهائي لسداد الاشتراكات الشهرية هو <strong>اليوم العاشر من كل شهر ميلادي</strong>. بعد انقضاء يوم 10، يُعتبر العضو متأخراً، ويصدر مدير الجمعية كشفاً رسمياً بأسماء المتأخرين يُنشر في قروب الواتساب لاستعجال السداد تفادياً لتعطل التزامات الجمعية.
              </p>
            </div>

            {/* مقترح 2: توثيق المعاملات المالية */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center">
                  9
                </span>
                <h5 className="font-bold text-slate-900 text-sm">التوثيق الإلزامي للمدفوعات والمصروفات</h5>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                لا يُعتمد أي سداد بنكي إلا بإشعار رسمي يتضمن رقم المرجع البنكي ليتم توثيقه بالنظام. وفي جانب المنصرفات، يلتزم من يتولى صرف أي مبلغ بإحضار فاتورة شراء أو سند استلام موثق يُسجل في سجلات الخزينة فوراً.
              </p>
            </div>

            {/* مقترح 3: إجراءات التعثر المتكرر */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center">
                  10
                </span>
                <h5 className="font-bold text-slate-900 text-sm">إجراءات التخلف المتكرر عن السداد (3 أشهر)</h5>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                إذا تخلف العضو عن السداد لمدة <strong>ثلاثة أشهر متتالية</strong> دون إبداء عذر تقبله إدارة الجمعية، يتم تعليق استفادته من مساهمات الصندوق وأصوله مؤقتاً حتى تتم تسوية المتأخرات، حفاظاً على حقوق الملتزمين.
              </p>
            </div>

            {/* مقترح 4: صيانة وحماية الأصول المشتركة */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center">
                  11
                </span>
                <h5 className="font-bold text-slate-900 text-sm">أمانة وحماية واستعارة الأصول والمعدات</h5>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                أصول الجمعية (الخيم، الكراسي، المبردات) مخصصة لخدمة أعضاء الجمعية وأهالي الحي بالمجان أو برسوم رمزية للصيانة. ويلتزم العضو المستعير بإرجاعها نظيفة وسليمة، ويتحمل تكلفة إصلاح أو تعويض أي تلف ناجم عن الإهمال.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* الختام والتوقيع الرسمي */}
      <div className="p-5 rounded-2xl bg-white border border-emerald-200 text-center space-y-1.5 shadow-xs">
        <p className="text-xs text-emerald-950 font-black">
          تمت صياغة وترتيب هذه اللائحة بتوافق أعضاء جمعية «رِفَاق» التعاونية
        </p>
        <p className="text-xs text-slate-700 font-medium">
          «يد الله مع الجماعة، والتعاون أساس البركة والنهوض بالمجتمع»
        </p>
      </div>
    </div>
  );
}
