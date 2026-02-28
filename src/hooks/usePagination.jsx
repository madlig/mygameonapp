import { useState, useMemo } from 'react';

/**
 * Custom hook for pagination.
 * @param {Array} data - The data to paginate.
 * @param {number} itemsPerPage - Number of items per page.
 */
const usePagination = (data = [], itemsPerPage = 10) => {
  const [currentPage, setCurrentPage] = useState(1);

  const validData = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const totalPages = Math.ceil(validData.length / itemsPerPage);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return validData.slice(startIndex, endIndex);
  }, [currentPage, itemsPerPage, validData]);

  const setPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  return {
    currentPage,
    totalPages,
    paginatedData,
    setPage,
  };
};

export default usePagination;
