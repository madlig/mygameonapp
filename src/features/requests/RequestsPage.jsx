// src/features/requests/RequestsPage.jsx
//
// Admin request management — simplified flow.
// 2 tabs: Active (pending → reviewing → processing) and Done (completed/rejected).
// Dark+colorful theme.

import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import {
  Search,
  Loader2,
  Inbox,
  Archive,
  Plus,
  PackageSearch,
  Server,
} from 'lucide-react';
import RequestCard from './components/RequestCard';
import AddNewRequest from './components/AddNewRequest';
import {
  REQUEST_ALL_STATUSES,
  REQUEST_ACTIVE_STATUSES,
  REQUEST_FINAL_STATUSES,
  REQUEST_STATUS,
  normalizeStatus,
} from '../../shared/requestStatus';

const RequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [mainTab, setMainTab] = useState('active');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'reviewing' | 'processing' | 'queued' | 'rdp'
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Reset search & sub-filter when switching tabs
  useEffect(() => {
    setSearchTerm('');
    setActiveFilter('all');
  }, [mainTab]);

  // ── Real-time listener ──
  useEffect(() => {
    const q = query(
      collection(db, 'requests'),
      where('status', 'in', REQUEST_ALL_STATUSES)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          // Normalize legacy statuses
          status: normalizeStatus(d.data().status),
        }));

        // Sort: newest first, with votes as secondary
        data.sort((a, b) => {
          // Higher votes first
          if ((b.votes || 0) !== (a.votes || 0)) {
            return (b.votes || 0) - (a.votes || 0);
          }
          return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
        });

        setRequests(data);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching requests:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // ── Counts ──
  const counts = useMemo(() => {
    const active = requests.filter((r) =>
      REQUEST_ACTIVE_STATUSES.includes(r.status)
    ).length;
    const done = requests.filter((r) =>
      REQUEST_FINAL_STATUSES.includes(r.status)
    ).length;
    return { active, done };
  }, [requests]);

  // ── Filtered list ──
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const statusList =
        mainTab === 'active' ? REQUEST_ACTIVE_STATUSES : REQUEST_FINAL_STATUSES;
      if (!statusList.includes(req.status)) return false;

      // Sub-filter for active tab
      if (mainTab === 'active' && activeFilter !== 'all') {
        if (activeFilter === 'rdp') {
          if (!req.needsRdp && req.status !== REQUEST_STATUS.QUEUED) return false;
        } else if (activeFilter === 'reviewing') {
          if (req.status !== REQUEST_STATUS.REVIEWING) return false;
        } else if (activeFilter === 'processing') {
          if (req.status !== REQUEST_STATUS.PROCESSING) return false;
        } else if (activeFilter === 'queued') {
          if (req.status !== REQUEST_STATUS.QUEUED) return false;
        }
      }

      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        const match =
          (req.title || '').toLowerCase().includes(s) ||
          (req.requesterName || '').toLowerCase().includes(s) ||
          (req.trackingCode || '').toLowerCase().includes(s);
        if (!match) return false;
      }

      return true;
    });
  }, [requests, mainTab, searchTerm, activeFilter]);

  // ── Tab definitions ──
  const tabs = [
    {
      key: 'active',
      label: 'Aktif',
      icon: Inbox,
      count: counts.active,
    },
    {
      key: 'done',
      label: 'Selesai',
      icon: Archive,
      count: counts.done,
    },
  ];

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#F3F4F6] mb-1">
              Request Game
            </h1>
            <p className="text-[#7E8796] text-sm">
              Review request → upload file → finalisasi ke katalog.
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#FFD100] hover:bg-[#FFD100]/90 text-[#111317] px-4 py-2.5 rounded-lg text-sm font-bold flex items-center transition-all active:scale-95"
          >
            <Plus size={18} className="mr-2" />
            Tambah Manual
          </button>
        </div>

        {/* ── Tabs + Search ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-end gap-3">
            <div className="flex border-b border-[#2A2F39] gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = mainTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setMainTab(tab.key)}
                    className={`pb-3 px-4 text-sm font-medium flex items-center gap-2 whitespace-nowrap transition-colors border-b-2 ${
                      active
                        ? 'text-[#FFD100] border-[#FFD100]'
                        : 'text-[#7E8796] border-transparent hover:text-[#C8CFDA]'
                    }`}
                  >
                    <Icon size={16} />
                    {tab.label}
                    {tab.count > 0 && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          tab.key === 'active' && tab.count > 0
                            ? 'bg-[#FFD100]/15 text-[#FFD100]'
                            : 'bg-[#2A2F39] text-[#C8CFDA]'
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Sub-filter chips */}
            {mainTab === 'active' && (
              <div className="flex items-center gap-1.5 mb-1">
                {[
                  { key: 'all', label: 'Semua', color: 'yellow' },
                  { key: 'reviewing', label: 'Review', color: 'indigo' },
                  { key: 'queued', label: 'Antrian', color: 'violet' },
                  { key: 'processing', label: 'Upload', color: 'blue' },
                  { key: 'rdp', label: 'RDP', color: 'violet', icon: true },
                ].map((chip) => {
                  const isActive = activeFilter === chip.key;
                  const colorMap = {
                    yellow: isActive
                      ? 'bg-[#FFD100]/15 text-[#FFD100] border-[#FFD100]/40'
                      : '',
                    indigo: isActive
                      ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40'
                      : '',
                    violet: isActive
                      ? 'bg-violet-500/20 text-violet-400 border-violet-500/40'
                      : '',
                    blue: isActive
                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                      : '',
                  };
                  return (
                    <button
                      key={chip.key}
                      onClick={() =>
                        setActiveFilter((v) =>
                          v === chip.key ? 'all' : chip.key
                        )
                      }
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-md flex items-center gap-1 transition-all border ${
                        isActive
                          ? colorMap[chip.color]
                          : 'bg-[#1A1F27] text-[#7E8796] border-[#2A2F39] hover:text-[#C8CFDA] hover:border-[#3A3F49]'
                      }`}
                    >
                      {chip.icon && <Server size={11} />}
                      {chip.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="relative w-full sm:w-72">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A5568]"
              size={16}
            />
            <input
              type="text"
              placeholder="Cari judul / nama / kode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-[#1A1F27] border border-[#2A2F39] text-[#C8CFDA] placeholder-[#4A5568] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD100]/40 focus:border-[#FFD100]/50 transition-colors"
            />
          </div>
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-[#FFD100] w-8 h-8" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-20 bg-[#1A1F27] rounded-xl border border-dashed border-[#2A2F39]">
            <PackageSearch size={40} className="mx-auto text-[#4A5568] mb-3" />
            <h3 className="text-[#C8CFDA] font-medium mb-1">
              {mainTab === 'active'
                ? 'Tidak ada request aktif'
                : 'Belum ada request selesai'}
            </h3>
            <p className="text-[#7E8796] text-sm">
              {searchTerm
                ? `Tidak ditemukan hasil untuk "${searchTerm}"`
                : mainTab === 'active'
                  ? 'Request baru dari customer akan muncul di sini.'
                  : 'Request yang sudah diproses akan muncul di sini.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredRequests.map((req) => (
              <RequestCard key={req.id} request={req} />
            ))}
          </div>
        )}
      </div>

      {/* ── Add modal ── */}
      {isAddModalOpen && (
        <AddNewRequest
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
};

export default RequestsPage;
