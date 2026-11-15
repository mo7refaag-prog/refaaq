'use client';

import React from 'react';
import { ShieldCheck, User, LogOut, BookOpen, LayoutDashboard } from 'lucide-react';
import { Profile } from '@/types/database';

interface AppHeaderProps {
  currentUser: Profile | null;
  onLogout?: () => void;
  onRoleToggle?: () => void;
  activeView?: 'dashboard' | 'rules';
  onViewChange?: (view: 'dashboard' | 'rules') => void;
}

export function AppHeader({
  currentUser,
  onLogout,
  activeView = 'dashboard',
  onViewChange,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/90 border-b border-emerald-100/80 px-4 py-2.5 shadow-xs">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        {/* الشعار الرسمي فقط دون نصوص قديمة */}
        <div className="flex items-center">
          <img
            src="/logo.png"
            alt="شعار رِفاق"
            className="h-11 md:h-12 w-auto object-contain hover:scale-105 transition-transform"
          />
        </div>

        {/* أزرار المستخدم وتغيير الجلسة والتنقل */}
        {currentUser && (
          <div className="flex items-center gap-2">
            {onViewChange && (
              <button
                onClick={() => onViewChange(activeView === 'rules' ? 'dashboard' : 'rules')}
                className={`text-xs px-3 py-1.5 rounded-xl border flex items-center gap-1.5 font-semibold transition shadow-xs ${
                  activeView === 'rules'
                    ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-sm'
                    : 'bg-emerald-50/80 hover:bg-emerald-100 border-emerald-200 text-emerald-800'
                }`}
                title="لوائح وقوانين الجمعية"
              >
                {activeView === 'rules' ? (
                  <>
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>الرئيسية</span>
                  </>
                ) : (
                  <>
                    <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                    <span>قوانين الجمعية</span>
                  </>
                )}
              </button>
            )}

            <div
              className={`text-xs px-3 py-1.5 rounded-xl border flex items-center gap-1.5 font-medium ${
                currentUser.role === 'admin'
                  ? 'bg-amber-50 border-amber-200 text-amber-900 font-bold'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900 font-bold'
              }`}
            >
              {currentUser.role === 'admin' ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span className="hidden sm:inline">مدير الجمعية</span>
                </>
              ) : (
                <>
                  <User className="w-4 h-4 text-emerald-600" />
                  <span className="hidden sm:inline">{currentUser.full_name.split(' ')[0]}</span>
                </>
              )}
            </div>

            {onLogout && (
              <button
                onClick={onLogout}
                className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition"
                title="تسجيل الخروج والتبديل لعضو آخر"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
