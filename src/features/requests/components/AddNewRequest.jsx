import React from 'react';
import { useForm } from 'react-hook-form';
import { X, Loader2, StickyNote, Gamepad2 } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../config/firebaseConfig';

const AddNewRequest = ({ onClose, onSuccess }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    try {
      const cleanTitle = data.title.trim();
      
      const requestData = {
        title: cleanTitle,
        title_lower: cleanTitle.toLowerCase(), // TAMBAHAN PENTING
        
        platform: 'PC',
        notes: data.notes || '',
        
        requesterName: 'Admin', 
        source: 'admin', 
        
        status: 'queued', 
        isUrgent: data.isUrgent || false,
        isRdpBatch: false,
        
        votes: 1,
        
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'requests'), requestData);
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error adding manual request:", error);
      alert("Gagal menambahkan request.");
    }
  };

  // ... (Sisa kode return render sama persis seperti sebelumnya)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800">Tambah Antrian Manual</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Judul Game</label>
            <div className="relative">
                <Gamepad2 className="absolute top-2.5 left-3 text-slate-400" size={18} />
                <input {...register("title", { required: "Judul wajib diisi" })} placeholder="Contoh: GTA V" className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            {errors.title && <span className="text-xs text-red-500">{errors.title.message}</span>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Catatan (Opsional)</label>
            <div className="relative">
                <StickyNote className="absolute top-3 left-3 text-slate-400" size={16} />
                <textarea {...register("notes")} placeholder="Catatan untuk diri sendiri..." rows="3" className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"></textarea>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
            <input type="checkbox" id="isUrgent" {...register("isUrgent")} className="w-4 h-4 text-blue-600 rounded cursor-pointer" />
            <label htmlFor="isUrgent" className="text-sm text-slate-700 font-medium cursor-pointer">Tandai Urgent (Prioritas Tinggi)</label>
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-bold flex items-center justify-center transition-all active:scale-[0.98]">
            {isSubmitting ? <Loader2 className="animate-spin" /> : 'Tambahkan ke Antrian'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddNewRequest;