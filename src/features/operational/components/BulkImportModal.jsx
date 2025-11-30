// src/features/operational/components/BulkImportModal.jsx
import React, { useEffect, useMemo, useState } from 'react';
import Modal from '../../../components/common/Modal';
import { formatCurrency } from '../../../utils/numberUtils';

/**
 * BulkImportModal
 * Props:
 * - isOpen
 * - onClose
 * - reports: array of parsed rows (from parseShopeeReportForBulk)
 * - onConfirmImport: function(reportsToImport)
 *
 * Behavior:
 * - Validate each parsed row (required fields)
 * - Show counts: valid / warnings / errors
 * - Allow per-row Edit (open inline editor) and toggle exclude rows with errors
 */
const requiredFields = ['date', 'grossIncome', 'totalOrders'];

const validateRow = (row) => {
  const errors = [];
  const warnings = [];

  // date
  let dateObj = null;
  if (row.date instanceof Date) dateObj = row.date;
  else if (typeof row.date === 'string' || typeof row.date === 'number') {
    const d = new Date(row.date);
    if (!isNaN(d.getTime())) dateObj = d;
  }
  if (!dateObj) errors.push('Invalid or missing date');

  // grossIncome numeric non-negative
  const gross = Number(row.grossIncome);
  if (!Number.isFinite(gross) || gross < 0) errors.push('Invalid Pendapatan Kotor');

  // totalOrders integer
  const orders = Number(row.totalOrders);
  if (!Number.isFinite(orders) || !Number.isInteger(orders) || orders < 0) errors.push('Invalid Total Pesanan');

  // optional fields check
  if (row.canceledValue && isNaN(Number(row.canceledValue))) warnings.push('Nilai Batal tidak terparse');
  if (row.returnedValue && isNaN(Number(row.returnedValue))) warnings.push('Nilai Kembali tidak terparse');

  return { errors, warnings, normalized: { ...row, date: dateObj, grossIncome: gross || 0, totalOrders: Number.isFinite(orders) ? orders : 0 } };
};

