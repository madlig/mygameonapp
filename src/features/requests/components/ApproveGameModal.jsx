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
  doc,
  serverTimestamp,
  writeBatch,
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
      title: request.title,
      version: 'v1.0',
      size: '',
      sizeUnit: 'GB',
      numberOfParts: 1,
      genre: '',
      location: '',
      description: request.notes || '',
      status: 'Available',
      coverArtUrl: '',
      installerType: 'PRE-INSTALLED',
      shopeeLink: '',
    },
  });

  const onSubmit = async (data) => {
    try {
      const fileSizeBytes = (() => {
  const n = parseFloat(data.size) || 0;
  const multipliers = { KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4 };
  return Math.round(n * (multipliers[data.sizeUnit] || multipliers.GB));
})();

const slug = (data.title || '')
  .toLowerCase()
  .replace(/['']/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const genreNormalized = (data.genre || []).map((g) => g.toLowerCase().trim());
const autoShortDesc = `${data.title} — game ${genreNormalized.slice(0, 2).join(' & ') || 'menarik'} berukuran ${data.size} ${data.sizeUnit || 'GB'}. Tersedia paket instalasi siap main.`;

const now = serverTimestamp();

const publicData = {
  title: data.title,
  slug,
  platform: data.platform || 'PC',
  genres: genreNormalized,
  tags: data.tags || [],
  fileVersion: data.version || '',
  fileEdition: null,
  fileSizeBytes,
  partsCount: Number(data.numberOfParts) || 1,
  packageType: data.installerType || 'PRE-INSTALLED',
  playModes: ['singleplayer'],
  coverImageUrl: data.coverArtUrl || '',
  screenshots: [],
  videoUrl: null,
  description: data.description || '',
  shortDescription: autoShortDesc,
  shopee: {
    isAvailable: Boolean(data.shopeeLink),
    url: data.shopeeLink || '',
    packagePrice: null,
  },
  officialPlatforms: [],
  steamAppId: null,
  relatedGameIds: [],
  relatedGamesMode: 'auto',
  availabilityStatus: 'available',
  isProblematic: false,
  lastFileUpdatedAt: now,
  lastVersionCheckAt: null,
  steamLastUpdatedAt: null,
  versionStatus: 'unchecked',
  createdAt: now,
  updatedAt: now,
};

const privateData = {
  storageLocations: data.location
    ? [{ email: data.location, role: 'PRIMARY', version: data.version || '', uploadedAt: null, shopeeListed: Boolean(data.shopeeLink), tipe: data.installerType || '', notes: '' }]
    : [],
  adminNotes: `Approved from request: ${requestId || ''}`,
  verificationStatus: 'needs_check',
  lastVerifiedAt: null,
  addedBy: 'Approved Request',
  coverSourceCredit: '',
};

// Write ke 2 collections sekaligus
const newDocRef = doc(collection(db, 'games'));
const batch = writeBatch(db);
batch.set(newDocRef, publicData);
batch.set(doc(db, 'gamesPrivate', newDocRef.id), privateData);
await batch.commit();

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
        text: `Finalisasi gagal: ${error?.message || 'Terjadi kesalahan saat menyimpan data.'}`,
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
              Data disesuaikan dengan schema katalog games.
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
              {/* Title */}
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
                    {...register('title', {
                      required: 'Nama game wajib diisi',
                    })}
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
                  <option value="Broken">Broken</option>
                  <option value="Testing">Testing</option>
                </select>
              </div>

              {/* Installer Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Installer Type
                </label>
                <select
                  {...register('installerType')}
                  className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="PRE-INSTALLED">PRE-INSTALLED</option>
                  <option value="INSTALLER GOG">INSTALLER GOG</option>
                  <option value="INSTALLER ELAMIGOS">INSTALLER ELAMIGOS</option>
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
                    {...register('sizeUnit')}
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
                    {...register('numberOfParts', {
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

              {/* Shopee Link */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Shopee Link (Opsional)
                </label>
                <div className="relative">
                  <LinkIcon
                    className="absolute top-2.5 left-3 text-slate-400"
                    size={18}
                  />
                  <input
                    {...register('shopeeLink')}
                    placeholder="https://shopee.co.id/..."
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
