'use client';

import React, { useState } from 'react';
import { Lock, AlertCircle } from 'lucide-react';
import { Profile } from '@/types/database';
import { useMembers } from '@/lib/hooks/useCoopData';

interface AuthScreenProps {
  onLoginSuccess: (profile: Profile) => void;
}

export function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const { data: members, isLoading } = useMembers();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const selectedMember = members?.find((m) => m.id === selectedUserId);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedMember) {
      setError('يرجى اختيار اسم العضو أولاً');
      return;
    }

    // التحقق من رمز PIN الخاص بالعضو
    const expectedPin = selectedMember.pin_code;

    if (expectedPin && pin.trim() === expectedPin) {
      // حفظ الجلسة محلياً ليبقى المستخدم مسجلاً
      try {
        localStorage.setItem('refaaq_logged_user', JSON.stringify(selectedMember));
      } catch {
        // ignore
      }
      onLoginSuccess(selectedMember);
    } else {
      setError('رمز المرور (PIN) غير صحيح، يرجى التأكد وإعادة المحاولة');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-4 py-8">
      <div className="w-full flex-1 flex items-center justify-center">
        {/* بطاقة الدخول البيضاء النقية */}
        <div className="w-full max-w-md glass-card p-6 md:p-8 border border-emerald-200/90 text-slate-900 shadow-xl relative bg-white">
          {/* الشعار المعتمد فقط دون نصوص قديمة */}
          <div className="text-center mb-6">
            <div className="flex justify-center">
              <img
                src="/logo.png"
                alt="شعار رِفاق"
                className="h-24 md:h-28 w-auto object-contain drop-shadow-xs"
              />
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-950 font-bold text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handlePinSubmit} className="space-y-4">
            {/* اختيار اسم العضو */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                اختر اسمك من القائمة
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => {
                  setSelectedUserId(e.target.value);
                  setError(null);
                }}
                className="w-full glass-input bg-slate-50 text-slate-950 text-sm border-slate-300 font-semibold"
                disabled={isLoading}
              >
                <option value="" className="text-slate-500">-- اضغط لاختيار اسمك --</option>
                {members?.map((m) => (
                  <option key={m.id} value={m.id} className="text-slate-900">
                    {m.full_name} {m.role === 'admin' ? '🛡️ (مدير الجمعية)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* إدخال رمز المرور (PIN) */}
            {selectedUserId && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span>رمز المرور (PIN) الخاص بك:</span>
                  <span className="text-[11px] text-emerald-900 font-bold">
                    مكون من 4 أرقام
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="• • • •"
                    className="w-full glass-input text-center text-2xl tracking-[0.5em] font-mono text-emerald-950 font-black bg-white border-slate-300"
                    autoFocus
                  />
                  <Lock className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            )}

            {/* زر تسجيل الدخول */}
            <button
              type="submit"
              disabled={!selectedUserId || pin.length < 4}
              className="w-full touch-button bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 disabled:hover:bg-emerald-700 text-white font-bold text-base shadow-md shadow-emerald-950/15 mt-2"
            >
              دخول الصندوق
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-200 text-center">
            <p className="text-[11px] text-slate-700 font-medium">
              تبقى مسجلاً تلقائياً على هذا الهاتف حتى لا تضطر لتسجيل الدخول في كل مرة.
            </p>
          </div>
        </div>
      </div>

      {/* الفوتر الثابت */}
      <footer className="w-full text-center py-3 text-xs text-slate-800 font-medium">
        أم القرى، بورتسودان • تطوير: <span className="font-bold text-slate-950 font-mono">Mo7amed-Yagoub</span>
      </footer>
    </div>
  );
}
