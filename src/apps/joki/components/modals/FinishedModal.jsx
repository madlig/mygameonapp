import React from 'react';

const formatDateTime = (timestamp) => {
  return new Date(timestamp).toLocaleString("id-ID", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
  });
};

const formatDuration = (hours) => {
  const totalMinutes = Math.round(Number(hours) * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h > 0 && m > 0) return `${h} Jam ${m} Menit`;
  if (h > 0) return `${h} Jam`;
  return `${m} Menit`;
};

const FinishedModal = ({ queue, onClose }) => {
  if (!queue || queue.length === 0) return null;

  const current = queue[0];
  const isStopped = current.finishType === "STOPPED";
  const title = isStopped ? "BILLING DIHENTIKAN" : "BILLING SELESAI";
  const message = isStopped ? `${current.name} SUDAH DI-STOP!` : `${current.name} SUDAH HABIS!`;

  return (
    <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-[1000]">
      <div className="bg-white w-[430px] max-w-[92%] rounded-xl p-6 shadow-2xl text-center animate-[popupShow_0.25s_ease]">
        <div className="text-5xl mb-2">🔔</div>
        <h2 className="text-red-600 mb-2.5 text-2xl font-bold">{title}</h2>
        <div className="text-xl font-bold mb-4">{message}</div>

        <div className="bg-gray-100 rounded-lg p-4 leading-[1.8] text-left">
          <strong>Layanan:</strong> {current.service} <br/>
          <strong>Durasi:</strong> {formatDuration(current.duration)} <br/>
          <strong>Mulai:</strong> {formatDateTime(current.startTime)} <br/>
          <strong>Jam selesai:</strong> {formatDateTime(current.finishedTime)}
        </div>

        <div className="mt-3 text-gray-500 text-sm">
          {queue.length > 1 ? `${queue.length - 1} customer lain menunggu notifikasi.` : ""}
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button 
            onClick={onClose}
            className="bg-blue-600 text-white px-4 py-2 rounded-md font-bold hover:opacity-85"
          >
            ✓ TUTUP
          </button>
        </div>
      </div>
    </div>
  );
};

export default FinishedModal;
