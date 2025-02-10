import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../config/firebaseConfig";

const EditGameModal = ({ gameId, isOpen, onClose }) => {
  const { register, handleSubmit, setValue, reset } = useForm();

  useEffect(() => {
    const fetchGameData = async () => {
      if (gameId) {
        const docRef = doc(db, "games", gameId);
        const docSnap = await getDoc(docRef);
  
        if (docSnap.exists()) {
          const gameData = docSnap.data();
  
          // Set values for other fields
          setValue("name", gameData.name);
          setValue("version", gameData.version);
          setValue("size", gameData.size.split(" ")[0]);
          setValue("unit", gameData.size.split(" ")[1]);
          setValue("jumlahPart", gameData.jumlahPart);
          setValue("category", gameData.category.join(", "));
          setValue("status", gameData.status);
          setValue("description", gameData.description);
  
          // Mengonversi dateAdded dari Timestamp ke format yyyy-MM-dd tanpa pergeseran zona waktu
          const localDate = gameData.dateAdded.toDate();
          const formattedDate = new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000)
            .toISOString()
            .split("T")[0];
          setValue("dateAdded", formattedDate);  // Set nilai dateAdded ke form
        }
      }
    };
  
    fetchGameData();
  }, [gameId, setValue]);  
  

  // Fungsi untuk menyimpan data yang sudah diedit
  const onSubmitHandler = async (data) => {
    try {
      const gameRef = doc(db, "games", gameId);
  
      // Konversi dateAdded ke objek Date
      const formattedDateAdded = new Date(data.dateAdded);
  
      const updatedData = {
        name: data.name,
        version: data.version,
        size: `${data.size} ${data.unit}`,
        jumlahPart: parseInt(data.jumlahPart, 10),
        category: data.category.split(",").map((cat) => cat.trim()), // Pecah kategori menjadi array
        status: data.status,
        dateAdded: formattedDateAdded, // Simpan sebagai objek Date
        description: data.description,
      };
  
      // Update data di Firestore
      await updateDoc(gameRef, updatedData);
      console.log("Game successfully updated!");
  
      // Tutup modal setelah update
      onClose();
    } catch (error) {
      console.error("Error updating game:", error);
    }
  };
  

  if (!isOpen) return null; // Tidak render modal jika tidak dibuka

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-xl relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
        >
          &times;
        </button>
        <h2 className="text-lg font-bold mb-4">Edit Game</h2>
        <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-4">
          <div>
            <label className="block font-medium">Name</label>
            <input
              {...register("name")}
              className="input w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block font-medium">Version</label>
            <input
              {...register("version")}
              className="input w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium">Size</label>
              <input
                type="number"
                {...register("size")}
                className="input w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-medium">Unit</label>
              <input
                {...register("unit")}
                className="input w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label className="block font-medium">Jumlah Part</label>
            <input
              type="number"
              {...register("jumlahPart")}
              className="input w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block font-medium">Category</label>
            <input
              {...register("category")}
              className="input w-full border border-gray-300 rounded px-3 py-2"
              placeholder="Separate categories with commas"
            />
          </div>
          <div>
            <label className="block font-medium">Status</label>
            <input
              {...register("status")}
              className="input w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block font-medium">Date Added</label>
            <input
              type="date"
              {...register("dateAdded")}
              className="input w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block font-medium">Description</label>
            <textarea
              {...register("description")}
              className="input w-full border border-gray-300 rounded px-3 py-2"
            ></textarea>
          </div>
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditGameModal;
