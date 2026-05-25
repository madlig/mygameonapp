import React, { useCallback, useRef, useState } from 'react';
import {
  Upload,
  FileSpreadsheet,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { detectAndParse } from '../utils/shopeeReportParser';
import {
  savePortfolioData,
  generateDailyRevenues,
} from '../services/portfolioFirestore';

const TYPE_LABELS = {
  ads: {
    label: 'Ads Report',
    color: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  },
  voucher: {
    label: 'Voucher Report',
    color: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
  },
  shopStats: {
    label: 'Shop Stats',
    color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  },
  unknown: {
    label: 'Unknown',
    color: 'bg-red-500/15 text-red-400 border-red-500/25',
  },
};

const ShopeeImportModal = ({ onClose, onSuccess }) => {
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const processFiles = useCallback(async (fileList) => {
    setError(null);
    const newFiles = [];

    for (const file of fileList) {
      const entry = {
        file,
        name: file.name,
        status: 'parsing',
        type: null,
        data: null,
        error: null,
      };
      newFiles.push(entry);
    }
    setFiles((prev) => [...prev, ...newFiles]);

    for (let i = 0; i < newFiles.length; i++) {
      try {
        const result = await detectAndParse(newFiles[i].file);
        newFiles[i].type = result.type;
        newFiles[i].data = result.data;
        newFiles[i].status = result.type === 'unknown' ? 'error' : 'ready';
        if (result.type === 'unknown')
          newFiles[i].error = 'Format tidak dikenali';
      } catch (err) {
        newFiles[i].status = 'error';
        newFiles[i].error = err.message || 'Gagal memproses file';
      }
      setFiles((prev) => {
        const updated = [...prev];
        const idx = updated.length - newFiles.length + i;
        updated[idx] = { ...newFiles[i] };
        return updated;
      });
    }
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length) processFiles(droppedFiles);
    },
    [processFiles]
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleInputChange = (e) => {
    const selected = Array.from(e.target.files);
    if (selected.length) processFiles(selected);
    e.target.value = '';
  };

  const removeFile = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const readyFiles = files.filter((f) => f.status === 'ready');

  const handleSave = async () => {
    if (!readyFiles.length) return;
    setSaving(true);
    setError(null);
    try {
      const parsedFiles = readyFiles.map((f) => ({
        type: f.type,
        data: f.data,
      }));
      const result = await savePortfolioData(parsedFiles);
      await generateDailyRevenues(parsedFiles);
      onSuccess?.(result);
      onClose();
    } catch (err) {
      setError(err.message || 'Gagal menyimpan data');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#111317] border border-[#2A2F39] rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2F39]">
          <h2 className="text-lg font-semibold text-[#F3F4F6]">
            Import Shopee Analytics
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#7E8796] hover:text-[#F3F4F6] hover:bg-[#2A2F39] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-[#2A2F39] hover:border-[#FFD100]/50 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors group"
          >
            <Upload
              size={36}
              className="text-[#7E8796] group-hover:text-[#FFD100] transition-colors mb-3"
            />
            <p className="text-[#C8CFDA] text-sm text-center">
              Drag & drop file laporan Shopee di sini
            </p>
            <p className="text-[#7E8796] text-xs mt-1">
              CSV (Ads) atau XLSX (Voucher, Shop Stats)
            </p>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".csv,.xlsx,.xls"
              onChange={handleInputChange}
              className="hidden"
            />
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((f, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 px-4 py-3 bg-[#1A1F27] border border-[#2A2F39] rounded-lg"
                >
                  <FileSpreadsheet
                    size={18}
                    className="text-[#7E8796] shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#C8CFDA] truncate">{f.name}</p>
                    {f.status === 'parsing' && (
                      <p className="text-xs text-[#7E8796] flex items-center gap-1 mt-0.5">
                        <Loader2 size={12} className="animate-spin" />{' '}
                        Memproses...
                      </p>
                    )}
                    {f.status === 'error' && (
                      <p className="text-xs text-red-400 flex items-center gap-1 mt-0.5">
                        <AlertCircle size={12} /> {f.error}
                      </p>
                    )}
                  </div>
                  {f.status === 'ready' && f.type && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded border ${TYPE_LABELS[f.type]?.color || TYPE_LABELS.unknown.color}`}
                    >
                      {TYPE_LABELS[f.type]?.label || 'Unknown'}
                    </span>
                  )}
                  {f.status === 'ready' && (
                    <CheckCircle2
                      size={16}
                      className="text-emerald-400 shrink-0"
                    />
                  )}
                  <button
                    onClick={() => removeFile(idx)}
                    className="p-1 rounded text-[#7E8796] hover:text-red-400 transition-colors shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="px-4 py-3 bg-red-500/10 border border-red-500/25 rounded-lg text-sm text-red-400">
              {error}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-[#2A2F39] flex items-center justify-between">
          <p className="text-xs text-[#7E8796]">
            {readyFiles.length} file siap diimport
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-[#C8CFDA] hover:text-[#F3F4F6] transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={!readyFiles.length || saving}
              className="px-5 py-2 text-sm font-medium rounded-lg bg-[#FFD100] text-[#0D1117] hover:bg-[#FFD100]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? 'Menyimpan...' : 'Import Data'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopeeImportModal;
