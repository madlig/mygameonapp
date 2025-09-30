import React from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

const SectionActions = ({
  selectedRows,
  gamesData,
  onClose,
  onEdit,
  onDelete,
}) => {
  const isSingleSelection = selectedRows.length === 1;
  const selectedGameName =
    isSingleSelection &&
    gamesData.find((game) => game.id === selectedRows[0])?.name;

  return (
    <div className="bg-gray-100 border rounded p-2 flex items-center justify-between shadow-md">
      <div className="flex items-center space-x-2">
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
        <p className="text-gray-700 text-base font-medium">
          {isSingleSelection
            ? `Selected Game: ${selectedGameName}`
            : `${selectedRows.length} Selected`}
        </p>
      </div>
      <div className="flex space-x-2">
        {isSingleSelection && (
          <button
            onClick={onEdit}
            className="bg-green-600 text-white px-3 py-1.5 rounded text-base font-medium hover:bg-green-700"
          >
            Edit
          </button>
        )}
        <button
          onClick={onDelete}
          className="bg-red-600 text-white px-3 py-1.5 rounded text-base font-medium hover:bg-red-700"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default SectionActions;
