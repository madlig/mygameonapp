import React, { useEffect } from 'react';
import { 
  X, 
  HardDrive, 
  Cpu, 
  Layers, 
  CheckCircle2, 
  ShoppingBag, 
  ShieldCheck, 
  Monitor, 
  Video, 
  FolderArchive,
  AlertCircle,
  Laptop
} from 'lucide-react';
import { buildWhatsAppUrl, INTEGRATIONS } from '../../../config/integrations';
import { formatFileSize } from '../../games/utils/formatters';
import { getSteamCoverUrl, DEFAULT_STEAM_COVER } from '../utils/coverHelper';
import { trackClickShopee, trackClickWhatsApp } from '../../../utils/metaPixel';
import WhatsAppIcon from '../../../components/common/WhatsAppIcon';
import CanIRunItBox from './CanIRunItBox';
import { useDeviceProfile } from '../hooks/useDeviceProfile';
import { determineGameRequirement } from '../utils/hardwareEngine';

/**
 * Heuristik pendeteksi spesifikasi PC berdasarkan ukuran & data game
 */
function resolveSystemSpecs(game) {
  const rawSize = game.fileSizeBytes || game.size || 0;
  const sizeGB = typeof rawSize === 'number' && rawSize > 0 
    ? rawSize / (1024 * 1024 * 1024) 
    : 20;

  // Jika di database sudah ada specs kustom
  if (game.specs && (game.specs.min || game.specs.minimum)) {
    const min = game.specs.min || game.specs.minimum;
    const rec = game.specs.rec || game.specs.recommended || min;
    return {
      tier: sizeGB < 15 ? 'low' : (sizeGB < 50 ? 'mid' : 'high'),
      tierLabel: sizeGB < 15 ? 'Aman untuk Laptop Standar / Kantor' : (sizeGB < 50 ? 'Mid-End (Laptop Gaming Standar)' : 'Grafis Berat (Wajib GPU Diskrit)'),
      tierColor: sizeGB < 15 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : (sizeGB < 50 ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'),
      min: {
        os: min.os || 'Windows 10 64-bit',
        cpu: min.cpu || 'Intel Core i3 / AMD Ryzen 3',
        ram: min.ram || '8 GB',
        gpu: min.gpu || 'NVIDIA GTX 750 Ti / AMD RX 550',
        storage: min.storage || `${Math.ceil(sizeGB)} GB SSD/HDD`,
        directx: min.directx || 'Version 11',
      },
      rec: {
        os: rec.os || 'Windows 10 / 11 64-bit',
        cpu: rec.cpu || 'Intel Core i5 / AMD Ryzen 5',
        ram: rec.ram || '16 GB',
        gpu: rec.gpu || 'NVIDIA GTX 1650 / AMD RX 580',
        storage: rec.storage || `${Math.ceil(sizeGB)} GB SSD`,
        directx: rec.directx || 'Version 12',
      }
    };
  }

  // Gunakan engine cerdas pendeteksi beban hardware
  const req = determineGameRequirement(game);

  if (req.tier === 'light') {
    return {
      tier: 'low',
      tierLabel: 'Aman untuk Laptop Standar / Pelajar / Kantor',
      tierColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      min: {
        os: 'Windows 10 / 11 (64-bit)',
        cpu: req.minCpuLabel || 'Intel Core 2 Duo / Intel Core i3',
        ram: `${req.minRamGB || 4} GB RAM`,
        gpu: req.minGpuLabel || 'Intel HD Graphics / Semua VGA',
        storage: `${Math.ceil(sizeGB + 5)} GB Free Storage`,
        directx: 'DirectX 9 / 11',
      },
      rec: {
        os: 'Windows 10 / 11 (64-bit)',
        cpu: 'Intel Core i3 Gen 8+ / AMD Ryzen 3',
        ram: '8 GB RAM',
        gpu: 'Intel Iris Xe / NVIDIA GT 1030',
        storage: `${Math.ceil(sizeGB + 5)} GB SSD`,
        directx: 'DirectX 11',
      }
    };
  }

  if (req.tier === 'medium') {
    return {
      tier: 'mid',
      tierLabel: req.tierLabel || 'Mid-End (Disarankan Laptop/PC Gaming Entry)',
      tierColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      min: {
        os: 'Windows 10 (64-bit)',
        cpu: req.minCpuLabel || 'Intel Core i5-4460 / AMD FX-6300',
        ram: `${req.minRamGB || 8} GB RAM`,
        gpu: req.minGpuLabel || 'NVIDIA GTX 960 / AMD RX 560 (2GB VRAM)',
        storage: `${Math.ceil(sizeGB + 10)} GB Free Storage`,
        directx: 'DirectX 11 / 12',
      },
      rec: {
        os: 'Windows 10 / 11 (64-bit)',
        cpu: 'Intel Core i5-8400 / AMD Ryzen 5 2600',
        ram: '16 GB RAM',
        gpu: 'NVIDIA GeForce GTX 1650 / GTX 1660',
        storage: `${Math.ceil(sizeGB + 10)} GB SSD`,
        directx: 'DirectX 12',
      }
    };
  }

  // AAA Berat
  return {
    tier: 'high',
    tierLabel: 'Grafis Berat (Wajib Laptop/PC Gaming Dedicated GPU)',
    tierColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    min: {
      os: 'Windows 10 (64-bit)',
      cpu: req.minCpuLabel || 'Intel Core i7-6700 / AMD Ryzen 5 1600',
      ram: `${req.minRamGB || 16} GB RAM`,
      gpu: req.minGpuLabel || 'NVIDIA GeForce GTX 1060 6GB / RTX 3050',
      storage: `${Math.ceil(sizeGB + 15)} GB SSD Recommended`,
      directx: 'DirectX 12',
    },
    rec: {
      os: 'Windows 10 / 11 (64-bit)',
      cpu: 'Intel Core i7-10700K / AMD Ryzen 7 3700X',
      ram: '16 GB RAM (Dual Channel)',
      gpu: 'NVIDIA GeForce RTX 3060 / AMD Radeon RX 6700 XT',
      storage: `${Math.ceil(sizeGB + 15)} GB High-Speed NVMe SSD`,
      directx: 'DirectX 12 Ultimate',
    }
  };
}

const GameDetailModal = ({ game, isOpen, onClose }) => {
  const { profile, isConfigured, checkGame } = useDeviceProfile();

  // Lock body scroll saat modal terbuka & listen to ESC
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !game) return null;

  const title = game.title || game.name || 'Detail Game PC';
  const coverUrl = getSteamCoverUrl(game);
  const rawSize = game.fileSizeBytes || game.size || 0;
  const formattedSize = typeof rawSize === 'number' && rawSize > 0 
    ? formatFileSize(rawSize) 
    : (typeof rawSize === 'string' && rawSize ? rawSize : 'Direct Cloud');

  const version = game.fileVersion || game.version || 'Versi Terupdate';
  const packageType = game.packageType || 'PRE-INSTALLED';
  const partsCount = game.partsCount || game.jumlahPart || 1;
  const genres = Array.isArray(game.genres) && game.genres.length > 0 
    ? game.genres 
    : (Array.isArray(game.genre) && game.genre.length > 0 ? game.genre : ['PC Game']);

  const shopeeUrl = game.shopee?.url || game.shopeeLink || INTEGRATIONS.shopeeStoreUrl;

  const specs = resolveSystemSpecs(game);
  const diag = isConfigured && game ? checkGame(game) : null;

  const waOrderUrl = buildWhatsAppUrl({
    text: `Halo Admin MyGameON, saya mau order game PC:\n- Judul: ${title}\n- Ukuran: ${formattedSize} (${version})\n- Spek Laptop: ${isConfigured ? `${profile.cpuShort}, ${profile.ramGB}GB RAM, ${profile.gpuShort} (${diag?.isPlayable ? 'Terverifikasi Lancar' : 'Perlu Penyesuaian'})` : 'Belum dicek'}\n- Email Google Drive: [Tulis alamat Gmail kamu di sini]\nMohon info nomor rekening dan total pembayarannya ya min.`,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Dialog Container */}
      <div 
        className="relative z-10 w-full max-w-4xl bg-[#0B0F17] border border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#070A0F]">
          <div className="flex items-center gap-2">
            <Monitor size={15} className="text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-300">
              Spesifikasi & Informasi Game
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            title="Tutup Modal (Esc)"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="overflow-y-auto p-5 sm:p-7 space-y-6">
          
          {/* Top Hero Section: Cover + Core Info */}
          <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 items-start">
            {/* Poster Cover 3:4 */}
            <div className="w-36 sm:w-48 aspect-[3/4] flex-shrink-0 rounded-xl overflow-hidden border border-white/15 shadow-xl bg-[#141A26] relative">
              <img 
                src={coverUrl} 
                alt={title} 
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = DEFAULT_COVER; }}
              />
              <div className="absolute top-2 left-2 bg-emerald-500 text-black text-[11px] font-mono font-black px-2 py-0.5 rounded shadow">
                {formattedSize}
              </div>
            </div>

            {/* Core Info */}
            <div className="flex-1 min-w-0 space-y-3">
              <div>
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  {genres.map((g, idx) => (
                    <span 
                      key={idx}
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 text-amber-400 border border-white/10"
                    >
                      {g}
                    </span>
                  ))}
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {version}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight">
                  {title}
                </h2>
              </div>

              {/* Package Type & Parts Badges */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                  <CheckCircle2 size={14} />
                  <span>{packageType === 'PRE-INSTALLED' ? 'Tinggal Ekstrak & Main (Bebas Crack Rumit)' : packageType}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 text-slate-300 border border-white/10 text-xs font-semibold">
                  <FolderArchive size={14} className="text-amber-400" />
                  <span>{partsCount > 1 ? `${partsCount} Part Download (Bebas Corrupt / MD5)` : '1 File Siap Download'}</span>
                </span>
              </div>

              {/* Short Description / Hook */}
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed line-clamp-3">
                {game.shortDescription || game.description || `${title} untuk PC/Laptop dengan update dan DLC terlengkap. Download langsung dari Google Drive kecepatan maksimal tanpa shortlink atau iklan menipu.`}
              </p>

              {/* Can I Run It Hardware Diagnostic Box */}
              <CanIRunItBox game={game} />
            </div>
          </div>

          {/* Official Gameplay Screenshots (From Steam) */}
          {Array.isArray(game.screenshots) && game.screenshots.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Tangkapan Layar Gameplay Resmi
                </span>
                <span className="text-[10px] text-slate-500">Klik untuk memperbesar</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {game.screenshots.slice(0, 4).map((shot, idx) => (
                  <a 
                    key={idx} 
                    href={shot} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="aspect-video rounded-xl overflow-hidden border border-white/10 hover:border-amber-400/60 transition-all block group/shot bg-[#070A0F]"
                  >
                    <img 
                      src={shot} 
                      alt={`${title} screenshot ${idx + 1}`} 
                      className="w-full h-full object-cover group-hover/shot:scale-105 transition-transform duration-300" 
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* PC System Requirements Table */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Cpu size={18} className="text-amber-400" />
                <span>Kebutuhan Spesifikasi Komputer / Laptop</span>
              </h3>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Pastikan laptop Anda memenuhi spek minimum di bawah
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {/* Minimum Specs */}
              <div className="bg-[#070A0F] border border-white/10 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    Spesifikasi Minimum
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-slate-300">
                    Setelan Low 720p/1080p
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">OS:</span>
                    <span className="text-slate-200 font-medium text-right">{specs.min.os}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">Processor:</span>
                    <span className="text-slate-200 font-medium text-right">{specs.min.cpu}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">RAM:</span>
                    <span className="text-amber-400 font-bold text-right">{specs.min.ram}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">Kartu Grafis:</span>
                    <span className="text-slate-200 font-medium text-right">{specs.min.gpu}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Ruang Simpan:</span>
                    <span className="text-slate-200 font-medium text-right">{specs.min.storage}</span>
                  </div>
                </div>
              </div>

              {/* Recommended Specs */}
              <div className="bg-[#070A0F] border border-amber-500/20 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
                    Spesifikasi Rekomendasi
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-400/10 text-amber-400 font-semibold">
                    Setelan High 1080p 60fps
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">OS:</span>
                    <span className="text-slate-200 font-medium text-right">{specs.rec.os}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">Processor:</span>
                    <span className="text-slate-200 font-medium text-right">{specs.rec.cpu}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">RAM:</span>
                    <span className="text-emerald-400 font-bold text-right">{specs.rec.ram}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">Kartu Grafis:</span>
                    <span className="text-slate-200 font-medium text-right">{specs.rec.gpu}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Ruang Simpan:</span>
                    <span className="text-slate-200 font-medium text-right">{specs.rec.storage}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Service Guarantees Pill Matrix */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Keuntungan Membeli di MyGameON:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />
                <span>Link Google Drive Full Speed</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />
                <span>Video Tutorial Download & Ekstrak</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />
                <span>Dipandu Admin WA Jika Bingung</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />
                <span>Bebas Iklan & Shortlink Menipu</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />
                <span>Akses Download GDrive Aktif 1 Tahun</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />
                <span>Bisa Masuk Paket Bundling Hemat</span>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Sticky Bottom Action Bar */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-[#070A0F] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="hidden sm:block text-xs text-slate-400">
            Punya pertanyaan seputar spek? Hubungi admin via WhatsApp untuk konsultasi gratis.
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* Shopee Secondary Action */}
            <a
              href={shopeeUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackClickShopee(title)}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-shopee-orange/40 bg-shopee-orange/10 hover:bg-shopee-orange/20 text-orange-400 hover:text-orange-300 font-bold text-xs sm:text-sm transition-all shadow-sm"
            >
              <ShoppingBag size={16} className="text-shopee-orange" />
              <span>Beli di Toko Shopee</span>
            </a>

            {/* WhatsApp Primary Fast-Lane Action */}
            <a
              href={waOrderUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackClickWhatsApp(title)}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm transition-transform active:scale-95 shadow-lg shadow-emerald-500/25"
            >
              <WhatsAppIcon className="w-5 h-5 fill-current flex-shrink-0" />
              <span>Beli via WhatsApp</span>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};

export default GameDetailModal;
