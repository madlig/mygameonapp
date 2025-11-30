// src/features/operational/components/AllocationPreviewModal.jsx
import React from 'react';
import Modal from '../../../components/common/Modal';
import { formatCurrency } from '../../../utils/numberUtils';

const AllocationPreviewModal = ({
  isOpen,
  onClose,
  allocationData = [],
  onConfirm,
  title = 'Pratinjau Alokasi',
  totalCost = 0
}) => {
  if (!isOpen) return null;

  const rows = Array.isArray(allocationData) ? allocationData : [];
  const totalGross = rows.reduce((s, r) => s + (Number(r.grossIncome) || 0), 0);
  const totalAllocatedFromRows = rows.reduce((s, r) => s + (Number(r.allocatedCost) || 0), 0);

  const fmt = (v, opts) => formatCurrency(v, opts);

  return (
    <Modal onClose={onClose} ariaLabel={`${title} Allocation Preview`}>
      <div className="p-6 w-full max-w-4xl">
        <h2 className="text-xl font-bold mb-2 text-gray-800">{title}</h2>
        <p className="text-sm text-gray-600 mb-4">
          Total biaya sebesar <strong>Rp {fmt(totalCost)}</strong> akan dialokasikan secara proporsional berdasarkan pendapatan harian.
        </p>

        <div className="max-h-[60vh] overflow-y-auto border rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pendapatan Kotor</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Bobot (%)</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Alokasi Biaya</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rows.map((item, index) => {
                // safe date
                let dateObj = null;
                if (item.date instanceof Date) dateObj = item.date;
                else if (typeof item.date === 'string' || typeof item.date === 'number') {
                  const d = new Date(item.date);
                  if (!isNaN(d.getTime())) dateObj = d;
                }

                const gross = Number(item.grossIncome) || 0;
                // prefer explicit weight if numeric
                let weight = null;
                if (typeof item.weight === 'number' && Number.isFinite(item.weight)) weight = item.weight;
                else if (totalGross > 0) weight = (gross / totalGross) * 100;
                else if (totalCost > 0) weight = ((Number(item.allocatedCost) || 0) / totalCost) * 100;
                else weight = 0;

                const weightText = Number.isFinite(weight) ? weight.toFixed(2) : '0.00';
                const allocated = Number(item.allocatedCost) || 0;

                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                      {dateObj ? dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : '-'}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                      Rp {fmt(gross)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                      {weightText}%
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-semibold text-green-700">
                      Rp {fmt(Math.round(allocated))}
                    </td>
                  </tr>
                );
              })}
              {Math.round(totalAllocatedFromRows) !== Math.round(totalCost) && (
                <tr className="bg-yellow-50">
                  <td colSpan="2" className="px-4 py-2 text-sm text-gray-700 font-medium">Note</td>
                  <td className="px-4 py-2 text-sm text-gray-700">Total allocated</td>
                  <td className="px-4 py-2 text-sm font-semibold text-yellow-800">
                    Rp {fmt(totalAllocatedFromRows)} (expected Rp {fmt(totalCost)})
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
            Batal
          </button>
          <button type="button" onClick={() => onConfirm && onConfirm(rows)} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">
            Konfirmasi & Simpan Alokasi
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AllocationPreviewModal;