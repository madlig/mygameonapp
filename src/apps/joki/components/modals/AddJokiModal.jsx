import React, { useState, useEffect } from 'react';
import { useJoki } from '../../contexts/JokiContext';

const PRICE_BASIC = 4000;
const PRICE_VIP = 6000;

const AddJokiModal = ({ isOpen, onClose }) => {
  const { addJokiCustomer, globalPaused } = useJoki();
  const [name, setName] = useState('');
  const [service, setService] = useState('Basic');
  const [duration, setDuration] = useState(1);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setService('Basic');
      setDuration(1);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!name.trim()) {
      alert("Nama customer wajib diisi.");
      return;
    }
    if (!duration || duration <= 0) {
      alert("Durasi harus lebih dari 0.");
      return;
    }

    const now = Date.now();
    const durationSeconds = duration * 3600;
    const pricePerHour = service === 'VIP' ? PRICE_VIP : PRICE_BASIC;

    const customer = {
      name: name.trim(),
      service,
      duration: Number(duration),
      price: Number(duration) * pricePerHour,
      startTime: now,
      endTime: now + (durationSeconds * 1000),
      paused: false,
      pauseStarted: null,
      remainingAtPause: null,
      totalPausedSeconds: 0,
      finished: false,
      stopped: false,
      stopTime: null,
      finishedTime: null
    };

    if (globalPaused) {
      customer.paused = true;
      customer.pauseStarted = now;
      customer.remainingAtPause = durationSeconds;
    }

    await addJokiCustomer(customer);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-[1000]">
      <div className="bg-white w-[430px] max-w-[92%] rounded-xl p-6 shadow-2xl">
        <h2 className="mt-0 mb-5 text-2xl font-bold">Tambah Joki</h2>

        <div className="mb-4">
          <label className="block mb-1.5 text-sm font-bold">Nama Customer</label>
          <input 
            type="text" 
            className="w-full p-2.5 border border-slate-300 rounded-md text-sm outline-none"
            placeholder="Contoh: Budi"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            autoFocus
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1.5 text-sm font-bold">Layanan</label>
          <select 
            className="w-full p-2.5 border border-slate-300 rounded-md text-sm outline-none"
            value={service}
            onChange={(e) => setService(e.target.value)}
          >
            <option value="Basic">Basic — Rp4.000 / Jam</option>
            <option value="VIP">VIP — Rp6.000 / Jam</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block mb-1.5 text-sm font-bold">Durasi</label>
          <input 
            type="number" 
            min="0.01" step="0.01"
            className="w-full p-2.5 border border-slate-300 rounded-md text-sm outline-none"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
          <small className="block mt-1.5 text-gray-500">
            Contoh: 0.5 = 30 menit, 0.25 = 15 menit, 0.01 ≈ 1 menit
          </small>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button 
            onClick={onClose}
            className="bg-gray-200 px-4 py-2 rounded-md font-bold hover:opacity-85"
          >
            Batal
          </button>
          <button 
            onClick={handleSave}
            className="bg-blue-600 text-white px-4 py-2 rounded-md font-bold hover:opacity-85"
          >
            Tambahkan
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddJokiModal;
