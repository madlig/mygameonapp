// src/features/content/ContentPage.jsx
//
// Admin Content page — manage landing page content.
// 4 tabs: Video Tutorial, Download Apps, Software Pendukung, Blog

import React, { useState, useEffect } from 'react';
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Video,
  Download,
  Wrench,
  ExternalLink,
  Play,
  FileText,
  Star,
} from 'lucide-react';
import Swal from 'sweetalert2';
import {
  tutorialsCRUD,
  seedTutorials,
  downloadsCRUD,
  seedDownloads,
  prerequisitesCRUD,
  seedPrerequisites,
  blogsCRUD,
  seedBlogs,
  winningProductService,
} from './services/contentFirestore';
import { tutorials as staticTutorials } from '../landing/data/tutorials';
import { downloads as staticDownloads } from '../landing/data/downloads';
import { prerequisites as staticPrereqs } from '../landing/data/prerequisites';
import { BLOG_ARTICLES as staticBlogs } from '../landing/data/blogArticles';

const BLOG_CATEGORIES = [
  { value: 'Update', label: 'Update' },
  { value: 'News', label: 'News' },
  { value: 'Tips', label: 'Tips' },
  { value: 'Tutorial', label: 'Tutorial' },
];

const BLOG_CAT_COLORS = {
  Update: '#EF4444',
  News: '#F97316',
  Tips: '#8B5CF6',
  Tutorial: '#22D3EE',
};

const swalDark = {
  color: '#F3F4F6',
  background: '#1A1F27',
  confirmButtonColor: '#FFD100',
};

const VIDEO_CATEGORIES = [
  { value: 'general', label: 'Umum' },
  { value: 'sims4', label: 'Sims 4' },
  { value: 'troubleshoot', label: 'Troubleshoot' },
];

