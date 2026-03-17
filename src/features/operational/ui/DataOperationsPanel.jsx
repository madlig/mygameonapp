import React from 'react';

const DataOperationsPanel = ({
  editedCount,
  onImportSales,
  onImportVoucher,
  onOpenAdsDistribution,
  onOpenBulkEdit,
  onSaveInlineEdits,
}) => (
  <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-4">
    <div>
      <h3 className="text-sm font-semibold text-gray-700">Data Operations</h3>
      <p className="mt-1 text-xs text-gray-500">
        Gunakan operasi berikut untuk mengelola data finansial harian.
      </p>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
      <button
        onClick={onImportSales}
        className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        Import Shopee Sales
      </button>
      <button
        onClick={onImportVoucher}
        className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
      >
        Import Voucher XLSX
      </button>
      <button
        onClick={onOpenAdsDistribution}
        className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-700"
      >
        Ads Distribution
      </button>
      <button
        onClick={onOpenBulkEdit}
        className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700"
      >
        Bulk Edit
      </button>
    </div>
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={onSaveInlineEdits}
        className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Simpan Perubahan Tabel
      </button>
      <span className="text-xs text-gray-500">Edited rows: {editedCount}</span>
    </div>
  </section>
);

export default DataOperationsPanel;
