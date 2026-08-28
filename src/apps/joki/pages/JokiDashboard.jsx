import React, { useState, useEffect, useRef } from 'react';
import { useJoki } from '../contexts/JokiContext';
import JokiLayout from '../components/layout/JokiLayout';
import JokiHeader from '../components/layout/JokiHeader';
import { StreamerBanner, StreamStatus } from '../components/ui/StreamerBanner';
import JokiSummary from '../components/dashboard/JokiSummary';
import JokiToolbar from '../components/dashboard/JokiToolbar';
import ActiveTable from '../components/dashboard/ActiveTable';
import HistoryTable from '../components/dashboard/HistoryTable';
import QueueSidebar from '../components/dashboard/QueueSidebar';
import AddJokiModal from '../components/modals/AddJokiModal';
import ExtendModal from '../components/modals/ExtendModal';
import StartBillingModal from '../components/modals/StartBillingModal';
import FinishedModal from '../components/modals/FinishedModal';
import ConfirmModal from '../components/modals/ConfirmModal';
import JokiLoginModal from '../components/modals/JokiLoginModal';
import ManageAdminsModal from '../components/modals/ManageAdminsModal';
import JokiSettingsModal from '../components/modals/JokiSettingsModal';
import EditBillingModal from '../components/modals/EditBillingModal';
import SecretVaultModal from '../components/modals/SecretVaultModal';
import Toast from '../components/ui/Toast';

