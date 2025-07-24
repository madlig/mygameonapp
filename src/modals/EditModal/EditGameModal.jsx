// src/EditGameModal.jsx
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { db } from "../../config/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { yupResolver } from "@hookform/resolvers/yup";

import GenreSelector from "../../hooks/GenreSelector";
import UnitSelector from "../../hooks/UnitSelector";
import StatusSelector from "../../hooks/StatusSelector";
import LocationSelector from "../../hooks/LocationSelector";

const schema = yup.object().shape({
  name: yup.string().required("Name is required"),
  version: yup.string().nullable(),
  size: yup.number().typeError("Size must be a number").required("Size is required").positive("Size must be positive"),
  unit: yup.string().required("Unit is required"),
  jumlahPart: yup.number().typeError("Jumlah Part must be a number").required("Jumlah Part is required").integer("Jumlah Part must be an integer").min(1, "Jumlah Part must be at least 1"),
  platform: yup.string().required("Platform is required"),
  coverArtUrl: yup.string().url("Must be a valid URL if provided").nullable(),
  location: yup.string().required("Location is required"),
  genre: yup.array().min(1, "At least one genre is required"),
  status: yup.string().required("Status is required"),
  dateAdded: yup.date().required("Date Added is required"),
  description: yup.string().nullable(),
});

const EditGameModal = ({ gameId, isOpen, onClose }) => {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      description: "",
      version: "",
      size: "",
      jumlahPart: "",
      platform: "",
      coverArtUrl: "",
      location: "",
      genre: [],
      status: "",
      dateAdded: "",
      unit: "MB",
    },
  });

  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState("MB");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");

  useEffect(() => {
    setValue("genre", selectedGenres);
  }, [selectedGenres, setValue]);

  useEffect(() => {
    setValue("unit", selectedUnit);
  }, [selectedUnit, setValue]);

  useEffect(() => {
    setValue("status", selectedStatus);
  }, [selectedStatus, setValue]);

  useEffect(() => {
    setValue("location", selectedLocation);
  }, [selectedLocation, setValue]);

  useEffect(() => {
    const fetchGameData = async () => {
      if (gameId) {
        const docRef = doc(db, "games", gameId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const gameData = docSnap.data();

          setValue("name", gameData.name);
          setValue("version", gameData.version || "");
          
          const [sizeValue, unitValue] = gameData.size ? gameData.size.split(" ") : ["", "MB"];
          setValue("size", sizeValue);
          setValue("unit", unitValue);
          setSelectedUnit(unitValue);

          setValue("jumlahPart", gameData.jumlahPart);
          setValue("platform", gameData.platform || "");
          
          // --- REVISI DI SINI: Logika untuk CoverArtUrl ---
          let displayCoverArtUrl = gameData.coverArtUrl || "";
          // Jika URL yang tersimpan sama persis dengan nama game (dan bukan URL valid yang dimulai dengan http/https),
          // asumsikan itu adalah nilai fallback dan tampilkan kosong di input field.
          // Ini mencegah URL yang sebenarnya "www.gameku.com" dihilangkan jika kebetulan sama dengan nama.
          if (displayCoverArtUrl === gameData.name && !displayCoverArtUrl.startsWith('http')) {
              displayCoverArtUrl = "";
          }
          setValue("coverArtUrl", displayCoverArtUrl);
          // -------------------------------------------------
          
          const genresArray = gameData.genre || [];
          setValue("genre", genresArray);
          setSelectedGenres(genresArray);

          const statusValue = gameData.status || "";
          setValue("status", statusValue);
          setSelectedStatus(statusValue);

          const localDate = gameData.dateAdded ? gameData.dateAdded.toDate() : null;
          const formattedDate = localDate 
            ? new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000).toISOString().split("T")[0]
            : "";
          setValue("dateAdded", formattedDate);

          setValue("description", gameData.description || "");
          
          const locationValue = gameData.location || "";
          setValue("location", locationValue);
          setSelectedLocation(locationValue);

        } else {
          console.warn("No such document for gameId:", gameId);
          reset();
          setSelectedGenres([]);
          setSelectedUnit("MB");
          setSelectedStatus("");
          setSelectedLocation("");
        }
      }
    };

    if (isOpen) {
      fetchGameData();
    } else {
      reset();
      setSelectedGenres([]);
      setSelectedUnit("MB");
      setSelectedStatus("");
      setSelectedLocation("");
    }
  }, [gameId, isOpen, setValue, reset]);

  const onSubmitHandler = async (data) => {
    console.log("Updating data in Firestore:", data);
    try {
      const gameRef = doc(db, "games", gameId);

      const updatedData = {
        name: data.name,
        version: data.version || "",
        size: `${data.size} ${data.unit}`,
        jumlahPart: data.jumlahPart,
        platform: data.platform,
        // Logika fallback yang sama saat menyimpan
        coverArtUrl: data.coverArtUrl || data.name, 
        genre: data.genre,
        status: data.status,
        dateAdded: new Date(data.dateAdded),
        description: data.description || "",
        location: data.location,
      };

      await updateDoc(gameRef, updatedData);
      console.log("Game successfully updated!");
      alert("Game updated successfully!");

      onClose();
    } catch (error) {
      console.error("Error updating game:", error);
      alert("Error updating game. Please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="p-6 pb-4 border-b">
          <h2 className="text-xl font-bold">Edit Game</h2>
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
            <div>
              <label htmlFor="unit" className="block text-sm font-medium mb-1">Unit</label>
              <UnitSelector
                selectedUnit={selectedUnit}
                onSelect={(unit) => {
                  setSelectedUnit(unit);
                  setValue("unit", unit);
                }}
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
            <label htmlFor="coverArtUrl" className="block text-sm font-medium mb-1">Cover Art URL (Opsional)</label>
            <input
              id="coverArtUrl"
              type="url"
              {...register("coverArtUrl")}
              placeholder="Akan menggunakan Nama Game jika kosong"
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.coverArtUrl && <p className="text-red-500 text-sm">{errors.coverArtUrl.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Location</label>
            <LocationSelector
              selectedLocation={selectedLocation}
              onLocationChange={setSelectedLocation}
            />
            {errors.location && <p className="text-red-500 text-sm">{errors.location.message}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Genre</label>
            <GenreSelector
              selectedGenres={selectedGenres}
              onChange={setSelectedGenres}
            />
            {errors.genre && <p className="text-red-500 text-sm">{errors.genre.message}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <StatusSelector
              selectedStatus={selectedStatus}
              onSelect={(status) => {
                setSelectedStatus(status);
                setValue("status", status);
              }}
            />
            {errors.status && <p className="text-red-500 text-sm">{errors.status.message}</p>}
          </div>
          
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
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit(onSubmitHandler)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditGameModal;