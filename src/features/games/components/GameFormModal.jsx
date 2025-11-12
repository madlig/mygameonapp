import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { collection, getDocs, query, where, deleteDoc, doc } from "../../../config/firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage, db } from "../../../config/firebaseConfig"; // pastikan path benar

import MultiSelectDropdown from "../../../components/forms/MultiSelectDropDown";
import UnitSelector from "../../../components/forms/UnitSelector";
import StatusSelector from "../../../components/forms/StatusSelector.jsx";
import AddLocationModal from "../../../modals/AddLocationModal";
import AddGenreModal from "../../../modals/AddGenreModal";
import CloseButton from "../../../components/common/CloseButton";

// Skema validasi
const schema = yup.object().shape({
  name: yup.string().required("Name is required"),
  version: yup.string().nullable(),
  size: yup
    .number()
    .typeError("Size must be a number")
    .required("Size is required")
    .positive("Size must be positive"),
  unit: yup.string().required("Unit is required"),
  jumlahPart: yup
    .number()
    .typeError("Jumlah Part must be a number")
    .required("Jumlah Part is required")
    .integer("Jumlah Part must be an integer")
    .min(1, "Jumlah Part must be at least 1"),
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
      name: "",
      version: "",
      size: "",
      unit: "MB",
      jumlahPart: "",
      platform: "",
      locations: [],
      genre: [],
      shopeeLink: "",
      status: "",
      dateAdded: new Date().toISOString().split("T")[0],
      description: "",
    },
  });

  const isEditMode = Boolean(initialData);
  const watchedGenres = watch("genre") || [];
  const watchedLocations = watch("locations") || [];
  const watchedUnit = watch("unit");
  const watchedStatus = watch("status");

  const [coverImage, setCoverImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [isImageRemoved, setIsImageRemoved] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState("MB");
  const [selectedStatus, setSelectedStatus] = useState("");

  const [allGenres, setAllGenres] = useState([]);
  const [allLocations, setAllLocations] = useState([]);

  const [isAddGenreModalOpen, setIsAddGenreModalOpen] = useState(false);
  const [isAddLocationModalOpen, setIsAddLocationModalOpen] = useState(false);

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const genresSnapshot = await getDocs(collection(db, "genres"));
        setAllGenres(genresSnapshot.docs.map((d) => d.data().name));
      } catch (err) {
        console.warn("Failed to load genres:", err);
      }
      try {
        const locationsSnapshot = await getDocs(collection(db, "emailLocations"));
        setAllLocations(locationsSnapshot.docs.map((d) => d.data().email));
      } catch (err) {
        console.warn("Failed to load locations:", err);
      }
    };
    fetchDropdownData();
  }, []);

  useEffect(() => {
    if (isEditMode && initialData) {
      const dateFromFirestore = initialData.dateAdded?.toDate ? initialData.dateAdded.toDate() : null;
      let formattedDate = "";
      if (dateFromFirestore) {
        const year = dateFromFirestore.getFullYear();
        const month = String(dateFromFirestore.getMonth() + 1).padStart(2, "0");
        const day = String(dateFromFirestore.getDate()).padStart(2, "0");
        formattedDate = `${year}-${month}-${day}`;
      }

      const formValues = {
        ...initialData,
        dateAdded: formattedDate,
        size: parseFloat(initialData.size) || "",
        unit: (initialData.size || " MB").split(" ")[1] || "MB",
      };
      reset(formValues);
      setValue("dateAdded", formattedDate);

      const unit = (initialData.size || " MB").split(" ")[1] || "MB";
      setSelectedUnit(unit);
      setSelectedStatus(initialData.status || "");
      if (initialData.coverArtUrl) setImagePreview(initialData.coverArtUrl);
    } else {
      reset({
        name: "",
        version: "",
        size: "",
        unit: "MB",
        jumlahPart: "",
        platform: "",
        locations: [],
        genre: [],
        shopeeLink: "",
        status: "",
        dateAdded: new Date().toISOString().split("T")[0],
        description: "",
      });
      setImagePreview("");
      setCoverImage(null);
      setSelectedStatus("");
      setSelectedUnit("MB");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, isEditMode, reset]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      setImagePreview(URL.createObjectURL(file));
      setIsImageRemoved(false);
    }
  };

  const handleRemoveImage = () => {
    setCoverImage(null);
    setImagePreview("");
    setIsImageRemoved(true);
  };

  const handleDeleteOption = async (optionValue, collectionName, fieldName) => {
    const confirmDelete = window.confirm(`Apakah Anda yakin ingin menghapus "${optionValue}" secara permanen?`);
    if (!confirmDelete) return;

    try {
      const q = query(collection(db, collectionName), where(fieldName, "==", optionValue));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        alert("Opsi tidak ditemukan untuk dihapus.");
        return;
      }
      const docToDelete = snapshot.docs[0];
      await deleteDoc(doc(db, collectionName, docToDelete.id));

      if (collectionName === "genres") {
        setAllGenres((prev) => prev.filter((g) => g !== optionValue));
        setValue("genre", (watch("genre") || []).filter((g) => g !== optionValue));
      } else if (collectionName === "emailLocations") {
        setAllLocations((prev) => prev.filter((l) => l !== optionValue));
        setValue("locations", (watch("locations") || []).filter((l) => l !== optionValue));
      }
      alert(`"${optionValue}" berhasil dihapus.`);
    } catch (error) {
      console.error("Error deleting option:", error);
      alert("Gagal menghapus opsi.");
    }
  };

  const onSubmitHandler = async (data) => {
    setUploading(true);
    let finalCoverArtUrl = initialData?.coverArtUrl || "";

    if (isImageRemoved) {
      finalCoverArtUrl = "";
    } else if (coverImage) {
      const fileName = `covers/${data.name.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}`;
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

    try {
      const localDate = new Date(data.dateAdded);
      const dateInUTC = new Date(Date.UTC(localDate.getFullYear(), localDate.getMonth(), localDate.getDate()));

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

      await onSubmit(finalData, initialData?.id);
      onClose();
    } catch (error) {
      console.error("Gagal menyimpan game:", error);
      alert("Terjadi kesalahan saat menyimpan data.");
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    // overlay with padding so modal doesn't touch viewport edges on small screens
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black bg-opacity-50 p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Container: not full-height on mobile (my-6) and limited max-height */}
      <div
        className="bg-white rounded-lg shadow-lg w-full max-w-3xl mx-auto my-6 flex flex-col
                   sm:my-8 md:my-10
                   max-h-[80vh] overflow-hidden"
        aria-labelledby="game-modal-title"
      >
        {/* Header sticky so Close is always visible */}
        <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-white z-10">
          <h2 id="game-modal-title" className="text-lg font-semibold">
            {isEditMode ? "Edit Game" : "Add New Game"}
          </h2>
          <CloseButton onClose={onClose} />
        </div>

        {/* Form area: scrollable with a sane max-height */}
        <form
          onSubmit={handleSubmit(onSubmitHandler)}
          className="p-5 overflow-y-auto"
          style={{ maxHeight: "calc(80vh - 64px)" }} // header height ~64px, keep inside viewport
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
              <input id="name" {...register("name")} className="w-full border border-gray-300 rounded px-3 py-2" />
              {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="version" className="block text-sm font-medium mb-1">Version</label>
                <input id="version" {...register("version")} className="w-full border border-gray-300 rounded px-3 py-2" />
                {errors.version && <p className="text-red-500 text-sm">{errors.version.message}</p>}
              </div>

              <div>
                <label htmlFor="platform" className="block text-sm font-medium mb-1">Platform</label>
                <input id="platform" {...register("platform")} className="w-full border border-gray-300 rounded px-3 py-2" />
                {errors.platform && <p className="text-red-500 text-sm">{errors.platform.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="size" className="block text-sm font-medium mb-1">Size</label>
                <input id="size" type="number" {...register("size")} className="w-full border border-gray-300 rounded px-3 py-2" />
                {errors.size && <p className="text-red-500 text-sm">{errors.size.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Unit</label>
                <UnitSelector selectedUnit={watchedUnit} onSelect={(unit) => setValue("unit", unit)} />
                {errors.unit && <p className="text-red-500 text-sm">{errors.unit.message}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="jumlahPart" className="block text-sm font-medium mb-1">Jumlah Part</label>
              <input id="jumlahPart" type="number" {...register("jumlahPart")} className="w-full border border-gray-300 rounded px-3 py-2" />
              {errors.jumlahPart && <p className="text-red-500 text-sm">{errors.jumlahPart.message}</p>}
            </div>

            <div>
              <label htmlFor="shopeeLink" className="block text-sm font-medium mb-1">Shopee Link (Optional)</label>
              <input id="shopeeLink" type="url" {...register("shopeeLink")} placeholder="https://shopee.co.id/..." className="w-full border border-gray-300 rounded px-3 py-2" />
              {errors.shopeeLink && <p className="text-red-500 text-sm">{errors.shopeeLink.message}</p>}
            </div>

            <div>
              <label htmlFor="coverArt" className="block text-sm font-medium mb-1">Cover Art (optional)</label>
              <input type="file" id="coverArt" accept="image/*" onChange={handleImageChange} className="w-full text-sm text-gray-500" />
              {imagePreview && (
                <div className="mt-3 relative w-32 h-32">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-md" />
                  {isEditMode && (
                    <button type="button" onClick={handleRemoveImage} className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1">
                      ×
                    </button>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Locations</label>
              <MultiSelectDropdown
                options={allLocations}
                selectedOptions={watchedLocations}
                onChange={(newLocations) => setValue("locations", newLocations)}
                onAddNew={() => setIsAddLocationModalOpen(true)}
                onDelete={(location) => handleDeleteOption(location, "emailLocations", "email")}
                placeholderText="Select Locations"
              />
              {errors.locations && <p className="text-red-500 text-sm">{errors.locations.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Genre</label>
              <MultiSelectDropdown
                options={allGenres}
                selectedOptions={watchedGenres}
                onChange={(newGenres) => setValue("genre", newGenres)}
                onAddNew={() => setIsAddGenreModalOpen(true)}
                onDelete={(genre) => handleDeleteOption(genre, "genres", "name")}
                placeholderText="Select Genres"
              />
              {errors.genre && <p className="text-red-500 text-sm">{errors.genre.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <StatusSelector selectedStatus={watchedStatus} onSelect={(status) => setValue("status", status)} />
              {errors.status && <p className="text-red-500 text-sm">{errors.status.message}</p>}
            </div>

            <div>
              <label htmlFor="dateAdded" className="block text-sm font-medium mb-1">Date Added</label>
              <input id="dateAdded" type="date" {...register("dateAdded")} className="w-full border border-gray-300 rounded px-3 py-2" />
              {errors.dateAdded && <p className="text-red-500 text-sm">{errors.dateAdded.message}</p>}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
              <textarea id="description" {...register("description")} className="w-full border border-gray-300 rounded px-3 py-2" rows={4} />
              {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
            </div>
          </div>
        </form>

        {/* Footer: actions */}
        <div className="px-5 py-4 border-t bg-white flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={uploading} className="px-4 py-2 bg-gray-300 rounded">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit(onSubmitHandler)} disabled={uploading} className="px-4 py-2 bg-blue-500 text-white rounded">
            {uploading ? "Saving..." : (isEditMode ? "Save Changes" : "Add New Game")}
          </button>
        </div>

        {/* Modals for add location/genre */}
        <AddLocationModal
          showModal={isAddLocationModalOpen}
          onClose={() => setIsAddLocationModalOpen(false)}
          onAddLocation={(newLocation) => setAllLocations((prev) => [...prev, newLocation])}
        />
        <AddGenreModal
          isOpen={isAddGenreModalOpen}
          onClose={() => setIsAddGenreModalOpen(false)}
          onAddGenre={(newGenre) => setAllGenres((prev) => [...prev, newGenre])}
        />
      </div>
    </div>
  );
};

export default GameFormModal;