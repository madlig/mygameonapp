import React from 'react';
import Modal from '../../../components/common/Modal'; // Pastikan path ini benar

const VoucherImportModal = ({ isOpen, onClose, reports, onConfirmImport }) => {
  if (!isOpen) return null;

  return (
    <Modal onClose={onClose} ariaLabel="Preview Voucher Import">
      <div className="p-6 w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Pratinjau Impor Biaya Voucher</h2>
        <p className="text-sm text-gray-600 mb-4">
          Ditemukan <strong>{reports.length}</strong> data biaya voucher harian. Data yang ada akan ditimpa.
        </p>

        <div className="max-h-[60vh] overflow-y-auto border rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Biaya Voucher</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reports.map((report, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                    {report.date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric'})}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-semibold text-green-700">
                    Rp {report.voucherCost.toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
            Batal
          </button>
          <button
            type="button"
            onClick={() => onConfirmImport(reports)}
            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700"
          >
            Impor {reports.length} Data
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default VoucherImportModal;