import React from 'react';
import { useForm } from 'react-hook-form';
import {
  X,
  Save,
  Loader2,
  HardDrive,
  Link as LinkIcon,
  Gamepad2,
  Image as ImageIcon,
  Tag,
  Hash,
  GitBranch,
  AlignLeft,
} from 'lucide-react';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../../config/firebaseConfig';
import Swal from 'sweetalert2';
import { REQUEST_STATUS } from '../../../shared/requestStatus';

const ApproveGameModal = ({ request, onClose, onSuccess }) => {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      name: request.title, // Sesuai field 'name' di GameFormModal
      version: 'v1.0', // Default version
      size: '', // Input angka
      unit: 'GB', // Default unit
      jumlahPart: 1, // Default jumlah part
      genre: '', // String dipisah koma
      location: '', // Diisi Link GDrive
      description: request.notes || '', // Ambil dari notes request
      status: 'Available',
      coverArtUrl: '', // Opsional untuk gambar
    },
  });

  const onSubmit = async (data) => {
    try {
      // 1. Format Data agar COCOK dengan standar GameFormModal
      const gameData = {
        name: data.name,
        version: data.version || null,

        // Pastikan size dan jumlahPart dikonversi ke Number
        size: Number(data.size),
        unit: data.unit,
        jumlahPart: Number(data.jumlahPart),

        // Konversi string genre ke Array
        genre: data.genre
          .split(',')
          .map((g) => g.trim())
          .filter((g) => g !== ''),

        // Mengikuti skema existing games: locations adalah array
        locations: [data.location],
        description: data.description,
        status: data.status,

        // Tambahan: Platform dari request (meski tidak ada di snippet GameFormModal,
        // sebaiknya tetap disimpan untuk filter/kategori)
        platform: request.platform || 'PC',

        // Mengikuti skema existing games: coverArtUrl
        coverArtUrl: data.coverArtUrl || '',
        shopeeLink: '',

        dateAdded: serverTimestamp(),

        // Metadata tracking asal usul data
        originRequestId: request.id,
        addedBy: 'Admin Approval',
      };

      // 2. Simpan ke koleksi 'games'
      await addDoc(collection(db, 'games'), gameData);

      // 3. Update status Request jadi 'available' untuk tracking publik
      await updateDoc(doc(db, 'requests', request.id), {
        status: REQUEST_STATUS.AVAILABLE,
        approvedAt: serverTimestamp(),
        availableAt: serverTimestamp(),
        finalGameTitle: data.name,
      });

      Swal.fire({
        title: 'Sukses!',
        text: 'Game berhasil masuk ke Katalog (Tabel Games).',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error approving game:', error);
      Swal.fire({
        title: 'Error',
        text: 'Gagal menyimpan data. Pastikan input angka valid.',
        icon: 'error',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">
              Finalisasi ke Katalog
            </h3>
            <p className="text-slate-500 text-xs">
              Data disesuaikan dengan standar GameFormModal.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* KOLOM KIRI: Identitas Game */}
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nama Game
                </label>
                <div className="relative">
                  <Gamepad2
                    className="absolute top-2.5 left-3 text-slate-400"
                    size={18}
                  />
                  <input
                    {...register('name', { required: 'Nama game wajib diisi' })}
                    className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Version & Platform */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Versi
                  </label>
                  <div className="relative">
                    <GitBranch
                      className="absolute top-2.5 left-3 text-slate-400"
                      size={18}
                    />
                    <input
                      {...register('version')}
                      placeholder="v1.0"
                      className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Platform
                  </label>
                  <input
                    value={request.platform || 'PC'}
                    disabled
                    className="w-full px-3 py-2 border rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Genre */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Genre
                </label>
                <div className="relative">
                  <Tag
                    className="absolute top-2.5 left-3 text-slate-400"
                    size={18}
                  />
                  <input
                    {...register('genre', { required: 'Genre wajib diisi' })}
                    placeholder="Action, RPG (Pisahkan koma)"
                    className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Status
                </label>
                <select
                  {...register('status')}
                  className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="Available">Available</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Empty">Empty</option>
                </select>
              </div>
            </div>

            {/* KOLOM KANAN: Teknis & File */}
            <div className="space-y-4">
              {/* Size & Unit */}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Ukuran (Size)
                  </label>
                  <div className="relative">
                    <HardDrive
                      className="absolute top-2.5 left-3 text-slate-400"
                      size={18}
                    />
                    <input
                      type="number"
                      step="0.01"
                      {...register('size', { required: 'Size wajib diisi' })}
                      className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Unit
                  </label>
                  <select
                    {...register('unit')}
                    className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="GB">GB</option>
                    <option value="MB">MB</option>
                    <option value="TB">TB</option>
                  </select>
                </div>
              </div>

              {/* Jumlah Part */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Jumlah Part
                </label>
                <div className="relative">
                  <Hash
                    className="absolute top-2.5 left-3 text-slate-400"
                    size={18}
                  />
                  <input
                    type="number"
                    {...register('jumlahPart', {
                      required: 'Wajib diisi',
                      min: 1,
                    })}
                    className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="1"
                  />
                </div>
              </div>

              {/* Location / Link GDrive */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Link GDrive (Location)
                </label>
                <div className="relative">
                  <LinkIcon
                    className="absolute top-2.5 left-3 text-slate-400"
                    size={18}
                  />
                  <input
                    {...register('location', { required: 'Link wajib diisi' })}
                    placeholder="https://drive.google.com/..."
                    className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-blue-600 font-mono text-sm"
                  />
                </div>
              </div>

              {/* Cover Image URL */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Cover Image (URL)
                </label>
                <div className="relative">
                  <ImageIcon
                    className="absolute top-2.5 left-3 text-slate-400"
                    size={18}
                  />
                  <input
                    {...register('coverArtUrl')}
                    placeholder="https://imgur.com/..."
                    className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Description (Full Width) */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Deskripsi
            </label>
            <div className="relative">
              <AlignLeft
                className="absolute top-3 left-3 text-slate-400"
                size={18}
              />
              <textarea
                {...register('description')}
                rows="3"
                className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                placeholder="Deskripsi game..."
              ></textarea>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-6 mt-6 border-t border-slate-100 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center shadow-lg shadow-blue-100"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isSubmitting ? 'Menyimpan...' : 'Simpan ke Katalog'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApproveGameModal;
