// src/features/requests/components/AddNewRequest.jsx
//
// Modal untuk admin menambah request manual.
// Simplified: just title + notes. Starts at "pending" status.

import React from 'react';
import { useForm } from 'react-hook-form';
import { X, Loader2, StickyNote, Gamepad2 } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../config/firebaseConfig';
import { REQUEST_STATUS } from '../../../shared/requestStatus';
import Swal from 'sweetalert2';

const swalDark = {
  color: '#F3F4F6',
  background: '#1A1F27',
  confirmButtonColor: '#FFD100',
};

const AddNewRequest = ({ onClose, onSuccess }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const createTrackingCode = () => {
    const seed = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    return `RQ-${seed.slice(-6).toUpperCase()}`;
  };

  const onSubmit = async (data) => {
    try {
      const cleanTitle = data.title.trim();

      const requestData = {
        title: cleanTitle,
        title_lower: cleanTitle.toLowerCase(),
        trackingCode: createTrackingCode(),
        platform: 'PC',
        notes: data.notes?.trim() || '',
        requesterName: 'Admin',
        contactWhatsApp: '',
        status: REQUEST_STATUS.PENDING,
        votes: 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'requests'), requestData);

      Swal.fire({
        ...swalDark,
        icon: 'success',
        title: 'Request ditambahkan',
        timer: 1200,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding manual request:', error);
      Swal.fire({
        ...swalDark,
        icon: 'error',
        title: 'Gagal',
        text: 'Gagal menambahkan request.',
      });
    }
  };

  const inputClass =
    'w-full pl-10 pr-3 py-2.5 bg-[#111317] border border-[#2A2F39] text-[#C8CFDA] placeholder-[#4A5568] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD100]/40 focus:border-[#FFD100]/50 transition-colors text-sm';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1A1F27] rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-[#2A2F39]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#2A2F39] flex justify-between items-center bg-[#111317]">
          <h3 className="font-bold text-[#F3F4F6]">Tambah Request Manual</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#2A2F39] rounded-full transition-colors"
          >
            <X size={20} className="text-[#7E8796]" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-[#C8CFDA] mb-1.5">
              Judul Game *
            </label>
            <div className="relative">
              <Gamepad2
                className="absolute top-2.5 left-3 text-[#4A5568]"
                size={18}
              />
              <input
                {...register('title', { required: 'Judul wajib diisi' })}
                placeholder="Contoh: GTA V"
                className={inputClass}
              />
            </div>
            {errors.title && (
              <span className="text-xs text-red-400 mt-1">
                {errors.title.message}
              </span>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-[#C8CFDA] mb-1.5">
              Catatan (Opsional)
            </label>
            <div className="relative">
              <StickyNote
                className="absolute top-3 left-3 text-[#4A5568]"
                size={16}
              />
              <textarea
                {...register('notes')}
                placeholder="Catatan internal..."
                rows="3"
                className="w-full pl-10 pr-3 py-2.5 bg-[#111317] border border-[#2A2F39] text-[#C8CFDA] placeholder-[#4A5568] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD100]/40 focus:border-[#FFD100]/50 transition-colors text-sm resize-none"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-[#FFD100] text-[#111317] rounded-lg hover:bg-[#FFD100]/90 font-bold flex items-center justify-center transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              'Tambah Request'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddNewRequest;
