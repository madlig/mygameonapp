import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Save, Loader2, Calendar, Flag, Tag, Zap, Search, AlertCircle } from 'lucide-react';
import { collection, addDoc, updateDoc, doc, serverTimestamp, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../../../config/firebaseConfig';
import Swal from 'sweetalert2';

// Tambahkan prop 'prefillData'
const TaskFormModal = ({ isOpen, onClose, initialData, prefillData, onSuccess }) => {
  const { register, handleSubmit, watch, setValue, reset, formState: { isSubmitting } } = useForm({
    defaultValues: {
      title: '',
      description: '',
      priority: 'Medium',
      category: 'General',
      dueDate: '',
      isAutomation: false,
      automationTargetId: '',
      newVersion: ''
    }
  });

  const [gamesList, setGamesList] = useState([]);
  const [isGamesLoading, setIsGamesLoading] = useState(false);

  const categoryWatch = watch('category');
  const isAutomationWatch = watch('isAutomation');

  useEffect(() => {
    if (isOpen) {
      // LOGIKA BARU: INITIAL vs PREFILL vs RESET
      if (initialData) {
        // MODE EDIT (Data sudah ada)
        setValue('title', initialData.title);
        setValue('description', initialData.description || '');
        setValue('priority', initialData.priority || 'Medium');
        setValue('category', initialData.category || 'General');
        
        if (initialData.dueDate?.seconds) {
             const date = new Date(initialData.dueDate.seconds * 1000);
             setValue('dueDate', date.toISOString().split('T')[0]);
        }

        setValue('isAutomation', initialData.isAutomation || false);
        setValue('automationTargetId', initialData.automationTargetId || '');
        setValue('newVersion', initialData.automationPayload?.newVersion || '');
      
      } else if (prefillData) {
        // MODE CREATE VIA GAME TABLE (Data titipan)
        reset({
            title: `Update ${prefillData.gameTitle}`, // Judul otomatis
            description: `Update versi game dari ${prefillData.currentVersion || '?'} ke versi terbaru.`,
            priority: 'High', // Biasanya update itu penting
            category: 'Game Update', // Otomatis kategori Game Update
            isAutomation: true, // Otomatis nyalakan automation
            automationTargetId: prefillData.gameId, // Otomatis pilih gamenya
            newVersion: '',
            dueDate: new Date().toISOString().split('T')[0] // Deadline hari ini
        });

      } else {
        // MODE CREATE BIASA (Kosong)
        reset({
            title: '', description: '', priority: 'Medium', category: 'General',
            dueDate: '', isAutomation: false, automationTargetId: '', newVersion: ''
        });
      }

      // Fetch Games List
      const fetchGames = async () => {
        setIsGamesLoading(true);
        try {
            const q = query(collection(db, 'games'), orderBy('title'));
            const snap = await getDocs(q);
            setGamesList(snap.docs.map(d => ({ id: d.id, title: d.data().title })));
        } catch (e) {
            console.error("Error fetching games", e);
        } finally {
            setIsGamesLoading(false);
        }
      };
      fetchGames();
    }
  }, [isOpen, initialData, prefillData, setValue, reset]);

  const onSubmit = async (data) => {
    try {
      const taskData = {
        title: data.title,
        description: data.description,
        priority: data.priority,
        category: data.category,
        dueDate: data.dueDate ? Timestamp.fromDate(new Date(data.dueDate)) : null,
        status: initialData?.status || 'Todo',
        updatedAt: serverTimestamp(),
        isAutomation: data.isAutomation,
      };

      if (!initialData) {
        taskData.createdAt = serverTimestamp();
      }

      if (data.isAutomation && data.automationTargetId) {
        const selectedGame = gamesList.find(g => g.id === data.automationTargetId);
        // Fallback jika gamesList belum ke-load tapi ID ada (dari prefill)
        const targetTitle = selectedGame?.title || prefillData?.gameTitle || 'Unknown Game';
        
        taskData.automationTargetId = data.automationTargetId;
        taskData.automationTargetTitle = targetTitle;
        taskData.automationPayload = {
            newVersion: data.newVersion,
            targetField: 'version'
        };
      }

      if (initialData) {
        await updateDoc(doc(db, 'tasks', initialData.id), taskData);
        Swal.fire({ icon: 'success', title: 'Task Diupdate', timer: 1000, showConfirmButton: false });
      } else {
        await addDoc(collection(db, 'tasks'), taskData);
        Swal.fire({ icon: 'success', title: 'Task Dibuat', timer: 1000, showConfirmButton: false });
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Gagal menyimpan task', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800 text-lg">{initialData ? 'Edit Task' : 'Task Baru'}</h3>
          <button onClick={onClose}><X size={20} className="text-slate-500 hover:bg-slate-200 rounded-full p-1" /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 overflow-y-auto">
          
          <div>
            <input 
                {...register("title", { required: true })}
                placeholder="Apa yang perlu dikerjakan?" 
                className="w-full text-lg font-bold placeholder:text-slate-300 border-none focus:ring-0 px-0 py-2 text-slate-800"
                autoFocus
            />
            <textarea 
                {...register("description")}
                placeholder="Tambahkan detail..."
                className="w-full text-sm text-slate-600 placeholder:text-slate-300 border-none focus:ring-0 px-0 resize-none h-20"
            />
          </div>

          <div className="border-t border-slate-100 my-2"></div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center"><Tag size={12} className="mr-1"/> Kategori</label>
                <select {...register("category")} className="w-full text-sm border-slate-200 rounded-lg focus:ring-blue-500">
                    <option value="General">General / Brain Dump</option>
                    <option value="Shopee">Shopee Store</option>
                    <option value="Game Update">Game Update</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Personal">Personal</option>
                </select>
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center"><Flag size={12} className="mr-1"/> Prioritas</label>
                <select {...register("priority")} className="w-full text-sm border-slate-200 rounded-lg focus:ring-blue-500">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                </select>
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center"><Calendar size={12} className="mr-1"/> Deadline</label>
                <input type="date" {...register("dueDate")} className="w-full text-sm border-slate-200 rounded-lg focus:ring-blue-500" />
             </div>
          </div>

          {/* AUTOMATION SECTION */}
          {categoryWatch === 'Game Update' && (
             <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 mt-4 animate-in slide-in-from-top-2">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-purple-800 flex items-center">
                        <Zap size={16} className="mr-2 text-purple-600"/> Otomatisasi Game
                    </h4>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" {...register("isAutomation")} className="sr-only peer" />
                        <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                </div>
                
                {isAutomationWatch && (
                    <div className="space-y-3">
                        <div className="text-xs text-purple-600 mb-2">
                            <AlertCircle size={12} className="inline mr-1"/>
                            Saat task ini <b>"Done"</b>, game otomatis terupdate.
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold text-purple-700 mb-1">Pilih Game</label>
                            {isGamesLoading ? <Loader2 className="animate-spin h-4 w-4"/> : (
                                <select {...register("automationTargetId")} className="w-full text-sm border-purple-200 rounded-lg focus:ring-purple-500 bg-white">
                                    <option value="">-- Pilih Game --</option>
                                    {gamesList.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
                                </select>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-purple-700 mb-1">Versi Baru (Target)</label>
                            <input 
                                {...register("newVersion")} 
                                placeholder="Contoh: v1.6.8"
                                className="w-full text-sm border-purple-200 rounded-lg focus:ring-purple-500" 
                            />
                        </div>
                    </div>
                )}
             </div>
          )}

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium text-sm">Batal</button>
            <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold text-sm hover:bg-slate-800 flex items-center">
                {isSubmitting ? <Loader2 className="animate-spin w-4 h-4"/> : 'Simpan Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskFormModal;