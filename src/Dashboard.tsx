import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, db } from './firebase';
import { useAuth } from './AuthContext';
import { useApp } from './App';
import { formatCurrency } from './lib/utils';
import { useNavigate } from 'react-router-dom';
import { Landmark, LogOut, Store } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { EmployeeTable } from './Employee';

export const Dashboard = () => {
  const { role, appSettings, loading: authLoading } = useAuth();
  const { t, language } = useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [minLoadingTimePassed, setMinLoadingTimePassed] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  useEffect(() => {
    window.history.pushState(null, "", window.location.href);

    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      setShowExitConfirm(true);
      window.history.pushState(null, "", window.location.href);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinLoadingTimePassed(true);
    }, 100); 
    return () => clearTimeout(timer);
  }, []);

  const [data, setData] = useState<any>({
    transactions: [] as any[],
    outlets: [] as any[],
    employees: [] as any[],
  });

  useEffect(() => {
    if (authLoading) return;
    if (!role) {
      setLoading(false);
      return;
    }

    let loadedCount = 0;
    const totalToLoad = role === 'director' ? 3 : 2;

    const checkLoaded = () => {
      loadedCount++;
      if (loadedCount >= totalToLoad) {
        setLoading(false);
      }
    };

    const unsubTrs = onSnapshot(collection(db, 'transactions'), (snap) => {
      setData(prev => ({ ...prev, transactions: snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) }));
      checkLoaded();
    }, () => checkLoaded());

    const unsubOutlets = onSnapshot(collection(db, 'directors'), (snap) => {
      setData(prev => ({ ...prev, outlets: snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) }));
      checkLoaded();
    }, () => checkLoaded());

    let unsubEmployees = () => {};
    if (role === 'director') {
      unsubEmployees = onSnapshot(collection(db, 'employees'), (snap) => {
        setData(prev => ({ ...prev, employees: snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) }));
        checkLoaded();
      }, () => checkLoaded());
    }

    return () => {
      unsubTrs();
      unsubOutlets();
      unsubEmployees();
    };
  }, [role, authLoading]);

  const calculateTotalBalance = () => {
    let totalReceive = 0, totalPayment = 0, totalExpense = 0;
    data.transactions.forEach((t: any) => {
      const amount = parseFloat(t.amount) || 0;
      if (t.type === 'Receive' || t.type === 'Cash Receive' || t.type === 'Profit') totalReceive += amount;
      else if (t.type === 'Payment' || t.type === 'Cash Payment') totalPayment += amount;
      else if (t.type === 'Expense') totalExpense += amount;
    });
    return totalReceive - totalPayment - totalExpense;
  };

  const handleExitApp = () => {
    window.close();
    setShowExitConfirm(false);
  };

  if (!role && !authLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full">
          <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-bold">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-24 px-4">
      {(role === 'admin' || role === 'super_admin' || role === 'director') && (
        <div className="space-y-8 flex flex-col items-center text-center">
          <div className="text-center space-y-3 flex flex-col items-center w-full">
            {appSettings?.logoUrl && appSettings.logoUrl.trim() !== '' ? (
              <img src={appSettings.logoUrl} alt="Logo" className="w-24 h-24 rounded-2xl object-contain mb-2 shadow-sm" />
            ) : (
              <div className="w-24 h-24 bg-emerald-50 rounded-2xl flex items-center justify-center mb-2 shadow-inner">
                <Store size={48} className="text-emerald-600/50" />
              </div>
            )}
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-black leading-tight gradient-text whitespace-nowrap overflow-hidden text-ellipsis px-2 max-w-full">
                {appSettings?.appName || 'Al-Arafah Islami Bank Plc'}
              </h1>
              <h2 className="text-lg font-black gradient-text">
                {appSettings?.outletName || 'SPS Bazar Outlet'}
              </h2>
              <p className="text-xs font-bold gradient-text max-w-xl mx-auto px-4 opacity-80">
                {appSettings?.address || 'Kayaria Lanch Ghat, Kayaria, Kalkini, Madaripur.'}
              </p>
            </div>
          </div>
          <div className="w-full flex justify-center pt-2">
            <div className="flex items-center gap-4 bg-emerald-50 px-6 py-4 rounded-[2rem] border border-emerald-100/50 shadow-sm">
              <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-md shadow-emerald-200">
                <Landmark size={24} />
              </div>
              <div className="text-left">
                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em]">{t('totalBalance')}</p>
                <h3 className="text-3xl font-black text-slate-800 tracking-tight">{formatCurrency(calculateTotalBalance(), language)}</h3>
              </div>
            </div>
          </div>
        </div>
      )}

      {role === 'director' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 ml-2">
            <div className="w-2 h-8 bg-purple-500 rounded-full" />
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
              {t('employeeList')}
            </h3>
          </div>
          <EmployeeTable 
            employees={data.employees.sort((a: any, b: any) => {
              const getPriority = (d: string) => {
                if (d === 'Outlet Manager') return 1;
                if (d === 'Operation Manager') return 2;
                if (d === 'Teller') return 3;
                return 4;
              };
              const pA = getPriority(a.designation);
              const pB = getPriority(b.designation);
              if (pA !== pB) return pA - pB;
              return a.name.localeCompare(b.name);
            })} 
            role={role} 
            t={t} 
          />
        </div>
      )}

      {(role === 'admin' || role === 'super_admin') && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 ml-2">
            <div className="w-2 h-8 bg-indigo-500 rounded-full" />
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
              {t('quickActions')}
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => navigate('/transactions', { state: { category: 'cash_closing' } })}
              className="p-6 bg-slate-900 text-white rounded-[2rem] font-black flex items-center justify-center group hover:bg-black transition-all shadow-lg shadow-slate-200"
            >
              <span>{t('cashManagement')}</span>
            </button>

            <button 
              onClick={() => navigate('/transactions', { state: { category: 'general', subType: 'receive' } })}
              className="p-6 bg-emerald-600 text-white rounded-[2rem] font-black flex items-center justify-center group hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
            >
              <span>{t('receivePayment')}</span>
            </button>

            <button 
              onClick={() => navigate('/cash-closing')}
              className="p-6 bg-indigo-600 text-white rounded-[2rem] font-black flex items-center justify-center group hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
            >
              <span>{t('cashClosingPage')}</span>
            </button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showExitConfirm && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 text-center space-y-6 shadow-2xl"
            >
              <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto rotate-12">
                <LogOut size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-800">Exit Application?</h3>
                <p className="text-slate-500 text-sm font-bold">Are you sure you want to exit the app?</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowExitConfirm(false)} 
                  className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                >
                  Stay
                </button>
                <button 
                  onClick={handleExitApp}
                  className="flex-1 py-4 bg-rose-600 text-white font-bold rounded-2xl shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all"
                >
                  Exit
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};