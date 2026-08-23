import React, { useState, useEffect } from 'react';
import { useJoki } from '../../contexts/JokiContext';

const PRICE_BASIC = 4000;
const PRICE_VIP = 6000;

const ExtendModal = ({ customer, onClose }) => {
  const { updateJokiCustomer } = useJoki();
  const [amount, setAmount] = useState(1);
  const [unit, setUnit] = useState('minute');

  useEffect(() => {
    if (customer) {
      setAmount(1);
      setUnit('minute');
    }
  }, [customer]);

  if (!customer) return null;

  const handleSave = async () => {
    if (!amount || amount <= 0) {
      alert("Jumlah waktu harus lebih dari 0.");
      return;
    }

    if (customer.finished) {
      alert("Billing sudah selesai.");
      onClose();
      return;
    }

    let seconds = unit === 'hour' ? amount * 3600 : amount * 60;
    
    let updates = {};
    if (customer.paused) {
      updates.remainingAtPause = customer.remainingAtPause + seconds;
    } else {
      updates.endTime = customer.endTime + (seconds * 1000);
    }

    updates.duration = customer.duration + (seconds / 3600);
    
    const pricePerHour = customer.service === 'VIP' ? PRICE_VIP : PRICE_BASIC;
    updates.price = customer.price + (pricePerHour * (seconds / 3600));

    await updateJokiCustomer(customer.id, updates);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-[1000]">
      <div className="bg-white w-[430px] max-w-[92%] rounded-xl p-6 shadow-2xl">
        <h2 className="mt-0 mb-5 text-2xl font-bold">⏱ Tambah Waktu</h2>
        <div className="mb-2 font-bold text-gray-700">Untuk: {customer.name}</div>

        <div className="mb-4">
          <label className="block mb-1.5 text-sm font-bold">Jumlah</label>
          <input 
            type="number" min="1" step="1"
            className="w-full p-2.5 border border-slate-300 rounded-md text-sm outline-none"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1.5 text-sm font-bold">Satuan</label>
          <select 
            className="w-full p-2.5 border border-slate-300 rounded-md text-sm outline-none"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
          >
            <option value="minute">Menit</option>
            <option value="hour">Jam</option>
          </select>
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

export default ExtendModal;
