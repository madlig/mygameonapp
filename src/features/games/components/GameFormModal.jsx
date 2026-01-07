import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Save, Loader2, HardDrive, MapPin, Gamepad2, Tag, Calendar, Trash2, Plus, Disc, Info, Layers } from 'lucide-react';
import { collection, addDoc, updateDoc, doc, serverTimestamp, Timestamp, deleteDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../../config/firebaseConfig';
import Swal from 'sweetalert2';

const GameFormModal = ({ isOpen, onClose, initialData, prefillData, originRequestId, onSuccess }) => {
  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      title: '',
      platform: 'PC',
      version: 'v1.0', 
      installerType: 'PRE INSTALLED',
      numberOfParts: 1, // FIELD BARU
      size: '',
      sizeUnit: 'GB',
      genre: '',
      tags: '',
      location: '',
      status: 'Available',
      lastVersionDate: new Date().toISOString().split('T')[0]
    }
  });

  const [locationsList, setLocationsList] = useState([]);
  const [genresList, setGenresList] = useState([]);
  const [tagsList, setTagsList] = useState([]);

  useEffect(() => {
    if (isOpen) {
      const fetchDropdowns = async () => {
        try {
          const locSnap = await getDocs(query(collection(db, 'emailLocations'), orderBy('name')));
          setLocationsList(locSnap.docs.map(d => ({ id: d.id, name: d.data().name })));

          const genreSnap = await getDocs(query(collection(db, 'genres'), orderBy('name')));
          setGenresList(genreSnap.docs.map(d => ({ id: d.id, name: d.data().name })));

          const tagSnap = await getDocs(query(collection(db, 'tags'), orderBy('name')));
          setTagsList(tagSnap.docs.map(d => ({ id: d.id, name: d.data().name })));
        } catch (error) {
          console.error("Error fetching dropdowns:", error);
        }
      };
      fetchDropdowns();

      if (initialData) {
        setValue('title', initialData.title);
        setValue('platform', initialData.platform || 'PC');
        setValue('version', initialData.version || '');
        setValue('installerType', initialData.installerType || 'PRE INSTALLED');
        setValue('numberOfParts', initialData.numberOfParts || 1); // Load Data
        setValue('size', initialData.size || '');
        setValue('sizeUnit', initialData.sizeUnit || 'GB');
        setValue('location', initialData.location || '');
        setValue('status', initialData.status || 'Available');
        setValue('genre', Array.isArray(initialData.genre) ? initialData.genre.join(', ') : (initialData.genre || ''));
        setValue('tags', Array.isArray(initialData.tags) ? initialData.tags.join(', ') : (initialData.tags || ''));
        if (initialData.lastVersionDate?.seconds) {
            const date = new Date(initialData.lastVersionDate.seconds * 1000);
            setValue('lastVersionDate', date.toISOString().split('T')[0]);
        }
      } else if (prefillData) {
        reset({
          title: prefillData.title || '',
          platform: prefillData.platform || 'PC',
          version: '',
          installerType: 'PRE INSTALLED',
          numberOfParts: 1,
          size: '', sizeUnit: 'GB',
          genre: '', tags: '', location: '', status: 'Available',
          lastVersionDate: new Date().toISOString().split('T')[0]
        });
      } else {
        reset({
          title: '', platform: 'PC', version: '', installerType: 'PRE INSTALLED', numberOfParts: 1,
          size: '', sizeUnit: 'GB',
          genre: '', tags: '', location: '', status: 'Available',
          lastVersionDate: new Date().toISOString().split('T')[0]
        });
      }
    }
  }, [isOpen, initialData, prefillData, reset, setValue]);

  const handleAddNew = async (collectionName, label) => {
    const { value: text } = await Swal.fire({
      title: `Tambah ${label} Baru`,
      input: 'text',
      inputLabel: `Masukkan nama ${label}`,
      showCancelButton: true,
      inputValidator: (value) => { if (!value) return 'Tidak boleh kosong!'; }
    });

    if (text) {
      try {
        const docRef = await addDoc(collection(db, collectionName), { name: text, createdAt: serverTimestamp() });
        const newItem = { id: docRef.id, name: text };
        
        const sortFunc = (a, b) => a.name.localeCompare(b.name);
        if (collectionName === 'emailLocations') setLocationsList(prev => [...prev, newItem].sort(sortFunc));
        if (collectionName === 'genres') setGenresList(prev => [...prev, newItem].sort(sortFunc));
        if (collectionName === 'tags') setTagsList(prev => [...prev, newItem].sort(sortFunc));

        if (collectionName === 'emailLocations') appendToInput('location', text);
        if (collectionName === 'genres') appendToInput('genre', text);
        if (collectionName === 'tags') appendToInput('tags', text);
        
        Swal.fire({ icon: 'success', title: 'Ditambahkan!', timer: 1000, showConfirmButton: false });
      } catch (e) {
        Swal.fire('Error', 'Gagal menyimpan data baru', 'error');
      }
    }
  };

  const appendToInput = (fieldName, value) => {
    const currentVal = watch(fieldName) || '';
    if (!currentVal.includes(value)) {
        const newVal = currentVal ? `${currentVal}, ${value}` : value;
        setValue(fieldName, newVal);
    }
  };

  const onSubmit = async (data) => {
    try {
      const genreArray = data.genre ? data.genre.split(',').map(g => g.trim()).filter(g => g !== '') : [];
      const tagsArray = data.tags ? data.tags.split(',').map(t => t.trim()).filter(t => t !== '') : [];
      const sizeValue = parseFloat(data.size);
      let sizeInMB = data.sizeUnit === 'GB' ? sizeValue * 1024 : sizeValue;

      const gameData = {
        title: data.title,
        title_lower: data.title.toLowerCase(),
        platform: data.platform,
        version: data.version,
        installerType: data.installerType,
        numberOfParts: parseInt(data.numberOfParts) || 1, // SAVE FIELD BARU
        size: sizeValue,
        sizeUnit: data.sizeUnit,
        sortableSize: sizeInMB,
        genre: genreArray,
        tags: tagsArray,
        status: data.status,
        location: data.location, 
        lastVersionDate: Timestamp.fromDate(new Date(data.lastVersionDate)),
        updatedAt: serverTimestamp()
      };

      if (initialData) {
        await updateDoc(doc(db, 'games', initialData.id), gameData);
        Swal.fire({ title: 'Diupdate!', text: 'Data game diperbarui', icon: 'success', timer: 1500, showConfirmButton: false });
      } else {
        gameData.createdAt = serverTimestamp();
        gameData.addedBy = originRequestId ? 'Request Approval' : 'Manual Admin';
        if (originRequestId) gameData.originRequestId = originRequestId;

        await addDoc(collection(db, 'games'), gameData);

        if (originRequestId) {
             await updateDoc(doc(db, 'requests', originRequestId), {
                status: 'completed',
                approvedAt: serverTimestamp(),
                finalGameTitle: data.title
             });
        }
        Swal.fire({ title: 'Tersimpan!', icon: 'success', timer: 1500, showConfirmButton: false });
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving:", error);
      Swal.fire({ title: 'Error', text: 'Gagal menyimpan data.', icon: 'error' });
    }
  };

  const handleDelete = async () => {
    const result = await Swal.fire({ title: 'Hapus Game?', text: "Data hilang permanen!", icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Ya, Hapus' });
    if (result.isConfirmed) {
      await deleteDoc(doc(db, 'games', initialData.id));
      onSuccess(); onClose();
      Swal.fire('Terhapus!', '', 'success');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[95vh]">
        
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
          <h3 className="font-bold text-slate-800 text-lg">
            {initialData ? 'Edit Data Game' : 'Tambah Game Baru'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full"><X size={20} className="text-slate-500" /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
          
          {/* 1. INFORMASI UTAMA */}
          <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                 <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Judul Game</label>
                    <input {...register("title", { required: "Wajib" })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Nama Game..." />
                 </div>
                 <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Versi</label>
                    <input {...register("version")} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="v1.0" />
                 </div>
              </div>

              {/* TIPE & PART (Grid Baru) */}
              <div className="grid grid-cols-3 gap-3">
                 <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center"><Disc size={12} className="mr-1 text-slate-400"/> Tipe Installer</label>
                    <select {...register("installerType")} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white">
                        <option value="PRE INSTALLED">PRE INSTALLED (Langsung Main)</option>
                        <option value="INSTALLER GOG">INSTALLER GOG (Setup.exe)</option>
                        <option value="INSTALLER ElAmigos">INSTALLER ElAmigos</option>
                        <option value="INSTALLER RUNE">INSTALLER RUNE</option>
                        <option value="INSTALLER FITGIRL">INSTALLER FITGIRL</option>
                        <option value="INSTALLER DODI">INSTALLER DODI</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center"><Layers size={12} className="mr-1 text-slate-400"/> Jml Part</label>
                    <input type="number" min="1" {...register("numberOfParts")} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-center" />
                 </div>
              </div>
          </div>

          <div className="border-t border-slate-100"></div>

          {/* 2. TEKNIS & STATUS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center"><HardDrive size={12} className="mr-1 text-slate-400" /> Size</label>
                <div className="flex gap-2">
                    <input type="number" step="0.1" {...register("size", { required: "Wajib" })} className="w-full min-w-0 px-3 py-2 border border-slate-300 rounded-lg outline-none" placeholder="0" />
                    <select {...register("sizeUnit")} className="w-20 shrink-0 px-2 py-2 border border-slate-300 rounded-lg bg-slate-50 text-sm font-medium">
                        <option value="GB">GB</option>
                        <option value="MB">MB</option>
                    </select>
                </div>
            </div>
            <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Status Game</label>
                <select {...register("status")} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white">
                    <option value="Available">Available</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Broken">Broken</option>
                    <option value="Testing">Testing</option>
                </select>
            </div>
          </div>

          {/* 3. LOKASI AKUN */}
          <div>
            <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700 flex items-center"><MapPin size={12} className="mr-1 text-blue-600" /> Lokasi Akun (Backup Supported)</label>
                <div className="flex gap-2">
                    <select 
                        onChange={(e) => appendToInput('location', e.target.value)} 
                        className="text-[10px] border border-slate-200 rounded bg-slate-50 max-w-[150px]"
                        value=""
                    >
                        <option value="">+ Tambah Akun...</option>
                        {locationsList.map(loc => <option key={loc.id} value={loc.name}>{loc.name}</option>)}
                    </select>
                    <button type="button" onClick={() => handleAddNew('emailLocations', 'Lokasi Akun')} className="text-[10px] text-blue-600 hover:underline flex items-center"><Plus size={10} className="mr-1"/> Baru</button>
                </div>
            </div>
            <input 
                {...register("location", { required: "Wajib diisi" })} 
                placeholder="mygameon1@gmail.com, mygameonbackup@gmail.com" 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white outline-none text-sm font-medium text-slate-700"
            />
          </div>

          <div className="border-t border-slate-100"></div>

          {/* 4. GENRE & TAGS */}
          <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-medium text-slate-700 flex items-center"><Gamepad2 size={12} className="mr-1 text-slate-400" /> Genre</label>
                    <div className="flex gap-2">
                        <select onChange={(e) => appendToInput('genre', e.target.value)} className="text-[10px] border border-slate-200 rounded bg-slate-50 max-w-[100px]" value="">
                            <option value="">+ Pilih...</option>
                            {genresList.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
                        </select>
                        <button type="button" onClick={() => handleAddNew('genres', 'Genre')} className="text-[10px] text-blue-600 hover:underline"><Plus size={10}/></button>
                    </div>
                </div>
                <input {...register("genre")} placeholder="Action, RPG..." className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none text-sm" />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-medium text-slate-700 flex items-center"><Tag size={12} className="mr-1 text-slate-400" /> Tags</label>
                    <div className="flex gap-2">
                        <select onChange={(e) => appendToInput('tags', e.target.value)} className="text-[10px] border border-slate-200 rounded bg-slate-50 max-w-[100px]" value="">
                            <option value="">+ Pilih...</option>
                            {tagsList.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                        </select>
                        <button type="button" onClick={() => handleAddNew('tags', 'Tag')} className="text-[10px] text-blue-600 hover:underline"><Plus size={10}/></button>
                    </div>
                </div>
                <input {...register("tags")} placeholder="Low Spec, AAA..." className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none text-sm bg-slate-50" />
              </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1"><Calendar size={12} className="inline mr-1" /> Versi Terupdate Per Tanggal</label>
            <input type="date" {...register("lastVersionDate")} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none text-sm" />
          </div>

          {/* Actions */}
          <div className="pt-4 flex gap-3 border-t border-slate-100 mt-4">
            {initialData && (
                <button type="button" onClick={handleDelete} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><Trash2 size={18} /></button>
            )}
            <div className="flex-1 flex gap-3">
                <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium">Batal</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-bold flex items-center justify-center">
                    {isSubmitting ? <Loader2 className="animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Simpan</>}
                </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GameFormModal;