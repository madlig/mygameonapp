import React from "react";
import RequestCard from "./RequestCard";

/**
 * Simple column that lists RequestCard; drag & drop removed.
 * Props:
 *  - id: column id / title (e.g., "Requested List")
 *  - items: array of request objects
 *  - onEdit, onDelete, onMove, onMoveToGames: handlers passed down
 */
const StatusColumn = ({ id, items = [], onEdit, onDelete, onMove, onMoveToGames }) => {
  return (
    <div className="bg-white p-4 rounded-lg border shadow-sm">
      <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center justify-between">
        <span>{id}</span>
        <span className="text-sm text-gray-500">{items.length} {items.length === 1 ? "item" : "items"}</span>
      </h2>

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="text-gray-500 text-sm">No items</div>
        ) : (
          items.map((item) => (
            <RequestCard
              key={item.id}
              request={item}
              status={id}
              onEdit={onEdit}
              onDelete={onDelete}
              onMove={onMove}
              onMoveToGames={onMoveToGames}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default StatusColumn;