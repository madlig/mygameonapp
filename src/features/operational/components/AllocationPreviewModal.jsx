// src/features/operational/components/AllocationPreviewModal.jsx

import React from 'react';
import { formatCurrency } from '../../../utils/numberUtils';

/**
 * AllocationPreviewModal
 * Displays a preview of allocation data for ad spend distribution.
 * Defensive: computes weight from grossIncome/totalGross if item.weight is not provided.
 */
const AllocationPreviewModal = ({ isOpen, onClose, allocationData, totalGross }) => {
  if (!isOpen) return null;

  // Safe parsing for totalGross
  const safeTotalGross = Number(totalGross) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Preview Alokasi Biaya Iklan
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-4">
          {allocationData && allocationData.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                    Tanggal
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                    Pendapatan Kotor
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                    Bobot (%)
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                    Alokasi Iklan
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {allocationData.map((item, index) => {
                  // Safe parsing for grossIncome and allocatedAdSpend
                  const grossIncome = Number(item.grossIncome) || 0;
                  const allocatedAdSpend = Number(item.allocatedAdSpend) || 0;

                  // Defensive: compute weight if not provided
                  let weight = item.weight;
                  if (weight === undefined || weight === null) {
                    weight =
                      safeTotalGross > 0 ? (grossIncome / safeTotalGross) * 100 : 0;
                  }
                  const safeWeight = Number(weight) || 0;

                  // Safe date parsing
                  let formattedDate = '-';
                  if (item.date) {
                    try {
                      const dateObj =
                        item.date instanceof Date
                          ? item.date
                          : item.date.toDate
                            ? item.date.toDate()
                            : new Date(item.date);
                      formattedDate = dateObj.toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                      });
                    } catch {
                      formattedDate = '-';
                    }
                  }

                  return (
                    <tr key={item.id || index}>
                      <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-800">
                        {formattedDate}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-800">
                        Rp {formatCurrency(grossIncome)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-800">
                        {safeWeight.toFixed(2)}%
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-sm font-medium text-green-700">
                        Rp {formatCurrency(allocatedAdSpend)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="py-4 text-center text-gray-500">
              Tidak ada data alokasi untuk ditampilkan.
            </p>
          )}
        </div>

        <div className="flex justify-end border-t p-4">
          <button
            onClick={onClose}
            className="rounded-md bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default AllocationPreviewModal;
