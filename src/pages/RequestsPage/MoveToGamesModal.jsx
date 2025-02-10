import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { db } from "../../config/firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import CategorySelector from "../../hooks/CategorySelector";
import UnitSelector from "../../hooks/UnitSelector";
import StatusSelector from "../../hooks/StatusSelector";
import AddLocationModal from "../../modals/InputModal/AddLocationModal";
import LocationSelector from "../../hooks/LocationSelector";

const schema = yup.object().shape({
  name: yup.string().required("Name is required"),
  size: yup.number().required("Size is required"),
  unit: yup.string().required("Unit is required"),
  jumlahPart: yup.number().required("Jumlah Part is required"),
  location: yup
    .string()
    .email("Invalid email format")
    .required("Location is required"),
  category: yup.array().min(1, "At least one category is required"),
  status: yup.string().required("Status is required"),
  dateAdded: yup.date().required("Date Added is required"),
  description: yup.string().nullable(),
});

const MoveToGamesModal = ({ request, onClose, onConfirm, prefillData }) => {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      ...prefillData, // Use `prefillData` to prefill fields
      description: "", // Ensure description has a default value
    },
  });

  useEffect(() => {
    console.log("Received prefillData in MoveToGamesModal:", prefillData);
    if (prefillData) {
      console.log("Setting form values from prefillData:", prefillData);
      Object.keys(prefillData).forEach((key) => {
        if (key in schema.fields) {
          setValue(key, prefillData[key]); // Set the prefilled value
        }
      });
    }
  }, [prefillData, setValue]);
  

  const onSubmitHandler = async (data) => {
    try {
      // Combine Size and Unit
      const gameData = {
        name: data.name,
        version: data.version,
        size: `${data.size} ${data.unit}`,
        jumlahPart: data.jumlahPart,
        category: data.category,
        status: data.status,
        dateAdded: data.dateAdded,
        description: data.description || "",
        location: data.location,
      };

      // Add to "games" collection in Firestore
      await addDoc(collection(db, "games"), gameData);
      alert("Game successfully added to Games collection!");

      // Call onConfirm to remove the request from Firestore
      if (onConfirm) onConfirm(request);

      // Close the modal
      if (onClose) onClose();
    } catch (error) {
      console.error("Error adding game:", error);
      alert("Failed to add game. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
        <h2 className="text-xl font-bold mb-4">Move Request to Games</h2>
        <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              {...register("name")}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Version</label>
            <input
              {...register("version")}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.version && (
              <p className="text-red-500 text-sm">{errors.version.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Size</label>
              <input
                type="number"
                {...register("size")}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.size && (
                <p className="text-red-500 text-sm">{errors.size.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Unit</label>
              <UnitSelector
                selectedUnit={prefillData?.unit || "MB"}
                onSelect={(unit) => setValue("unit", unit)}
              />
              {errors.unit && (
                <p className="text-red-500 text-sm">{errors.unit.message}</p>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Jumlah Part</label>
            <input
              type="number"
              {...register("jumlahPart")}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.jumlahPart && (
              <p className="text-red-500 text-sm">{errors.jumlahPart.message}</p>
            )}
          </div>
          <label className="block text-sm font-medium mb-2">Location</label>
          <LocationSelector
            locations={[]}
            selectedLocation={prefillData?.location || ""}
            onLocationChange={(location) => setValue("location", location)}
            onAddLocationClick={() => {}}
          />
          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <CategorySelector
              availableCategories={[]}
              selectedCategories={prefillData?.category || []}
              onChange={(categories) => setValue("category", categories)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <StatusSelector
              selectedStatus={prefillData?.status || "Shopee"}
              onSelect={(status) => setValue("status", status)}
            />
            {errors.status && (
              <p className="text-red-500 text-sm">{errors.status.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date Added</label>
            <input
              type="date"
              {...register("dateAdded")}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.dateAdded && (
              <p className="text-red-500 text-sm">{errors.dateAdded.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              {...register("description")}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
            {errors.description && (
              <p className="text-red-500 text-sm">{errors.description.message}</p>
            )}
          </div>
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Move to Games
            </button>
          </div>
        </form>
      </div>
      <AddLocationModal
        showModal={false}
        onClose={() => {}}
        onAddLocation={() => {}}
      />
    </div>
  );
};

export default MoveToGamesModal;
