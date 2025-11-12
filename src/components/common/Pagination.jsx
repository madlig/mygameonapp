import React from "react";

const Pagination = ({ currentPage, totalPages, onPageChange, onRowsPerPageChange, rowsPerPage }) => {
  return (
    <div className="mt-4">
      {/* Mobile: stack (kolom). Sm+: horizontal row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        {/* Left: Rows per page (aligned start on sm+, centered on mobile) */}
        <div className="flex items-center justify-center sm:justify-start space-x-2">
          <label htmlFor="rows-per-page" className="text-sm font-medium text-gray-700">Rows per page:</label>
          <select
            id="rows-per-page"
            value={rowsPerPage}
            onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={15}>15</option>
          </select>
        </div>

        {/* Center: pagination controls (centered on all sizes) */}
        <div className="flex items-center justify-center space-x-3">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50 text-sm"
            aria-label="Previous page"
          >
            Previous
          </button>

          <div className="text-center">
            <div className="text-sm font-medium">Page</div>
            <div className="text-lg font-bold">{currentPage} <span className="text-base font-normal">of</span> {totalPages}</div>
          </div>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50 text-sm"
            aria-label="Next page"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;