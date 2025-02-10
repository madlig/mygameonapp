import React from "react";

const SectionActions = ({ selectedRows = [], onEdit, onDelete }) => {
  // Pastikan selectedRows selalu berupa array
  const selectedCount = selectedRows.length;

  if (selectedCount === 0) {
    return null; // Tidak ada aksi yang ditampilkan jika tidak ada baris yang dipilih
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={onEdit}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Edit ({selectedCount})
      </button>
      <button
        onClick={onDelete}
        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        Delete ({selectedCount})
      </button>
    </div>
  );
};

export default SectionActions;
