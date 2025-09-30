// src/modals/GameFormModal.jsx

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { db, storage, collection, getDocs, query, where, deleteDoc, doc } from "../../../config/firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Import komponen UI lainnya
import MultiSelectDropdown from "../../../components/forms/MultiSelectDropDown";
import UnitSelector from "../../../components/forms/UnitSelector";
import StatusSelector from "../../../components/forms/StatusSelector.jsx"
import AddLocationModal from "../../../modals/AddLocationModal";
import AddGenreModal from "../../../modals/AddGenreModal";

// Skema validasi (tetap sama)
const schema = yup.object().shape({
  name: yup.string().required("Name is required"),
  version: yup.string().nullable(),
  size: yup.number().typeError("Size must be a number").required("Size is required").positive("Size must be positive"),
  unit: yup.string().required("Unit is required"),
  jumlahPart: yup.number().typeError("Jumlah Part must be a number").required("Jumlah Part is required").integer("Jumlah Part must be an integer").min(1, "Jumlah Part must be at least 1"),
  platform: yup.string().required("Platform is required"),
  locations: yup.array().min(1, "At least one location is required"),
  genre: yup.array().min(1, "At least one genre is required"),
  shopeeLink: yup.string().nullable(),
  status: yup.string().required("Status is required"),
  dateAdded: yup
    .date()
    .required("Date Added is required")
    .max(new Date(), "Tanggal tidak boleh melebihi hari ini"),
  description: yup.string().nullable(),
});

