import React from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

const ActiveFilters = ({ filters, onRemoveFilter }) => {
  // Pastikan filters.genre selalu array, meskipun harusnya sudah di handle di useFilters
  const currentGenres = filters.genre || [];

  // Kondisi untuk menampilkan komponen ActiveFilters
  // Ditampilkan jika ada genre yang terpilih ATAU status yang terpilih
  // Anda bisa menambahkan kondisi lain seperti filters.size.min, filters.dateAdded.start, dll.
  const shouldShowFilters =
    currentGenres.length > 0 ||
    !!filters.status || // Menggunakan !! untuk mengkonversi string kosong menjadi false
    (filters.size.min && filters.size.max) || // Contoh untuk filter size
    (filters.dateAdded.start && filters.dateAdded.end); // Contoh untuk filter dateAdded

  if (!shouldShowFilters) {
    return null; // Tidak menampilkan apa-apa jika tidak ada filter aktif
  }

  return (
    <div className="flex space-x-4 mt-4 flex-wrap gap-2"> {/* Tambah flex-wrap dan gap-2 untuk responsif */}
      {/* Tampilkan filter Genre */}
      {currentGenres.map((genre) => (
        <div
          key={genre}
          className="flex items-center bg-blue-100 text-blue-700 px-3 py-1 rounded-full"
        >
          <span>{genre}</span>
          <button
            className="ml-2 text-blue-700 hover:text-blue-900"
            onClick={() => onRemoveFilter("genre", genre)} // Mengubah 'category' menjadi 'genre'
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      ))}

      {/* Tampilkan filter Status */}
      {filters.status && (
        <div className="flex items-center bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
          <span>{filters.status}</span>
          <button
            className="ml-2 text-blue-700 hover:text-blue-900"
            onClick={() => onRemoveFilter("status")}
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tambahan: Contoh menampilkan filter Size (jika sudah diimplementasikan) */}
      {filters.size.min && filters.size.max && (
        <div className="flex items-center bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
          <span>
            Size: {filters.size.min} - {filters.size.max} {filters.size.unit}
          </span>
          <button
            className="ml-2 text-blue-700 hover:text-blue-900"
            onClick={() => onRemoveFilter("size")} // Anda mungkin perlu logika onRemoveFilter yang berbeda untuk size object
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tambahan: Contoh menampilkan filter Date Added (jika sudah diimplementasikan) */}
      {filters.dateAdded.start && filters.dateAdded.end && (
        <div className="flex items-center bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
          <span>
            Added: {filters.dateAdded.start} to {filters.dateAdded.end}
          </span>
          <button
            className="ml-2 text-blue-700 hover:text-blue-900"
            onClick={() => onRemoveFilter("dateAdded")} // Anda mungkin perlu logika onRemoveFilter yang berbeda untuk dateAdded object
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ActiveFilters;