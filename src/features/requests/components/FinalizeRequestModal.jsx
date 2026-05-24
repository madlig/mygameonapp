// src/features/requests/components/FinalizeRequestModal.jsx
//
// Quick-finalize modal: when admin completes a request, this collects
// minimal game data and batch-writes to games/ + gamesPrivate/ + updates request.
// Much simpler than the full GameFormModal — just the essentials.

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  X,
  Loader2,
  CheckCircle,
  HardDrive,
  Link2,
  FolderOpen,
  Gamepad2,
} from 'lucide-react';
import {
  collection,
  doc,
  getDocs,
  updateDoc,
  writeBatch,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../../config/firebaseConfig';
import { REQUEST_STATUS } from '../../../shared/requestStatus';
import Swal from 'sweetalert2';

const swalDark = {
  color: '#F3F4F6',
  background: '#1A1F27',
  confirmButtonColor: '#FFD100',
};

function slugify(title = '') {
  return title
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

function gbToBytes(gb) {
  const n = parseFloat(gb);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n * 1024 ** 3);
}

const PACKAGE_TYPES = [
  'PRE-INSTALLED',
  'INSTALLER-GOG',
  'INSTALLER-ELAMIGOS',
  'INSTALLER',
];

const FinalizeRequestModal = ({ request, onClose, onSuccess }) => {
  const [locationEmails, setLocationEmails] = useState([]);
  const [genres, setGenres] = useState([]);
  const [loadingMeta, setLoadingMeta] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      title: request.title || '',
      fileSizeGB: '',
      partsCount: 1,
      packageType: 'PRE-INSTALLED',
      genre: '',
      storageEmail: '',
      shopeeUrl: '',
      adminNotes: '',
    },
  });

  // Fetch metadata (genres + storage emails)
  useEffect(() => {
    const fetchMeta = async () => {
      setLoadingMeta(true);
      try {
        const [genresSnap, privateSnap] = await Promise.all([
          getDocs(collection(db, 'metadata', 'genres', 'entries')),
          getDocs(collection(db, 'gamesPrivate')),
        ]);

        setGenres(
          genresSnap.docs
            .map((d) => ({ id: d.id, label: d.data().label || d.id }))
            .sort((a, b) => a.label.localeCompare(b.label))
        );

        const emailSet = new Set();
        privateSnap.docs.forEach((d) => {
          const locs = d.data().storageLocations || [];
          locs.forEach((loc) => {
            if (loc?.email && loc.email !== 'TBD') {
              emailSet.add(loc.email);
            }
          });
        });
        setLocationEmails([...emailSet].sort());
      } catch (err) {
        console.error('[FinalizeRequestModal] Meta fetch error:', err);
      } finally {
        setLoadingMeta(false);
      }
    };
    fetchMeta();
  }, []);

  const onSubmit = async (data) => {
    try {
      const slug = slugify(data.title);
      const fileSizeBytes = gbToBytes(data.fileSizeGB);
      const now = serverTimestamp();

      // Public game doc
      const publicData = {
        title: data.title.trim(),
        slug,
        genres: data.genre ? [data.genre.toLowerCase()] : [],
        tags: [],
        platform: 'PC',
        fileVersion: '',
        fileEdition: null,
        fileSizeBytes,
        partsCount: Number(data.partsCount) || 1,
        packageType: data.packageType,
        playModes: ['singleplayer'],
        coverImageUrl: '',
        screenshots: [],
        videoUrl: null,
        description: '',
        shortDescription: '',
        shopee: {
          isAvailable: Boolean(data.shopeeUrl),
          url: data.shopeeUrl || '',
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

      // Private game doc
      const privateData = {
        storageLocations: data.storageEmail
          ? [
              {
                email: data.storageEmail,
                role: 'PRIMARY',
                version: '',
                uploadedAt: Timestamp.now(),
                shopeeListed: Boolean(data.shopeeUrl),
                tipe: data.packageType,
                notes: '',
              },
            ]
          : [],
        adminNotes: data.adminNotes || '',
        verificationStatus: 'needs_check',
        lastVerifiedAt: null,
        addedBy: 'request-finalize',
        coverSourceCredit: '',
        sourceRequestId: request.id,
      };

      // Batch write: create game + update request
      const batch = writeBatch(db);

      const newGameRef = doc(collection(db, 'games'));
      batch.set(newGameRef, publicData);
      batch.set(doc(db, 'gamesPrivate', newGameRef.id), privateData);

      // Update request to completed
      batch.update(doc(db, 'requests', request.id), {
        status: REQUEST_STATUS.COMPLETED,
        shopeeProductUrl: data.shopeeUrl || '',
        completedAt: Timestamp.now(),
        linkedGameId: newGameRef.id,
        updatedAt: now,
      });

      await batch.commit();

      Swal.fire({
        ...swalDark,
        icon: 'success',
        title: 'Request selesai & game ditambahkan!',
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('[FinalizeRequestModal] Submit error:', err);
      Swal.fire({
        ...swalDark,
        icon: 'error',
        title: 'Gagal',
        text: err.message || 'Terjadi kesalahan saat menyimpan.',
      });
    }
  };

  // Skip flow: just mark completed without adding to catalog
  const handleSkip = async () => {
    const { value: shopeeUrl } = await Swal.fire({
      ...swalDark,
      title: 'Selesaikan Tanpa Katalog?',
      text: 'Request akan ditandai selesai tanpa menambah game ke katalog.',
      input: 'url',
      inputLabel: 'Link Shopee (opsional)',
      inputPlaceholder: 'https://shopee.co.id/...',
      showCancelButton: true,
      confirmButtonText: 'Ya, Selesaikan',
      cancelButtonText: 'Batal',
      inputValidator: () => null,
    });

    if (shopeeUrl !== undefined) {
      await updateDoc(doc(db, 'requests', request.id), {
        status: REQUEST_STATUS.COMPLETED,
        shopeeProductUrl: shopeeUrl || '',
        completedAt: new Date(),
        updatedAt: serverTimestamp(),
      });
      Swal.fire({
        ...swalDark,
        icon: 'success',
        title: 'Request selesai!',
        timer: 1200,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
      });
      onSuccess?.();
      onClose();
    }
  };

  const inputClass =
    'w-full pl-10 pr-3 py-2.5 bg-[#111317] border border-[#2A2F39] text-[#C8CFDA] placeholder-[#4A5568] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD100]/40 focus:border-[#FFD100]/50 transition-colors text-sm';
  const selectClass =
    'w-full pl-10 pr-3 py-2.5 bg-[#111317] border border-[#2A2F39] text-[#C8CFDA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD100]/40 focus:border-[#FFD100]/50 transition-colors text-sm appearance-none';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1A1F27] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-[#2A2F39] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#2A2F39] flex justify-between items-center bg-[#111317] flex-shrink-0">
          <div>
            <h3 className="font-bold text-[#F3F4F6] flex items-center gap-2">
              <CheckCircle size={18} className="text-emerald-400" />
              Finalisasi Request
            </h3>
            <p className="text-xs text-[#7E8796] mt-0.5">
              Data game akan masuk ke katalog otomatis.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#2A2F39] rounded-full transition-colors"
          >
            <X size={20} className="text-[#7E8796]" />
          </button>
        </div>

        {loadingMeta ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-[#FFD100] w-6 h-6" />
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="p-6 space-y-4 overflow-y-auto"
          >
            {/* Title (pre-filled) */}
            <div>
              <label className="block text-xs font-semibold text-[#7E8796] mb-1.5 uppercase tracking-wide">
                Judul Game
              </label>
              <div className="relative">
                <Gamepad2
                  className="absolute top-2.5 left-3 text-[#4A5568]"
                  size={18}
                />
                <input
                  {...register('title', { required: 'Judul wajib diisi' })}
                  className={inputClass}
                />
              </div>
              {errors.title && (
                <span className="text-xs text-red-400 mt-1">
                  {errors.title.message}
                </span>
              )}
            </div>

            {/* Size + Parts row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#7E8796] mb-1.5 uppercase tracking-wide">
                  Ukuran (GB)
                </label>
                <div className="relative">
                  <HardDrive
                    className="absolute top-2.5 left-3 text-[#4A5568]"
                    size={18}
                  />
                  <input
                    {...register('fileSizeGB', {
                      required: 'Wajib diisi',
                      validate: (v) =>
                        parseFloat(v) > 0 || 'Harus lebih dari 0',
                    })}
                    type="number"
                    step="0.01"
                    placeholder="45.5"
                    className={inputClass}
                  />
                </div>
                {errors.fileSizeGB && (
                  <span className="text-xs text-red-400 mt-1">
                    {errors.fileSizeGB.message}
                  </span>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#7E8796] mb-1.5 uppercase tracking-wide">
                  Jumlah Part
                </label>
                <div className="relative">
                  <FolderOpen
                    className="absolute top-2.5 left-3 text-[#4A5568]"
                    size={18}
                  />
                  <input
                    {...register('partsCount', { min: 1 })}
                    type="number"
                    min="1"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Package Type + Genre row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#7E8796] mb-1.5 uppercase tracking-wide">
                  Tipe Paket
                </label>
                <div className="relative">
                  <FolderOpen
                    className="absolute top-2.5 left-3 text-[#4A5568]"
                    size={18}
                  />
                  <select {...register('packageType')} className={selectClass}>
                    {PACKAGE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#7E8796] mb-1.5 uppercase tracking-wide">
                  Genre Utama
                </label>
                <div className="relative">
                  <Gamepad2
                    className="absolute top-2.5 left-3 text-[#4A5568]"
                    size={18}
                  />
                  <select {...register('genre')} className={selectClass}>
                    <option value="">— Pilih nanti —</option>
                    {genres.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Storage Location */}
            <div>
              <label className="block text-xs font-semibold text-[#7E8796] mb-1.5 uppercase tracking-wide">
                Lokasi Storage (GDrive Email)
              </label>
              <div className="relative">
                <FolderOpen
                  className="absolute top-2.5 left-3 text-[#4A5568]"
                  size={18}
                />
                <select {...register('storageEmail')} className={selectClass}>
                  <option value="">— Pilih —</option>
                  {locationEmails.map((email) => (
                    <option key={email} value={email}>
                      {email}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Shopee URL */}
            <div>
              <label className="block text-xs font-semibold text-[#7E8796] mb-1.5 uppercase tracking-wide">
                Link Shopee (Opsional)
              </label>
              <div className="relative">
                <Link2
                  className="absolute top-2.5 left-3 text-[#4A5568]"
                  size={18}
                />
                <input
                  {...register('shopeeUrl')}
                  placeholder="https://shopee.co.id/..."
                  className={inputClass}
                />
              </div>
            </div>

            {/* Admin Notes */}
            <div>
              <label className="block text-xs font-semibold text-[#7E8796] mb-1.5 uppercase tracking-wide">
                Catatan Admin (Opsional)
              </label>
              <textarea
                {...register('adminNotes')}
                placeholder="Internal notes..."
                rows="2"
                className="w-full px-3 py-2.5 bg-[#111317] border border-[#2A2F39] text-[#C8CFDA] placeholder-[#4A5568] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD100]/40 focus:border-[#FFD100]/50 transition-colors text-sm resize-none"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  <CheckCircle size={18} />
                  Selesaikan & Tambah ke Katalog
                </>
              )}
            </button>

            {/* Skip — just complete without catalog */}
            <button
              type="button"
              onClick={handleSkip}
              className="w-full py-2.5 text-[#7E8796] hover:text-[#C8CFDA] text-sm font-medium transition-colors"
            >
              Lewati — selesaikan tanpa katalog
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default FinalizeRequestModal;
