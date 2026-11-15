'use client';

import React, { useState, useEffect } from 'react';
import { AppHeader } from '@/components/AppHeader';
import { MemberDashboard } from '@/components/MemberDashboard';
import { AdminDashboard } from '@/components/AdminDashboard';
import { AuthScreen } from '@/components/AuthScreen';
import { RulesPage } from '@/components/RulesPage';
import { Profile } from '@/types/database';

export default function Home() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [activeView, setActiveView] = useState<'dashboard' | 'rules'>('dashboard');

  // استرجاع جلسة المستخدم المسجلة محلياً في الهاتف
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const saved = localStorage.getItem('refaaq_logged_user');
        if (saved) {
          setCurrentUser(JSON.parse(saved));
        }
      } catch (e) {
        console.warn('Failed reading saved session:', e);
      } finally {
        setIsInitializing(false);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const handleLoginSuccess = (profile: Profile) => {
    setCurrentUser(profile);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('refaaq_logged_user');
    } catch {
      // ignore
    }
    setCurrentUser(null);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f3f8f5] text-emerald-600">
        <div className="w-10 h-10 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // إذا لم يسجل المستخدم الدخول بعد، نعرض شاشة اختيار العضو ورمز المرور (PIN)
  if (!currentUser) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f3f8f5] text-[#0c241b]">
      <AppHeader
        currentUser={currentUser}
        onLogout={handleLogout}
        activeView={activeView}
        onViewChange={(v) => setActiveView(v)}
      />

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6 mt-2">
        {/* شريط ترحيبي */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-800 bg-white p-3.5 rounded-2xl border border-emerald-200 shadow-xs">
          <div>
            مرحباً بك، <strong className="text-slate-950 font-black">{currentUser.full_name}</strong>
          </div>
          <div className="text-xs text-slate-800 flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span>الاشتراك الشهري: <strong className="text-emerald-950 font-black">15,000 ج.س</strong> • الحد الأدنى للخزنة: <strong className="text-slate-950 font-black">100,000 ج.س</strong></span>
          </div>
        </div>

        {/* عرض الصفحة المطلوبة: إما اللائحة والقوانين أو لوحة التحكم */}
        {activeView === 'rules' ? (
          <RulesPage onBack={() => setActiveView('dashboard')} />
        ) : currentUser.role === 'admin' ? (
          <AdminDashboard />
        ) : (
          <MemberDashboard
            currentUser={currentUser}
            onOpenRules={() => setActiveView('rules')}
          />
        )}
      </main>

      {/* شريط سفلي ثابت */}
      <footer className="border-t border-emerald-200/80 bg-white/90 py-4 px-4 text-center text-xs text-slate-800 font-medium">
        أم القرى، بورتسودان • تطوير: <span className="font-bold text-slate-950 font-mono">Mo7amed-Yagoub</span>
      </footer>
    </div>
  );
}
