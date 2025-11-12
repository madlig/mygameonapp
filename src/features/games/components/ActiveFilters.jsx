import React from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

const ActiveFilters = ({ filters, onRemoveFilter, onResetAll }) => {
  const currentGenres = filters?.genre || [];

  const hasSize =
    filters?.size &&
    (filters.size.min !== "" && filters.size.min !== undefined) ||
    (filters.size.max !== "" && filters.size.max !== undefined);

  const hasDate =
    !!(filters?.dateAdded && (filters.dateAdded.start || filters.dateAdded.end));

  const shouldShowFilters =
    currentGenres.length > 0 || !!filters?.status || hasSize || hasDate;

  if (!shouldShowFilters) return null;

  const sizeLabel = () => {
    if (!filters?.size) return "";
    const { min, max, unit } = filters.size;
    const displayUnit = (unit || "GB").toUpperCase();
    if (min !== "" && max !== "") return `Size: ${min} - ${max} ${displayUnit}`;
    if (min !== "") return `Size ≥ ${min} ${displayUnit}`;
    if (max !== "") return `Size ≤ ${max} ${displayUnit}`;
    return "";
  };

  const dateLabel = () => {
    if (!filters?.dateAdded) return "";
    const { start, end } = filters.dateAdded;
    if (start && end) return `Added: ${start} — ${end}`;
    if (start) return `Added from ${start}`;
    if (end) return `Added until ${end}`;
    return "";
  };

  return (
    <div className="flex items-center justify-between mt-4">
      <div className="flex space-x-2 flex-wrap">
        {currentGenres.map((genre) => (
          <div
            key={genre}
            className="flex items-center bg-blue-100 text-blue-700 px-3 py-1 rounded-full"
          >
            <span className="text-sm">{genre}</span>
            <button
              className="ml-2 text-blue-700 hover:text-blue-900"
              onClick={() => onRemoveFilter && onRemoveFilter("genre", genre)}
              aria-label={`Remove genre ${genre}`}
              title="Remove"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        ))}

        {filters?.status && (
          <div className="flex items-center bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
            <span className="text-sm">{filters.status}</span>
            <button
              className="ml-2 text-blue-700 hover:text-blue-900"
              onClick={() => onRemoveFilter && onRemoveFilter("status")}
              title="Remove status"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        {hasSize && (
          <div className="flex items-center bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
            <span className="text-sm">{sizeLabel()}</span>
            <button
              className="ml-2 text-blue-700 hover:text-blue-900"
              onClick={() => onRemoveFilter && onRemoveFilter("size")}
              title="Remove size filter"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        {hasDate && (
          <div className="flex items-center bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
            <span className="text-sm">{dateLabel()}</span>
            <button
              className="ml-2 text-blue-700 hover:text-blue-900"
              onClick={() => onRemoveFilter && onRemoveFilter("dateAdded")}
              title="Remove date filter"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Clear All button */}
      <div>
        <button
          onClick={() => (onResetAll ? onResetAll() : onRemoveFilter && onRemoveFilter("all"))}
          className="text-sm px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
          title="Clear all filters"
        >
          Clear All
        </button>
      </div>
    </div>
  );
};

export default ActiveFilters;