const BulkImportModal = ({ isOpen, onClose, reports = [], onConfirmImport }) => {
  const [rows, setRows] = useState([]);
  const [excludedIds, setExcludedIds] = useState(new Set());
  const [editingRow, setEditingRow] = useState(null);

  useEffect(() => {
    // when modal opens, validate incoming reports
    const validated = (reports || []).map((r, idx) => {
      const { errors, warnings, normalized } = validateRow(r);
      return { id: idx, raw: r, errors, warnings, normalized };
    });
    setRows(validated);
    setExcludedIds(new Set()); // reset
    setEditingRow(null);
  }, [reports, isOpen]);

  const counts = useMemo(() => {
    let valid = 0, warn = 0, err = 0;
    for (const r of rows) {
      if (r.errors && r.errors.length > 0) err++;
      else if (r.warnings && r.warnings.length > 0) warn++;
      else valid++;
    }
    return { valid, warn, err, total: rows.length };
  }, [rows]);

  const toggleExclude = (id) => {
    const s = new Set(excludedIds);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    setExcludedIds(s);
  };

  const handleEdit = (row) => {
    // open inline editor (simple)
    setEditingRow({ ...row.normalized, id: row.id });
  };

  const applyEdit = (edited) => {
    // re-validate edited row and replace in rows
    const updated = rows.map(r => {
      if (r.id !== edited.id) return r;
      const { errors, warnings, normalized } = validateRow(edited);
      return { id: r.id, raw: edited, errors, warnings, normalized };
    });
    setRows(updated);
    setEditingRow(null);
  };

  const handleConfirm = () => {
    // collect non-excluded and non-error rows
    const toImport = rows
      .filter(r => !excludedIds.has(r.id) && (!r.errors || r.errors.length === 0))
      .map(r => r.normalized);
    onConfirmImport && onConfirmImport(toImport);
    onClose && onClose();
  };

  if (!isOpen) return null;

  const fmt = (v) => formatCurrency(v);

  return (
    <Modal onClose={onClose} ariaLabel="Bulk Import Preview">
      <div className="p-6 w-full max-w-4xl">
        <h2 className="text-xl font-bold mb-2">Preview Hasil Upload</h2>
        <p className="text-sm text-gray-600 mb-4">Periksa hasil parsing. Anda dapat mengedit baris yang bermasalah atau mengecualikannya sebelum menyimpan.</p>

        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm">
            <strong>{counts.total}</strong> rows — <span className="text-green-600">{counts.valid} valid</span>, <span className="text-yellow-600">{counts.warn} warning</span>, <span className="text-red-600">{counts.err} error</span>
          </div>
          <div className="text-sm">
            <button onClick={() => { setExcludedIds(new Set()); setEditingRow(null); }} className="px-3 py-1 bg-gray-100 rounded">Reset</button>
          </div>
        </div>

        <div className="max-h-[50vh] overflow-y-auto border rounded">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs">#</th>
                <th className="px-3 py-2 text-left text-xs">Tanggal</th>
                <th className="px-3 py-2 text-left text-xs">Pendapatan Kotor</th>
                <th className="px-3 py-2 text-left text-xs">Total Pesanan</th>
                <th className="px-3 py-2 text-left text-xs">Status</th>
                <th className="px-3 py-2 text-left text-xs">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const status = (r.errors && r.errors.length > 0) ? 'Error' : (r.warnings && r.warnings.length > 0) ? 'Warning' : 'OK';
                const isExcluded = excludedIds.has(r.id);
                return (
                  <tr key={r.id} className={`${isExcluded ? 'opacity-50' : ''} hover:bg-gray-50`}>
                    <td className="px-3 py-2 text-sm">{r.id + 1}</td>
                    <td className="px-3 py-2 text-sm">{r.normalized.date ? r.normalized.date.toLocaleDateString('id-ID') : '-'}</td>
                    <td className="px-3 py-2 text-sm">Rp {fmt(r.normalized.grossIncome)}</td>
                    <td className="px-3 py-2 text-sm">{r.normalized.totalOrders}</td>
                    <td className="px-3 py-2 text-sm">
                      {status}
                      {r.warnings && r.warnings.length > 0 && <div className="text-xs text-yellow-700">{r.warnings.join('; ')}</div>}
                      {r.errors && r.errors.length > 0 && <div className="text-xs text-red-700">{r.errors.join('; ')}</div>}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      <button onClick={() => handleEdit(r)} className="mr-2 text-blue-600">Edit</button>
                      <button onClick={() => toggleExclude(r.id)} className={`mr-2 ${isExcluded ? 'text-green-600' : 'text-gray-600'}`}>{isExcluded ? 'Include' : 'Exclude'}</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Inline editor */}
        {editingRow && (
          <div className="mt-4 p-4 bg-white border rounded shadow">
            <h3 className="font-semibold mb-2">Edit Baris #{editingRow.id + 1}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm">Tanggal</label>
                <input type="date" value={editingRow.date ? (new Date(editingRow.date)).toISOString().split('T')[0] : ''} onChange={(e) => setEditingRow({...editingRow, date: e.target.value})} className="mt-1 p-2 border rounded w-full" />
              </div>
              <div>
                <label className="block text-sm">Pendapatan Kotor (Rp)</label>
                <input type="number" value={editingRow.grossIncome || ''} onChange={(e) => setEditingRow({...editingRow, grossIncome: e.target.value})} className="mt-1 p-2 border rounded w-full" />
              </div>
              <div>
                <label className="block text-sm">Total Pesanan</label>
                <input type="number" value={editingRow.totalOrders || ''} onChange={(e) => setEditingRow({...editingRow, totalOrders: e.target.value})} className="mt-1 p-2 border rounded w-full" />
              </div>
            </div>
            <div className="mt-3 flex justify-end gap-3">
              <button onClick={() => setEditingRow(null)} className="px-3 py-2 bg-gray-200 rounded">Cancel</button>
              <button onClick={() => applyEdit(editingRow)} className="px-3 py-2 bg-blue-600 text-white rounded">Apply</button>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Batal</button>
          <button onClick={handleConfirm} className="px-4 py-2 bg-green-600 text-white rounded">Confirm Import ({rows.filter(r=>!excludedIds.has(r.id) && (!r.errors||r.errors.length===0)).length})</button>
        </div>
      </div>
    </Modal>
  );
};

export default BulkImportModal;