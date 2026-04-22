import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, onSnapshot, addDoc, query, where, orderBy, limit, getDocs, doc, getDoc, serverTimestamp, deleteDoc, increment, updateDoc, db, handleFirestoreError, OperationType } from './firebase';
import { useAuth } from './AuthContext';
import { useApp } from './App';
import { formatCurrency, cn, toBengaliNumber, formatDate, formatNumber } from './lib/utils';
import { Receipt, Wallet, ArrowDownCircle, ArrowUpCircle, Landmark, Info, CheckCircle2, AlertCircle, Calculator, TrendingUp, FileText, Plus, X } from 'lucide-react';
import { DailyReport } from './DailyReport';
import { motion, AnimatePresence } from 'motion/react';

export const Transactions = () => {
  const navigate = useNavigate();
  const { role, customUserId } = useAuth();
  const { t, language } = useApp();
  const location = useLocation();
  const [view, setView] = useState<'selection' | 'form'>(() => {
    const state = location.state as any;
    return (state?.category) ? 'form' : 'selection';
  });
  const [category, setCategory] = useState<'cash_closing' | 'general' | 'profit' | 'daily_report'>(() => {
    const state = location.state as any;
    return state?.category || 'cash_closing';
  });
  const [subType, setSubType] = useState<string>(() => {
    const state = location.state as any;
    return state?.subType || '';
  });
  const [loading, setLoading] = useState(false);
  const [successModal, setSuccessModal] = useState<string | null>(null);
  const [errorModal, setErrorModal] = useState<string | null>(null);
  
  const [previousCashAmount, setPreviousCashAmount] = useState<number>(0);
  const [previousMotherAmount, setPreviousMotherAmount] = useState<number>(0);
  const [previousPaymentAmount, setPreviousPaymentAmount] = useState<number>(0);
  const [todayLastBalance, setTodayLastBalance] = useState<number>(0);
  const [isAmountEditable, setIsAmountEditable] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<any>(null);

  const [formData, setFormData] = useState({
    amount: '',
    cashAmount: '',
    motherAmount: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  const [isClosed, setIsClosed] = useState(false);
  const [existingReceive, setExistingReceive] = useState<any>(null);

  useEffect(() => {
    if (!formData.date) return;
    const q = query(
      collection(db, 'cash_closings'),
      where('date', '==', formData.date)
    );
    const unsub = onSnapshot(q, (snap) => {
      setIsClosed(!snap.empty);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'cash_closings');
    });
    return () => unsub();
  }, [formData.date]);

  useEffect(() => {
    const fetchReceiveData = async () => {
      setIsAmountEditable(true);
      setPreviousPaymentAmount(0);
      setExistingReceive(null);

      if (category !== 'cash_closing' || subType !== 'receive' || !formData.date) {
        return;
      }
      
      try {
        const qToday = query(
          collection(db, 'transactions'),
          where('date', '==', formData.date),
          where('type', '==', 'Cash Receive'),
          limit(1)
        );
        const todaySnap = await getDocs(qToday);
        
        if (!todaySnap.empty) {
          const data = todaySnap.docs[0].data();
          setExistingReceive(data);
          const cash = data.cashAmount || 0;
          const mother = data.motherAmount || 0;
          setPreviousCashAmount(cash);
          setPreviousMotherAmount(mother);
          setFormData(prev => ({ 
            ...prev, 
            amount: data.amount.toString(), 
            cashAmount: cash.toString(), 
            motherAmount: mother.toString(),
            description: data.description || ''
          }));
          setIsAmountEditable(false);
          return;
        }

        const q = query(collection(db, 'cash_closings'));
        const querySnapshot = await getDocs(q);
        const prevDocs = querySnapshot.docs
          .map(d => d.data())
          .filter(d => d.date < formData.date)
          .sort((a, b) => b.date.localeCompare(a.date));

        if (prevDocs.length > 0) {
          const cash = prevDocs[0].todayCash || 0;
          const mother = prevDocs[0].todayMother || 0;
          const amount = cash + mother;
          setPreviousCashAmount(cash);
          setPreviousMotherAmount(mother);
          setPreviousPaymentAmount(amount);
          setFormData(prev => ({ ...prev, amount: amount.toString(), cashAmount: cash.toString(), motherAmount: mother.toString() }));
          setIsAmountEditable(false);
        } else {
          setFormData(prev => ({ ...prev, amount: '', cashAmount: '', motherAmount: '' }));
          setIsAmountEditable(true);
        }
      } catch (error) {
        console.error("Error fetching receive data:", error);
        setIsAmountEditable(true);
      }
    };
    fetchReceiveData();
  }, [category, subType, formData.date]);

  useEffect(() => {
    const fetchTodayLastBalance = async () => {
      if (category !== 'cash_closing' || subType !== 'payment') {
        return;
      }

      try {
        let prevCash = 0;
        const qPrev = query(collection(db, 'cash_closings'));
        const prevSnap = await getDocs(qPrev);
        const prevDocs = prevSnap.docs
          .map(d => d.data())
          .filter(d => d.date < formData.date)
          .sort((a, b) => b.date.localeCompare(a.date));
        
        if (prevDocs.length > 0) {
          prevCash = prevDocs[0].closingBalance || 0;
        }

        const qToday = query(
          collection(db, 'transactions'),
          where('date', '==', formData.date)
        );
        const todaySnap = await getDocs(qToday);
        let receive = 0;
        let payment = 0;
        let expense = 0;
        
        todaySnap.docs.forEach(doc => {
          const data = doc.data();
          if (data.note === 'Cash Closing' || data.description === 'Cash Closing') return;
          if (data.type === 'Receive') receive += data.amount || 0;
          else if (data.type === 'Payment') payment += data.amount || 0;
          else if (data.type === 'Expense') expense += data.amount || 0;
        });

        const lastBalance = prevCash + receive - payment - expense;
        setTodayLastBalance(lastBalance);
        setFormData(prev => ({ ...prev, amount: lastBalance > 0 ? lastBalance.toString() : '' }));
      } catch (error) {
        console.error("Error fetching today last balance:", error);
      }
    };

    fetchTodayLastBalance();
  }, [category, subType, formData.date]);

  useEffect(() => {
    try {
      const q = query(
        collection(db, 'transactions'),
        orderBy('date', 'desc'),
        limit(20)
      );
      const unsub = onSnapshot(q, (snap) => {
        setTransactions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'transactions');
      });
      return () => unsub();
    } catch (err) {
      console.error("Query setup error:", err);
    }
  }, []);

  const handleDelete = async (tx: any) => {
    try {
      await deleteDoc(doc(db, 'transactions', tx.id));
      setShowDeleteConfirm(null);
      setSuccessModal('Entry deleted successfully.');
    } catch (error) {
      console.error("Error deleting entry:", error);
      handleFirestoreError(error, OperationType.DELETE, `transactions/${tx.id}`);
      setErrorModal('Error deleting entry.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subType) {
      setErrorModal('Please select a transaction type.');
      return;
    }

    setLoading(true);
    try {
      // Validation: Check if there's a Cash Receive for today before allowing other transactions
      const isCashReceive = category === 'cash_closing' && subType === 'receive';
      
      if (!isCashReceive) {
        const qCashCheck = query(
          collection(db, 'transactions'),
          where('date', '==', formData.date),
          where('type', '==', 'Cash Receive'),
          limit(1)
        );
        const cashSnap = await getDocs(qCashCheck);
        if (cashSnap.empty) {
          setErrorModal(language === 'bn' ? 'আগে Cash Management থেকে রিসিভ কর' : 'Please receive from Cash Management first');
          setLoading(false);
          return;
        }
      }

      let type = '';
      let amount = parseFloat(formData.amount);
      let cashAmount = parseFloat(formData.cashAmount) || 0;
      let motherAmount = parseFloat(formData.motherAmount) || 0;

      if (category === 'cash_closing') {
        if (subType === 'receive') {
          if (existingReceive) {
            setErrorModal('Cash receive already completed for this date.');
            setLoading(false);
            return;
          }
          type = 'Cash Receive';
          if (!isAmountEditable) {
            amount = previousPaymentAmount;
            cashAmount = previousCashAmount;
            motherAmount = previousMotherAmount;
          } else {
            amount = cashAmount + motherAmount;
          }
        } else {
          type = 'Cash Payment';
        }
      } else if (category === 'profit') {
        type = 'Profit';
      } else {
        if (subType === 'receive') type = 'Receive';
        else if (subType === 'payment') type = 'Payment';
        else type = 'Expense';
      }

      if (isNaN(amount) || amount < 0) {
        setErrorModal('Please enter a valid amount.');
        setLoading(false);
        return;
      }

      await addDoc(collection(db, 'transactions'), {
        amount,
        cashAmount,
        motherAmount,
        date: formData.date,
        type,
        category,
        description: formData.description,
        customUserId: customUserId || 'N/A',
        createdAt: serverTimestamp()
      });

      setSuccessModal('Transaction completed successfully.');
      setFormData({ ...formData, amount: '', cashAmount: '', motherAmount: '', description: '' });
      if (category !== 'general') setSubType('');
    } catch (error) {
      console.error("Error saving transaction:", error);
      handleFirestoreError(error, OperationType.CREATE, 'transactions');
      setErrorModal('Error saving transaction.');
    } finally {
      setLoading(false);
    }
  };

  const isEditable = true;

  if (view === 'selection') {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-20 px-4 sm:px-6">
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">{t('transactions')}</h2>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <Receipt size={28} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setCategory('cash_closing');
                setSubType('');
                setView('form');
              }}
              className="flex flex-col items-center justify-center p-8 bg-white border-2 border-slate-100 rounded-[2rem] hover:border-emerald-500 hover:bg-emerald-50/30 transition-all group"
            >
              <div className="p-4 bg-emerald-100 text-emerald-600 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                <Wallet size={32} />
              </div>
              <span className="text-lg font-bold text-slate-800">{formatNumber(1, language)}. {t('cashManagement')}</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setCategory('general');
                setSubType('');
                setView('form');
              }}
              className="flex flex-col items-center justify-center p-8 bg-white border-2 border-slate-100 rounded-[2rem] hover:border-blue-500 hover:bg-blue-50/30 transition-all group"
            >
              <div className="p-4 bg-blue-100 text-blue-600 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                <Landmark size={32} />
              </div>
              <span className="text-lg font-bold text-slate-800">{formatNumber(2, language)}. {t('generalTransactions')}</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setCategory('profit');
                setSubType('receive');
                setView('form');
              }}
              className="flex flex-col items-center justify-center p-8 bg-white border-2 border-slate-100 rounded-[2rem] hover:border-amber-500 hover:bg-amber-50/30 transition-all group"
            >
              <div className="p-4 bg-amber-100 text-amber-600 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                <TrendingUp size={32} />
              </div>
              <span className="text-lg font-bold text-slate-800">{formatNumber(3, language)}. {t('addProfit')}</span>
            </motion.button>

            {(role === 'super_admin' || role === 'admin') && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/cash-closing')}
                className="flex flex-col items-center justify-center p-8 bg-white border-2 border-slate-100 rounded-[2rem] hover:border-purple-500 hover:bg-purple-50/30 transition-all group"
              >
                <div className="p-4 bg-purple-100 text-purple-600 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                  <Calculator size={32} />
                </div>
                <span className="text-lg font-bold text-slate-800">{formatNumber(4, language)}. {t('cashClosingPage')}</span>
              </motion.button>
            )}

            {role === 'super_admin' && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setCategory('daily_report');
                  setSubType('');
                  setView('form');
                }}
                className="flex flex-col items-center justify-center p-8 bg-white border-2 border-slate-100 rounded-[2rem] hover:border-indigo-500 hover:bg-indigo-50/30 transition-all group"
              >
                <div className="p-4 bg-indigo-100 text-indigo-600 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                  <FileText size={32} />
                </div>
                <span className="text-lg font-bold text-slate-800">{formatNumber(5, language)}. {t('dailyReport')}</span>
              </motion.button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto pb-20 px-4 sm:px-6 space-y-8 max-w-4xl">
      <div className="space-y-6 bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setView('selection');
                setFormData({ ...formData, amount: '', description: '' });
              }}
              className="px-4 py-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600 font-black text-xs uppercase tracking-widest"
            >
              Back
            </button>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              {category === 'cash_closing' ? t('cashManagement') : 
               category === 'profit' ? t('addProfit') : 
               category === 'daily_report' ? t('dailyReport') : t('generalTransactions')}
            </h2>
          </div>
          <div className={cn(
            "p-3 rounded-2xl",
            category === 'cash_closing' ? "bg-emerald-50 text-emerald-600" : 
            category === 'profit' ? "bg-amber-50 text-amber-600" : 
            category === 'daily_report' ? "bg-indigo-50 text-indigo-600" : "bg-blue-50 text-blue-600"
          )}>
            {category === 'cash_closing' ? <Wallet size={28} /> : 
             category === 'profit' ? <TrendingUp size={28} /> : 
             category === 'daily_report' ? <FileText size={28} /> : <Landmark size={28} />}
          </div>
        </div>

        {category === 'daily_report' ? (
          <DailyReport />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Form content */}
          </div>
        )}
      </div>

      {category !== 'daily_report' && (
        <div className={cn(
          "bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8",
          !isEditable && "opacity-50 pointer-events-none"
        )}>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-lg font-black text-black uppercase ml-1">{t('transactionTypeLabel')}</label>
                <select 
                  className="w-full px-5 py-4 bg-white border-2 border-slate-500 rounded-2xl focus:border-emerald-500 focus:outline-none font-black text-slate-900"
                  value={subType}
                  onChange={(e) => setSubType(e.target.value)}
                >
                  <option value="">{t('selectMethod')}</option>
                  {category === 'cash_closing' ? (
                    <option value="receive">{t('receive')}</option>
                  ) : category === 'profit' ? (
                    <option value="receive">{t('addProfit')}</option>
                  ) : (
                    <>
                      <option value="receive">{t('receive')}</option>
                      <option value="payment">{t('payment')}</option>
                      <option value="expense">{t('expense')}</option>
                    </>
                  )}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-lg font-black text-black uppercase ml-1">{t('date')}</label>
                <input 
                  type="date" 
                  required 
                  className="w-full px-5 py-4 bg-white border-2 border-slate-500 rounded-2xl focus:border-emerald-500 focus:outline-none font-black text-slate-900"
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {category === 'cash_closing' && subType === 'receive' ? (
                <>
                  <div className="space-y-1">
                    <label className="text-lg font-black text-black uppercase ml-1">Cash Amount</label>
                    {isAmountEditable ? (
                      <input 
                        type="number" 
                        required 
                        className="w-full px-5 py-4 bg-white border-2 border-slate-500 rounded-2xl focus:border-emerald-500 focus:outline-none font-black text-slate-900 text-xl"
                        value={formData.cashAmount}
                        onChange={e => setFormData({...formData, cashAmount: e.target.value})}
                        placeholder={language === 'bn' ? '০.০০' : '0.00'}
                      />
                    ) : (
                      <div className="w-full px-5 py-4 bg-slate-100 border-2 border-slate-500 rounded-2xl font-black text-slate-900 text-xl flex items-center justify-between">
                        <span>{formatCurrency(previousCashAmount, language)}</span>
                        <Info size={16} className="text-slate-400" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-lg font-black text-black uppercase ml-1">Mother Amount</label>
                    {isAmountEditable ? (
                      <input 
                        type="number" 
                        required 
                        className="w-full px-5 py-4 bg-white border-2 border-slate-500 rounded-2xl focus:border-emerald-500 focus:outline-none font-black text-slate-900 text-xl"
                        value={formData.motherAmount}
                        onChange={e => setFormData({...formData, motherAmount: e.target.value})}
                        placeholder={language === 'bn' ? '০.০০' : '0.00'}
                      />
                    ) : (
                      <div className="w-full px-5 py-4 bg-slate-100 border-2 border-slate-500 rounded-2xl font-black text-slate-900 text-xl flex items-center justify-between">
                        <span>{formatCurrency(previousMotherAmount, language)}</span>
                        <Info size={16} className="text-slate-400" />
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-1">
                  <label className="text-lg font-black text-black uppercase ml-1">{t('amount')}</label>
                  <input 
                    type="number" 
                    required 
                    className="w-full px-5 py-4 bg-white border-2 border-slate-500 rounded-2xl focus:border-emerald-500 focus:outline-none font-black text-slate-900"
                    value={formData.amount}
                    onChange={e => setFormData({...formData, amount: e.target.value})}
                    placeholder={language === 'bn' ? '০.০০' : '0.00'}
                  />
                </div>
              )}
            </div>

            {category !== 'cash_closing' && (
              <div className="space-y-1">
                <label className="text-lg font-black text-black uppercase ml-1">{t('note')}</label>
                <textarea 
                  className="w-full px-5 py-4 bg-white border-2 border-slate-500 rounded-2xl focus:border-emerald-500 focus:outline-none font-bold text-slate-900 min-h-[100px]"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder={t('enterDescription')}
                />
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading || !isEditable || !subType}
              className={cn(
                "w-full py-5 rounded-2xl font-black text-white shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 text-lg",
                (subType === 'receive' || category === 'profit') ? "bg-emerald-600 shadow-emerald-200" : 
                subType === 'payment' ? "bg-rose-600 shadow-rose-200" : 
                subType === 'expense' ? "bg-amber-600 shadow-amber-200" : "bg-slate-400"
              )}
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {(subType === 'receive' || category === 'profit') ? <ArrowUpCircle size={24} /> : <ArrowDownCircle size={24} />}
                  {category === 'profit' ? t('addProfit') : subType === 'receive' ? t('receive') : subType === 'payment' ? t('payment') : subType === 'expense' ? t('expense') : t('submit')}
                </>
              )}
            </button>
          </form>
        </div>
      )}

      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 text-center space-y-6 shadow-2xl">
              <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto">
                <AlertCircle size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-800">{t('areYouSure')}</h3>
                <p className="text-slate-500 text-sm font-bold">{t('deleteConfirmMessage')}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl">{t('cancel')}</button>
                <button onClick={() => handleDelete(showDeleteConfirm)} className="flex-1 py-4 bg-rose-600 text-white font-black rounded-2xl shadow-lg shadow-rose-200">{t('delete')}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {successModal && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 text-center space-y-6 shadow-2xl">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto">
                <CheckCircle2 size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-800">Success</h3>
                <p className="text-slate-500 text-sm font-bold">{successModal}</p>
              </div>
              <button onClick={() => setSuccessModal(null)} className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-lg shadow-emerald-200 active:scale-95 transition-all text-lg">{t('ok')}</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {errorModal && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 text-center space-y-6 shadow-2xl">
              <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto">
                <AlertCircle size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-800">{t('warning')}</h3>
                <p className="text-slate-500 text-sm font-bold">{errorModal}</p>
              </div>
              <button onClick={() => setErrorModal(null)} className="w-full py-4 bg-slate-800 text-white font-black rounded-2xl active:scale-95 transition-all text-lg">{t('ok')}</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