const JokiDashboard = () => {
  const { 
    customers, 
    queue,
    updateJokiCustomer, 
    deleteJokiCustomer,
    deleteJokiQueue,
    moveCustomerToQueue,
    updateJokiSettings, 
    globalPaused, 
    toasts,
    addToast,
    removeToast,
    isAdmin,
    isSuperAdmin
  } = useJoki();

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isManageAdminsOpen, setIsManageAdminsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSecretVaultOpen, setIsSecretVaultOpen] = useState(false);
  const [extendCustomer, setExtendCustomer] = useState(null);
  const [editCustomer, setEditCustomer] = useState(null);
  const [startQueueItem, setStartQueueItem] = useState(null);
  const [finishedQueue, setFinishedQueue] = useState([]);
  const [popupShowing, setPopupShowing] = useState(false);

  // Global Shortcut Listener for Secret Master Vault (Ctrl + Shift + V)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        setIsSecretVaultOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Set Document Title
  useEffect(() => {
    document.title = "Dashboard Joki Steal an Egg — BY PT.KADAL GAMING";
  }, []);

  // Confirm Modal state
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    detail: null,
    confirmText: 'Konfirmasi',
    cancelText: 'Batal',
    variant: 'danger',
    onConfirm: () => {},
  });

  const closeConfirm = () => {
    setConfirmConfig(prev => ({ ...prev, isOpen: false }));
  };

  // Sound Player
  const playNotificationSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const audioContext = new AudioCtx();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.type = "sine";
      oscillator.frequency.value = 850;
      
      gain.gain.setValueAtTime(0.001, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.2, audioContext.currentTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.6);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.6);
    } catch (error) {
      console.log("Audio notification tidak tersedia:", error);
    }
  };

  // Anti-Race Condition Set for Expired Timers
  const processedFinishedRef = useRef(new Set());

  // Timer: Check for Finished Billing (Marks isPendingClearance without deleting from active table)
  useEffect(() => {
    const timer = setInterval(() => {
      const newlyFinished = [];

      customers.forEach(customer => {
        if (customer.finished || customer.isPendingClearance || customer.paused || processedFinishedRef.current.has(customer.id)) return;

        const remaining = Math.max(0, Math.floor((customer.endTime - Date.now()) / 1000));
        if (remaining <= 0) {
          processedFinishedRef.current.add(customer.id);
          newlyFinished.push(customer);
        }
      });

      if (newlyFinished.length > 0) {
        newlyFinished.forEach(async (customer) => {
          // Keep customer in active table with isPendingClearance: true & finishedTime
          await updateJokiCustomer(customer.id, {
            isPendingClearance: true,
            finishedTime: Date.now(),
            paused: false,
            pauseStarted: null,
            remainingAtPause: null
          });
          
          setFinishedQueue(prev => [...prev, { ...customer, finishType: "EXPIRED" }]);
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [customers]);

  // Process Finished Popups
  useEffect(() => {
    if (!popupShowing && finishedQueue.length > 0) {
      setPopupShowing(true);
      playNotificationSound();
    }
  }, [finishedQueue, popupShowing]);

  const handleCloseFinishedModal = () => {
    setFinishedQueue(prev => prev.slice(1));
    setPopupShowing(false);
  };

  // ── Actions with Custom Confirmation Modals ──

  // 1. Pause All (Parallelized)
  const handleRequestPauseAll = () => {
    const active = customers.filter(c => !c.finished && !c.paused);
    if (active.length === 0) {
      addToast('Tidak ada billing aktif yang sedang berjalan.', 'info');
      return;
    }

    setConfirmConfig({
      isOpen: true,
      title: 'Jeda Semua Billing (PAUSE ALL)?',
      message: `Semua ${active.length} customer aktif akan dihentikan sementara. Sisa durasi waktu customer tidak akan berkurang.`,
      detail: active.map(c => `• ${c.username || c.name} (Slot: ${c.slot || '-'} | ${c.service})`).join('\n'),
      confirmText: 'Jeda Semua',
      variant: 'warning',
      onConfirm: async () => {
        closeConfirm();
        const now = Date.now();
        await updateJokiSettings({ globalPaused: true, globalPauseStarted: now });
        
        await Promise.all(active.map(customer => {
          const remaining = Math.max(0, Math.floor((customer.endTime - now) / 1000));
          return updateJokiCustomer(customer.id, {
            remainingAtPause: remaining,
            pauseStarted: now,
            paused: true
          });
        }));

        addToast('Semua billing berhasil di-pause!', 'success');
      }
    });
  };

  // 2. Resume All (Parallelized)
  const handleRequestResumeAll = () => {
    const paused = customers.filter(c => c.paused && !c.finished);
    if (paused.length === 0) {
      addToast('Tidak ada billing yang sedang di-pause.', 'info');
      return;
    }

    setConfirmConfig({
      isOpen: true,
      title: 'Lanjutkan Semua Billing (RESUME ALL)?',
      message: `${paused.length} customer yang dijeda akan mulai dihitung kembali durasi waktunya dan jam selesai akan disesuaikan maju.`,
      detail: paused.map(c => `• ${c.username || c.name} (Slot: ${c.slot || '-'} | ${c.service})`).join('\n'),
      confirmText: 'Lanjutkan Semua',
      variant: 'info',
      onConfirm: async () => {
        closeConfirm();
        const now = Date.now();
        await updateJokiSettings({ globalPaused: false, globalPauseStarted: null });

        await Promise.all(paused.map(customer => {
          const pauseDuration = Math.max(0, Math.floor((now - (customer.pauseStarted || now)) / 1000));
          const newEndTime = now + ((customer.remainingAtPause || 0) * 1000);
          return updateJokiCustomer(customer.id, {
            totalPausedSeconds: (customer.totalPausedSeconds || 0) + pauseDuration,
            endTime: newEndTime,
            paused: false,
            pauseStarted: null,
            remainingAtPause: null
          });
        }));

        addToast('Semua billing berhasil dilanjutkan! Jam selesai telah diperbarui.', 'success');
      }
    });
  };

  // 3. Stop Customer
  const handleRequestStopCustomer = (customer) => {
    const custName = customer.username || customer.name;
    setConfirmConfig({
      isOpen: true,
      title: `Hentikan Billing ${custName}?`,
      message: `Billing untuk akun ${custName} (Slot ${customer.slot || '-'}) akan diselesaikan sekarang.`,
      confirmText: 'Hentikan Sekarang',
      variant: 'danger',
      onConfirm: async () => {
        closeConfirm();
        const now = Date.now();
        await updateJokiCustomer(customer.id, {
          finished: true,
          stopped: true,
          stopTime: now,
          finishedTime: now,
          paused: false,
          pauseStarted: null,
          remainingAtPause: null
        });

        setFinishedQueue(prev => [...prev, { ...customer, finishType: "STOPPED" }]);
        addToast(`Billing ${custName} dihentikan.`, 'info');
      }
    });
  };

  // 4. Delete Customer
  const handleRequestDeleteCustomer = (customer) => {
    const custName = customer.username || customer.name;
    setConfirmConfig({
      isOpen: true,
      title: `Hapus Data ${custName}?`,
      message: `Data transaksi ini akan dihapus permanen dari sistem database Firestore.`,
      confirmText: 'Hapus Data',
      variant: 'danger',
      onConfirm: async () => {
        closeConfirm();
        await deleteJokiCustomer(customer.id);
        addToast(`Data ${custName} berhasil dihapus.`, 'success');
      }
    });
  };

  // 5. Clear Active Billings Only
  const handleRequestClearActiveBillings = () => {
    const active = customers.filter(c => !c.finished);
    if (active.length === 0) {
      addToast('Tidak ada billing aktif yang bisa dikosongkan.', 'info');
      return;
    }

    setConfirmConfig({
      isOpen: true,
      title: 'Kosongkan Semua Billing Aktif?',
      message: `Tindakan ini akan menghapus ${active.length} customer yang sedang berjalan / pause. Riwayat joki selesai & data omzet TETAP aman tersimpan.`,
      confirmText: 'Kosongkan Billing Aktif',
      variant: 'warning',
      onConfirm: async () => {
        closeConfirm();
        await updateJokiSettings({ globalPaused: false, globalPauseStarted: null });
        for (const c of active) {
          await deleteJokiCustomer(c.id);
        }
        addToast('Billing aktif berhasil dikosongkan. Riwayat tetap tersimpan aman.', 'success');
      }
    });
  };

  // 6. Clear All Transactions
  const handleRequestClearTransactions = () => {
    if (customers.length === 0) {
      addToast('Tidak ada transaksi di database.', 'info');
      return;
    }

    setConfirmConfig({
      isOpen: true,
      title: 'HAPUS SEMUA DATA TRANSAKSI?',
      message: `Tindakan ini akan menghapus SELURUH ${customers.length} data joki (baik antrean aktif maupun riwayat selesai) dari database Firestore. Tindakan ini TIDAK BISA dibatalkan.`,
      confirmText: 'Hapus Seluruh Database',
      variant: 'danger',
      onConfirm: async () => {
        closeConfirm();
        await updateJokiSettings({ globalPaused: false, globalPauseStarted: null });
        for (const c of customers) {
          await deleteJokiCustomer(c.id);
        }
        setFinishedQueue([]);
        setPopupShowing(false);
        addToast('Seluruh data transaksi berhasil dibersihkan.', 'success');
      }
    });
  };

  // 7. Clear All Queue
  const handleRequestClearQueue = () => {
    if (queue.length === 0) {
      addToast('Antrian sudah kosong.', 'info');
      return;
    }

    setConfirmConfig({
      isOpen: true,
      title: 'Kosongkan Semua Antrian?',
      message: `Semua ${queue.length} customer di daftar antrian akan dihapus.`,
      confirmText: 'Kosongkan Antrian',
      variant: 'danger',
      onConfirm: async () => {
        closeConfirm();
        for (const item of queue) {
          await deleteJokiQueue(item.id);
        }
        addToast('Daftar antrian berhasil dikosongkan.', 'success');
      }
    });
  };

  // 8. Move Active Customer back to Queue (Free up duplicate slot)
  const handleRequestMoveToQueue = (customer) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Kembalikan ke Antrian?',
      message: `Customer ${customer.username || customer.name} (Slot ${customer.slot}) akan dipindahkan kembali ke daftar Antrian dengan sisa durasinya. Slot ${customer.slot} akan langsung dikosongkan.`,
      confirmText: 'Kembalikan ke Antrian',
      variant: 'warning',
      onConfirm: async () => {
        closeConfirm();
        await moveCustomerToQueue(customer);
      }
    });
  };

  return (
    <JokiLayout>
      {/* Header */}
      <JokiHeader
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onOpenManageAdminsModal={() => setIsManageAdminsOpen(true)}
        onOpenSettingsModal={() => setIsSettingsOpen(true)}
        onRequestPauseAll={handleRequestPauseAll}
        onRequestResumeAll={handleRequestResumeAll}
      />

      {/* Stream Status Banners */}
      <StreamerBanner onOpenSettings={() => setIsSettingsOpen(true)} />
      <StreamStatus />

      {/* Metric Summary Cards (Admin Only) */}
      <JokiSummary />

      {/* Main Split Deck (60 : 40 Sejajar): Active Table (Left 60%) + Queue Sidebar (Right 40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start mb-6">
        {/* Left Column: Active Table (60% / 7 cols) */}
        <div className="w-full lg:col-span-7 xl:col-span-7 space-y-3 min-w-0">
          <JokiToolbar />
          <ActiveTable
            onOpenExtendModal={setExtendCustomer}
            onOpenEditModal={setEditCustomer}
            onRequestMoveToQueue={handleRequestMoveToQueue}
            onRequestStopCustomer={handleRequestStopCustomer}
            onRequestClearActiveBillings={handleRequestClearActiveBillings}
            onStartQueueItem={setStartQueueItem}
          />
        </div>

        {/* Right Column: Queue Sidebar (40% / 5 cols) */}
        <div className="w-full lg:col-span-5 xl:col-span-5 min-w-0">
          <QueueSidebar
            onStartFromQueue={setStartQueueItem}
            onRequestClearQueue={handleRequestClearQueue}
          />
        </div>
      </div>

      {/* Bottom Area (100% Full Width): History Table & Leaderboard */}
      <div className="w-full mb-8">
        <HistoryTable />
      </div>

      {/* Modals */}
      <AddJokiModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      <ExtendModal
        customer={extendCustomer}
        onClose={() => setExtendCustomer(null)}
      />

      <EditBillingModal
        customer={editCustomer}
        onClose={() => setEditCustomer(null)}
      />

      <StartBillingModal
        queueItem={startQueueItem}
        onClose={() => setStartQueueItem(null)}
      />

      <JokiLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={() => addToast('Berhasil login sebagai Admin!', 'success')}
      />

      <ManageAdminsModal
        isOpen={isManageAdminsOpen}
        onClose={() => setIsManageAdminsOpen(false)}
      />

      <JokiSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <SecretVaultModal
        isOpen={isSecretVaultOpen}
        onClose={() => setIsSecretVaultOpen(false)}
      />

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        detail={confirmConfig.detail}
        confirmText={confirmConfig.confirmText}
        cancelText={confirmConfig.cancelText}
        variant={confirmConfig.variant}
        onConfirm={confirmConfig.onConfirm}
        onCancel={closeConfirm}
      />

      {popupShowing && (
        <FinishedModal
          queue={finishedQueue}
          onClose={handleCloseFinishedModal}
        />
      )}

      {/* Custom Toast System */}
      <Toast toasts={toasts} onDismiss={removeToast} />
    </JokiLayout>
  );
};

export default JokiDashboard;
