
const Pagination = ({ currentPage, totalPages, onPageChange, onRowsPerPageChange, rowsPerPage }) => {
  return (
    <div className="flex justify-between items-center mt-4">
      {/* Pilihan Rows per Page */}
      <div className="flex items-center space-x-2">
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

      {/* Pagination Controls */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-lg font-medium">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;
