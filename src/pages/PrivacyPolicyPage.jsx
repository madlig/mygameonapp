import React from 'react';
import PageShell from '../features/landing/components/PageShell';
import Seo from '../components/common/Seo';
import { ShieldCheck, Mail, Lock, UserCheck } from 'lucide-react';

const PrivacyPolicyPage = () => {
  return (
    <PageShell title="Kebijakan Privasi (Privacy Policy)">
      <Seo
        title="Kebijakan Privasi — MyGameON"
        description="Kebijakan privasi resmi MyGameON terkait penggunaan data akun, autentikasi Google, dan keamanan informasi pelanggan."
      />

      <div className="space-y-8 text-sm text-slate-300 leading-relaxed max-w-3xl mx-auto">
        {/* Header summary */}
        <div className="p-6 rounded-2xl bg-[#0B0F17] border border-white/10 flex items-start gap-4 shadow-xl">
          <div className="w-12 h-12 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center shrink-0">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-white mb-1">
              Kebijakan Privasi MyGameON
            </h1>
            <p className="text-xs text-slate-400">
              Terakhir diperbarui: September 2026 • Berlaku untuk seluruh layanan di <strong>mygameon.store</strong>
            </p>
          </div>
        </div>

        {/* Section 1: Pendahuluan */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-1.5 h-4 bg-amber-400 rounded-full" />
            1. Pendahuluan
          </h2>
          <p>
            MyGameON menghargai dan berkomitmen penuh untuk melindungi privasi setiap pengguna, pelanggan, dan pengunjung website kami di <strong>https://mygameon.store</strong>. Dokumen Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi data pribadi Anda saat menggunakan layanan kami, termasuk saat melakukan autentikasi melalui Google Sign-In.
          </p>
        </section>

        {/* Section 2: Data yang Kami Kumpulkan */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-1.5 h-4 bg-amber-400 rounded-full" />
            2. Data yang Kami Kumpulkan
          </h2>
          <p>
            Saat Anda menggunakan fitur autentikasi Google Sign-In atau mendaftar akun di MyGameON, kami hanya mengumpulkan informasi dasar non-sensitif sebagai berikut:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-300">
            <li>
              <strong>Alamat Email:</strong> Digunakan sebagai identitas unik akun Anda dan untuk memverifikasi hak akses folder Google Drive game yang Anda pesan.
            </li>
            <li>
              <strong>Nama Lengkap / Profil:</strong> Nama tampilan publik yang disediakan oleh akun Google Anda untuk personalisasi antarmuka pengguna.
            </li>
            <li>
              <strong>Foto Profil (Avatar):</strong> Foto profil publik Google Anda untuk kenyamanan visual di header akun.
            </li>
            <li>
              <strong>Username Shopee (Opsional):</strong> Data yang Anda berikan secara sukarela untuk mempermudah sinkronisasi otomatis antara nomor invoice pesanan Shopee Anda dengan brankas cloud MyGameON.
            </li>
          </ul>
        </section>

        {/* Section 3: Penggunaan Data */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-1.5 h-4 bg-amber-400 rounded-full" />
            3. Tujuan Penggunaan Informasi
          </h2>
          <p>Kami menggunakan informasi yang dikumpulkan hanya untuk keperluan operasional layanan:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-4 rounded-xl bg-[#090C12] border border-white/5">
              <h4 className="font-bold text-white text-xs mb-1 flex items-center gap-1.5">
                <UserCheck size={14} className="text-emerald-400" /> Akses Game Cloud
              </h4>
              <p className="text-xs text-slate-400">
                Memberikan tautan langsung ke folder Google Drive resmi untuk game yang telah Anda beli tanpa gangguan iklan.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#090C12] border border-white/5">
              <h4 className="font-bold text-white text-xs mb-1 flex items-center gap-1.5">
                <Lock size={14} className="text-amber-400" /> Keamanan & Garansi
              </h4>
              <p className="text-xs text-slate-400">
                Memverifikasi keaslian pembeli guna mengaktifkan garansi purnajual jika terjadi kendala instalasi atau link mati.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: Pembagian Data Pihak Ketiga */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-1.5 h-4 bg-amber-400 rounded-full" />
            4. Perlindungan & Pembagian Data
          </h2>
          <p>
            <strong>Kami TIDAK PERNAH menjual, menyewakan, memperjualbelikan, atau membagikan data pribadi Anda</strong> kepada pihak ketiga mana pun, biro iklan, maupun pihak eksternal lainnya untuk tujuan komersial. Data Anda hanya disimpan secara terenkripsi menggunakan infrastruktur aman Google Firebase.
          </p>
        </section>

        {/* Section 5: Penghapusan Data */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-1.5 h-4 bg-amber-400 rounded-full" />
            5. Hak Pengguna &amp; Permintaan Penghapusan Data
          </h2>
          <p>
            Anda memiliki hak penuh untuk meminta penutupan akun atau penghapusan seluruh riwayat data profil Anda dari sistem database kami. Untuk mengajukan permintaan penghapusan data, silakan hubungi tim kami melalui kontak di bawah.
          </p>
        </section>

        {/* Section 6: Kontak Kami */}
        <section className="p-5 rounded-2xl bg-[#0B0F17] border border-white/10 space-y-2">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Mail size={16} className="text-amber-400" /> Kontak Resmi Layanan
          </h2>
          <p className="text-xs text-slate-300">
            Jika Anda memiliki pertanyaan mengenai Kebijakan Privasi ini atau pengelolaan data Anda, silakan hubungi kami di:
          </p>
          <div className="text-xs text-slate-300 space-y-1 font-mono">
            <p>• Email: <strong>support@mygameon.store</strong> / <strong>madlighifari29@gmail.com</strong></p>
            <p>• Website: <strong>https://mygameon.store</strong></p>
            <p>• WhatsApp Resmi: <strong>+62 851-2130-9829</strong></p>
          </div>
        </section>
      </div>
    </PageShell>
  );
};

export default PrivacyPolicyPage;
