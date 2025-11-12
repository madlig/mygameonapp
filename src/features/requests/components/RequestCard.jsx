import React from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";

const getPriorityStyle = (requestCount) => {
  if (requestCount > 10) return { label: "Critical", bg: "bg-red-100", text: "text-red-800" };
  if (requestCount > 5) return { label: "High", bg: "bg-orange-100", text: "text-orange-800" };
  if (requestCount > 3) return { label: "Medium", bg: "bg-yellow-100", text: "text-yellow-800" };
  return { label: "Low", bg: "bg-green-100", text: "text-green-800" };
};

const RequestCard = ({ request, status, onEdit, onDelete, onMove, onMoveToGames }) => {
  const priority = getPriorityStyle(request.requestCount || 0);

  const renderMoveButtons = () => {
    if (status === "Requested List") {
      return (
        <button
          onClick={() => onMove(request, "On Process")}
          className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          Start Process
        </button>
      );
    }
    if (status === "On Process") {
      return (
        <button
          onClick={() => onMove(request, "Uploaded")}
          className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
        >
          Mark Uploaded
        </button>
      );
    }
    if (status === "Uploaded") {
      return (
        <div className="flex-1 flex gap-2">
          <button
            onClick={() => onMoveToGames && onMoveToGames(request)}
            className="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
          >
            Move to Games
          </button>
          <button
            onClick={() => onMove(request, "Requested List")}
            className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm"
          >
            Return to Requested
          </button>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`relative border rounded-lg p-3 ${priority.bg} shadow-sm`}>
      <button
        onClick={() => onDelete(request.id)}
        className="absolute top-2 right-2 text-red-600 hover:text-red-800 p-1 rounded"
        aria-label="Delete request"
      >
        <XMarkIcon className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className={`px-2 py-0.5 text-xs font-bold uppercase rounded-full border ${priority.text}`}>
            {priority.label}
          </div>
          <div className="mt-2 px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded-full text-center">Req: {request.requestCount}</div>
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-gray-800 truncate" title={request.game}>{request.game}</h3>

          {request.usernameShopee && (
            <div className="text-sm text-gray-600 mt-1">
              Requested by: <span className="font-medium text-gray-800">{request.usernameShopee}</span>
            </div>
          )}

          {request.earliestDate && (
            <div className="text-xs text-gray-500 mt-1">{request.earliestDate}</div>
          )}

          {(request.platforms || []).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {request.platforms.map((p, i) => (
                <span key={i} className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-200 text-gray-800">
                  {p}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-col sm:flex-row gap-2">
        <button
          onClick={() => onEdit(request)}
          className="w-full sm:w-auto px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
        >
          Edit
        </button>

        {renderMoveButtons()}

        <button
          onClick={() => onDelete(request.id)}
          className="w-full sm:w-auto px-3 py-2 bg-red-500 text-white text-sm rounded hover:bg-red-600"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default RequestCard;