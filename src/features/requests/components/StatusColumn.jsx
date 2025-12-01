// src/features/requests/components/StatusColumn.jsx
import React, { useMemo, useState } from "react";
import RequestCard from "./RequestCard";

/**
 * StatusColumn (mobile-first)
 * - On small screens: collapsible accordion (shows header + count; expand to view items)
 * - On large screens: standard column with search & sort
 */
const sortFunctions = {
  "": () => 0,
  "requestCountDesc": (a, b) => (Number(b.requestCount) || 0) - (Number(a.requestCount) || 0),
  "requestCountAsc": (a, b) => (Number(a.requestCount) || 0) - (Number(b.requestCount) || 0),
  "sizeDesc": (a, b) => (Number(b.estimatedSize) || 0) - (Number(a.estimatedSize) || 0),
  "sizeAsc": (a, b) => (Number(a.estimatedSize) || 0) - (Number(b.estimatedSize) || 0),
};

const StatusColumn = ({ id, items = [], onEdit, onDelete, onMove, onMoveToGames, onAddToRdp }) => {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("");
  const [expanded, setExpanded] = useState(true); // expanded by default on mobile for discoverability

  const shownItems = useMemo(() => {
    const q = (search || "").trim().toLowerCase();
    let list = Array.isArray(items) ? items.slice() : [];
    if (q) {
      list = list.filter(it => (it.game || "").toLowerCase().includes(q) || (it.usernameShopee || "").toLowerCase().includes(q));
    }
    if (sortKey && sortFunctions[sortKey]) {
      list.sort((a, b) => {
        try { return sortFunctions[sortKey](a, b); } catch (err) { return 0; }
      });
    }
    return list;
  }, [items, search, sortKey]);

  // On small screens, render compact header that toggles content
  return (
    <div className="bg-white p-3 rounded-lg border shadow-sm">
      {/* Header clickable (mobile-friendly) */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="lg:hidden p-2 rounded-md bg-gray-100 hover:bg-gray-200"
            aria-expanded={expanded}
            aria-controls={`col-${id}`}
          >
            <svg className={`w-4 h-4 transform ${expanded ? 'rotate-90' : ''}`} viewBox="0 0 24 24" fill="none">
              <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h2 className="text-lg font-semibold text-gray-700">{id}</h2>
          <span className="text-sm text-gray-500">{items.length}</span>
        </div>

        {/* Large-screen controls */}
        <div className="hidden lg:flex items-center gap-2">
          <input
            type="search"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-1 border rounded-md"
            aria-label={`Search in ${id}`}
          />
          <select value={sortKey} onChange={(e) => setSortKey(e.target.value)} className="px-2 py-1 border rounded-md">
            <option value="">Sort</option>
            <option value="requestCountDesc">Requests (high → low)</option>
            <option value="requestCountAsc">Requests (low → high)</option>
            <option value="sizeDesc">Size (large → small)</option>
            <option value="sizeAsc">Size (small → large)</option>
          </select>
        </div>
      </div>

      {/* Content: collapsible on mobile, always visible on lg */}
      <div id={`col-${id}`} className={`${!expanded ? 'hidden' : ''} lg:block`}>
        {/* Mobile: inline search & sort (compact) */}
        <div className="mb-3 lg:hidden">
          <input
            type="search"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 border rounded-md mb-2"
            aria-label={`Search in ${id}`}
          />
          <select value={sortKey} onChange={(e) => setSortKey(e.target.value)} className="w-full px-3 py-2 border rounded-md">
            <option value="">Sort</option>
            <option value="requestCountDesc">Requests (high → low)</option>
            <option value="requestCountAsc">Requests (low → high)</option>
            <option value="sizeDesc">Size (large → small)</option>
            <option value="sizeAsc">Size (small → large)</option>
          </select>
        </div>

        <div className="space-y-3">
          {shownItems.length === 0 ? (
            <div className="text-gray-500 text-sm">No items</div>
          ) : (
            shownItems.map((item) => (
              <RequestCard
                key={item.id}
                request={item}
                status={id}
                onEdit={onEdit}
                onDelete={onDelete}
                onMove={onMove}
                onMoveToGames={onMoveToGames}
                onAddToRdp={onAddToRdp}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default StatusColumn;