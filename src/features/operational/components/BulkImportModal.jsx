import React, { useState } from 'react';
import Modal from '../../../components/common/Modal'; // Asumsi Anda punya komponen Modal generik

const BulkImportModal = ({ isOpen, onClose, reports, onConfirmImport }) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirmImport(reports);
    setLoading(false);
    onClose();
  };
  
  if (!isOpen) return null;

  return (
    <Modal onClose={onClose} ariaLabel="Preview Bulk Import">
      <div className="p-6 w-full max-w-6xl"> {/* Perlebar modal */}
        <h2 className="text-xl font-bold mb-4 text-gray-800">Pratinjau Impor Laporan Harian</h2>
        <p className="text-sm text-gray-600 mb-4">
          Ditemukan <strong>{reports.length}</strong> laporan harian dari file yang Anda unggah. Data yang sudah ada di database akan ditimpa.
        </p>

        <div className="max-h-[60vh] overflow-y-auto border rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pendapatan Kotor</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Pesanan</th>
                {/* Kolom Baru */}
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pesanan Batal</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nilai Batal</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pesanan Kembali</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nilai Kembali</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reports.map((report, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                    {report.date ? new Date(report.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric'}) : 'Invalid Date'}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                    Rp {report.grossIncome.toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                    {report.totalOrders}
                  </td>
                  {/* Data Baru */}
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{report.canceledOrders || 0}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">Rp {(report.canceledValue || 0).toLocaleString('id-ID')}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{report.returnedOrders || 0}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">Rp {(report.returnedValue || 0).toLocaleString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading || reports.length === 0}
            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Mengimpor...' : `Impor ${reports.length} Laporan`}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default BulkImportModal;