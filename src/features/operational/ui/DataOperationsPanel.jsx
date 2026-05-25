import React from 'react';

const DataOperationsPanel = ({
  editedCount,
  onOpenBulkEdit,
  onSaveInlineEdits,
}) => (
  <section className="rounded-xl border border-[#2A2F39] bg-[#1A1F27] p-4 space-y-4">
    <div>
      <h3 className="text-sm font-semibold text-[#C8CFDA]">Data Operations</h3>
      <p className="mt-1 text-xs text-[#7E8796]">
        Kelola dan edit data finansial harian.
      </p>
    </div>
    <div className="flex gap-2">
      <button
        onClick={onOpenBulkEdit}
        className="rounded-lg bg-yellow-500/15 border border-yellow-500/25 px-3 py-2 text-xs font-bold text-yellow-400 hover:bg-yellow-500/25 transition-colors"
      >
        Bulk Edit
      </button>
    </div>
    {editedCount > 0 && (
      <div className="flex items-center gap-3 pt-2 border-t border-[#2A2F39]">
        <button
          onClick={onSaveInlineEdits}
          className="rounded-lg bg-[#FFD100] px-4 py-2 text-xs font-bold text-[#111317] hover:brightness-95 transition-all"
        >
          Simpan Perubahan
        </button>
        <span className="text-xs text-[#7E8796]">
          {editedCount} baris diubah
        </span>
      </div>
    )}
  </section>
);

export default DataOperationsPanel;
