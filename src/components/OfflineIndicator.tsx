import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from "lucide-react";

export const OfflineIndicator: React.FC = () => {
 const [isOnline, setIsOnline] = useState(
 typeof navigator !== 'undefined' ? navigator.onLine : true
 );

 useEffect(() => {
 const handleOnline = () => setIsOnline(true);
 const handleOffline = () => setIsOnline(false);

 window.addEventListener('online', handleOnline);
 window.addEventListener('offline', handleOffline);

 return () => {
 window.removeEventListener('online', handleOnline);
 window.removeEventListener('offline', handleOffline);
 };
 }, []);

 if (isOnline) return null;

 return (
 <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-2xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-xl border border-amber-300 animate-in slide-in-from-bottom-2">
 <WifiOff className="w-4 h-4 text-slate-950 animate-pulse" />
 <span>Modo Offline — Dados do aplicativo carregados do cache local.</span>
 </div>
 );
};
