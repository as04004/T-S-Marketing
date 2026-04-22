import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { db, doc, updateDoc, serverTimestamp } from './firebase';
import { Store, MapPin, Image as ImageIcon, Save, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, compressImage } from './lib/utils';
import { useApp } from './App';

export const Settings = () => {
  const { appSettings, role } = useAuth();
  const { t } = useApp();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    outletName: appSettings.outletName || '',
    address: appSettings.address || '',
    logoUrl: appSettings.logoUrl || '',
    appName: appSettings.appName || 'Al-Arafah Islami Bank Plc'
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        setFormData(prev => ({ ...prev, logoUrl: compressed }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role !== 'super_admin' && role !== 'admin') {
      setError('Only Admins can change settings.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const configRef = doc(db, 'app_settings', 'config');
      await updateDoc(configRef, {
        ...formData,
        updatedAt: serverTimestamp()
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  if (role !== 'super_admin' && role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mb-6">
          <AlertCircle size={40} />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">Access Denied</h2>
        <p className="text-slate-500 font-bold max-w-sm">Only administrators can access system settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800">System Settings</h2>
          <p className="text-sm font-bold text-slate-400">Manage outlet details and brand identity</p>
        </div>
        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
          <Store size={24} />
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-indigo-600 p-8 text-white space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border-2 border-white/30 flex items-center justify-center overflow-hidden">
              {formData.logoUrl ? (
                <img src={formData.logoUrl} alt="Logo Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-indigo-500/50">
                  <Store size={32} className="text-white" />
                </div>
              )}
            </div>
            <div>
              <h3 className="text-xl font-black">{formData.outletName || 'Outlet Name'}</h3>
              <p className="text-xs font-bold opacity-70 uppercase tracking-widest">{formData.address || 'Address'}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">App Name</label>
              <div className="relative">
                <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                <input 
                  type="text"
                  required
                  placeholder="System Name"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold"
                  value={formData.appName}
                  onChange={e => setFormData({ ...formData, appName: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Outlet Name</label>
              <div className="relative">
                <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                <input 
                  type="text"
                  required
                  placeholder="SPS Bazar Outlet"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold"
                  value={formData.outletName}
                  onChange={e => setFormData({ ...formData, outletName: e.target.value })}
                />
              </div>
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Outlet Address</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-4 text-slate-300" size={20} />
                <textarea 
                  required
                  placeholder="Full Address"
                  rows={2}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold resize-none"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Outlet Logo (Upload)</label>
              <div className="flex items-center gap-4">
                <label className="flex-1 cursor-pointer group">
                  <div className="w-full p-8 border-2 border-dashed border-slate-200 rounded-2xl group-hover:border-indigo-500 group-hover:bg-indigo-50/30 transition-all flex flex-col items-center justify-center gap-2">
                    <ImageIcon size={32} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                    <span className="text-sm font-bold text-slate-500 group-hover:text-indigo-600 transition-colors">Click to upload logo</span>
                    <span className="text-[10px] text-slate-400">JPG, PNG allowed.</span>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
                {formData.logoUrl && (
                  <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-slate-100 shadow-sm flex-shrink-0">
                    <img src={formData.logoUrl} alt="Logo Preview" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, logoUrl: '' }))}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-lg shadow-lg hover:bg-red-600 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
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
            disabled={loading}
            className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {loading ? 'Updating...' : (
              <>
                <Save size={24} />
                <span>Save Settings</span>
              </>
            )}
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
            Settings saved successfully!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
