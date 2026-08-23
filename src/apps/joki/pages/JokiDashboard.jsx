import React, { useState, useEffect } from 'react';
import { useJoki } from '../contexts/JokiContext';
import JokiLayout from '../components/layout/JokiLayout';
import JokiHeader from '../components/layout/JokiHeader';
import { StreamerBanner, StreamStatus } from '../components/ui/StreamerBanner';
import JokiSummary from '../components/dashboard/JokiSummary';
import JokiToolbar from '../components/dashboard/JokiToolbar';
import ActiveTable from '../components/dashboard/ActiveTable';
import HistoryTable from '../components/dashboard/HistoryTable';
import AddJokiModal from '../components/modals/AddJokiModal';
import ExtendModal from '../components/modals/ExtendModal';
import FinishedModal from '../components/modals/FinishedModal';

const JokiDashboard = () => {
  const { 
    customers, 
    updateJokiCustomer, 
    globalPaused, 
    updateJokiSettings, 
    deleteJokiCustomer 
  } = useJoki();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [extendCustomer, setExtendCustomer] = useState(null);
  const [finishedQueue, setFinishedQueue] = useState([]);
  const [popupShowing, setPopupShowing] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      checkFinished();
    }, 1000);
    return () => clearInterval(timer);
  }, [customers, globalPaused, popupShowing, finishedQueue]);

  const getRemaining = (customer) => {
    if (customer.finished) return 0;
    if (customer.paused) return Math.max(0, customer.remainingAtPause || 0);
    return Math.max(0, Math.floor((customer.endTime - Date.now()) / 1000));
  };

  const checkFinished = () => {
    const newlyFinished = [];

    customers.forEach(customer => {
      if (customer.finished || customer.paused) return;

      const remaining = getRemaining(customer);
      if (remaining <= 0) {
        newlyFinished.push(customer);
      }
    });

    if (newlyFinished.length > 0) {
      newlyFinished.forEach(async (customer) => {
        await updateJokiCustomer(customer.id, {
          finished: true,
          stopped: false,
          finishedTime: Date.now(),
          paused: false,
          pauseStarted: null,
          remainingAtPause: null
        });
        
        setFinishedQueue(prev => [...prev, { ...customer, finishType: "EXPIRED" }]);
      });
    }

    if (!popupShowing && finishedQueue.length > 0) {
      setPopupShowing(true);
      playNotificationSound();
    }
  };

  const playNotificationSound = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const audioContext = new AudioContext();
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
      console.log("Audio notification tidak tersedia.");
    }
  };

  const handleStopCustomer = async (customer) => {
    if (!window.confirm(`STOP BILLING?\n\nCustomer: ${customer.name}\n\nBilling akan dihentikan.`)) {
      return;
    }
    
    await updateJokiCustomer(customer.id, {
      finished: true,
      stopped: true,
      stopTime: Date.now(),
      finishedTime: Date.now(),
      paused: false,
      pauseStarted: null,
      remainingAtPause: null
    });
    
    setFinishedQueue(prev => [...prev, { ...customer, finishType: "STOPPED" }]);
    if (!popupShowing) {
      setPopupShowing(true);
      playNotificationSound();
    }
  };

  const handleDeleteCustomer = async (customer) => {
    if (!window.confirm(`Hapus data ${customer.name}?`)) {
      return;
    }
    await deleteJokiCustomer(customer.id);
  };

  const handleClearTransactions = async () => {
    if (customers.length === 0) {
      alert("Tidak ada transaksi yang bisa dihapus.");
      return;
    }
    
    if (!window.confirm("⚠️ CLEAR SEMUA TRANSAKSI?\n\nSemua data transaksi akan dihapus dari Firestore.\nTindakan ini TIDAK BISA dibatalkan.")) {
      return;
    }

    await updateJokiSettings({ globalPaused: false, globalPauseStarted: null });
    
    for (const c of customers) {
      await deleteJokiCustomer(c.id);
    }
    
    setFinishedQueue([]);
    setPopupShowing(false);
    alert("✅ Semua transaksi berhasil dibersihkan.");
  };

  const handleCloseFinishedModal = () => {
    setFinishedQueue(prev => prev.slice(1));
    setPopupShowing(false);
  };

  return (
    <JokiLayout>
      <JokiHeader 
        onOpenAddModal={() => setIsAddModalOpen(true)} 
        onClearTransactions={handleClearTransactions}
      />
      <StreamerBanner />
      <StreamStatus />
      <JokiSummary />
      
      <JokiToolbar />
      <ActiveTable 
        onOpenExtendModal={setExtendCustomer}
        onStopCustomer={handleStopCustomer}
        onDeleteCustomer={handleDeleteCustomer}
      />
      <HistoryTable />

      <AddJokiModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />
      
      <ExtendModal 
        customer={extendCustomer} 
        onClose={() => setExtendCustomer(null)} 
      />
      
      {popupShowing && (
        <FinishedModal 
          queue={finishedQueue} 
          onClose={handleCloseFinishedModal} 
        />
      )}
    </JokiLayout>
  );
};

export default JokiDashboard;
