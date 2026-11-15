'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';

export function NetworkStatusBar() {
  const [isOnline, setIsOnline] = useState(true);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) return null;

  return (
    <div
      className={`fixed top-4 left-4 right-4 z-50 flex items-center justify-between p-3.5 rounded-2xl border backdrop-blur-xl transition-all duration-300 shadow-2xl ${
        !isOnline
          ? 'bg-amber-950/80 border-amber-500/40 text-amber-200'
          : 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
      }`}
    >
      <div className="flex items-center gap-3">
        {!isOnline ? (
          <div className="p-2 bg-amber-500/20 rounded-xl">
            <WifiOff className="w-5 h-5 text-amber-400 animate-pulse" />
          </div>
        ) : (
          <div className="p-2 bg-emerald-500/20 rounded-xl">
            <Wifi className="w-5 h-5 text-emerald-400" />
          </div>
        )}
        <div>
          <h4 className="text-sm font-semibold">
            {!isOnline ? 'أنت تعمل دون اتصال بالإنترنت' : 'تمت استعادة الاتصال بنجاح'}
          </h4>
          <p className="text-xs opacity-80">
            {!isOnline
              ? 'تطبيق رفاق يحفظ بياناتك محلياً وستتم المزامنة تلقائياً عند عودة الشبكة.'
              : 'جاري تحديث ومزامنة بيانات الصندوق في الخلفية...'}
          </p>
        </div>
      </div>
      {!isOnline && (
        <span className="text-xs bg-amber-500/30 text-amber-300 px-2.5 py-1 rounded-full font-medium">
          وضع عدم الاتصال
        </span>
      )}
    </div>
  );
}
