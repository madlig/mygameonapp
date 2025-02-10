import React from "react";
import { InformationCircleIcon } from "@heroicons/react/24/solid";
import { Tooltip } from "react-tooltip";

const getStatusClass = (status) => {
    switch (status) {
      case "Shopee":
        return "bg-orange-500 text-white"; // Warna oranye untuk Shopee
      case "Gdrive":
        return "bg-green-500 text-white"; // Warna hijau untuk Gdrive
      default:
        return "bg-gray-100 text-gray-800"; // Warna default untuk status lainnya
    }
  };

const GameTable = ({
  data,
  selectedRows,
  onRowClick,
  onSort,
  sortConfig,
  onSelectAll,
}) => {
  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow mt-6">
      <table className="min-w-full text-left border-collapse">
        <thead className="bg-gray-300 text-black-700 text-sm uppercase tracking-wide">
          <tr>
            <th className="px-6 py-3 w-12 text-center">
              <input
                type="checkbox"
                className="form-checkbox"
                onChange={onSelectAll}
                checked={selectedRows.length === data.length}
              />
            </th>
            <th className="px-6 py-3 cursor-pointer" onClick={() => onSort("name")}>
              Name
              {sortConfig.key === "name" &&
                (sortConfig.direction === "ascending" ? " ↑" : " ↓")}
            </th>
            <th className="px-6 py-3">Version</th>
            <th className="px-6 py-3">Size</th>
            <th className="px-1 py-3 text-center">Jumlah Part</th>
            <th className="px-1 py-3 text-center">Category</th>
            <th className="px-6 py-3">Status</th>
            <th className="px-6 py-3">Date Added</th>
            <th className="px-6 py-3 w-10"></th> {/* Space for tooltip icon */}
          </tr>
        </thead>
        <tbody className="text-black-200 text-md">
          {data.length === 0 ? (
            <tr>
              <td colSpan="9" className="px-6 py-4 text-center text-black-500">
                No Match Data Found
              </td>
            </tr>
          ) : (
            data.map((game) => (
              <tr
                key={game.id}
                className={`border-b hover:bg-gray-50 transition ${
                  selectedRows.includes(game.id) ? "bg-gray-100" : ""
                }`}
                onClick={(e) => onRowClick(game.id, e)}
              >
                <td className="px-6 py-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={selectedRows.includes(game.id)}
                    onChange={(e) => onRowClick(game.id, e)}
                    className="form-checkbox"
                  />
                </td>
                <td className="px-6 py-4 truncate">{game.name}</td>
                <td className="px-6 py-4 truncate">{game.version}</td>
                <td className="px-6 py-4 truncate">{game.size}</td>
                <td className="px-6 py-4 text-center">{game.jumlahPart}</td>
                <td className="px-6 py-4 text-center">
                  {game.category && game.category.length > 0 ? (
                    game.category.map((cat, index) => (
                      <span
                        key={index}
                        className="inline-block px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full mr-2 mb-2"
                      >
                        {cat}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500">No Category</span>
                  )}
                </td>
                <td className="px-6 py-4">
                <span
                    className={`px-2 py-1 rounded text-sm font-medium ${getStatusClass(
                    game.status
                    )}`}
                >
                    {game.status}
                  </span>
                </td>
                <td className="px-6 py-4 truncate">
                  {game.dateAdded
                    ? new Date(game.dateAdded.seconds * 1000).toLocaleDateString("en-US")
                    : "N/A"}
                </td>
                <td className="px-6 py-4 text-center">
                  <span
                    className="text-gray-500 cursor-pointer hover:text-gray-700"
                    data-tooltip-id={`tooltip-${game.id}`}
                  >
                    <InformationCircleIcon className="w-5 h-5 inline-block" />
                  </span>
                  <Tooltip id={`tooltip-${game.id}`} place="top" effect="solid">
                    {game.description || "No description available"}
                  </Tooltip>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default GameTable;
