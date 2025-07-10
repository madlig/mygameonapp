// useSelectedRows.js
import { useState } from "react";

export const useSelectedRows = () => {
  const [selectedRows, setSelectedRows] = useState([]);

  const toggleRowSelection = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  return { selectedRows, toggleRowSelection };
};
