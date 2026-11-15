'use client';

import { useEffect } from 'react';

export function PWARegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Refaaq ServiceWorker registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.warn('Refaaq ServiceWorker registration failed:', error);
        });
    }
  }, []);

  return null;
}
