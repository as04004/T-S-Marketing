import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { db, auth, doc, updateDoc, serverTimestamp, updateEmail, updatePassword } from './firebase';
import { User, Mail, Lock, Shield, CheckCircle2, AlertCircle, Camera, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, compressImage } from './lib/utils';
import { useApp } from './App';

export const Profile = () => {
  const { user } = useAuth();
  const { t } = useApp();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: user?.name || user?.displayName || '',
    email: user?.email || '',
    password: '',
    photoURL: user?.photoURL || ''
  });

  const isSuperAdmin = user?.email === 'cmrabbi@gmail.com';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        setFormData(prev => ({ ...prev, photoURL: compressed }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSuperAdmin) {
      setError('Super Admin এর তথ্য পরিবর্তন করা সম্ভব নয়।');
      return;
    }
    if (!user?.uid || !auth.currentUser) return;
    setLoading(true);
    setError('');

    try {
      // 1. Update Email in Auth if changed
      if (formData.email !== auth.currentUser.email) {
        try {
          await updateEmail(auth.currentUser, formData.email);
        } catch (err: any) {
          if (err.code === 'auth/requires-recent-login') {
            throw new Error(t('reloginRequiredEmail'));
          }
          if (err.code === 'auth/operation-not-allowed') {
            throw new Error("Email change is restricted. Please contact developer.");
          }
          throw err;
        }
      }

      // 2. Update Password in Auth if provided
      if (formData.password) {
        try {
          await updatePassword(auth.currentUser, formData.password);
        } catch (err: any) {
          if (err.code === 'auth/requires-recent-login') {
            throw new Error(t('reloginRequired'));
          }
          throw err;
        }
      }

      // 3. Update Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        name: formData.name,
        email: formData.email,
        photoURL: formData.photoURL,
        updatedAt: serverTimestamp()
      });

      setSuccess(true);
      setSuccessMsg(t('updateSuccess'));
      setFormData(prev => ({ ...prev, password: '' }));
      setTimeout(() => {
        setSuccess(false);
        setSuccessMsg('');
      }, 5000);
    } catch (err: any) {
      setError(err.message || t('updateFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800">{t('profile')}</h2>
          <p className="text-sm font-bold text-slate-400">{t('updatePersonalInfo')}</p>
        </div>
        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-100">
          <User size={24} />
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-[#003366] p-8 flex flex-col items-center text-white space-y-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-[2rem] bg-white/20 backdrop-blur-md border-4 border-white/30 flex items-center justify-center overflow-hidden">
              {formData.photoURL ? (
                <img src={formData.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={48} className="text-white" />
              )}
            </div>
            <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center border-4 border-[#003366] hover:scale-110 transition-transform cursor-pointer">
              <Camera size={18} />
              <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={isSuperAdmin} />
            </label>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-black">{formData.name || user?.name || t('user')}</h3>
            <p className="text-xs font-bold opacity-70 uppercase tracking-widest">
              {user?.role === 'super_admin' ? t('superAdmin') : user?.role === 'admin' ? t('adminRole') : t('director')}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">{t('yourName')}</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                <input 
                  type="text"
                  required
                  disabled={isSuperAdmin}
                  className={cn(
                    "w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold",
                    isSuperAdmin && "opacity-70 cursor-not-allowed"
                  )}
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">{t('emailAddress')}</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                <input 
                  type="email"
                  required
                  disabled={isSuperAdmin}
                  className={cn(
                    "w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold",
                    isSuperAdmin && "opacity-70 cursor-not-allowed"
                  )}
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">{t('newPasswordOptional')}</label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                <input 
                  type="password"
                  placeholder={t('New Password (Optional)')}
                  disabled={isSuperAdmin}
                  className={cn(
                    "w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold",
                    isSuperAdmin && "opacity-70 cursor-not-allowed"
                  )}
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 text-xs font-bold flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={loading || isSuperAdmin}
            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-lg shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {loading ? t('updating') : isSuperAdmin ? 'আপনার তথ্য পরিবর্তন লক করা আছে' : t('updateInfo')}
          </button>
        </form>
      </div>

      <AnimatePresence>
        {success && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black shadow-2xl flex items-center gap-3 z-[100]"
          >
            <CheckCircle2 size={24} />
            {successMsg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