const GameFormModal = ({ isOpen, onClose, onSubmit, initialData = null }) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: initialData || {
      // Nilai default untuk form tambah
      name: "", version: "", size: "", unit: "MB", jumlahPart: "",
      platform: "", locations: [], genre: [], shopeeLink: "", status: "",
      dateAdded: new Date().toISOString().split("T")[0], description: "",
    },
  });

  // Tentukan mode berdasarkan initialData
  const isEditMode = Boolean(initialData);

  const watchedGenres = watch('genre') || [];
  const watchedLocations = watch('locations') || [];
  const watchedUnit = watch('unit');
  const watchedStatus = watch('status');

  // State untuk UI
  const [coverImage, setCoverImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [isImageRemoved, setIsImageRemoved] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState("MB");
  const [selectedStatus, setSelectedStatus] = useState("");

  // State untuk data dropdown
  const [allGenres, setAllGenres] = useState([]);
  const [allLocations, setAllLocations] = useState([]);

  // State untuk modal "Add New"
  const [isAddGenreModalOpen, setIsAddGenreModalOpen] = useState(false);
  const [isAddLocationModalOpen, setIsAddLocationModalOpen] = useState(false);

  // --- EFEK UNTUK MENGAMBIL DATA DROPDOWN ---
  useEffect(() => {
    const fetchDropdownData = async () => {
      // Fetch Genres
      const genresSnapshot = await getDocs(collection(db, "genres"));
      setAllGenres(genresSnapshot.docs.map(doc => doc.data().name));
      
      // Fetch Locations
      const locationsSnapshot = await getDocs(collection(db, "emailLocations"));
      setAllLocations(locationsSnapshot.docs.map(doc => doc.data().email));
    };
    fetchDropdownData();
  }, []);

  
  // Efek untuk mengisi form saat initialData berubah (mode edit)
  useEffect(() => {
    if (isEditMode && initialData) {
      const dateFromFirestore = initialData.dateAdded?.toDate ? initialData.dateAdded.toDate() : null;
      
      let formattedDate = '';
      if (dateFromFirestore) {
        // *** PERBAIKAN: Mengatasi masalah zona waktu ***
        // Ambil tahun, bulan, dan tanggal dari tanggal lokal untuk menghindari pergeseran
        const year = dateFromFirestore.getFullYear();
        const month = String(dateFromFirestore.getMonth() + 1).padStart(2, '0'); // Bulan dimulai dari 0
        const day = String(dateFromFirestore.getDate()).padStart(2, '0');
        formattedDate = `${year}-${month}-${day}`;
      }
      
      const formValues = {
        ...initialData,
        dateAdded: formattedDate, // Gunakan tanggal yang sudah diformat dengan benar
        size: parseFloat(initialData.size) || "",
        unit: (initialData.size || " MB").split(" ")[1] || "MB",
      };
      reset(formValues);

      setValue('dateAdded', formattedDate);

      // 3. Atur state untuk komponen kustom
      const unit = (initialData.size || " MB").split(" ")[1] || "MB";
      setSelectedUnit(unit);
      setSelectedStatus(initialData.status || "");
      if (initialData.coverArtUrl) {
        setImagePreview(initialData.coverArtUrl);
      }
    } else {
      // Atur nilai default untuk mode "Tambah Baru"
      reset({
        name: "", version: "", size: "", unit: "MB", jumlahPart: "",
        platform: "", location: "", genre: [], status: "",
        dateAdded: new Date().toISOString().split("T")[0], description: "",
        shopeeLink: "",
      });
      // Kosongkan juga state kustom
      setImagePreview('');
      setCoverImage(null);
      setSelectedStatus("");
      setSelectedUnit("MB");
    }
  }, [initialData, isEditMode, reset]);

  // // Efek untuk sinkronisasi selector (tidak berubah)
  // useEffect(() => {
  //   setValue("genre", selectedGenres);
  //   setValue("unit", selectedUnit);
  //   setValue("status", selectedStatus);
  //   setValue("locations", selectedLocations);
  // }, [selectedGenres, selectedUnit, selectedStatus, selectedLocation, setValue]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverImage(file);
      setImagePreview(URL.createObjectURL(file));
      setIsImageRemoved(false);
    }
  };

  const handleRemoveImage = () => {
    setCoverImage(null); // Hapus file baru jika ada
    setImagePreview(''); // Hapus preview
    setIsImageRemoved(true); // Tandai bahwa gambar ingin dihapus
  };

  const handleDeleteOption = async (optionValue, collectionName, fieldName) => {
    // Konfirmasi sebelum menghapus
    const confirmDelete = window.confirm(`Apakah Anda yakin ingin menghapus "${optionValue}" secara permanen?`);
    if (!confirmDelete) return;

    try {
      // Cari dokumen yang sesuai di Firestore
      const q = query(collection(db, collectionName), where(fieldName, "==", optionValue));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        alert("Opsi tidak ditemukan untuk dihapus.");
        return;
      }

      // Hapus dokumen yang ditemukan
      const docToDelete = snapshot.docs[0];
      await deleteDoc(doc(db, collectionName, docToDelete.id));

      // Perbarui state lokal untuk menghilangkan opsi dari UI
      if (collectionName === 'genres') {
        setAllGenres(prev => prev.filter(g => g !== optionValue));
        // Juga hapus dari pilihan yang aktif jika ada
        setValue('genre', watch('genre').filter(g => g !== optionValue));
      } else if (collectionName === 'emailLocations') {
        setAllLocations(prev => prev.filter(l => l !== optionValue));
        setValue('locations', watch('locations').filter(l => l !== optionValue));
      }
      
      alert(`"${optionValue}" berhasil dihapus.`);

    } catch (error) {
      console.error("Error deleting option:", error);
      alert("Gagal menghapus opsi.");
    }
  };

  const onSubmitHandler = async (data) => {
    setUploading(true);
    let finalCoverArtUrl = initialData?.coverArtUrl || '';

    if (isImageRemoved) {
      finalCoverArtUrl = '';
    }
    // 1. Unggah gambar HANYA JIKA ada file baru yang dipilih
    else if (coverImage) {
      const fileName = `covers/${data.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`;
      const storageRef = ref(storage, fileName);
      try {
        const snapshot = await uploadBytes(storageRef, coverImage);
        finalCoverArtUrl = await getDownloadURL(snapshot.ref);
      } catch (error) {
        console.error("Error uploading image:", error);
        alert("Gagal mengunggah gambar.");
        setUploading(false);
        return;
      }
    }

    // 2. Simpan data game ke Firestore
    try {
      const localDate = data.dateAdded;
      const dateInUTC = new Date(Date.UTC(
        localDate.getFullYear(),
        localDate.getMonth(),
        localDate.getDate(),
      ));

      const finalData = {
        name: data.name,
        version: data.version || "",
        size: `${data.size} ${data.unit}`,
        jumlahPart: data.jumlahPart,
        platform: data.platform,
        coverArtUrl: finalCoverArtUrl,
        genre: data.genre,
        shopeeLink: data.shopeeLink || "",
        status: data.status,
        dateAdded: dateInUTC,
        description: data.description || "",
        locations: data.locations,
    };

      await onSubmit(finalData, initialData?.id); // Kirim data dan ID (jika ada)
        onClose(); // Tutup modal setelah parent selesai
    } catch (error) {
        console.error("Gagal menyimpan game:", error);
        alert("Terjadi kesalahan saat menyimpan data.");
    } finally {
        setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="p-6 pb-4 border-b">
          <h2 className="text-xl font-bold">{isEditMode ? "Edit Game" : "Add New Game"}</h2>
        </div>

        <form 
          onSubmit={handleSubmit(onSubmitHandler)}
          className="p-6 overflow-y-auto flex-grow space-y-4"
        >
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
            <input
              id="name"
              {...register("name")}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
          </div>
          <div>
            <label htmlFor="version" className="block text-sm font-medium mb-1">Version</label>
            <input
              id="version"
              {...register("version")}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.version && <p className="text-red-500 text-sm">{errors.version.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="size" className="block text-sm font-medium mb-1">Size</label>
              <input
                id="size"
                type="number"
                {...register("size")}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.size && <p className="text-red-500 text-sm">{errors.size.message}</p>}
            </div>

            {/* Unit Selector */}
            <div>
              <label className="block text-sm font-medium mb-1">Unit</label>
              <UnitSelector
                selectedUnit={watchedUnit}
                onSelect={(unit) => setValue("unit", unit)}
              />
              {errors.unit && <p className="text-red-500 text-sm">{errors.unit.message}</p>}
            </div>
          </div>
          <div>
            <label htmlFor="jumlahPart" className="block text-sm font-medium mb-1">Jumlah Part</label>
            <input
              id="jumlahPart"
              type="number"
              {...register("jumlahPart")}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.jumlahPart && <p className="text-red-500 text-sm">{errors.jumlahPart.message}</p>}
          </div>
          {/* New Field: Platform */}
          <div>
            <label htmlFor="platform" className="block text-sm font-medium mb-1">Platform</label>
            <input
              id="platform"
              {...register("platform")}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.platform && <p className="text-red-500 text-sm">{errors.platform.message}</p>}
          </div>
          <div>
            <label htmlFor="shopeeLink" className="block text-sm font-medium mb-1">Shopee Link (Opsional)</label>
            <input
              id="shopeeLink"
              type="url"
              {...register("shopeeLink")}
              placeholder="https://shopee.co.id/..."
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.shopeeLink && <p className="text-red-500 text-sm">{errors.shopeeLink.message}</p>}
          </div>
          {/* Cover Art URL (Sekarang Opsional) */}
          <div>
            <label htmlFor="coverArt" className="block text-sm font-medium mb-1">Cover Art</label>
            <input 
              type="file" 
              id="coverArt" 
              accept="image/*" 
              onChange={handleImageChange} 
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {imagePreview && (
              <div className="mt-4 relative w-32 h-32">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-md" />
                {/* Tombol Hapus hanya muncul di mode edit */}
                {isEditMode && (
                  <button 
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 leading-none hover:bg-red-700"
                    aria-label="Remove image"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Location Selector */}
          <div>
              <label className="block text-sm font-medium mb-2">Locations</label>
              <MultiSelectDropdown
                options={allLocations}
                selectedOptions={watchedLocations}
                onChange={(newLocations) => setValue('locations', newLocations)}
                onAddNew={() => setIsAddLocationModalOpen(true)}
                onDelete={(location) => handleDeleteOption(location, 'emailLocations', 'email')}
                placeholderText="Select Locations"
              />
              {errors.locations && <p className="text-red-500 text-sm">{errors.locations.message}</p>}
            </div>
          
          {/* Genre Selector */}
          <div>
              <label className="block text-sm font-medium mb-2">Genre</label>
              <MultiSelectDropdown
                options={allGenres}
                selectedOptions={watchedGenres}
                onChange={(newGenres) => setValue('genre', newGenres)}
                onAddNew={() => setIsAddGenreModalOpen(true)}
                onDelete={(genre) => handleDeleteOption(genre, 'genres', 'name')}
                placeholderText="Select Genres"
              />
              {errors.genre && <p className="text-red-500 text-sm">{errors.genre.message}</p>}
            </div>
          
          {/* Status Selector */}
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <StatusSelector
              selectedStatus={watchedStatus}
              onSelect={(status) => setValue("status", status)}
            />
            {errors.status && <p className="text-red-500 text-sm">{errors.status.message}</p>}
          </div>
          
          {/* Date Added */}
          <div>
            <label htmlFor="dateAdded" className="block text-sm font-medium mb-1">Date Added</label>
            <input
              id="dateAdded"
              type="date"
              {...register("dateAdded")}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.dateAdded && <p className="text-red-500 text-sm">{errors.dateAdded.message}</p>}
          </div>
          
          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
            <textarea
              id="description"
              {...register("description")}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
            {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
          </div>
        </form>

        <div className="p-6 pt-4 border-t flex justify-end space-x-4">
          <button type="button" onClick={onClose} disabled={uploading} className="px-4 py-2 bg-gray-300 rounded">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit(onSubmitHandler)} disabled={uploading} className="px-4 py-2 bg-blue-500 text-white rounded">
            {uploading ? "Saving..." : (isEditMode ? "Save Changes" : "Add New Game")}
          </button>
        </div>
        {/* Modal untuk Add New Location */}
        <AddLocationModal
          showModal={isAddLocationModalOpen}
          onClose={() => setIsAddLocationModalOpen(false)}
          onAddLocation={(newLocation) => {
            setAllLocations(prev => [...prev, newLocation]);
          }}
        />
        
        {/* Modal untuk Add New Genre */}
        <AddGenreModal
          isOpen={isAddGenreModalOpen}
          onClose={() => setIsAddGenreModalOpen(false)}
          onAddGenre={(newGenre) => {
            setAllGenres(prev => [...prev, newGenre]);
          }}
        />
      </div>
    </div>
  );
};

export default GameFormModal;