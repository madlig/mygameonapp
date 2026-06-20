// src/features/games/components/GameFormModal.jsx
//
// Add / Edit Game Form Modal — Rebuilt Apr 2026
// Schema baru: games/ (public) + gamesPrivate/ (admin)
//
// Sections:
//   1. Informasi File   — title, slug, fileVersion, fileEdition, size, parts, packageType
//   2. Klasifikasi      — platform, genres, tags, playModes
//   3. Media            — coverImageUrl, videoUrl
//   4. Deskripsi        — description, shortDescription
//   5. Dual-Link        — shopee (isAvailable, url, price), officialPlatforms, steamAppId
//   6. Status & QC      — availabilityStatus, isProblematic
//   7. Data Admin       — storageLocations, adminNotes, verificationStatus, coverSourceCredit, lastFileUpdatedAt

import React, { useEffect, useState, useCallback } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { db, storage } from '../../../config/firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Swal from 'sweetalert2';
import {
  X,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Loader2,
  Save,
  ExternalLink,
  Upload,
  ImageIcon,
} from 'lucide-react';

// ============================================================
// HELPERS
// ============================================================

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

function bytesToGb(bytes) {
  if (!bytes || bytes <= 0) return '';
  return (bytes / 1024 ** 3).toFixed(2);
}

function toTimestampInput(ts) {
  if (!ts) return '';
  let d;
  if (ts?.seconds) d = new Date(ts.seconds * 1000);
  else if (ts instanceof Date) d = ts;
  else d = new Date(ts);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

const COVER_MAX_W = 600;
const COVER_MAX_H = 450;

const resizeCoverImage = (file) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = COVER_MAX_W;
      canvas.height = COVER_MAX_H;
      const ctx = canvas.getContext('2d');
      const srcRatio = img.width / img.height;
      const dstRatio = COVER_MAX_W / COVER_MAX_H;
      let sx = 0,
        sy = 0,
        sw = img.width,
        sh = img.height;
      if (srcRatio > dstRatio) {
        sw = img.height * dstRatio;
        sx = (img.width - sw) / 2;
      } else {
        sh = img.width / dstRatio;
        sy = (img.height - sh) / 2;
      }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, COVER_MAX_W, COVER_MAX_H);
      canvas.toBlob(
        (blob) =>
          blob ? resolve(blob) : reject(new Error('Canvas toBlob failed')),
        'image/jpeg',
        0.85
      );
    };
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = URL.createObjectURL(file);
  });

const PLATFORM_OPTIONS = [
  'steam',
  'gog',
  'epic',
  'itch',
  'ubisoft-connect',
  'ea-app',
  'microsoft-store',
];
const PACKAGE_TYPES = [
  'PRE-INSTALLED',
  'INSTALLER-GOG',
  'INSTALLER-ELAMIGOS',
  'INSTALLER',
];
const VERIFICATION_OPTIONS = ['needs_check', 'verified', 'rejected'];

// ============================================================
// VALIDATION SCHEMA
// ============================================================

const schema = yup.object({
  title: yup.string().required('Judul wajib diisi').min(2),
  slug: yup.string().required('Slug wajib diisi'),
  fileVersion: yup.string().nullable(),
  fileEdition: yup.string().nullable(),
  fileSizeGB: yup
    .number()
    .typeError('Masukkan angka yang valid')
    .required('Ukuran file wajib diisi')
    .positive('Harus lebih dari 0'),
  partsCount: yup
    .number()
    .typeError('Masukkan angka')
    .integer()
    .min(1)
    .required('Jumlah part wajib diisi'),
  packageType: yup.string().required('Package type wajib dipilih'),
  platform: yup.string().required('Platform wajib diisi'),
  genres: yup.array().min(1, 'Pilih minimal 1 genre'),
  tags: yup.array(),
  playModes: yup.array().min(1, 'Pilih minimal 1 play mode'),
  coverImageUrl: yup.string().nullable(),
  videoUrl: yup.string().nullable(),
  description: yup.string().nullable(),
  shortDescription: yup.string().nullable(),
  shopeeIsAvailable: yup.boolean(),
  shopeeUrl: yup.string().nullable(),
  shopeePackagePrice: yup.number().nullable().typeError(''),
  steamAppId: yup.string().nullable(),
  availabilityStatus: yup.string().required(),
  isProblematic: yup.boolean(),
  storageEmails: yup.array().min(1, 'Pilih minimal 1 lokasi storage'),
  adminNotes: yup.string().nullable(),
  verificationStatus: yup.string().required(),
  coverSourceCredit: yup.string().nullable(),
  lastFileUpdatedAt: yup.string().nullable(),
});

