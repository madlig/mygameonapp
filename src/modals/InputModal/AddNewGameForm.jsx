import { useState, useEffect, React } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { db } from "../../config/firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import { yupResolver } from "@hookform/resolvers/yup";
import CategorySelector from "../../hooks/CategorySelector";
import UnitSelector from "../../hooks/UnitSelector";
import StatusSelector from "../../hooks/StatusSelector";
import AddLocationModal from "./AddLocationModal";
import LocationSelector from "../../hooks/LocationSelector";

const schema = yup.object().shape({
  name: yup.string().required("Name is required"),
  size: yup.number().required("Size is required"),
  unit: yup.string().required("Unit is required"),
  jumlahPart: yup.number().required("Jumlah Part is required"),
  location: yup.string().email("Invalid email format").required("Location is required"),
  category: yup.array().min(1, "At least one category is required"),
  status: yup.string().required("Status is required"),
  dateAdded: yup.date().required("Date Added is required"),
  description: yup.string().nullable(),
});

const AddNewGameForm = ({ onSubmit, onClose }) => {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      description: "", // Default nilai untuk description
    },
  });

  // Fungsi untuk mengirimkan data ke Firestore
  const onSubmitHandler = async (data) => {
    console.log("Submitting data to Firestore:", data);
    try {
      // Gabungkan Size dan Unit
      const gameData = {
        name: data.name,
        version: data.version,
        size: `${data.size} ${data.unit}`, // Gabungkan Size dan Unit
        jumlahPart: data.jumlahPart,
        category: data.category, // Menyertakan kategori yang dipilih
        status: data.status,
        dateAdded: data.dateAdded,
        description: data.description || "", // Pastikan string kosong jika tidak ada
        location: data.location, // Disimpan meskipun tidak ditampilkan
      };

      // Menyimpan data ke Firestore
      await addDoc(collection(db, "games"), gameData);
      console.log("Data successfully added to Firestore!");
      alert("Game added successfully!");

      // Menutup form setelah submit
      if (onClose) onClose();
    } catch (error) {
      console.error("Error adding document to Firestore:", error);
      alert("Error adding game. Please try again.");
    }
  };

  const [categories, setCategories] = useState([]); // Inisialisasi dengan array kosong
  const [selectedCategories, setSelectedCategories] = useState([]);
  
  const [selectedUnit, setSelectedUnit] = useState("MB");
  const [selectedStatus, setSelectedStatus] = useState("Shopee");

  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);

  const handleLocationChange = (location) => {
    setSelectedLocation(location);
    setValue("location", location); // Set location value in form
  };

  const handleAddLocationClick = () => {
    setShowAddLocationModal(true);
  };

  const handleAddLocation = async (newLocation) => {
    try {
      // Menyimpan lokasi baru ke Firestore
      await addDoc(collection(db, "emailLocations"), { email: newLocation });
      setLocations((prevLocations) => [...prevLocations, newLocation]);
      setSelectedLocation(newLocation);
      setValue("location", newLocation); // Set location value in form
      setShowAddLocationModal(false); // Close modal
    } catch (error) {
      console.error("Error adding location to Firestore:", error);
    }
  };

  useEffect(() => {
    setValue("category", selectedCategories);
  }, [selectedCategories, setValue]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
        <h2 className="text-xl font-bold mb-4">Add New Game</h2>
        <form 
            onSubmit={handleSubmit(onSubmitHandler)}
            className="space-y-4"
          >
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              {...register("name")}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Version</label>
            <input
              {...register("version")}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Size</label>
              <input
                type="number"
                {...register("size")}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.size && <p className="text-red-500 text-sm">{errors.size.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Unit</label>
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
            <label className="block text-sm font-medium mb-1">Jumlah Part</label>
            <input
              type="number"
              {...register("jumlahPart")}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.jumlahPart && <p className="text-red-500 text-sm">{errors.jumlahPart.message}</p>}
          </div>
          {/* Location Selector */}
          <label className="block text-sm font-medium mb-2">Location</label>
          <LocationSelector
            locations={locations}
            selectedLocation={selectedLocation}
            onLocationChange={handleLocationChange}
            onAddLocationClick={handleAddLocationClick}
          />
        <div>
        <label className="block text-sm font-medium mb-2">Category</label>
        <CategorySelector
          availableCategories={categories}
          selectedCategories={selectedCategories}
          onChange={setSelectedCategories}
        />
      </div>
      {/* Input Status */}
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
            <label className="block text-sm font-medium mb-1">Date Added</label>
            <input
              type="date"
              {...register("dateAdded")}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.dateAdded && <p className="text-red-500 text-sm">{errors.dateAdded.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Deskripsi</label>
            <textarea
              {...register("description")}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
            {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
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
              Add New Game
            </button>
          </div>
        </form>
      </div>
      {/* Add Location Modal */}
      <AddLocationModal
        showModal={showAddLocationModal}
        onClose={() => setShowAddLocationModal(false)}
        onAddLocation={handleAddLocation}
      />
    </div>
  );
};

export default AddNewGameForm;
