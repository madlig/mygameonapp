import React from 'react';
import Modal from '../../../components/common/Modal';

const formatDate = (date) =>
  date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const VoucherImportModal = ({
  isOpen,
  onClose,
  reports,
  onConfirmImport,
  isImporting = false,
}) => {
  if (!isOpen) return null;

  const totalVoucherCost = reports.reduce(
    (sum, report) => sum + (Number(report.voucherCost) || 0),
    0
  );

  return (
    <Modal onClose={onClose} ariaLabel="Preview Voucher Import">
      <div className="p-6 w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4 text-gray-800">
          Pratinjau Impor Voucher Harian
        </h2>
        <p className="text-sm text-gray-600 mb-2">
          Ditemukan <strong>{reports.length}</strong> data voucher harian dari
          sheet Grafik Kriteria.
        </p>
        <p className="text-sm text-gray-700 mb-4">
          Total voucher:{' '}
          <strong>Rp {totalVoucherCost.toLocaleString('id-ID')}</strong>
        </p>

        <div className="max-h-[60vh] overflow-y-auto border rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Tanggal
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Voucher Cost
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reports.map((report, index) => (
                <tr key={`${report.date?.toISOString?.() || index}-${index}`}>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(report.date)}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-semibold text-green-700">
                    Rp{' '}
                    {(Number(report.voucherCost) || 0).toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isImporting}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={isImporting}
            onClick={() => onConfirmImport(reports)}
            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isImporting ? 'Mengimpor...' : `Impor ${reports.length} Data`}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default VoucherImportModal;
