import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy, db, handleFirestoreError, OperationType } from './firebase';
import { useAuth } from './AuthContext';
import { useApp } from './App';
import { Plus, Edit2, Trash2, Filter, Search, Phone, User as UserIcon, X, Save, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, getDirectDriveUrl, compressImage } from './lib/utils';

interface EmployeeData {
  id: string;
  name: string;
  designation: string;
  userId: string;
  mobile: string;
  address: string;
  photoUrl: string;
  createdAt: any;
}

interface DesignationData {
  id: string;
  name: string;
}

const DEFAULT_DESIGNATIONS = ['Outlet Manager', 'Operation Manager', 'Teller'];

export const EmployeeTable = ({ employees, role, t, onEdit }: { employees: EmployeeData[], role: string, t: any, onEdit?: (emp: EmployeeData) => void }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successModal, setSuccessModal] = useState<string | null>(null);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  const handleDeleteEmployee = async (id: string) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'employees', id));
      setSuccessModal(t('employeeDeleted'));
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting employee:", error);
      setErrorModal(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const showActions = role === 'super_admin';

  const headerClass = "p-1.5 font-black uppercase text-[11px] tracking-wider text-slate-800 border border-slate-400 text-center bg-[#e8edfb]";
  const cellClass = "p-1 font-bold text-sm whitespace-nowrap text-slate-700 border border-slate-400";

  return (
    <div className="overflow-x-auto border border-slate-400">
      <table className="w-full border-collapse table-auto">
        <thead>
          <tr>
            <th className={headerClass}>{t('sl')}</th>
            <th className={headerClass}>{t('photos') || 'Photos'}</th>
            <th className={headerClass}>{t('name')}</th>
            <th className={headerClass}>{t('designation') || 'Designation'}</th>
            <th className={headerClass}>{t('userId')}</th>
            <th className={headerClass}>{t('mobile')}</th>
            <th className={headerClass}>{t('address') || 'Address'}</th>
            {showActions && <th className={headerClass}>{t('action')}</th>}
          </tr>
        </thead>
        <tbody className="bg-white">
          {employees.length === 0 ? (
            <tr>
              <td colSpan={showActions ? 8 : 7} className="p-12 text-center border border-slate-400">
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <p className="font-bold">No data found</p>
                </div>
              </td>
            </tr>
          ) : (
            employees.map((emp, index) => (
              <tr key={emp.id}>
                {/* SL - Centered */}
                <td className={cn(cellClass, "text-center")}>{index + 1}</td>
                <td className="p-0 border border-slate-400 w-12 h-12 overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center bg-slate-50">
                    {emp.photoUrl ? (
                      <img src={emp.photoUrl} alt={emp.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <UserIcon size={20} />
                      </div>
                    )}
                  </div>
                </td>
                {/* Name - Left Aligned (Default) */}
                <td className={cellClass}>{emp.name}</td>
                {/* Designation - Centered */}
                <td className={cn(cellClass, "text-center")}>{emp.designation}</td>
                {/* UserID - Centered */}
                <td className={cn(cellClass, "font-mono text-xs text-center")}>{emp.userId}</td>
                {/* Mobile - Centered */}
                <td className={cn(cellClass, "text-center")}>
                  <a href={`tel:${emp.mobile}`} className="flex items-center justify-center gap-2 text-emerald-600 font-bold hover:underline">
                    <Phone size={14} />
                    <span>{emp.mobile}</span>
                  </a>
                </td>
                {/* Address */}
                <td className={cn(cellClass, "text-xs max-w-[150px] truncate")}>{emp.address || '---'}</td>
                {showActions && (
                  <td className={cn(cellClass, "text-center")}>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        onClick={() => onEdit?.(emp)}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(emp.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Delete Confirmation, Success Modal, and Error Modal code remains exactly the same as provided... */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto rotate-12">
                <Trash2 size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-800">{t('delete')}</h3>
                <p className="text-slate-500 text-sm font-bold">{t('confirmDeleteEmployee') || 'Are you sure you want to delete this employee?'}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200">{t('cancel')}</button>
                <button onClick={() => handleDeleteEmployee(showDeleteConfirm)} disabled={loading} className="flex-1 py-4 bg-rose-600 text-white font-bold rounded-2xl shadow-lg shadow-rose-200">
                  {loading ? t('deleting') : t('delete')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {successModal && (
          <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto">
                <CheckCircle2 size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-800">{t('success')}</h3>
                <p className="text-slate-500 text-sm font-bold">{successModal}</p>
              </div>
              <button onClick={() => setSuccessModal(null)} className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-lg shadow-emerald-200">{t('ok')}</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {errorModal && (
          <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto">
                <AlertTriangle size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-800">{t('error')}</h3>
                <p className="text-slate-500 text-sm font-bold">{errorModal}</p>
              </div>
              <button onClick={() => setErrorModal(null)} className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl">{t('ok')}</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const Employee = () => {
  const { t, language } = useApp();
  const { role, user: currentUser, appSettings } = useAuth();
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [designations, setDesignations] = useState<DesignationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeData | null>(null);
  const [showDesignationModal, setShowDesignationModal] = useState(false);
  const [newDesignation, setNewDesignation] = useState('');
  const [successModal, setSuccessModal] = useState<string | null>(null);
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    designation: '',
    userId: '',
    mobile: '',
    address: '',
    photoUrl: ''
  });

  useEffect(() => {
    const unsubDesignations = onSnapshot(collection(db, 'designations'), (snap) => {
      setDesignations(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as DesignationData)));
    });

    const unsubEmployees = onSnapshot(collection(db, 'employees'), (snap) => {
      setEmployees(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmployeeData)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'employees');
      setLoading(false);
    });

    return () => {
      unsubDesignations();
      unsubEmployees();
    };
  }, []);

  const getDesignationPriority = (designation: string) => {
    if (designation === 'Outlet Manager') return 1;
    if (designation === 'Operation Manager') return 2;
    if (designation === 'Teller') return 3;
    return 4;
  };

  const sortedEmployees = [...employees].sort((a, b) => {
    const priorityA = getDesignationPriority(a.designation);
    const priorityB = getDesignationPriority(b.designation);
    if (priorityA !== priorityB) return priorityA - priorityB;
    return a.name.localeCompare(b.name);
  });

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        ...formData,
        updatedAt: serverTimestamp()
      };

      if (editingEmployee) {
        await updateDoc(doc(db, 'employees', editingEmployee.id), data);
        setSuccessModal(t('employeeUpdated'));
      } else {
        await addDoc(collection(db, 'employees'), {
          ...data,
          createdAt: serverTimestamp()
        });
        setSuccessModal(t('employeeCreated'));
      }
      setShowAddModal(false);
      setEditingEmployee(null);
      setFormData({ name: '', designation: '', userId: '', mobile: '', address: '', photoUrl: '' });
    } catch (error) {
      console.error("Error saving employee:", error);
      setErrorModal(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'employees', id));
      setSuccessModal(t('employeeDeleted'));
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting employee:", error);
      setErrorModal(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddDesignation = async () => {
    if (!newDesignation.trim()) return;
    try {
      await addDoc(collection(db, 'designations'), {
        name: newDesignation.trim(),
        createdAt: serverTimestamp()
      });
      setNewDesignation('');
    } catch (error) {
      console.error("Error adding designation:", error);
    }
  };

  const handleRemoveDesignation = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'designations', id));
    } catch (error) {
      console.error("Error removing designation:", error);
    }
  };

  const allDesignations = [...DEFAULT_DESIGNATIONS, ...designations.map(d => d.name)];

  return (
    <div className="space-y-6 pb-20">
      <div className="relative flex flex-col items-center justify-center text-center space-y-2 py-4">
        <div className="flex flex-col items-center gap-3">
          {appSettings?.logoUrl && (
            <img src={appSettings.logoUrl} alt="Logo" className="w-16 h-16 rounded-2xl object-cover border border-slate-100 shadow-sm" />
          )}
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black leading-tight gradient-text">
              {appSettings?.appName || 'Al-Arafah Islami Bank PLC'}
            </h1>
            <h2 className="text-xl font-black gradient-text">
              {appSettings?.outletName || 'SPS Bazar Outlet'}
            </h2>
            <p className="text-sm font-bold gradient-text max-w-xl mx-auto px-4">
              {appSettings?.address || 'Kayaria Lanch Ghat, Kayaria, Kalkini, Madaripur'}
            </p>
          </div>
        </div>
        
        <h3 className="text-lg font-black text-emerald-700 pt-4 uppercase tracking-[0.2em]">{t('employeeList')}</h3>
        
        <div className="absolute right-0 top-1/2 -translate-y-1/2">
          {role === 'super_admin' && (
            <button
              onClick={() => {
                setEditingEmployee(null);
                setFormData({ name: '', designation: '', userId: '', mobile: '', address: '', photoUrl: '' });
                setShowAddModal(true);
              }}
              title={t('addEmployee')}
              className="p-3.5 bg-emerald-600 text-white font-black rounded-2xl shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center group"
            >
              <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>
          )}
        </div>
      </div>

      <EmployeeTable 
        employees={sortedEmployees} 
        role={role || ''} 
        t={t} 
        onEdit={(emp) => {
          setEditingEmployee(emp);
          setFormData({
            name: emp.name,
            designation: emp.designation,
            userId: emp.userId,
            mobile: emp.mobile,
            address: emp.address || '',
            photoUrl: emp.photoUrl
          });
          setShowAddModal(true);
        }}
      />

      {/* Modals (Add, Designation, Success, Error, Delete) code remains exactly the same as provided... */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 md:left-64 lg:left-72 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white w-full max-w-2xl rounded-[2.5rem] p-8 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-slate-800 tracking-tight">
                  {editingEmployee ? t('editEmployee') : t('addEmployee')}
                </h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveEmployee} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">{t('employeeName') || 'Employee Name'}</label>
                  <input
                    type="text"
                    required
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 focus:outline-none font-bold"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">{t('designation')}</label>
                  <select
                    required
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 focus:outline-none font-bold appearance-none"
                    value={formData.designation}
                    onChange={e => setFormData({ ...formData, designation: e.target.value })}
                  >
                    <option value="">{t('selectDesignation') || 'Select Designation'}</option>
                    {allDesignations.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  {role === 'super_admin' && (
                    <button
                      type="button"
                      onClick={() => setShowDesignationModal(true)}
                      className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1 ml-1 hover:underline"
                    >
                      + {t('addDesignation') || 'Add / Remove Designation'}
                    </button>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">{t('userId')}</label>
                  <input
                    type="text"
                    required
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 focus:outline-none font-bold"
                    value={formData.userId}
                    onChange={e => setFormData({ ...formData, userId: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">{t('mobile')}</label>
                  <input
                    type="text"
                    required
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 focus:outline-none font-bold"
                    value={formData.mobile}
                    onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">{t('address') || 'Address'}</label>
                  <input
                    type="text"
                    required
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 focus:outline-none font-bold"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">{t('photo') || 'Photo'}</label>
                  <div className="flex items-center gap-4">
                    <label className="flex-1 cursor-pointer group">
                      <div className="w-full p-4 border-2 border-dashed border-slate-200 rounded-2xl group-hover:border-emerald-500 group-hover:bg-emerald-50/30 transition-all flex items-center justify-center gap-2">
                        <Plus size={20} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
                        <span className="text-sm font-bold text-slate-500 group-hover:text-emerald-600 transition-colors">Click to upload photo</span>
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = async () => {
                              const compressed = await compressImage(reader.result as string);
                              setFormData({ ...formData, photoUrl: compressed });
                            };
                            reader.readAsDataURL(file);
                          }
                        }} 
                      />
                    </label>
                    {formData.photoUrl && (
                      <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-slate-100 shadow-sm flex-shrink-0">
                        <img src={formData.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, photoUrl: '' }))}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-lg"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={20} />}
                    <span>{editingEmployee ? t('update') : t('save')}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDesignationModal && (
          <div className="fixed inset-0 md:left-64 lg:left-72 z-[130] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-800 tracking-tight">{t('addDesignation') || 'Designations'}</h3>
                <button onClick={() => setShowDesignationModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-emerald-500 focus:outline-none font-bold"
                    placeholder={t('designationName') || "New Designation"}
                    value={newDesignation}
                    onChange={e => setNewDesignation(e.target.value)}
                  />
                  <button
                    onClick={handleAddDesignation}
                    className="p-3 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-100"
                  >
                    <Plus size={20} />
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('defaultDesignations') || 'Default'}</p>
                  {DEFAULT_DESIGNATIONS.map(d => (
                    <div key={d} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="font-bold text-slate-700">{d}</span>
                      <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Fixed</span>
                    </div>
                  ))}
                  
                  {designations.length > 0 && (
                    <>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4 ml-1">{t('customDesignations') || 'Custom'}</p>
                      {designations.map(d => (
                        <div key={d.id} className="flex justify-between items-center p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                          <span className="font-bold text-slate-700">{d.name}</span>
                          <button
                            onClick={() => handleRemoveDesignation(d.id)}
                            className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {successModal && (
          <div className="fixed inset-0 md:left-64 lg:left-72 z-[140] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto">
                <CheckCircle2 size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-800">{t('success')}</h3>
                <p className="text-slate-500 text-sm font-bold">{successModal}</p>
              </div>
              <button onClick={() => setSuccessModal(null)} className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-lg shadow-emerald-200">{t('ok')}</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {errorModal && (
          <div className="fixed inset-0 md:left-64 lg:left-72 z-[140] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto">
                <AlertTriangle size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-800">{t('error')}</h3>
                <p className="text-slate-500 text-sm font-bold">{errorModal}</p>
              </div>
              <button onClick={() => setErrorModal(null)} className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl">{t('ok')}</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 md:left-64 lg:left-72 z-[130] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-sm rounded-[2.5rem] p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto rotate-12">
                <Trash2 size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-800">{t('delete')}</h3>
                <p className="text-slate-500 text-sm font-bold">{t('confirmDeleteEmployee') || 'Are you sure you want to delete this employee?'}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200">{t('cancel')}</button>
                <button onClick={() => handleDeleteEmployee(showDeleteConfirm)} disabled={loading} className="flex-1 py-4 bg-rose-600 text-white font-bold rounded-2xl shadow-lg shadow-rose-200">
                  {loading ? t('deleting') : t('delete')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};