// ============================================================
// MINI UI COMPONENTS
// ============================================================

const SectionHeader = ({ title, isOpen, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    className="w-full flex items-center justify-between py-3 px-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
  >
    <span className="font-semibold text-slate-700 text-sm">{title}</span>
    {isOpen ? (
      <ChevronUp size={16} className="text-slate-500" />
    ) : (
      <ChevronDown size={16} className="text-slate-500" />
    )}
  </button>
);

const FieldLabel = ({ children, required }) => (
  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">
    {children} {required && <span className="text-red-500">*</span>}
  </label>
);

const FieldError = ({ message }) =>
  message ? <p className="text-red-500 text-xs mt-1">{message}</p> : null;

const inputCls =
  'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

const TagSelector = ({
  options,
  selected,
  onChange,
  colorClass = 'bg-blue-100 text-blue-800 border-blue-200',
}) => (
  <div className="flex flex-wrap gap-2">
    {options.map((opt) => {
      const isSelected = selected.includes(opt.id);
      return (
        <button
          key={opt.id}
          type="button"
          onClick={() =>
            onChange(
              isSelected
                ? selected.filter((s) => s !== opt.id)
                : [...selected, opt.id]
            )
          }
          className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
            isSelected
              ? colorClass
              : 'bg-white text-slate-500 border-slate-300 hover:border-slate-400'
          }`}
        >
          {opt.label}
        </button>
      );
    })}
  </div>
);

// ============================================================
// MAIN COMPONENT
// ============================================================

const GameFormModal = ({ isOpen, onClose, initialData = null, onSuccess }) => {
  const isEditMode = Boolean(initialData?.id);

  // --- Metadata state ---
  const [genres, setGenres] = useState([]);
  const [tags, setTags] = useState([]);
  const [playModes, setPlayModes] = useState([]);
  const [locationEmails, setLocationEmails] = useState([]);
  const [loadingMeta, setLoadingMeta] = useState(true);

  // --- Section open/close ---
  const [openSections, setOpenSections] = useState({
    file: true,
    classification: true,
    media: false,
    description: false,
    duallink: true,
    status: true,
    admin: true,
  });
  const toggleSection = (key) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  // --- OfficialPlatforms dynamic list ---
  const [officialPlatforms, setOfficialPlatforms] = useState([]);
  const [uploadingCover, setUploadingCover] = useState(false);

  // --- Form ---
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      title: '',
      slug: '',
      fileVersion: '',
      fileEdition: '',
      fileSizeGB: '',
      partsCount: 1,
      packageType: 'PRE-INSTALLED',
      platform: 'PC',
      genres: [],
      tags: [],
      playModes: ['singleplayer'],
      coverImageUrl: '',
      videoUrl: '',
      description: '',
      shortDescription: '',
      shopeeIsAvailable: false,
      shopeeUrl: '',
      shopeePackagePrice: '',
      steamAppId: '',
      availabilityStatus: 'available',
      isProblematic: false,
      storageEmails: [],
      adminNotes: '',
      verificationStatus: 'needs_check',
      coverSourceCredit: '',
      lastFileUpdatedAt: new Date().toISOString().split('T')[0],
    },
  });

  const watchedTitle = watch('title');
  const watchedSlug = watch('slug');
  const watchedGenres = watch('genres') || [];
  const watchedTags = watch('tags') || [];
  const watchedPlayModes = watch('playModes') || [];
  const watchedStorageEmails = watch('storageEmails') || [];
  const watchedShopeeAvailable = watch('shopeeIsAvailable');
  const watchedIsProblematic = watch('isProblematic');

  // Auto-generate slug from title (only on create mode)
  useEffect(() => {
    if (!isEditMode && watchedTitle) {
      setValue('slug', slugify(watchedTitle));
    }
  }, [watchedTitle, isEditMode, setValue]);

  // --- Fetch metadata ---
  useEffect(() => {
    if (!isOpen) return;
    const fetchAll = async () => {
      setLoadingMeta(true);
      try {
        const [genresSnap, tagsSnap, playModesSnap, privateSnap] =
          await Promise.all([
            getDocs(collection(db, 'metadata', 'genres', 'entries')),
            getDocs(collection(db, 'metadata', 'tags', 'entries')),
            getDocs(collection(db, 'metadata', 'playModes', 'entries')),
            getDocs(collection(db, 'gamesPrivate')),
          ]);
        setGenres(
          genresSnap.docs
            .map((d) => ({ id: d.id, label: d.data().label || d.id }))
            .filter((g) => g)
            .sort((a, b) => a.label.localeCompare(b.label))
        );
        setTags(
          tagsSnap.docs
            .map((d) => ({ id: d.id, label: d.data().label || d.id }))
            .sort((a, b) => a.label.localeCompare(b.label))
        );
        setPlayModes(
          playModesSnap.docs
            .map((d) => ({ id: d.id, label: d.data().label || d.id }))
            .sort((a, b) => a.label.localeCompare(b.label))
        );
        // Extract unique emails from all gamesPrivate.storageLocations
        const emailSet = new Set();
        privateSnap.docs.forEach((d) => {
          const locs = d.data().storageLocations || [];
          locs.forEach((loc) => {
            if (
              loc?.email &&
              loc.email !== 'TBD' &&
              loc.email !== 'KEBERSAMAAN'
            ) {
              emailSet.add(loc.email);
            }
          });
        });
        setLocationEmails([...emailSet].sort());
      } catch (err) {
        console.error('[GameFormModal] Failed to load metadata:', err);
      } finally {
        setLoadingMeta(false);
      }
    };
    fetchAll();
  }, [isOpen]);

  // --- Populate form on edit ---
  useEffect(() => {
    if (!isOpen) return;

    if (isEditMode && initialData) {
      const priv = initialData._private || {};
      const emails = (priv.storageLocations || [])
        .map((loc) => loc.email)
        .filter(Boolean);

      reset({
        title: initialData.title || '',
        slug: initialData.slug || slugify(initialData.title || ''),
        fileVersion: initialData.fileVersion || '',
        fileEdition: initialData.fileEdition || '',
        fileSizeGB: bytesToGb(initialData.fileSizeBytes) || '',
        partsCount: initialData.partsCount || 1,
        packageType: initialData.packageType || 'PRE-INSTALLED',
        platform: initialData.platform || 'PC',
        genres: Array.isArray(initialData.genres) ? initialData.genres : [],
        tags: Array.isArray(initialData.tags) ? initialData.tags : [],
        playModes: Array.isArray(initialData.playModes)
          ? initialData.playModes
          : ['singleplayer'],
        coverImageUrl: initialData.coverImageUrl || '',
        videoUrl: initialData.videoUrl || '',
        description: initialData.description || '',
        shortDescription: initialData.shortDescription || '',
        shopeeIsAvailable: initialData.shopee?.isAvailable || false,
        shopeeUrl: initialData.shopee?.url || '',
        shopeePackagePrice: initialData.shopee?.packagePrice || '',
        steamAppId: initialData.steamAppId || '',
        availabilityStatus: initialData.availabilityStatus || 'available',
        isProblematic: initialData.isProblematic || false,
        storageEmails: emails,
        adminNotes: priv.adminNotes || '',
        verificationStatus: priv.verificationStatus || 'needs_check',
        coverSourceCredit: priv.coverSourceCredit || '',
        lastFileUpdatedAt: toTimestampInput(initialData.lastFileUpdatedAt),
      });
      setOfficialPlatforms(
        Array.isArray(initialData.officialPlatforms)
          ? initialData.officialPlatforms
          : []
      );
    } else {
      reset({
        title: '',
        slug: '',
        fileVersion: '',
        fileEdition: '',
        fileSizeGB: '',
        partsCount: 1,
        packageType: 'PRE-INSTALLED',
        platform: 'PC',
        genres: [],
        tags: [],
        playModes: ['singleplayer'],
        coverImageUrl: '',
        videoUrl: '',
        description: '',
        shortDescription: '',
        shopeeIsAvailable: false,
        shopeeUrl: '',
        shopeePackagePrice: '',
        steamAppId: '',
        availabilityStatus: 'available',
        isProblematic: false,
        storageEmails: [],
        adminNotes: '',
        verificationStatus: 'needs_check',
        coverSourceCredit: '',
        lastFileUpdatedAt: new Date().toISOString().split('T')[0],
      });
      setOfficialPlatforms([]);
    }
  }, [isOpen, isEditMode, initialData, reset]);

  // --- Official Platforms helpers ---
  const addPlatform = () =>
    setOfficialPlatforms((prev) => [
      ...prev,
      { platform: '', url: '', isAvailable: true },
    ]);
  const removePlatform = (i) =>
    setOfficialPlatforms((prev) => prev.filter((_, idx) => idx !== i));
  const updatePlatform = (i, key, val) =>
    setOfficialPlatforms((prev) =>
      prev.map((p, idx) => (idx === i ? { ...p, [key]: val } : p))
    );

  // --- Cover upload handler ---
  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      Swal.fire({
        title: 'File harus berupa gambar',
        icon: 'warning',
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        title: 'Ukuran maksimal 5 MB',
        icon: 'warning',
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }
    setUploadingCover(true);
    try {
      const blob = await resizeCoverImage(file);
      const slug = watch('slug') || 'game';
      const storageRef = ref(storage, `game_covers/${slug}_${Date.now()}.jpg`);
      await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
      const url = await getDownloadURL(storageRef);
      setValue('coverImageUrl', url);
    } catch (err) {
      console.error('[GameFormModal] Cover upload error:', err);
      Swal.fire({
        title: 'Gagal upload',
        text: err.message,
        icon: 'error',
        confirmButtonColor: '#0f172a',
      });
    } finally {
      setUploadingCover(false);
      e.target.value = '';
    }
  };

  const fieldToSection = {
    title: 'file',
    slug: 'file',
    fileVersion: 'file',
    fileEdition: 'file',
    fileSizeGB: 'file',
    partsCount: 'file',
    packageType: 'file',
    platform: 'classification',
    genres: 'classification',
    tags: 'classification',
    playModes: 'classification',
    coverImageUrl: 'media',
    videoUrl: 'media',
    description: 'description',
    shortDescription: 'description',
    shopeeIsAvailable: 'duallink',
    shopeeUrl: 'duallink',
    shopeePackagePrice: 'duallink',
    steamAppId: 'duallink',
    availabilityStatus: 'status',
    isProblematic: 'status',
    storageEmails: 'admin',
    adminNotes: 'admin',
    verificationStatus: 'admin',
    coverSourceCredit: 'admin',
    lastFileUpdatedAt: 'admin',
  };

  const onValidationError = (validationErrors) => {
    const sectionsToOpen = new Set();
    Object.keys(validationErrors).forEach((field) => {
      const section = fieldToSection[field];
      if (section) sectionsToOpen.add(section);
    });
    if (sectionsToOpen.size > 0) {
      setOpenSections((prev) => {
        const next = { ...prev };
        sectionsToOpen.forEach((s) => {
          next[s] = true;
        });
        return next;
      });
    }
    const firstField = Object.keys(validationErrors)[0];
    const firstMsg =
      validationErrors[firstField]?.message || 'Ada field yang belum valid';
    Swal.fire({
      title: 'Form belum lengkap',
      text: firstMsg,
      icon: 'warning',
      timer: 3000,
      showConfirmButton: false,
    });
  };

  // --- Submit ---
  const onSubmitHandler = async (data) => {
    try {
      const now = serverTimestamp();
      const fileSizeBytes = gbToBytes(data.fileSizeGB);

      // Build storageLocations array from selected emails
      const storageLocations = data.storageEmails.map((email) => {
        // Try to find existing location entry to preserve existing fields
        const existing = isEditMode
          ? (initialData?._private?.storageLocations || []).find(
              (loc) => loc.email === email
            )
          : null;
        return (
          existing || {
            email,
            role: 'PRIMARY',
            version: data.fileVersion || '',
            uploadedAt: null,
            shopeeListed: data.shopeeIsAvailable || false,
            tipe: data.packageType || '',
            notes: '',
          }
        );
      });

      // Auto-generate shortDescription if blank
      const genreText = (data.genres || []).slice(0, 2).join(' & ') || 'game';
      const sizeText =
        fileSizeBytes > 1024 ** 3
          ? `${(fileSizeBytes / 1024 ** 3).toFixed(2)} GB`
          : fileSizeBytes > 1024 ** 2
            ? `${(fileSizeBytes / 1024 ** 2).toFixed(1)} MB`
            : '-';
      const autoShortDesc = `${data.title} — game ${genreText} berukuran ${sizeText}. Tersedia paket instalasi siap main.`;

      // Public doc
      const publicData = {
        title: data.title.trim(),
        slug: data.slug.trim(),
        genres: (data.genres || []).map((g) => g.toLowerCase()),
        tags: data.tags || [],
        platform: data.platform || 'PC',
        fileVersion: data.fileVersion || '',
        fileEdition: data.fileEdition || null,
        fileSizeBytes,
        partsCount: Number(data.partsCount) || 1,
        packageType: data.packageType,
        playModes: data.playModes || ['singleplayer'],
        coverImageUrl: data.coverImageUrl || '',
        screenshots: initialData?.screenshots || [],
        videoUrl: data.videoUrl || null,
        description: data.description || '',
        shortDescription: data.shortDescription?.trim() || autoShortDesc,
        shopee: {
          isAvailable: data.shopeeIsAvailable || false,
          url: data.shopeeUrl || '',
          packagePrice: data.shopeePackagePrice
            ? Number(data.shopeePackagePrice)
            : null,
        },
        officialPlatforms: officialPlatforms.filter((p) => p.platform && p.url),
        steamAppId: data.steamAppId || null,
        relatedGameIds: initialData?.relatedGameIds || [],
        relatedGamesMode: initialData?.relatedGamesMode || 'auto',
        availabilityStatus: data.availabilityStatus,
        isProblematic: data.isProblematic || false,
        lastFileUpdatedAt: data.lastFileUpdatedAt
          ? Timestamp.fromDate(new Date(data.lastFileUpdatedAt))
          : now,
        lastVersionCheckAt: initialData?.lastVersionCheckAt || null,
        steamLastUpdatedAt: initialData?.steamLastUpdatedAt || null,
        versionStatus: initialData?.versionStatus || 'unchecked',
        updatedAt: now,
      };

      // Private doc
      const privateData = {
        storageLocations,
        adminNotes: data.adminNotes || '',
        verificationStatus: data.verificationStatus,
        lastVerifiedAt:
          data.verificationStatus === 'verified'
            ? initialData?._private?.lastVerifiedAt || now
            : null,
        addedBy: isEditMode
          ? initialData?._private?.addedBy || 'admin'
          : 'admin-form',
        coverSourceCredit: data.coverSourceCredit || '',
      };

      if (isEditMode) {
        // Update both collections
        const batch = writeBatch(db);
        batch.update(doc(db, 'games', initialData.id), publicData);
        batch.set(doc(db, 'gamesPrivate', initialData.id), privateData, {
          merge: true,
        });
        await batch.commit();
      } else {
        // Create new — add createdAt only on create
        const newDocRef = doc(collection(db, 'games'));
        const batch = writeBatch(db);
        batch.set(newDocRef, { ...publicData, createdAt: now });
        batch.set(doc(db, 'gamesPrivate', newDocRef.id), privateData);
        await batch.commit();
      }

      Swal.fire({
        title: isEditMode ? 'Game diperbarui!' : 'Game ditambahkan!',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('[GameFormModal] Submit error:', err);
      Swal.fire({
        title: 'Gagal menyimpan',
        text: err.message,
        icon: 'error',
        confirmButtonColor: '#0f172a',
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {isEditMode ? `Edit: ${initialData?.title}` : 'Tambah Game Baru'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Menulis ke{' '}
              <code className="bg-slate-100 px-1 rounded">games/</code> +{' '}
              <code className="bg-slate-100 px-1 rounded">gamesPrivate/</code>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Body */}
        {loadingMeta ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-blue-500 mr-2" />
            <span className="text-slate-500 text-sm">Memuat data...</span>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmitHandler, onValidationError)}
            className="flex flex-col gap-4 p-6"
          >
            {/* ══ SECTION 1: INFORMASI FILE ══ */}
            <div className="space-y-3">
              <SectionHeader
                title="1. Informasi File"
                isOpen={openSections.file}
                onToggle={() => toggleSection('file')}
              />
              {openSections.file && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Title */}
                  <div className="sm:col-span-2">
                    <FieldLabel required>Judul Game</FieldLabel>
                    <input
                      {...register('title')}
                      placeholder="e.g. Cuphead"
                      className={inputCls}
                    />
                    <FieldError message={errors.title?.message} />
                  </div>

                  {/* Slug */}
                  <div className="sm:col-span-2">
                    <FieldLabel required>Slug (URL)</FieldLabel>
                    <input
                      {...register('slug')}
                      placeholder="cuphead"
                      className={`${inputCls} font-mono text-xs`}
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Auto-generated dari judul. URL akan jadi:{' '}
                      <code>/game/{watchedSlug || '...'}</code>
                    </p>
                    <FieldError message={errors.slug?.message} />
                  </div>

                  {/* File Version */}
                  <div>
                    <FieldLabel>Versi File</FieldLabel>
                    <input
                      {...register('fileVersion')}
                      placeholder="v1.3.4"
                      className={inputCls}
                    />
                  </div>

                  {/* File Edition */}
                  <div>
                    <FieldLabel>Edisi</FieldLabel>
                    <input
                      {...register('fileEdition')}
                      placeholder="Standard / Deluxe / GOTY"
                      className={inputCls}
                    />
                  </div>

                  {/* Size */}
                  <div>
                    <FieldLabel required>Ukuran File (GB)</FieldLabel>
                    <input
                      {...register('fileSizeGB')}
                      type="number"
                      step="0.01"
                      placeholder="e.g. 48.57"
                      className={inputCls}
                    />
                    <FieldError message={errors.fileSizeGB?.message} />
                  </div>

                  {/* Parts */}
                  <div>
                    <FieldLabel required>Jumlah Part</FieldLabel>
                    <input
                      {...register('partsCount')}
                      type="number"
                      min="1"
                      className={inputCls}
                    />
                    <FieldError message={errors.partsCount?.message} />
                  </div>

                  {/* Package Type */}
                  <div>
                    <FieldLabel required>Package Type</FieldLabel>
                    <select {...register('packageType')} className={inputCls}>
                      {PACKAGE_TYPES.map((pt) => (
                        <option key={pt} value={pt}>
                          {pt}
                        </option>
                      ))}
                    </select>
                    <FieldError message={errors.packageType?.message} />
                  </div>

                  {/* Last File Updated */}
                  <div>
                    <FieldLabel>Tanggal File Diupload</FieldLabel>
                    <input
                      {...register('lastFileUpdatedAt')}
                      type="date"
                      className={inputCls}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ══ SECTION 2: KLASIFIKASI ══ */}
            <div className="space-y-3">
              <SectionHeader
                title="2. Klasifikasi"
                isOpen={openSections.classification}
                onToggle={() => toggleSection('classification')}
              />
              {openSections.classification && (
                <div className="space-y-4 pt-1">
                  {/* Platform */}
                  <div>
                    <FieldLabel required>Platform</FieldLabel>
                    <input
                      {...register('platform')}
                      placeholder="PC"
                      className={inputCls}
                    />
                  </div>

                  {/* Genres */}
                  <div>
                    <FieldLabel required>Genre</FieldLabel>
                    <TagSelector
                      options={genres}
                      selected={watchedGenres}
                      onChange={(val) => setValue('genres', val)}
                      colorClass="bg-blue-100 text-blue-800 border-blue-300"
                    />
                    <FieldError message={errors.genres?.message} />
                  </div>

                  {/* Tags */}
                  <div>
                    <FieldLabel>Tags</FieldLabel>
                    <TagSelector
                      options={tags}
                      selected={watchedTags}
                      onChange={(val) => setValue('tags', val)}
                      colorClass="bg-purple-100 text-purple-800 border-purple-300"
                    />
                  </div>

                  {/* Play Modes */}
                  <div>
                    <FieldLabel required>Play Modes (file kamu)</FieldLabel>
                    <TagSelector
                      options={playModes}
                      selected={watchedPlayModes}
                      onChange={(val) => setValue('playModes', val)}
                      colorClass="bg-emerald-100 text-emerald-800 border-emerald-300"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      ⚠️ Pilih sesuai kemampuan FILE yang kamu sediakan
                      (offline). Jangan pilih multiplayer-online.
                    </p>
                    <FieldError message={errors.playModes?.message} />
                  </div>
                </div>
              )}
            </div>

            {/* ══ SECTION 3: MEDIA ══ */}
            <div className="space-y-3">
              <SectionHeader
                title="3. Media"
                isOpen={openSections.media}
                onToggle={() => toggleSection('media')}
              />
              {openSections.media && (
                <div className="space-y-4 pt-1">
                  <div>
                    <FieldLabel>Cover Image</FieldLabel>
                    {/* Upload area */}
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <label
                          className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 cursor-pointer transition-colors ${
                            uploadingCover
                              ? 'border-blue-300 bg-blue-50'
                              : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50'
                          }`}
                        >
                          {uploadingCover ? (
                            <>
                              <Loader2
                                size={24}
                                className="animate-spin text-blue-500"
                              />
                              <span className="text-xs text-blue-600 font-medium">
                                Mengupload...
                              </span>
                            </>
                          ) : (
                            <>
                              <Upload size={24} className="text-slate-400" />
                              <span className="text-xs text-slate-500 font-medium">
                                Klik untuk upload cover
                              </span>
                              <span className="text-[10px] text-slate-400">
                                JPG, PNG, WebP · Max 5 MB · Auto-resize 600×450
                              </span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleCoverUpload}
                            disabled={uploadingCover}
                            className="hidden"
                          />
                        </label>
                        {/* Manual URL input */}
                        <div className="mt-2">
                          <p className="text-[10px] text-slate-400 mb-1">
                            atau paste URL langsung:
                          </p>
                          <input
                            {...register('coverImageUrl')}
                            placeholder="https://..."
                            className={inputCls}
                          />
                        </div>
                      </div>
                      {/* Preview */}
                      {watch('coverImageUrl') && (
                        <div className="flex-shrink-0">
                          <div className="relative group">
                            <img
                              src={watch('coverImageUrl')}
                              alt="cover preview"
                              className="h-[120px] w-[160px] object-cover rounded-lg border border-slate-200 shadow-sm"
                              onError={(e) => (e.target.style.display = 'none')}
                            />
                            <button
                              type="button"
                              onClick={() => setValue('coverImageUrl', '')}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Hapus cover"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <FieldLabel>URL Video (YouTube)</FieldLabel>
                    <input
                      {...register('videoUrl')}
                      placeholder="https://youtube.com/watch?v=..."
                      className={inputCls}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ══ SECTION 4: DESKRIPSI ══ */}
            <div className="space-y-3">
              <SectionHeader
                title="4. Deskripsi"
                isOpen={openSections.description}
                onToggle={() => toggleSection('description')}
              />
              {openSections.description && (
                <div className="space-y-4 pt-1">
                  <div>
                    <FieldLabel>Short Description</FieldLabel>
                    <input
                      {...register('shortDescription')}
                      placeholder="1 kalimat ringkas. Kosongkan untuk auto-generate."
                      className={inputCls}
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Kosongkan untuk auto-generate dari judul, genre, dan
                      ukuran.
                    </p>
                  </div>
                  <div>
                    <FieldLabel>Deskripsi Lengkap</FieldLabel>
                    <textarea
                      {...register('description')}
                      rows={5}
                      placeholder="Deskripsi game (opsional)..."
                      className={`${inputCls} resize-y`}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ══ SECTION 5: DUAL-LINK ══ */}
            <div className="space-y-3">
              <SectionHeader
                title="5. Dual-Link (Shopee & Platform Resmi)"
                isOpen={openSections.duallink}
                onToggle={() => toggleSection('duallink')}
              />
              {openSections.duallink && (
                <div className="space-y-4 pt-1">
                  {/* Shopee */}
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-bold text-orange-700 uppercase tracking-wide">
                      📦 Paket Instalasi (Shopee)
                    </p>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        {...register('shopeeIsAvailable')}
                        className="w-4 h-4 rounded text-orange-500"
                      />
                      <span className="text-sm text-slate-700 font-medium">
                        Tersedia di Shopee
                      </span>
                    </label>
                    {watchedShopeeAvailable && (
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <FieldLabel>URL Produk Shopee</FieldLabel>
                          <input
                            {...register('shopeeUrl')}
                            placeholder="https://shopee.co.id/..."
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <FieldLabel>Harga Paket (Rp)</FieldLabel>
                          <input
                            {...register('shopeePackagePrice')}
                            type="number"
                            placeholder="15000"
                            className={inputCls}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Official Platforms */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <FieldLabel>Platform Resmi (Steam, GOG, dll)</FieldLabel>
                      <button
                        type="button"
                        onClick={addPlatform}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold"
                      >
                        <Plus size={14} /> Tambah
                      </button>
                    </div>
                    {officialPlatforms.length === 0 && (
                      <p className="text-xs text-slate-400 italic">
                        Belum ada platform resmi. Klik "Tambah" untuk
                        menambahkan.
                      </p>
                    )}
                    {officialPlatforms.map((plat, i) => (
                      <div key={i} className="flex items-center gap-2 mb-2">
                        <select
                          value={plat.platform}
                          onChange={(e) =>
                            updatePlatform(i, 'platform', e.target.value)
                          }
                          className={`${inputCls} w-36 flex-shrink-0`}
                        >
                          <option value="">Pilih</option>
                          {PLATFORM_OPTIONS.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                        <input
                          value={plat.url}
                          onChange={(e) =>
                            updatePlatform(i, 'url', e.target.value)
                          }
                          placeholder="https://store.steampowered.com/..."
                          className={`${inputCls} flex-1`}
                        />
                        <button
                          type="button"
                          onClick={() => removePlatform(i)}
                          className="p-2 text-red-400 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Steam App ID */}
                  <div>
                    <FieldLabel>Steam App ID</FieldLabel>
                    <input
                      {...register('steamAppId')}
                      placeholder="e.g. 268910"
                      className={inputCls}
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Untuk version tracking otomatis. Ambil dari URL Steam:
                      store.steampowered.com/app/
                      <strong>268910</strong>/Cuphead/
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ══ SECTION 6: STATUS ══ */}
            <div className="space-y-3">
              <SectionHeader
                title="6. Status & QC"
                isOpen={openSections.status}
                onToggle={() => toggleSection('status')}
              />
              {openSections.status && (
                <div className="grid sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <FieldLabel required>Availability Status</FieldLabel>
                    <select
                      {...register('availabilityStatus')}
                      className={inputCls}
                    >
                      <option value="available">Available</option>
                      <option value="unavailable">Unavailable</option>
                    </select>
                  </div>
                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        {...register('isProblematic')}
                        className="w-4 h-4 rounded text-red-500"
                      />
                      <span className="text-sm text-slate-700 font-medium">
                        Tandai sebagai Problematic
                        <span className="block text-[10px] text-slate-400 font-normal">
                          Game tidak akan tampil di katalog publik
                        </span>
                      </span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* ══ SECTION 7: DATA ADMIN (gamesPrivate) ══ */}
            <div className="space-y-3">
              <SectionHeader
                title="7. Data Admin (Tersimpan di gamesPrivate)"
                isOpen={openSections.admin}
                onToggle={() => toggleSection('admin')}
              />
              {openSections.admin && (
                <div className="space-y-4 pt-1">
                  {/* Storage Locations */}
                  <div>
                    <FieldLabel required>
                      Lokasi File (Storage Email)
                    </FieldLabel>
                    <div className="flex flex-wrap gap-2 bg-slate-50 border border-slate-200 rounded-lg p-3">
                      {locationEmails.length === 0 && (
                        <p className="text-xs text-slate-400">
                          Tidak ada lokasi ditemukan di emailLocations
                          collection.
                        </p>
                      )}
                      {locationEmails.map((email) => {
                        const isSelected = watchedStorageEmails.includes(email);
                        const username = email.split('@')[0];
                        return (
                          <button
                            key={email}
                            type="button"
                            onClick={() => {
                              const cur = watchedStorageEmails;
                              setValue(
                                'storageEmails',
                                isSelected
                                  ? cur.filter((e) => e !== email)
                                  : [...cur, email]
                              );
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                              isSelected
                                ? 'bg-slate-800 text-white border-slate-800'
                                : 'bg-white text-slate-600 border-slate-300 hover:border-slate-500'
                            }`}
                            title={email}
                          >
                            {username}
                          </button>
                        );
                      })}
                    </div>
                    {watchedStorageEmails.length > 0 && (
                      <p className="text-[10px] text-slate-500 mt-1">
                        Dipilih:{' '}
                        {watchedStorageEmails
                          .map((e) => e.split('@')[0])
                          .join(', ')}
                      </p>
                    )}
                    <FieldError message={errors.storageEmails?.message} />
                  </div>

                  {/* Admin Notes */}
                  <div>
                    <FieldLabel>Admin Notes</FieldLabel>
                    <textarea
                      {...register('adminNotes')}
                      rows={2}
                      placeholder='e.g. "MASTER di mygameon8", "BACKUP ada di mygameon12"...'
                      className={`${inputCls} resize-none`}
                    />
                  </div>

                  {/* Verification Status + Cover Credit */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel required>Verification Status</FieldLabel>
                      <select
                        {...register('verificationStatus')}
                        className={inputCls}
                      >
                        {VERIFICATION_OPTIONS.map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <FieldLabel>Cover Source Credit</FieldLabel>
                      <input
                        {...register('coverSourceCredit')}
                        placeholder='e.g. "From MobyGames, modified v3"'
                        className={inputCls}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ══ FOOTER ACTIONS ══ */}
            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 mt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-5 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold text-sm transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-semibold text-sm transition-colors flex items-center gap-2 shadow-lg"
              >
                {isSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {isSubmitting
                  ? 'Menyimpan...'
                  : isEditMode
                    ? 'Simpan Perubahan'
                    : 'Tambah Game'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default GameFormModal;
