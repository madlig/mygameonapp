import React from 'react';
import Modal from '../../../components/common/Modal';

const EndShiftModal = ({
  isOpen,
  onClose,
  onConfirm,
  grossIncome,
  setGrossIncome,
  ordersCount,
  setOrdersCount,
  estimatedCompensation,
  loading,
}) => {
  if (!isOpen) return null;

  return (
    <Modal onClose={onClose} ariaLabel="End Shift Confirmation">
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Konfirmasi Selesai Shift</h2>
        <p className="text-gray-600 mb-4">
          Masukkan rekap pendapatan dan jumlah pesanan yang Anda tangani selama
          shift ini.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onConfirm();
          }}
        >
          <div className="space-y-4">
            <div>
              <label
                htmlFor="grossIncome"
                className="block text-sm font-medium text-gray-700"
              >
                Pendapatan Kotor (Rp)
              </label>
              <input
                type="number"
                id="grossIncome"
                value={grossIncome}
                onChange={(e) => setGrossIncome(e.target.value)}
                className="mt-1 p-2 w-full border rounded-md"
                required
                placeholder="e.g., 500000"
              />
            </div>
            <div>
              <label
                htmlFor="ordersCount"
                className="block text-sm font-medium text-gray-700"
              >
                Jumlah Pesanan
              </label>
              <input
                type="number"
                id="ordersCount"
                value={ordersCount}
                onChange={(e) => setOrdersCount(e.target.value)}
                className="mt-1 p-2 w-full border rounded-md"
                required
                placeholder="e.g., 10"
              />
            </div>

            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-sm font-semibold text-emerald-800">
                Estimasi Gaji Shift
              </p>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-emerald-900">
                <p>
                  Base Pay:{' '}
                  <span className="font-medium">
                    Rp{' '}
                    {(
                      estimatedCompensation?.breakdown?.basePay || 0
                    ).toLocaleString('id-ID')}
                  </span>
                </p>
                <p>
                  Overtime Pay:{' '}
                  <span className="font-medium">
                    Rp{' '}
                    {(
                      estimatedCompensation?.breakdown?.overtimePay || 0
                    ).toLocaleString('id-ID')}
                  </span>
                </p>
                <p>
                  Bonus:{' '}
                  <span className="font-medium">
                    Rp{' '}
                    {(
                      estimatedCompensation?.breakdown?.performanceBonus || 0
                    ).toLocaleString('id-ID')}
                  </span>
                </p>
                <p>
                  Tier:{' '}
                  <span className="font-medium">
                    {estimatedCompensation?.breakdown?.tier || '-'}
                  </span>
                </p>
              </div>
              <p className="mt-2 text-sm font-bold text-emerald-900">
                Total Estimasi: Rp{' '}
                {(estimatedCompensation?.totalPay || 0).toLocaleString('id-ID')}
              </p>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md"
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              className="bg-red-600 text-white px-4 py-2 rounded-md"
              disabled={loading}
            >
              {loading ? 'Menyimpan...' : 'Selesaikan & Simpan'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default EndShiftModal;
