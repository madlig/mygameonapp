import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, writeBatch, doc } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { 
  Search, Plus, Filter, Trash2, Loader2, MapPin, Calendar, 
  Disc, Tag, ChevronLeft, ChevronRight, Upload, Layers, 
  ArrowUpDown, ArrowUp, ArrowDown, HardDrive, RefreshCw 
} from 'lucide-react';
import Swal from 'sweetalert2';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import GameFormModal from './components/GameFormModal';
import BulkGameImportModal from './components/BulkGameImportModal';
// IMPORT MODAL TASK
import TaskFormModal from '../tasks/components/TaskFormModal';

const GamesPage = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State Filter & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGenre, setFilterGenre] = useState('');
  
  // State Sorting
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

  // State Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; 

  // State Modal Games
  const [selectedIds, setSelectedIds] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // STATE MODAL TASK (BARU)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskPrefill, setTaskPrefill] = useState(null);

  // FETCH REALTIME
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'games'), (snapshot) => {
      const gamesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGames(gamesData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching games:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- LOGIKA FILTERING & SORTING ---
  const processedGames = useMemo(() => {
    let data = games.filter(game => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = (game.title || '').toLowerCase().includes(searchLower) || 
                            (game.location || '').toLowerCase().includes(searchLower);
      
      const matchesGenre = filterGenre === '' || 
          (Array.isArray(game.genre) 
              ? game.genre.some(g => g.toLowerCase().includes(filterGenre.toLowerCase()))
              : (game.genre || '').toLowerCase().includes(filterGenre.toLowerCase())
          );

      return matchesSearch && matchesGenre;
    });

    if (sortConfig.key) {
      data.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (aValue === undefined || aValue === null) aValue = '';
        if (bValue === undefined || bValue === null) bValue = '';

        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();

        if (sortConfig.key === 'createdAt' || sortConfig.key === 'lastVersionDate') {
            aValue = aValue?.seconds || 0;
            bValue = bValue?.seconds || 0;
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return data;
  }, [games, searchTerm, filterGenre, sortConfig]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterGenre]);

  const totalPages = Math.ceil(processedGames.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedGames = processedGames.slice(startIndex, startIndex + itemsPerPage);

  // --- HANDLERS ---
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleOpenAdd = () => { setEditingGame(null); setIsModalOpen(true); };
  const handleOpenEdit = (game) => { setEditingGame(game); setIsModalOpen(true); };
  
  // HANDLER BARU: UPDATE VERSI VIA TASK
  const handleUpdateVersion = (game, e) => {
    e.stopPropagation(); // Agar tidak membuka modal edit game
    setTaskPrefill({
        gameId: game.id,
        gameTitle: game.title,
        currentVersion: game.version
    });
    setIsTaskModalOpen(true);
  };

  const toggleSelection = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === displayedGames.length) setSelectedIds([]);
    else setSelectedIds(displayedGames.map(g => g.id));
  };

  const handleBulkDelete = async () => {
    const result = await Swal.fire({
      title: `Hapus ${selectedIds.length} Game?`,
      text: "Data yang dihapus tidak bisa dikembalikan.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Ya, Hapus Semua'
    });
    if (result.isConfirmed) {
      const batch = writeBatch(db);
      selectedIds.forEach(id => batch.delete(doc(db, 'games', id)));
      await batch.commit();
      setSelectedIds([]);
      Swal.fire('Terhapus!', 'Game terpilih telah dihapus.', 'success');
    }
  };

  const handleBulkStatus = async (newStatus) => {
    const batch = writeBatch(db);
    selectedIds.forEach(id => batch.update(doc(db, 'games', id), { status: newStatus }));
    await batch.commit();
    setSelectedIds([]);
    Swal.fire('Updated!', `Status ${selectedIds.length} game diubah jadi ${newStatus}.`, 'success');
  };

  const formatVersionDate = (timestamp) => {
    if (!timestamp) return '-';
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return format(date, 'd MMM yyyy', { locale: localeId });
  };

  const SortableHeader = ({ label, sortKey, width }) => {
    const isActive = sortConfig.key === sortKey;
    return (
        <th 
            className={`p-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors select-none ${width}`}
            onClick={() => handleSort(sortKey)}
        >
            <div className="flex items-center gap-1">
                {label}
                {isActive ? (
                    sortConfig.direction === 'asc' ? <ArrowUp size={14} className="text-blue-600"/> : <ArrowDown size={14} className="text-blue-600"/>
                ) : (
                    <ArrowUpDown size={14} className="text-slate-300 opacity-0 group-hover/table:opacity-50 hover:opacity-100"/>
                )}
            </div>
        </th>
    );
  };

  const MobileGameCard = ({ game }) => (
    <div 
      onClick={() => handleOpenEdit(game)}
      className={`bg-white p-4 rounded-xl border ${selectedIds.includes(game.id) ? 'border-blue-500 bg-blue-50/20' : 'border-slate-200'} shadow-sm relative active:scale-[0.98] transition-all`}
    >
      <div className="absolute top-3 right-3 z-10 p-2 -m-2" onClick={(e) => { e.stopPropagation(); toggleSelection(game.id); }}>
         <input 
            type="checkbox" 
            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            checked={selectedIds.includes(game.id)}
            readOnly
         />
      </div>

      <div className="pr-8 mb-2">
         <h3 className="font-bold text-slate-800 text-lg leading-snug mb-1">{game.title}</h3>
         <div className="flex flex-wrap gap-2 items-center">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border
                ${game.status === 'Available' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : ''}
                ${game.status === 'Maintenance' ? 'bg-amber-100 text-amber-700 border-amber-200' : ''}
                ${game.status === 'Broken' ? 'bg-red-100 text-red-700 border-red-200' : ''}
                ${game.status === 'Testing' ? 'bg-blue-100 text-blue-700 border-blue-200' : ''}
            `}>
                {game.status}
            </span>
            {game.version && (
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 font-medium flex items-center">
                    <Tag size={10} className="mr-1 opacity-50" /> {game.version}
                </span>
            )}
            {/* TOMBOL UPDATE MOBILE */}
            <button 
                onClick={(e) => handleUpdateVersion(game, e)}
                className="text-[10px] px-2 py-0.5 bg-purple-50 text-purple-600 rounded border border-purple-200 font-bold flex items-center active:bg-purple-100"
            >
                <RefreshCw size={10} className="mr-1"/> Update
            </button>
         </div>
      </div>

      <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs sm:text-sm text-slate-600 border-t border-slate-100 pt-3 mt-2">
         <div className="flex items-center">
            <HardDrive size={12} className="mr-2 text-slate-400" />
            <span className="font-mono font-medium">{game.size ? `${game.size} ${game.sizeUnit}` : '-'}</span>
         </div>
         
         <div className="flex items-center">
            {game.numberOfParts > 1 ? (
                <>
                    <Layers size={12} className="mr-2 text-slate-400" />
                    <span>{game.numberOfParts} Parts</span>
                </>
            ) : <span className="text-slate-300">-</span>}
         </div>

         <div className="col-span-2 flex items-center">
            <MapPin size={12} className="mr-2 text-blue-500 shrink-0" />
            <span className="truncate w-full">{game.location || '-'}</span>
         </div>
         
         <div className="col-span-2 flex items-center justify-between text-[10px] sm:text-xs text-slate-400">
             {game.installerType ? (
                <div className="flex items-center text-slate-500">
                    <Disc size={12} className="mr-1.5 text-purple-400" />
                    {game.installerType.replace('INSTALLER ', '')}
                </div>
             ) : <span></span>}
             <div className="flex items-center">
                <Calendar size={12} className="mr-1.5" />
                {formatVersionDate(game.lastVersionDate)}
             </div>
         </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Katalog Game PC</h1>
            <p className="text-slate-500 text-sm">Total {games.length} game dalam inventaris.</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
             <button onClick={() => setIsImportModalOpen(true)} className="flex-1 sm:flex-none justify-center bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-4 py-2 rounded-lg font-bold flex items-center shadow-sm transition-all active:scale-95 text-sm">
                <Upload size={16} className="mr-2" /> Import CSV
             </button>
             <button onClick={handleOpenAdd} className="flex-1 sm:flex-none justify-center bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-bold flex items-center shadow-lg transition-all active:scale-95 text-sm">
                <Plus size={16} className="mr-2" /> Tambah
             </button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm mb-4 flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
             <div className="relative flex-1 sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" placeholder="Cari judul, lokasi akun..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
             </div>
             <div className="relative w-full sm:w-auto">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select value={filterGenre} onChange={e => setFilterGenre(e.target.value)} className="w-full sm:w-auto pl-9 pr-8 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none cursor-pointer hover:bg-slate-50 appearance-none">
                    <option value="">Semua Genre</option>
                    <option value="Action">Action</option>
                    <option value="RPG">RPG</option>
                    <option value="Simulation">Simulation</option>
                    <option value="Strategy">Strategy</option>
                    <option value="Sports">Sports</option>
                    <option value="Racing">Racing</option>
                    <option value="Adventure">Adventure</option>
                </select>
             </div>
          </div>
          
          {selectedIds.length > 0 && (
             <div className="flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-right-5 w-full lg:w-auto justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                <span className="text-sm font-bold text-slate-700 mr-2">{selectedIds.length} Dipilih</span>
                <select onChange={(e) => { if(e.target.value) handleBulkStatus(e.target.value); }} className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 bg-white hover:bg-slate-50 cursor-pointer flex-grow lg:flex-grow-0" defaultValue="">
                    <option value="" disabled>Ubah Status...</option>
                    <option value="Available">Set Available</option>
                    <option value="Maintenance">Set Maintenance</option>
                    <option value="Broken">Set Broken</option>
                </select>
                <button onClick={handleBulkDelete} className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-lg transition-colors" title="Hapus Terpilih"><Trash2 size={18} /></button>
             </div>
          )}
        </div>

        <div className="flex flex-col min-h-[400px]">
          {/* MOBILE VIEW */}
          <div className="md:hidden space-y-3">
             {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-500" /></div>
             ) : processedGames.length === 0 ? (
                <div className="text-center py-10 text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">Tidak ada game ditemukan.</div>
             ) : (
                displayedGames.map(game => <MobileGameCard key={game.id} game={game} />)
             )}
          </div>

          {/* DESKTOP VIEW */}
          <div className="hidden md:flex bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-col flex-grow group/table">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th className="p-4 w-10"><input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" checked={selectedIds.length === displayedGames.length && displayedGames.length > 0} onChange={toggleSelectAll}/></th>
                        <SortableHeader label="Nama Game" sortKey="title" width="w-1/3" />
                        <SortableHeader label="Size" sortKey="sortableSize" width="w-24" />
                        <SortableHeader label="Status" sortKey="status" width="w-32" />
                        <SortableHeader label="Location" sortKey="location" width="w-1/4" />
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Info File</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                    {loading ? (
                        <tr><td colSpan="6" className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" /></td></tr>
                    ) : processedGames.length === 0 ? (
                        <tr><td colSpan="6" className="p-8 text-center text-slate-500">Tidak ada game ditemukan.</td></tr>
                    ) : (
                        displayedGames.map(game => (
                        <tr key={game.id} className={`group hover:bg-slate-50 transition-colors cursor-pointer ${selectedIds.includes(game.id) ? 'bg-blue-50/50' : ''}`} onClick={() => handleOpenEdit(game)}>
                            <td className="p-4" onClick={(e) => { e.stopPropagation(); toggleSelection(game.id); }}><input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" checked={selectedIds.includes(game.id)} readOnly/></td>
                            <td className="p-4">
                                <div className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{game.title}</div>
                                {game.version && (
                                    <div className="flex items-center mt-1">
                                        <Tag size={10} className="mr-1 text-slate-400" />
                                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">{game.version}</span>
                                    </div>
                                )}
                            </td>
                            <td className="p-4">
                                <div className="text-sm text-slate-600 font-mono whitespace-nowrap">{game.size ? `${game.size} ${game.sizeUnit}` : '-'}</div>
                                {game.numberOfParts > 1 && (
                                    <div className="flex items-center mt-1 text-[10px] text-slate-400 font-medium">
                                        <Layers size={10} className="mr-1" /> {game.numberOfParts} Parts
                                    </div>
                                )}
                            </td>
                            <td className="p-4">
                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase
                                    ${game.status === 'Available' ? 'bg-emerald-100 text-emerald-700' : ''}
                                    ${game.status === 'Maintenance' ? 'bg-amber-100 text-amber-700' : ''}
                                    ${game.status === 'Broken' ? 'bg-red-100 text-red-700' : ''}
                                    ${game.status === 'Testing' ? 'bg-blue-100 text-blue-700' : ''}
                                `}>{game.status}</span>
                            </td>
                            <td className="p-4">
                                <div className="flex items-center text-sm text-slate-600 font-medium"><MapPin size={14} className="mr-1.5 text-blue-500 shrink-0" /><span className="truncate max-w-[180px]" title={game.location}>{game.location || '-'}</span></div>
                            </td>
                            <td className="p-4 text-xs text-slate-500 relative">
                                {/* INFO BIASA */}
                                <div>
                                    {game.installerType && (
                                        <div className="flex items-center mb-1 text-slate-700 font-medium"><Disc size={12} className="mr-1 text-purple-500" />{game.installerType.replace('INSTALLER ', '')}</div>
                                    )}
                                    <div className="flex items-center opacity-70"><Calendar size={12} className="mr-1" />{formatVersionDate(game.lastVersionDate)}</div>
                                </div>
                                
                                {/* BUTTON UPDATE (Tampil saat hover) */}
                                <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={(e) => handleUpdateVersion(game, e)}
                                        className="p-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 font-bold text-xs flex items-center shadow-sm"
                                        title="Buat Task Update Versi"
                                    >
                                        <RefreshCw size={14} className="mr-1"/> Update
                                    </button>
                                </div>
                            </td>
                        </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>
          </div>
          
          <div className="mt-4 md:mt-0 border-t border-slate-200 p-4 bg-white md:bg-slate-50 rounded-xl md:rounded-t-none md:rounded-b-xl shadow-sm md:shadow-none border md:border-t-0 border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
             <div className="text-xs text-slate-500 text-center sm:text-left">
                Menampilkan {startIndex + 1}-{Math.min(startIndex + itemsPerPage, processedGames.length)} dari {processedGames.length} game
             </div>
             {totalPages > 1 && (
                 <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600"><ChevronLeft size={16} /></button>
                    <span className="text-sm font-medium text-slate-700 whitespace-nowrap">Hal {currentPage} / {totalPages}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600"><ChevronRight size={16} /></button>
                 </div>
             )}
          </div>
        </div>
      </div>
      
      {/* MODAL EDIT GAME */}
      <GameFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} initialData={editingGame} onSuccess={() => {}} />
      
      {/* MODAL IMPORT */}
      <BulkGameImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onSuccess={() => {}} />

      {/* MODAL TASK (UPDATE VERSI) */}
      <TaskFormModal 
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        prefillData={taskPrefill} // Data dari tombol update
        onSuccess={() => {}}
      />
    </div>
  );
};

export default GamesPage;