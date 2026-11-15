'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileText,
  Loader2,
  X,
  Camera,
  Image as ImageIcon,
  Zap,
  Sparkles,
} from 'lucide-react';
import { compressReceiptImage } from '@/lib/image-compression';
import { extractReceiptData, ExtractedReceiptData } from '@/lib/ocr';
import { useUploadReceipt } from '@/lib/hooks/useCoopData';
import confetti from 'canvas-confetti';

interface ReceiptUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export function ReceiptUploadModal({ isOpen, onClose, userId }: ReceiptUploadModalProps) {
  const [step, setStep] = useState<'pick' | 'processing' | 'review' | 'success'>('pick');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);
  const [progressText, setProgressText] = useState<string>('');
  const [ocrProgress, setOcrProgress] = useState<number>(0);

  // حقول النموذج
  const [amount, setAmount] = useState<number>(15000);
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [recipientName, setRecipientName] = useState<string | null>(null);
  const [paymentMonth, setPaymentMonth] = useState<string>('2026-11-01');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadReceiptMutation = useUploadReceipt();

  // فحص ما إذا كان هناك إشعار مشارك من تطبيق بنكك عبر Web Share Target
  useEffect(() => {
    async function checkSharedReceipt() {
      if (typeof window !== 'undefined' && 'caches' in window) {
        try {
          const cache = await caches.open('shared-receipts');
          const response = await cache.match('latest-shared-receipt');
          if (response) {
            const blob = await response.blob();
            const sharedFile = new File([blob], 'bankak_shared_receipt.jpg', {
              type: blob.type || 'image/jpeg',
            });
            await cache.delete('latest-shared-receipt');
            handleFileSelection(sharedFile);
          }
        } catch (e) {
          console.warn('Error checking shared cache:', e);
        }
      }
    }
    if (isOpen) {
      checkSharedReceipt();
    }
  }, [isOpen]);

  const handleFileSelection = async (selectedFile: File) => {
    try {
      setErrorMsg(null);
      setStep('processing');
      setProgressText('جاري فحص إشعار بنكك وتحسين وضوح الأرقام...');
      setOcrProgress(10);

      // تشغيل الضغط والقراءة بالتوازي لتحقيق أعلى دقة وأسرع زمن
      const [compressionResult, extracted] = await Promise.all([
        compressReceiptImage(selectedFile),
        extractReceiptData(selectedFile, (progress, statusText) => {
          setOcrProgress(progress);
          setProgressText(statusText);
        }),
      ]);

      setFile(compressionResult.compressedFile);
      setPreviewUrl(compressionResult.previewUrl);
      setCompressedSize(compressionResult.compressedSizeKB);

      // ملء البيانات المستخرجة من إشعار بنكك
      if (extracted.amount) {
        setAmount(extracted.amount);
      }
      if (extracted.referenceNumber) {
        setReferenceNumber(extracted.referenceNumber);
      }
      if (extracted.recipientName) {
        setRecipientName(extracted.recipientName);
      }

      setStep('review');
    } catch (err: any) {
      console.error(err);
      setErrorMsg('تعذر التعرف الآلي على بعض الحقول، يرجى مراجعتها وتأكيدها.');
      setStep('review');
    }
  };

  const handleSubmit = async () => {
    if (!referenceNumber.trim()) {
      setErrorMsg('يرجى التأكد من كتابة الرقم المرجعي أو رقم العملية');
      return;
    }

    try {
      await uploadReceiptMutation.mutateAsync({
        userId,
        amount: Number(amount) || 15000,
        referenceNumber: referenceNumber.trim(),
        receiptImageFile: file,
        previewUrl,
        paymentMonth,
      });

      setStep('success');
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch (_) {}
    } catch (e) {
      setErrorMsg('تعذر حفظ الإشعار، يرجى المحاولة لاحقاً');
    }
  };

  const handleReset = () => {
    setStep('pick');
    setFile(null);
    setPreviewUrl(null);
    setRecipientName(null);
    setErrorMsg(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="w-full max-w-lg glass-card border border-emerald-200 p-5 md:p-6 text-slate-900 bg-white shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* زر الإغلاق */}
        <button
          onClick={handleReset}
          className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-700 rounded-full bg-slate-100 hover:bg-slate-200 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* خطوة 1: اختيار الصورة */}
        {step === 'pick' && (
          <div className="text-center py-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs border border-emerald-300">
              <UploadCloud className="w-8 h-8 text-emerald-700" />
            </div>
            <h3 className="text-xl font-black mb-1 text-slate-950">رفع إشعار تحويل (بنكك / فوري)</h3>
            <p className="text-sm text-slate-800 mb-6 font-medium">
              الاشتراك الشهري المقرر: <span className="font-black text-emerald-950">15,000 ج.س</span>
            </p>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileSelection(e.target.files[0])}
            />
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileSelection(e.target.files[0])}
            />

            <div className="space-y-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full touch-button bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base shadow-xs"
              >
                اختيار إشعار من معرض الصور
              </button>

              <button
                onClick={() => cameraInputRef.current?.click()}
                className="w-full touch-button bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-base"
              >
                <Camera className="w-5 h-5 ml-2 text-emerald-600" />
                <span>تصوير الإشعار بالكاميرا</span>
              </button>
            </div>
          </div>
        )}

        {/* خطوة 2: المعالجة والـ OCR */}
        {step === 'processing' && (
          <div className="text-center py-8">
            <Loader2 className="w-12 h-12 mx-auto text-emerald-600 animate-spin mb-4" />
            <h4 className="text-lg font-bold mb-2 text-slate-900">جاري تحليل إشعار بنكك</h4>
            <p className="text-sm text-slate-600 mb-6">{progressText}</p>

            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200 mb-2">
              <div
                className="bg-emerald-600 h-full transition-all duration-300 rounded-full"
                style={{ width: `${ocrProgress}%` }}
              />
            </div>
            <span className="text-xs text-emerald-700 font-bold">{ocrProgress}%</span>
          </div>
        )}

        {/* خطوة 3: مراجعة البيانات المستخرجة بدقة */}
        {step === 'review' && (
          <div className="py-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-black flex items-center gap-2 text-slate-950">
                <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                <span>تم التعرف على الإشعار</span>
              </h3>
              <span className="text-xs bg-emerald-100 text-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-300 font-black flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-700" />
                إشعار بنكك
              </span>
            </div>

            <p className="text-xs text-slate-700 font-medium mb-4">
              تم استخراج بيانات العملية تلقائياً. تأكد من صحتها قبل الحفظ النهائي
            </p>

            {recipientName && (
              <div className="mb-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-slate-800 flex items-center justify-between">
                <span>المستفيد المقروء:</span>
                <span className="font-black text-emerald-950">{recipientName}</span>
              </div>
            )}

            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-950 font-bold text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* معاينة الصورة */}
              {previewUrl && (
                <div className="relative rounded-xl overflow-hidden border border-slate-300 bg-slate-50 flex flex-col items-center justify-center p-2">
                  <img
                    src={previewUrl}
                    alt="إشعار بنكك"
                    className="max-h-44 w-auto object-contain rounded-lg"
                  />
                  {compressedSize && (
                    <span className="mt-2 text-[10px] bg-emerald-100 text-emerald-950 px-2 py-0.5 rounded-full border border-emerald-300 font-bold">
                      حجم الصورة بعد الضغط: {compressedSize} KB
                    </span>
                  )}
                </div>
              )}

              {/* حقول الإدخال */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    المبلغ (ج.س)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full glass-input text-lg font-black text-emerald-950 border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    رقم العملية (Reference No)
                  </label>
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="مثال: 20061371602"
                    className="w-full glass-input font-mono text-slate-950 font-bold text-base border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    شهر السداد
                  </label>
                  <select
                    value={paymentMonth}
                    onChange={(e) => setPaymentMonth(e.target.value)}
                    className="w-full glass-input bg-white text-slate-950 font-bold border-slate-300"
                  >
                    <option value="2026-11-01">نوفمبر 2026</option>
                    <option value="2026-12-01">ديسمبر 2026</option>
                    <option value="2026-10-01">أكتوبر 2026</option>
                    <option value="2026-09-01">سبتمبر 2026</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                disabled={uploadReceiptMutation.isPending}
                className="flex-1 touch-button bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-sm shadow-xs"
              >
                {uploadReceiptMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'تأكيد وإرسال الإشعار'
                )}
              </button>
              <button
                onClick={() => setStep('pick')}
                className="px-4 touch-button bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-bold border border-slate-300"
              >
                تغيير
              </button>
            </div>
          </div>
        )}

        {/* خطوة 4: نجاح العملية */}
        {step === 'success' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-700" />
            </div>
            <h3 className="text-xl font-black mb-2 text-slate-950">تم استلام الإشعار بنجاح!</h3>
            <p className="text-sm text-slate-800 mb-6 leading-relaxed font-medium">
              تم تسجيل رقم العملية ({referenceNumber}) بمبلغ ({Number(amount).toLocaleString()} ج.س) بنجاح وإرساله لإدارة جمعية رفاق للمطابقة والاعتماد.
            </p>
            <button
              onClick={handleReset}
              className="w-full touch-button bg-emerald-700 hover:bg-emerald-600 text-white font-bold"
            >
              العودة للرئيسية
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
