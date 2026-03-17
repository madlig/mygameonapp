import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const ShiftQuickPanel = ({
  adminName,
  setAdminName,
  activeShift,
  handleStartShift,
  handleEndShift,
  getActiveShiftDuration,
}) => {
  const [localAdmin, setLocalAdmin] = useState(adminName || '');
  const adminList = ['Fariz', 'Adli'];

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-700">
            Shift Quick Panel
          </h2>
          <p className="text-xs text-gray-500">
            Akses cepat untuk mulai/akhiri shift tanpa scroll jauh.
          </p>
        </div>
        <Link
          to="/operational/shift"
          className="rounded-md border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          Buka Shift Workspace
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-600">Pilih Admin</label>
          <select
            value={localAdmin}
            onChange={(event) => {
              setLocalAdmin(event.target.value);
              setAdminName(event.target.value);
            }}
            className="mt-1 w-full rounded-md border border-gray-200 px-2 py-2 text-sm"
          >
            <option value="">-- Pilih Admin --</option>
            {adminList.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleStartShift}
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Mulai Shift
        </button>
        <button
          onClick={handleEndShift}
          disabled={!activeShift}
          className="rounded-md bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
        >
          Selesaikan Shift
        </button>

        <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
          {activeShift ? (
            <>
              <p>
                Aktif:{' '}
                <span className="font-semibold text-gray-800">
                  {activeShift.adminName}
                </span>
              </p>
              <p>Durasi: {getActiveShiftDuration()}</p>
            </>
          ) : (
            <p>Tidak ada shift aktif.</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default ShiftQuickPanel;
