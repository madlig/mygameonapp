import React from "react";
import { InformationCircleIcon } from "@heroicons/react/24/solid";
import { Tooltip } from "react-tooltip";

const getStatusClass = (status) => {
  switch (status) {
    case "Upload Shopee":
      return "bg-orange-500 text-white";
    case "Upload Gdrive":
      return "bg-green-500 text-white";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const formatDate = (dateObj) => {
  if (!dateObj) return "N/A";
  try {
    const d = dateObj.seconds ? new Date(dateObj.seconds * 1000) : new Date(dateObj);
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return "N/A";
  }
};

const MobileCard = ({ game, checked, onToggle, onRowClick }) => {
  return (
    <div
      className="bg-white rounded-lg shadow p-4 flex flex-col space-y-3"
      onClick={(e) => {
        if (e.target.type === "checkbox") return;
        onRowClick(game.id, e);
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 min-w-0">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onToggle(game.id)}
            onClick={(e) => e.stopPropagation()}
            className="mt-1 h-4 w-4 flex-shrink-0"
            aria-label={`Select ${game.name}`}
          />
          <div className="min-w-0">
            <h3 className="text-md font-semibold text-gray-800 truncate" title={game.name}>
              {game.name}
            </h3>
            <div className="mt-1 text-sm text-gray-500 truncate">
              {game.type || "—"} • {game.version || "—"}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end space-y-2 flex-shrink-0 ml-3 whitespace-nowrap">
          {game.shopeeLink ? (
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded whitespace-nowrap">
              Shopee
            </span>
          ) : game.source ? (
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded whitespace-nowrap">
              {game.source}
            </span>
          ) : null}

          <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusClass(game.status)}`}>
            {game.status || "N/A"}
          </span>

          <span
            className="text-gray-400 cursor-pointer"
            data-tooltip-id={`tooltip-mobile-${game.id}`}
            onClick={(e) => e.stopPropagation()}
            aria-hidden
          >
            <InformationCircleIcon className="w-5 h-5" />
          </span>
          <Tooltip id={`tooltip-mobile-${game.id}`} place="top" effect="solid">
            {game.description || "No description available"}
          </Tooltip>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <div className="text-gray-600">Size: <span className="font-medium text-gray-800">{game.size || "N/A"}</span></div>
        <div className="text-gray-600">Parts: <span className="font-medium text-gray-800">{game.jumlahPart ?? "-"}</span></div>
        <div className="text-gray-600">Date: <span className="font-medium text-gray-800">{formatDate(game.dateAdded)}</span></div>
      </div>

      <div className="flex flex-wrap gap-2">
        {Array.isArray(game.genre) && game.genre.length > 0 ? (
          game.genre.slice(0, 4).map((g, i) => (
            <span key={i} className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
              {g}
            </span>
          ))
        ) : (
          <span className="text-gray-400 text-sm">No Genre</span>
        )}

        {Array.isArray(game.locations) && game.locations.length > 0 && (
          <span className="ml-auto text-xs text-gray-500 whitespace-nowrap">
            {game.locations.length} location{game.locations.length > 1 ? "s" : ""}
          </span>
        )}
      </div>
    </div>
  );
};

const GameTable = ({
  data = [],
  selectedRows = [],
  onRowClick = () => {},
  onSort = () => {},
  sortConfig = {},
  onSelectAll = () => {},
  toggleRowSelection = () => {},
}) => {
  const allSelected = data.length > 0 && selectedRows.length === data.length;

  return (
    <>
      {/* DESKTOP / LARGE: table */}
      <div className="hidden lg:block overflow-x-auto bg-white rounded-lg shadow mt-6">
        <table className="min-w-full text-left border-collapse table-fixed">
          <thead className="bg-gray-300 text-black-700 text-sm uppercase tracking-wide">
            <tr>
              <th className="px-6 py-3 w-12 text-center">
                <input
                  type="checkbox"
                  className="form-checkbox"
                  onChange={onSelectAll}
                  checked={allSelected}
                  aria-label="Select all"
                />
              </th>
              <th className="px-6 py-3 cursor-pointer text-left" onClick={() => onSort("name")}>
                <div className="min-w-0">
                  <span className="truncate block">Name</span>
                </div>
                {sortConfig.key === "name" &&
                  (sortConfig.direction === "ascending" ? " ↑" : " ↓")}
              </th>

              {/* Removed redundant columns: Tipe, Version, Status (they are shown inside Name) */}
              <th className="px-6 py-3 text-left">Size</th>
              <th className="px-6 py-3 text-center">Jumlah Part</th>
              <th className="px-6 py-3 text-center">Genre</th>
              <th className="px-6 py-3 text-left">Location</th>
              <th className="px-6 py-3 truncate">Date Added</th>
              <th className="px-6 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody className="text-black-200 text-md">
            {data.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-4 text-center text-black-500">No Match Data Found</td>
              </tr>
            ) : (
              data.map((game) => (
                <tr
                  key={game.id}
                  className={`border-b hover:bg-gray-50 transition ${selectedRows.includes(game.id) ? "bg-gray-100" : ""}`}
                  onClick={(e) => onRowClick(game.id, e)}
                >
                  <td className="px-6 py-4 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(game.id)}
                      onChange={() => toggleRowSelection(game.id)}
                      className="form-checkbox"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>

                  {/* Name cell: includes small metadata (type/version/status) */}
                  <td className="px-6 py-4">
                    <div className="flex items-start justify-between min-w-0">
                      <div className="min-w-0 pr-3">
                        <span className="font-medium text-gray-800 block truncate" title={game.name}>
                          {game.name}
                        </span>
                        <div className="text-xs text-gray-500 truncate">
                          {game.type || "—"} • {game.version || "—"}
                        </div>
                        {/* show status inline if you want even more compact */}
                      </div>

                      <div className="flex-shrink-0 ml-3 flex items-center space-x-2 whitespace-nowrap">
                        {game.shopeeLink ? (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                            Shopee
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 truncate">{game.size}</td>
                  <td className="px-6 py-4 text-center">{game.jumlahPart}</td>
                  <td className="px-6 py-4 text-center">
                    {game.genre && game.genre.length > 0 ? (
                      game.genre.map((cat, index) => (
                        <span key={index} className="inline-block px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full mr-2 mb-2">
                          {cat}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500">No Genre</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {game.locations && game.locations.length > 0 ? (
                      game.locations.map((location, index) => (
                        <span key={index} className="inline-block px-3 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full mr-2 mb-2">
                          {location}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500">No Location</span>
                    )}
                  </td>
                  <td className="px-6 py-4 truncate">{formatDate(game.dateAdded)}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-gray-500 cursor-pointer hover:text-gray-700" data-tooltip-id={`tooltip-${game.id}`} onClick={(e) => e.stopPropagation()}>
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

      {/* MOBILE: card/list */}
      <div className="lg:hidden mt-4 space-y-3">
        {data.length === 0 ? (
          <div className="text-center text-gray-500 bg-white p-4 rounded-lg shadow">No Match Data Found</div>
        ) : (
          data.map((game) => (
            <MobileCard
              key={game.id}
              game={game}
              checked={selectedRows.includes(game.id)}
              onToggle={(id) => toggleRowSelection(id)}
              onRowClick={onRowClick}
            />
          ))
        )}
      </div>
    </>
  );
};

export default GameTable;