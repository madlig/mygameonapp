import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import {
  Search,
  Loader2,
  Inbox,
  ListTodo,
  Plus,
  Server,
  Zap,
  FileCheck,
  Archive,
} from 'lucide-react';
import RequestCard from './components/RequestCard';
import ApproveGameModal from './components/ApproveGameModal';
import AddNewRequest from './components/AddNewRequest';
import {
  REQUEST_ADMIN_VISIBLE_STATUSES,
  REQUEST_INBOX_STATUSES,
  REQUEST_QUEUE_STATUSES,
  REQUEST_RESULT_STATUSES,
  REQUEST_STATUS,
} from '../../shared/requestStatus';

const RequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [mainTab, setMainTab] = useState('inbox');
  const [viewFilter, setViewFilter] = useState('all');

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'requests'),
      where('status', 'in', REQUEST_ADMIN_VISIBLE_STATUSES)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const requestsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // --- LOGIKA SORTING BARU (Tanpa priority_score) ---
        const sortedRequests = requestsData.sort((a, b) => {
          // 1. Status Priority untuk flow pembayaran -> upload
          if (
            a.status === REQUEST_STATUS.AWAITING_PAYMENT &&
            b.status !== REQUEST_STATUS.AWAITING_PAYMENT
          )
            return -1;
          if (
            a.status !== REQUEST_STATUS.AWAITING_PAYMENT &&
            b.status === REQUEST_STATUS.AWAITING_PAYMENT
          )
            return 1;

          if (
            a.status === REQUEST_STATUS.PAID &&
            b.status !== REQUEST_STATUS.PAID
          )
            return -1;
          if (
            a.status !== REQUEST_STATUS.PAID &&
            b.status === REQUEST_STATUS.PAID
          )
            return 1;

          if (
            a.status === REQUEST_STATUS.UPLOADED &&
            b.status !== REQUEST_STATUS.UPLOADED
          )
            return -1;
          if (
            a.status !== REQUEST_STATUS.UPLOADED &&
            b.status === REQUEST_STATUS.UPLOADED
          )
            return 1;

          if (
            a.status === REQUEST_STATUS.PROCESSING &&
            b.status !== REQUEST_STATUS.PROCESSING
          )
            return -1;
          if (
            a.status !== REQUEST_STATUS.PROCESSING &&
            b.status === REQUEST_STATUS.PROCESSING
          )
            return 1;

          // 2. Urgent Priority (Boolean Check)
          // Jika A urgent dan B tidak -> A di atas (-1)
          if (a.isUrgent && !b.isUrgent) return -1;
          if (!a.isUrgent && b.isUrgent) return 1;

          // 3. Time Priority (Terbaru di atas)
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime;
        });

        setRequests(sortedRequests);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching requests:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredRequests = requests.filter((req) => {
    const status = req.status || REQUEST_STATUS.PENDING;

    const isInbox =
      mainTab === 'inbox' && REQUEST_INBOX_STATUSES.includes(status);
    const isQueue =
      mainTab === 'queue' && REQUEST_QUEUE_STATUSES.includes(status);
    const isResult =
      mainTab === 'result' && REQUEST_RESULT_STATUSES.includes(status);

    if (!isInbox && !isQueue && !isResult) return false;

    // Search Logic
    const searchLower = searchTerm.toLowerCase();
    const title = (req.title || '').toLowerCase();
    const requester = (req.requesterName || '').toLowerCase();
    const trackingCode = (req.trackingCode || '').toLowerCase();

    const matchSearch =
      title.includes(searchLower) ||
      requester.includes(searchLower) ||
      trackingCode.includes(searchLower);

    if (mainTab === 'queue') {
      if (viewFilter === 'rdp' && !req.isRdpBatch) return false;
      if (viewFilter === 'direct' && req.isRdpBatch) return false;
      if (viewFilter === 'urgent' && !req.isUrgent) return false;
      if (
        viewFilter === 'awaiting_payment' &&
        status !== REQUEST_STATUS.AWAITING_PAYMENT
      )
        return false;
      if (viewFilter === 'ready' && status !== REQUEST_STATUS.UPLOADED)
        return false;
    }

    if (mainTab === 'result') {
      if (viewFilter === 'ready' && status !== REQUEST_STATUS.AVAILABLE)
        return false;
      if (
        viewFilter === 'not_available' &&
        status !== REQUEST_STATUS.NOT_AVAILABLE
      )
        return false;
    }

    return matchSearch;
  });

  const inboxCount = requests.filter((r) =>
    REQUEST_INBOX_STATUSES.includes(r.status || REQUEST_STATUS.PENDING)
  ).length;
  const queueCount = requests.filter((r) =>
    REQUEST_QUEUE_STATUSES.includes(r.status)
  ).length;
  const readyCount = requests.filter(
    (r) => r.status === REQUEST_STATUS.UPLOADED
  ).length;
  const resultCount = requests.filter((r) =>
    REQUEST_RESULT_STATUSES.includes(r.status)
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 mb-1">
              Pusat Request
            </h1>
            <p className="text-slate-500 text-sm">
              Kelola permintaan game, checkout Shopee, dan proses upload.
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg text-sm font-bold flex items-center shadow-lg shadow-slate-200 transition-all active:scale-95"
          >
            <Plus size={18} className="mr-2" />
            Tambah Manual
          </button>
        </div>

        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-600">
          <p className="font-semibold text-slate-800 mb-1">
            Aturan Jalur Upload
          </p>
          <p>
            Direct untuk game &lt;= 20GB (checkout setelah review). Batch RDP
            untuk game &gt; 20GB (checkout dibuka saat slot batch, window 24
            jam).
          </p>
        </div>

        <div className="flex border-b border-slate-200 mb-6 space-x-6 overflow-x-auto">
          <button
            onClick={() => setMainTab('inbox')}
            className={`pb-3 text-sm font-medium flex items-center gap-2 whitespace-nowrap ${mainTab === 'inbox' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}
          >
            <Inbox size={18} /> Permintaan Masuk
            {inboxCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {inboxCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setMainTab('queue')}
            className={`pb-3 text-sm font-medium flex items-center gap-2 whitespace-nowrap ${mainTab === 'queue' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}
          >
            <ListTodo size={18} /> Pembayaran & Upload
            {queueCount > 0 && (
              <span className="bg-slate-200 text-slate-700 text-xs px-2 py-0.5 rounded-full">
                {queueCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setMainTab('result')}
            className={`pb-3 text-sm font-medium flex items-center gap-2 whitespace-nowrap ${mainTab === 'result' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}
          >
            <Archive size={18} /> Hasil Request
            {resultCount > 0 && (
              <span className="bg-slate-200 text-slate-700 text-xs px-2 py-0.5 rounded-full">
                {resultCount}
              </span>
            )}
          </button>
        </div>

        {mainTab === 'queue' && (
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              <button
                onClick={() => setViewFilter('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap ${viewFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}
              >
                Semua
              </button>
              <button
                onClick={() => setViewFilter('rdp')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap flex items-center gap-1 ${viewFilter === 'rdp' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}
              >
                <Server size={12} /> Batch RDP
              </button>
              <button
                onClick={() => setViewFilter('direct')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap ${viewFilter === 'direct' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}
              >
                Direct
              </button>
              <button
                onClick={() => setViewFilter('urgent')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap flex items-center gap-1 ${viewFilter === 'urgent' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}
              >
                <Zap size={12} /> Urgent
              </button>
              <button
                onClick={() => setViewFilter('awaiting_payment')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap ${viewFilter === 'awaiting_payment' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}
              >
                Menunggu Checkout
              </button>
              <button
                onClick={() => setViewFilter('ready')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap flex items-center gap-1 ${viewFilter === 'ready' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}
              >
                <FileCheck size={12} /> Upload Selesai{' '}
                {readyCount > 0 && (
                  <span className="ml-1 bg-emerald-500 text-white px-1.5 rounded-full text-[10px]">
                    {readyCount}
                  </span>
                )}
              </button>
            </div>
            <div className="relative w-full md:w-64">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Cari judul / user / kode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {mainTab === 'result' && (
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              <button
                onClick={() => setViewFilter('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap ${viewFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}
              >
                Semua
              </button>
              <button
                onClick={() => setViewFilter('ready')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap ${viewFilter === 'ready' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}
              >
                Tersedia
              </button>
              <button
                onClick={() => setViewFilter('not_available')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap ${viewFilter === 'not_available' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}
              >
                Tidak Tersedia
              </button>
            </div>

            <div className="relative w-full md:w-64">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Cari judul / user / kode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-blue-600 w-8 h-8" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
            <h3 className="text-slate-900 font-medium mb-1">
              {mainTab === 'inbox'
                ? 'Tidak ada permintaan baru'
                : mainTab === 'queue'
                  ? 'Antrian upload kosong'
                  : 'Belum ada hasil request'}
            </h3>
            <p className="text-slate-500 text-sm">
              Data yang sesuai filter tidak ditemukan.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredRequests.map((req) => (
              <RequestCard
                key={req.id}
                request={req}
                onApproveClick={(r) => {
                  setSelectedRequest(r);
                  setIsApproveModalOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {isApproveModalOpen && selectedRequest && (
        <ApproveGameModal
          request={selectedRequest}
          onClose={() => setIsApproveModalOpen(false)}
          onSuccess={() => {}}
        />
      )}
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