// ════════════════════════════════════════════
// Reusable list item wrapper
// ════════════════════════════════════════════
const ContentItem = ({
  item,
  index,
  total,
  onMove,
  onToggle,
  onEdit,
  onDelete,
  children,
}) => (
  <div
    className={`rounded-xl border p-4 transition-colors ${
      item.isActive !== false
        ? 'bg-[#111317] border-[#2A2F39]'
        : 'bg-[#111317]/50 border-[#2A2F39]/50 opacity-60'
    }`}
  >
    <div className="flex items-start gap-3">
      <div className="flex flex-col items-center gap-0.5 pt-0.5">
        <button
          onClick={() => onMove(index, -1)}
          disabled={index === 0}
          className="p-0.5 text-[#7E8796] hover:text-[#C8CFDA] disabled:opacity-30 transition-colors"
        >
          <ChevronUp size={14} />
        </button>
        <GripVertical size={14} className="text-[#4A5568]" />
        <button
          onClick={() => onMove(index, 1)}
          disabled={index === total - 1}
          className="p-0.5 text-[#7E8796] hover:text-[#C8CFDA] disabled:opacity-30 transition-colors"
        >
          <ChevronDown size={14} />
        </button>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold text-[#7E8796] bg-[#2A2F39] px-1.5 py-0.5 rounded">
            #{index + 1}
          </span>
          {item.isActive === false && (
            <span className="text-[10px] font-bold text-red-400 bg-red-500/15 px-1.5 py-0.5 rounded border border-red-500/25">
              Nonaktif
            </span>
          )}
        </div>
        {children}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {onToggle && (
          <button
            onClick={() => onToggle(item)}
            className="p-1.5 rounded-md text-[#7E8796] hover:text-[#C8CFDA] hover:bg-[#2A2F39] transition-colors"
            title={item.isActive !== false ? 'Nonaktifkan' : 'Aktifkan'}
          >
            {item.isActive !== false ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
        )}
        <button
          onClick={() => onEdit(item)}
          className="p-1.5 rounded-md text-[#7E8796] hover:text-blue-400 hover:bg-blue-500/15 transition-colors"
          title="Edit"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={() => onDelete(item)}
          className="p-1.5 rounded-md text-[#7E8796] hover:text-red-400 hover:bg-red-500/15 transition-colors"
          title="Hapus"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  </div>
);

// ════════════════════════════════════════════
// Modal wrapper
// ════════════════════════════════════════════
const FormModal = ({ title, onClose, onSave, saving, disabled, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
    <div className="bg-[#1A1F27] border border-[#2A2F39] rounded-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
      <h3 className="text-base font-bold text-[#F3F4F6] mb-4">{title}</h3>
      <div className="space-y-3">{children}</div>
      <div className="flex justify-end gap-2 mt-4">
        <button
          onClick={onClose}
          className="px-4 py-2 text-xs font-bold rounded-lg bg-[#2A2F39] text-[#C8CFDA] hover:bg-[#3A3F49] transition-colors"
        >
          Batal
        </button>
        <button
          onClick={onSave}
          disabled={saving || disabled}
          className="px-4 py-2 text-xs font-bold rounded-lg bg-[#FFD100] text-[#0D1117] hover:bg-[#FFD100]/90 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : 'Simpan'}
        </button>
      </div>
    </div>
  </div>
);

const Field = ({ label, children }) => (
  <div>
    <label className="block text-xs text-[#7E8796] mb-1">{label}</label>
    {children}
  </div>
);

const inputCls =
  'w-full px-3 py-2 rounded-lg bg-[#111317] border border-[#2A2F39] text-sm text-[#C8CFDA] focus:outline-none focus:ring-2 focus:ring-[#FFD100]/40';

// ════════════════════════════════════════════
// Main page
// ════════════════════════════════════════════
const ContentPage = () => {
  const [activeTab, setActiveTab] = useState('videos');

  // Data
  const [tutorials, setTutorials] = useState([]);
  const [downloads, setDownloads] = useState([]);
  const [prereqs, setPrereqs] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [loadingDownloads, setLoadingDownloads] = useState(true);
  const [loadingPrereqs, setLoadingPrereqs] = useState(true);
  const [loadingBlogs, setLoadingBlogs] = useState(true);
  const [winningProduct, setWinningProduct] = useState(null);
  const [loadingWP, setLoadingWP] = useState(true);
  const [wpForm, setWpForm] = useState({});
  const [savingWP, setSavingWP] = useState(false);
  const [uploadingWP, setUploadingWP] = useState(false);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  // Subscribe
  useEffect(() => {
    const u1 = tutorialsCRUD.subscribe((items) => {
      setTutorials(items);
      setLoadingVideos(false);
    });
    const u2 = downloadsCRUD.subscribe((items) => {
      setDownloads(items);
      setLoadingDownloads(false);
    });
    const u3 = prerequisitesCRUD.subscribe((items) => {
      setPrereqs(items);
      setLoadingPrereqs(false);
    });
    const u4 = blogsCRUD.subscribe((items) => {
      setBlogs(items);
      setLoadingBlogs(false);
    });
    const u5 = winningProductService.subscribe((data) => {
      setWinningProduct(data);
      setLoadingWP(false);
      if (data) {
        setWpForm({
          title: data.title || '',
          sub: data.sub || '',
          genre: data.genre || '',
          size: data.size || '',
          price: data.price || '',
          oldPrice: data.oldPrice || '',
          tag1: data.tags?.[0] || '',
          tag2: data.tags?.[1] || '',
          desc: data.desc || '',
          color1: data.colors?.[0] || '#1a0533',
          color2: data.colors?.[1] || '#3b0764',
          color3: data.colors?.[2] || '#581c87',
          coverUrl: data.coverUrl || '',
        });
      }
    });
    return () => {
      u1();
      u2();
      u3();
      u4();
      u5();
    };
  }, []);

  // Seed on first load
  useEffect(() => {
    if (!loadingVideos && tutorials.length === 0)
      seedTutorials(staticTutorials);
  }, [loadingVideos, tutorials.length]);
  useEffect(() => {
    if (!loadingDownloads && downloads.length === 0)
      seedDownloads(staticDownloads);
  }, [loadingDownloads, downloads.length]);
  useEffect(() => {
    if (!loadingPrereqs && prereqs.length === 0)
      seedPrerequisites(staticPrereqs);
  }, [loadingPrereqs, prereqs.length]);
  useEffect(() => {
    if (!loadingBlogs && blogs.length === 0) seedBlogs(staticBlogs);
  }, [loadingBlogs, blogs.length]);

  // Active CRUD based on tab
  const getCRUD = () => {
    if (activeTab === 'videos') return tutorialsCRUD;
    if (activeTab === 'downloads') return downloadsCRUD;
    if (activeTab === 'blogs') return blogsCRUD;
    return prerequisitesCRUD;
  };
  const getItems = () => {
    if (activeTab === 'videos') return tutorials;
    if (activeTab === 'downloads') return downloads;
    if (activeTab === 'blogs') return blogs;
    return prereqs;
  };
  const isLoading = () => {
    if (activeTab === 'videos') return loadingVideos;
    if (activeTab === 'downloads') return loadingDownloads;
    if (activeTab === 'blogs') return loadingBlogs;
    return loadingPrereqs;
  };

  // ── Handlers ──
  const openAdd = () => {
    setEditing(null);
    if (activeTab === 'videos')
      setForm({
        title: '',
        description: '',
        youtubeId: '',
        category: 'general',
      });
    else if (activeTab === 'downloads')
      setForm({
        name: '',
        description: '',
        version: '',
        size: '',
        downloadUrl: '',
        icon: 'download',
        requirements: 'Windows 10+',
        isAvailable: true,
        comingSoonNote: '',
      });
    else if (activeTab === 'blogs')
      setForm({
        title: '',
        slug: '',
        category: 'News',
        excerpt: '',
        date: '',
        readTime: '3 min',
        author: 'Admin MyGameON',
        featured: false,
        trending: false,
        body: '',
      });
    else setForm({ name: '', description: '', url: '', icon: 'monitor' });
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    if (activeTab === 'videos')
      setForm({
        title: item.title,
        description: item.description,
        youtubeId: item.youtubeId || '',
        category: item.category || 'general',
      });
    else if (activeTab === 'downloads')
      setForm({
        name: item.name,
        description: item.description,
        version: item.version || '',
        size: item.size || '',
        downloadUrl: item.downloadUrl || '',
        icon: item.icon || 'download',
        requirements: item.requirements || '',
        isAvailable: item.isAvailable ?? true,
        comingSoonNote: item.comingSoonNote || '',
      });
    else if (activeTab === 'blogs')
      setForm({
        title: item.title,
        slug: item.slug || '',
        category: item.category || 'News',
        excerpt: item.excerpt || '',
        date: item.date || '',
        readTime: item.readTime || '3 min',
        author: item.author || 'Admin MyGameON',
        featured: item.featured ?? false,
        trending: item.trending ?? false,
        body: item.body || '',
      });
    else
      setForm({
        name: item.name,
        description: item.description,
        url: item.url || '',
        icon: item.icon || 'monitor',
      });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const crud = getCRUD();
      if (activeTab === 'videos') {
        const data = {
          title: form.title.trim(),
          description: form.description.trim(),
          youtubeId: form.youtubeId.trim() || null,
          category: form.category,
        };
        if (editing) await crud.update(editing.id, data);
        else await crud.add({ ...data, order: getItems().length });
      } else if (activeTab === 'downloads') {
        const data = {
          name: form.name.trim(),
          description: form.description.trim(),
          version: form.version.trim() || null,
          size: form.size.trim() || null,
          downloadUrl: form.downloadUrl.trim() || null,
          icon: form.icon,
          requirements: form.requirements.trim(),
          isAvailable: form.isAvailable,
          comingSoonNote: form.isAvailable
            ? null
            : form.comingSoonNote.trim() || 'Segera hadir',
        };
        if (editing) await crud.update(editing.id, data);
        else await crud.add({ ...data, order: getItems().length });
      } else if (activeTab === 'blogs') {
        const data = {
          title: form.title.trim(),
          slug:
            form.slug.trim() ||
            form.title
              .trim()
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/(^-|-$)/g, ''),
          category: form.category,
          categoryColor: BLOG_CAT_COLORS[form.category] || '#F97316',
          excerpt: form.excerpt.trim(),
          date: form.date.trim(),
          readTime: form.readTime.trim() || '3 min',
          author: form.author.trim() || 'Admin MyGameON',
          featured: form.featured,
          trending: form.trending,
          coverGradient: ['#0d0f14', '#1e3a5f', '#2563eb'],
          body: form.body.trim(),
        };
        if (editing) await crud.update(editing.id, data);
        else await crud.add({ ...data, order: getItems().length });
      } else {
        const data = {
          name: form.name.trim(),
          description: form.description.trim(),
          url: form.url.trim(),
          icon: form.icon,
        };
        if (editing) await crud.update(editing.id, data);
        else await crud.add({ ...data, order: getItems().length });
      }
      setShowForm(false);
      setEditing(null);
    } catch (err) {
      console.error('Save error:', err);
      Swal.fire({ ...swalDark, icon: 'error', title: 'Gagal menyimpan' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    const label = item.title || item.name;
    const res = await Swal.fire({
      ...swalDark,
      icon: 'warning',
      title: 'Hapus item?',
      text: `"${label}"`,
      showCancelButton: true,
      confirmButtonText: 'Hapus',
      cancelButtonText: 'Batal',
    });
    if (res.isConfirmed) await getCRUD().remove(item.id);
  };

  const handleToggle = async (item) => {
    await getCRUD().update(item.id, { isActive: !(item.isActive !== false) });
  };

  const handleMove = async (index, dir) => {
    const items = [...getItems()];
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    [items[index], items[target]] = [items[target], items[index]];
    await getCRUD().reorder(items.map((i) => i.id));
  };

  const handleSaveWP = async () => {
    setSavingWP(true);
    try {
      const tags = [wpForm.tag1?.trim(), wpForm.tag2?.trim()].filter(Boolean);
      const colors = [
        wpForm.color1 || '#1a0533',
        wpForm.color2 || '#3b0764',
        wpForm.color3 || '#581c87',
      ];
      await winningProductService.save({
        title: wpForm.title.trim(),
        sub: wpForm.sub.trim(),
        genre: wpForm.genre.trim(),
        size: wpForm.size.trim(),
        price: wpForm.price.trim(),
        oldPrice: wpForm.oldPrice.trim(),
        tags,
        desc: wpForm.desc.trim(),
        colors,
        coverUrl: wpForm.coverUrl || '',
      });
      Swal.fire({
        ...swalDark,
        icon: 'success',
        title: 'Winning Product tersimpan',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error('Save WP error:', err);
      Swal.fire({ ...swalDark, icon: 'error', title: 'Gagal menyimpan' });
    } finally {
      setSavingWP(false);
    }
  };

  const isFormValid = () => {
    if (activeTab === 'videos')
      return form.title?.trim() && form.description?.trim();
    if (activeTab === 'downloads')
      return form.name?.trim() && form.description?.trim();
    if (activeTab === 'blogs')
      return form.title?.trim() && form.body?.trim() && form.date?.trim();
    return form.name?.trim() && form.description?.trim();
  };

  const tabLabel =
    activeTab === 'videos'
      ? 'Video Tutorial'
      : activeTab === 'downloads'
        ? 'Download App'
        : activeTab === 'blogs'
          ? 'Blog'
          : 'Software Pendukung';

  // ════════════════════════════════════════════
  // Render
  // ════════════════════════════════════════════
  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#F3F4F6] mb-1">
            Kelola Konten
          </h1>
          <p className="text-[#7E8796] text-sm">
            Video tutorial, download apps, software pendukung, dan blog di
            landing page.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#2A2F39] gap-1 mb-6">
          {[
            {
              key: 'videos',
              label: 'Video Tutorial',
              icon: Video,
              count: tutorials.length,
            },
            {
              key: 'downloads',
              label: 'Download Apps',
              icon: Download,
              count: downloads.length,
            },
            {
              key: 'prereqs',
              label: 'Software',
              icon: Wrench,
              count: prereqs.length,
            },
            {
              key: 'blogs',
              label: 'Blog',
              icon: FileText,
              count: blogs.length,
            },
            {
              key: 'winning',
              label: 'Winning',
              icon: Star,
              count: winningProduct ? 1 : 0,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`pb-3 px-4 text-sm font-medium flex items-center gap-2 whitespace-nowrap transition-colors border-b-2 ${active ? 'text-[#FFD100] border-[#FFD100]' : 'text-[#7E8796] border-transparent hover:text-[#C8CFDA]'}`}
              >
                <Icon size={16} />
                {tab.label}
                {tab.count > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#2A2F39] text-[#C8CFDA]">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Winning Product Tab ── */}
        {activeTab === 'winning' && (
          <div className="mt-2">
            {loadingWP ? (
              <div className="flex justify-center py-16">
                <Loader2 className="animate-spin text-[#FFD100] w-6 h-6" />
              </div>
            ) : (
              <div className="rounded-xl border border-[#2A2F39] bg-[#111317] p-6">
                <div className="flex items-center gap-2 mb-5">
                  <Star size={16} className="text-[#FFD100]" />
                  <h3 className="text-sm font-bold text-[#F3F4F6]">
                    Winning Product Spotlight
                  </h3>
                  <span className="text-[10px] text-[#7E8796] ml-auto">
                    Ditampilkan di landing page
                  </span>
                </div>

                {/* Preview card */}
                {wpForm.title && (
                  <div
                    className="mb-6 rounded-xl overflow-hidden"
                    style={{
                      background: `linear-gradient(155deg, ${wpForm.color1}, ${wpForm.color2}, ${wpForm.color3})`,
                      padding: '20px 24px',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      {[wpForm.tag1, wpForm.tag2].filter(Boolean).map((t) => (
                        <span
                          key={t}
                          className="text-[9px] font-extrabold bg-white/20 text-white px-2 py-0.5 rounded"
                        >
                          {t.toUpperCase()}
                        </span>
                      ))}
                    </div>
                    <p className="text-lg font-black text-white">
                      {wpForm.title}
                    </p>
                    <p className="text-xs text-white/60">{wpForm.sub}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[11px] text-white/40 line-through">
                        {wpForm.oldPrice}
                      </span>
                      <span className="text-base font-black text-[#FFD100]">
                        {wpForm.price}
                      </span>
                    </div>
                  </div>
                )}

                {/* Cover Image Upload */}
                <div className="mb-5">
                  <Field label="Cover Image (Rekomendasi: 800 × 500 px, max 2 MB — otomatis di-resize)">
                    <div className="flex items-start gap-4 mt-1.5">
                      {/* Preview */}
                      <div
                        className="shrink-0 w-[160px] h-[100px] rounded-lg overflow-hidden border border-[#2A2F39]"
                        style={{
                          background: wpForm.coverUrl
                            ? `url(${wpForm.coverUrl}) center/cover`
                            : `linear-gradient(155deg, ${wpForm.color1 || '#1a0533'}, ${wpForm.color2 || '#3b0764'}, ${wpForm.color3 || '#581c87'})`,
                        }}
                      >
                        {!wpForm.coverUrl && (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-white/30 font-bold">
                            No Image
                          </div>
                        )}
                      </div>
                      {/* Upload button */}
                      <div className="flex-1">
                        <label className="inline-flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg bg-[#2A2F39] text-[#C8CFDA] hover:bg-[#3A3F49] transition-colors cursor-pointer">
                          {uploadingWP ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            'Pilih Gambar'
                          )}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            disabled={uploadingWP}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setUploadingWP(true);
                              try {
                                const url =
                                  await winningProductService.uploadCover(file);
                                setWpForm((prev) => ({
                                  ...prev,
                                  coverUrl: url,
                                }));
                                Swal.fire({
                                  ...swalDark,
                                  icon: 'success',
                                  title: 'Gambar diupload',
                                  text: 'Otomatis di-resize ke 800×500',
                                  timer: 1500,
                                  showConfirmButton: false,
                                });
                              } catch (err) {
                                console.error('Upload error:', err);
                                Swal.fire({
                                  ...swalDark,
                                  icon: 'error',
                                  title: 'Upload gagal',
                                  text: err.message,
                                });
                              } finally {
                                setUploadingWP(false);
                                e.target.value = '';
                              }
                            }}
                          />
                        </label>
                        {wpForm.coverUrl && (
                          <button
                            onClick={() =>
                              setWpForm((prev) => ({ ...prev, coverUrl: '' }))
                            }
                            className="ml-2 text-[10px] text-red-400 hover:text-red-300 transition-colors"
                          >
                            Hapus gambar
                          </button>
                        )}
                        <p className="text-[10px] text-[#7E8796] mt-1.5 leading-relaxed">
                          Format: JPG, PNG, WebP. Gambar otomatis di-crop &
                          resize ke <strong>800 × 500 px</strong> (rasio 8:5).
                          {' '}Jika tidak diisi, gradient warna akan digunakan.
                        </p>
                      </div>
                    </div>
                  </Field>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Judul Game">
                      <input
                        type="text"
                        value={wpForm.title || ''}
                        onChange={(e) =>
                          setWpForm({ ...wpForm, title: e.target.value })
                        }
                        className={inputCls}
                        placeholder="Cyberpunk 2077"
                      />
                    </Field>
                    <Field label="Subtitle">
                      <input
                        type="text"
                        value={wpForm.sub || ''}
                        onChange={(e) =>
                          setWpForm({ ...wpForm, sub: e.target.value })
                        }
                        className={inputCls}
                        placeholder="Ultimate Edition — Update 2.2"
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <Field label="Genre">
                      <input
                        type="text"
                        value={wpForm.genre || ''}
                        onChange={(e) =>
                          setWpForm({ ...wpForm, genre: e.target.value })
                        }
                        className={inputCls}
                        placeholder="RPG · Open World · AAA"
                      />
                    </Field>
                    <Field label="Ukuran">
                      <input
                        type="text"
                        value={wpForm.size || ''}
                        onChange={(e) =>
                          setWpForm({ ...wpForm, size: e.target.value })
                        }
                        className={inputCls}
                        placeholder="70.8 GB"
                      />
                    </Field>
                    <Field label="Harga Baru">
                      <input
                        type="text"
                        value={wpForm.price || ''}
                        onChange={(e) =>
                          setWpForm({ ...wpForm, price: e.target.value })
                        }
                        className={inputCls}
                        placeholder="Rp 25.000"
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <Field label="Harga Lama (coret)">
                      <input
                        type="text"
                        value={wpForm.oldPrice || ''}
                        onChange={(e) =>
                          setWpForm({ ...wpForm, oldPrice: e.target.value })
                        }
                        className={inputCls}
                        placeholder="Rp 45.000"
                      />
                    </Field>
                    <Field label="Tag 1">
                      <input
                        type="text"
                        value={wpForm.tag1 || ''}
                        onChange={(e) =>
                          setWpForm({ ...wpForm, tag1: e.target.value })
                        }
                        className={inputCls}
                        placeholder="Bestseller"
                      />
                    </Field>
                    <Field label="Tag 2">
                      <input
                        type="text"
                        value={wpForm.tag2 || ''}
                        onChange={(e) =>
                          setWpForm({ ...wpForm, tag2: e.target.value })
                        }
                        className={inputCls}
                        placeholder="Baru Update"
                      />
                    </Field>
                  </div>

                  <Field label="Deskripsi">
                    <textarea
                      value={wpForm.desc || ''}
                      onChange={(e) =>
                        setWpForm({ ...wpForm, desc: e.target.value })
                      }
                      rows={3}
                      className={`${inputCls} resize-none`}
                      placeholder="Deskripsi singkat game..."
                    />
                  </Field>

                  <div className="grid grid-cols-3 gap-3">
                    <Field label="Gradient Warna 1">
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={wpForm.color1 || '#1a0533'}
                          onChange={(e) =>
                            setWpForm({ ...wpForm, color1: e.target.value })
                          }
                          className="w-8 h-8 rounded cursor-pointer border border-[#2A2F39] bg-transparent"
                        />
                        <input
                          type="text"
                          value={wpForm.color1 || ''}
                          onChange={(e) =>
                            setWpForm({ ...wpForm, color1: e.target.value })
                          }
                          className={`${inputCls} font-mono text-xs`}
                          placeholder="#1a0533"
                        />
                      </div>
                    </Field>
                    <Field label="Gradient Warna 2">
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={wpForm.color2 || '#3b0764'}
                          onChange={(e) =>
                            setWpForm({ ...wpForm, color2: e.target.value })
                          }
                          className="w-8 h-8 rounded cursor-pointer border border-[#2A2F39] bg-transparent"
                        />
                        <input
                          type="text"
                          value={wpForm.color2 || ''}
                          onChange={(e) =>
                            setWpForm({ ...wpForm, color2: e.target.value })
                          }
                          className={`${inputCls} font-mono text-xs`}
                          placeholder="#3b0764"
                        />
                      </div>
                    </Field>
                    <Field label="Gradient Warna 3">
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={wpForm.color3 || '#581c87'}
                          onChange={(e) =>
                            setWpForm({ ...wpForm, color3: e.target.value })
                          }
                          className="w-8 h-8 rounded cursor-pointer border border-[#2A2F39] bg-transparent"
                        />
                        <input
                          type="text"
                          value={wpForm.color3 || ''}
                          onChange={(e) =>
                            setWpForm({ ...wpForm, color3: e.target.value })
                          }
                          className={`${inputCls} font-mono text-xs`}
                          placeholder="#581c87"
                        />
                      </div>
                    </Field>
                  </div>
                </div>

                <div className="flex justify-end mt-5">
                  <button
                    onClick={handleSaveWP}
                    disabled={savingWP || !wpForm.title?.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-lg bg-[#FFD100] text-[#0D1117] hover:bg-[#FFD100]/90 transition-colors disabled:opacity-50"
                  >
                    {savingWP ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      'Simpan Winning Product'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add button + Form + List (all CRUD tabs except winning) */}
        {activeTab !== 'winning' && (
          <>
            <div className="flex justify-end mb-4">
              <button
                onClick={openAdd}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-[#FFD100] text-[#0D1117] hover:bg-[#FFD100]/90 transition-colors"
              >
                <Plus size={14} />
                Tambah {tabLabel}
              </button>
            </div>

            {/* Form Modal */}
            {showForm && (
              <FormModal
                title={editing ? `Edit ${tabLabel}` : `Tambah ${tabLabel}`}
                onClose={() => {
                  setShowForm(false);
                  setEditing(null);
                }}
                onSave={handleSave}
                saving={saving}
                disabled={!isFormValid()}
              >
                {activeTab === 'videos' && (
                  <>
                    <Field label="Judul">
                      <input
                        type="text"
                        value={form.title}
                        onChange={(e) =>
                          setForm({ ...form, title: e.target.value })
                        }
                        className={inputCls}
                        placeholder="Cara Install Game..."
                      />
                    </Field>
                    <Field label="Deskripsi">
                      <textarea
                        value={form.description}
                        onChange={(e) =>
                          setForm({ ...form, description: e.target.value })
                        }
                        rows={3}
                        className={`${inputCls} resize-none`}
                        placeholder="Panduan lengkap..."
                      />
                    </Field>
                    <Field label="YouTube Video ID">
                      <input
                        type="text"
                        value={form.youtubeId}
                        onChange={(e) =>
                          setForm({ ...form, youtubeId: e.target.value })
                        }
                        className={inputCls}
                        placeholder="dQw4w9WgXcQ (kosongkan jika belum ada)"
                      />
                      <p className="text-[10px] text-[#7E8796] mt-1">
                        ID dari URL youtube.com/watch?v=<strong>ID_INI</strong>.
                        Min 720p, max 15 menit.
                      </p>
                    </Field>
                    <Field label="Kategori">
                      <select
                        value={form.category}
                        onChange={(e) =>
                          setForm({ ...form, category: e.target.value })
                        }
                        className={inputCls}
                      >
                        {VIDEO_CATEGORIES.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </>
                )}
                {activeTab === 'downloads' && (
                  <>
                    <Field label="Nama Aplikasi">
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                        className={inputCls}
                        placeholder="MyGameON Sims Launcher"
                      />
                    </Field>
                    <Field label="Deskripsi">
                      <textarea
                        value={form.description}
                        onChange={(e) =>
                          setForm({ ...form, description: e.target.value })
                        }
                        rows={2}
                        className={`${inputCls} resize-none`}
                        placeholder="Kelola DLC, Mods..."
                      />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Versi">
                        <input
                          type="text"
                          value={form.version}
                          onChange={(e) =>
                            setForm({ ...form, version: e.target.value })
                          }
                          className={inputCls}
                          placeholder="10.0.1"
                        />
                      </Field>
                      <Field label="Ukuran File">
                        <input
                          type="text"
                          value={form.size}
                          onChange={(e) =>
                            setForm({ ...form, size: e.target.value })
                          }
                          className={inputCls}
                          placeholder="~25 MB"
                        />
                      </Field>
                    </div>
                    <Field label="Download URL">
                      <input
                        type="text"
                        value={form.downloadUrl}
                        onChange={(e) =>
                          setForm({ ...form, downloadUrl: e.target.value })
                        }
                        className={inputCls}
                        placeholder="https://github.com/..."
                      />
                    </Field>
                    <Field label="Requirements">
                      <input
                        type="text"
                        value={form.requirements}
                        onChange={(e) =>
                          setForm({ ...form, requirements: e.target.value })
                        }
                        className={inputCls}
                        placeholder="Windows 10+"
                      />
                    </Field>
                    <Field label="Status">
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-xs text-[#C8CFDA] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.isAvailable}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                isAvailable: e.target.checked,
                              })
                            }
                            className="accent-[#FFD100]"
                          />
                          Tersedia untuk download
                        </label>
                      </div>
                      {!form.isAvailable && (
                        <input
                          type="text"
                          value={form.comingSoonNote}
                          onChange={(e) =>
                            setForm({ ...form, comingSoonNote: e.target.value })
                          }
                          className={`${inputCls} mt-2`}
                          placeholder="Segera hadir"
                        />
                      )}
                    </Field>
                  </>
                )}
                {activeTab === 'blogs' && (
                  <>
                    <Field label="Judul Artikel">
                      <input
                        type="text"
                        value={form.title}
                        onChange={(e) =>
                          setForm({ ...form, title: e.target.value })
                        }
                        className={inputCls}
                        placeholder="Cyberpunk 2077 Patch 2.2..."
                      />
                    </Field>
                    <Field label="Slug (otomatis jika kosong)">
                      <input
                        type="text"
                        value={form.slug}
                        onChange={(e) =>
                          setForm({ ...form, slug: e.target.value })
                        }
                        className={inputCls}
                        placeholder="cyberpunk-2077-patch-2-2"
                      />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Kategori">
                        <select
                          value={form.category}
                          onChange={(e) =>
                            setForm({ ...form, category: e.target.value })
                          }
                          className={inputCls}
                        >
                          {BLOG_CATEGORIES.map((c) => (
                            <option key={c.value} value={c.value}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Tanggal (teks)">
                        <input
                          type="text"
                          value={form.date}
                          onChange={(e) =>
                            setForm({ ...form, date: e.target.value })
                          }
                          className={inputCls}
                          placeholder="28 Mei 2026"
                        />
                      </Field>
                    </div>
                    <Field label="Excerpt / Ringkasan">
                      <textarea
                        value={form.excerpt}
                        onChange={(e) =>
                          setForm({ ...form, excerpt: e.target.value })
                        }
                        rows={2}
                        className={`${inputCls} resize-none`}
                        placeholder="Ringkasan singkat untuk card..."
                      />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Waktu Baca">
                        <input
                          type="text"
                          value={form.readTime}
                          onChange={(e) =>
                            setForm({ ...form, readTime: e.target.value })
                          }
                          className={inputCls}
                          placeholder="5 min"
                        />
                      </Field>
                      <Field label="Penulis">
                        <input
                          type="text"
                          value={form.author}
                          onChange={(e) =>
                            setForm({ ...form, author: e.target.value })
                          }
                          className={inputCls}
                          placeholder="Admin MyGameON"
                        />
                      </Field>
                    </div>
                    <Field label="Opsi">
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-xs text-[#C8CFDA] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.featured}
                            onChange={(e) =>
                              setForm({ ...form, featured: e.target.checked })
                            }
                            className="accent-[#FFD100]"
                          />
                          Featured
                        </label>
                        <label className="flex items-center gap-2 text-xs text-[#C8CFDA] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.trending}
                            onChange={(e) =>
                              setForm({ ...form, trending: e.target.checked })
                            }
                            className="accent-[#FFD100]"
                          />
                          Trending
                        </label>
                      </div>
                    </Field>
                    <Field label="Body (Markdown-lite: ## heading, **bold**, - list)">
                      <textarea
                        value={form.body}
                        onChange={(e) =>
                          setForm({ ...form, body: e.target.value })
                        }
                        rows={10}
                        className={`${inputCls} resize-y font-mono text-xs`}
                        placeholder="Konten artikel lengkap..."
                      />
                    </Field>
                  </>
                )}
                {activeTab === 'prereqs' && (
                  <>
                    <Field label="Nama Software">
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                        className={inputCls}
                        placeholder="DirectX End-User Runtime"
                      />
                    </Field>
                    <Field label="Deskripsi">
                      <textarea
                        value={form.description}
                        onChange={(e) =>
                          setForm({ ...form, description: e.target.value })
                        }
                        rows={2}
                        className={`${inputCls} resize-none`}
                        placeholder="Diperlukan oleh hampir semua game..."
                      />
                    </Field>
                    <Field label="URL Download Resmi">
                      <input
                        type="text"
                        value={form.url}
                        onChange={(e) =>
                          setForm({ ...form, url: e.target.value })
                        }
                        className={inputCls}
                        placeholder="https://www.microsoft.com/..."
                      />
                    </Field>
                  </>
                )}
              </FormModal>
            )}

            {/* List */}
            {isLoading() ? (
              <div className="flex justify-center py-16">
                <Loader2 className="animate-spin text-[#FFD100] w-6 h-6" />
              </div>
            ) : getItems().length === 0 ? (
              <div className="text-center py-16 bg-[#111317] border border-[#2A2F39] rounded-xl">
                <p className="text-sm text-[#C8CFDA]">Belum ada data</p>
                <p className="text-xs text-[#7E8796] mt-1">
                  Klik "Tambah" untuk memulai.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {getItems().map((item, index) => (
                  <ContentItem
                    key={item.id}
                    item={item}
                    index={index}
                    total={getItems().length}
                    onMove={handleMove}
                    onToggle={handleToggle}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                  >
                    {activeTab === 'videos' && (
                      <>
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-semibold text-[#F3F4F6]">
                            {item.title}
                          </p>
                          <span className="text-[10px] font-bold text-[#FFD100]/70 uppercase">
                            {item.category === 'sims4'
                              ? 'Sims 4'
                              : item.category === 'troubleshoot'
                                ? 'Troubleshoot'
                                : 'Umum'}
                          </span>
                        </div>
                        <p className="text-xs text-[#7E8796] leading-relaxed">
                          {item.description}
                        </p>
                        {item.youtubeId ? (
                          <a
                            href={`https://youtube.com/watch?v=${item.youtubeId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-1 text-[10px] text-red-400 hover:text-red-300"
                          >
                            <Play size={10} /> {item.youtubeId}
                          </a>
                        ) : (
                          <span className="text-[10px] text-[#4A5568] mt-1 block">
                            Belum ada video
                          </span>
                        )}
                      </>
                    )}
                    {activeTab === 'downloads' && (
                      <>
                        <p className="text-sm font-semibold text-[#F3F4F6] mb-0.5">
                          {item.name}
                        </p>
                        <p className="text-xs text-[#7E8796] leading-relaxed">
                          {item.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          {item.version && (
                            <span className="text-[10px] text-[#C8CFDA] bg-[#2A2F39] px-1.5 py-0.5 rounded">
                              v{item.version}
                            </span>
                          )}
                          {item.size && (
                            <span className="text-[10px] text-[#7E8796]">
                              {item.size}
                            </span>
                          )}
                          {item.isAvailable === false && (
                            <span className="text-[10px] font-bold text-[#FFD100] bg-[#FFD100]/15 px-1.5 py-0.5 rounded">
                              {item.comingSoonNote || 'Coming soon'}
                            </span>
                          )}
                          {item.downloadUrl && (
                            <a
                              href={item.downloadUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300"
                            >
                              <ExternalLink size={10} /> Link
                            </a>
                          )}
                        </div>
                      </>
                    )}
                    {activeTab === 'prereqs' && (
                      <>
                        <p className="text-sm font-semibold text-[#F3F4F6] mb-0.5">
                          {item.name}
                        </p>
                        <p className="text-xs text-[#7E8796] leading-relaxed">
                          {item.description}
                        </p>
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-1 text-[10px] text-blue-400 hover:text-blue-300"
                          >
                            <ExternalLink size={10} />{' '}
                            {item.url.replace(/^https?:\/\//, '').split('/')[0]}
                          </a>
                        )}
                      </>
                    )}
                    {activeTab === 'blogs' && (
                      <>
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-semibold text-[#F3F4F6]">
                            {item.title}
                          </p>
                          <span
                            className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded"
                            style={{
                              color: item.categoryColor || '#F97316',
                              backgroundColor: `${item.categoryColor || '#F97316'}22`,
                            }}
                          >
                            {item.category}
                          </span>
                        </div>
                        <p className="text-xs text-[#7E8796] leading-relaxed line-clamp-2">
                          {item.excerpt}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-[10px] text-[#7E8796]">
                            {item.date}
                          </span>
                          <span className="text-[10px] text-[#4A5568]">·</span>
                          <span className="text-[10px] text-[#7E8796]">
                            {item.readTime}
                          </span>
                          {item.featured && (
                            <span className="text-[10px] font-bold text-[#FFD100] bg-[#FFD100]/15 px-1.5 py-0.5 rounded">
                              Featured
                            </span>
                          )}
                          {item.trending && (
                            <span className="text-[10px] font-bold text-[#F97316] bg-[#F97316]/15 px-1.5 py-0.5 rounded">
                              Trending
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </ContentItem>
                ))}
              </div>
            )}
          </>
        )}
        {/* end activeTab !== winning */}
      </div>
    </div>
  );
};

export default ContentPage;
