import React, { useState } from 'react';
import { X, UploadCloud, FileSpreadsheet, CheckCircle, AlertCircle, Loader2, Info } from 'lucide-react';
import { writeBatch, doc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../../../config/firebaseConfig';
import Swal from 'sweetalert2';

const BulkGameImportModal = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (event) => parseCSV(event.target.result);
      reader.readAsText(selectedFile);
    }
  };

  const parseCSV = (text) => {
    const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
    // Split header, handle quotes
    const headers = lines[0].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));
    
    const parsed = lines.slice(1).map((line) => {
      const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, '')); 
      const row = {};
      headers.forEach((h, i) => row[h] = values[i] || '');
      return row;
    });

    setPreviewData(parsed.slice(0, 5));
  };

  // --- HELPER: PARSER SIZE ROBUST ---
  const parseSizeRobust = (input) => {
    if (!input) return { value: 0, unit: 'GB', sizeInMB: 0 };
    
    const str = input.toString().toUpperCase();
    
    // 1. Deteksi Unit (Cari kata kunci MB, KB, TB, GB)
    let unit = 'GB'; // Default
    if (str.includes('MB')) unit = 'MB';
    else if (str.includes('KB')) unit = 'KB';
    else if (str.includes('TB')) unit = 'TB';
    else if (str.includes('GB')) unit = 'GB';
    
    // 2. Deteksi Angka (Support koma dan titik)
    // Hapus semua karakter KECUALI angka, titik, dan koma
    const cleanNumStr = str.replace(/[^\d.,]/g, '').trim();
    
    // Ganti koma dengan titik untuk standarisasi float (429,5 -> 429.5)
    const normalizedNumStr = cleanNumStr.replace(',', '.');
    
    let value = parseFloat(normalizedNumStr);
    if (isNaN(value)) value = 0;

    // 3. Hitung Sortable Size (dalam MB)
    let sizeInMB = value;
    if (unit === 'GB') sizeInMB = value * 1024;
    if (unit === 'KB') sizeInMB = value / 1024;
    if (unit === 'TB') sizeInMB = value * 1024 * 1024;

    return { value, unit, sizeInMB };
  };

  const mapRowToFirestore = (row) => {
    // A. Judul
    const title = row.judul || row.title || row.name || row['nama game'] || 'No Title';
    
    // B. Size (Pakai Helper Baru)
    const rawSize = row.size || row.ukuran || row['file size'] || '0';
    const { value: sizeValue, unit: sizeUnit, sizeInMB } = parseSizeRobust(rawSize);

    // C. Genre & Tags
    const rawGenre = row.genre || row.kategori || '';
    const genreArray = rawGenre.split(',').map(g => g.trim()).filter(g => g);
    const rawTags = row.tags || row.tag || '';
    const tagsArray = rawTags.split(',').map(t => t.trim()).filter(t => t);
    
    // D. Lokasi
    const location = row.location || row.lokasi || row.akun || row.email || '';

    // E. Versi & Installer
    const version = row.version || row.versi || row['game version'] || 'v1.0';
    
    let installerType = row.installer || row['installer type'] || row['tipe installer'] || row.type || row.tipe || 'PRE INSTALLED';
    const upperType = installerType.toUpperCase();
    if (upperType.includes('GOG')) installerType = 'INSTALLER GOG';
    else if (upperType.includes('ELAMIGOS')) installerType = 'INSTALLER ElAmigos';
    else if (upperType.includes('RUNE')) installerType = 'INSTALLER RUNE';
    else if (upperType.includes('FITGIRL')) installerType = 'INSTALLER FITGIRL';
    else if (upperType.includes('DODI')) installerType = 'INSTALLER DODI';
    else if (upperType.includes('PRE')) installerType = 'PRE INSTALLED';

    // F. Jumlah Part
    const rawParts = row.parts || row.part || row['jumlah part'] || row['total part'] || '1';
    const numberOfParts = parseInt(rawParts) || 1;

    return {
      title: title,
      title_lower: title.toLowerCase(),
      platform: 'PC',
      
      version: version,
      installerType: installerType,
      numberOfParts: numberOfParts,
      
      size: sizeValue,
      sizeUnit: sizeUnit,
      sortableSize: sizeInMB, // Sorting logic
      
      genre: genreArray,
      tags: tagsArray,
      location: location,
      
      status: 'Available',
      
      lastVersionDate: Timestamp.now(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      addedBy: 'Bulk CSV Import'
    };
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsProcessing(true);
    setUploadProgress(0);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
      const dataLines = lines.slice(1);
      const headers = lines[0].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));
      
      const allData = dataLines.map(line => {
        const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
        const row = {};
        headers.forEach((h, i) => row[h] = values[i] || '');
        return mapRowToFirestore(row);
      });

      const BATCH_SIZE = 400;
      const totalBatches = Math.ceil(allData.length / BATCH_SIZE);

      try {
        for (let i = 0; i < totalBatches; i++) {
          const batch = writeBatch(db);
          const chunk = allData.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
          chunk.forEach(gameData => {
            const newRef = doc(collection(db, 'games'));
            batch.set(newRef, gameData);
          });
          await batch.commit();
          setUploadProgress(Math.round(((i + 1) / totalBatches) * 100));
        }

        Swal.fire({ title: 'Import Selesai!', text: `Berhasil mengimpor ${allData.length} game.`, icon: 'success' });
        onSuccess(); onClose(); setFile(null); setPreviewData([]);
      } catch (error) {
        console.error("Bulk Import Error:", error);
        Swal.fire('Gagal', 'Terjadi kesalahan saat upload.', 'error');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2"><UploadCloud size={20} className="text-blue-600"/> Import Game dari CSV</h3>
          <button onClick={onClose} disabled={isProcessing} className="p-2 hover:bg-slate-200 rounded-full"><X size={20} className="text-slate-500" /></button>
        </div>
        <div className="p-6 space-y-6 overflow-y-auto">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
            <div className="flex items-center gap-2 font-bold mb-2"><Info size={16}/> Format Kolom CSV</div>
            <p className="mb-2">Gunakan baris pertama sebagai Header. Format Size fleksibel (contoh: "45 GB", "500MB", "429,5 MB").</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <ul className="list-disc list-inside space-y-1 text-xs opacity-90 font-mono">
                    <li>Judul / Title</li>
                    <li>Size (cth: "429 MB")</li>
                    <li>Lokasi / Akun</li>
                    <li>Genre (Pisahkan koma)</li>
                </ul>
                <ul className="list-disc list-inside space-y-1 text-xs opacity-90 font-mono">
                    <li>Jumlah Part (cth: "5")</li>
                    <li>Versi (cth: "v1.0")</li>
                    <li>Tipe Installer (cth: "GOG")</li>
                    <li>Tags (Pisahkan koma)</li>
                </ul>
            </div>
          </div>
          {!file ? (
             <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors relative">
                <input type="file" accept=".csv" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>
                <FileSpreadsheet className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="font-medium text-slate-700">Klik atau Tarik file CSV ke sini</p>
             </div>
          ) : (
             <div className="space-y-4">
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-3"><FileSpreadsheet className="text-green-600" size={24} /><div><p className="text-sm font-bold text-slate-800">{file.name}</p><p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p></div></div>
                    <button onClick={() => { setFile(null); setPreviewData([]); }} className="text-xs text-red-500 font-medium hover:underline">Ganti File</button>
                </div>
                {previewData.length > 0 && (
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <div className="bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 border-b border-slate-200">Preview Data Mentah</div>
                        <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="bg-white border-b border-slate-100"><tr>{Object.keys(previewData[0]).map(key => (<th key={key} className="p-2 font-medium text-slate-500 uppercase whitespace-nowrap">{key}</th>))}</tr></thead><tbody className="divide-y divide-slate-50 bg-white">{previewData.map((row, idx) => (<tr key={idx}>{Object.values(row).map((val, i) => (<td key={i} className="p-2 text-slate-700 truncate max-w-[150px]">{val}</td>))}</tr>))}</tbody></table></div>
                    </div>
                )}
             </div>
          )}
          {isProcessing && (
            <div className="space-y-2"><div className="flex justify-between text-xs font-medium text-slate-600"><span>Mengupload...</span><span>{uploadProgress}%</span></div><div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden"><div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div></div></div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
            <button onClick={onClose} disabled={isProcessing} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-white transition-colors">Batal</button>
            <button onClick={handleUpload} disabled={!file || isProcessing} className="px-6 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-lg active:scale-95 transition-all">{isProcessing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/> Memproses...</> : <><UploadCloud className="w-4 h-4 mr-2"/> Mulai Import</>}</button>
        </div>
      </div>
    </div>
  );
};

export default BulkGameImportModal;