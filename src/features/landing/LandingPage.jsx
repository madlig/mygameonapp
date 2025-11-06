// src/pages/LandingPage/index.jsx
import React, { Suspense, lazy } from "react";
import { algoliasearch } from "algoliasearch";
import { 
  InstantSearch,
  SearchBox,
  Hits,
  Pagination,
  Configure,
  useInstantSearch 
} from "react-instantsearch";
import "instantsearch.css/themes/satellite.css";

const GameList = lazy(() => import("./components/GameList"));

const searchClient = algoliasearch(
  import.meta.env.VITE_ALGOLIA_APP_ID,
  import.meta.env.VITE_ALGOLIA_SEARCH_ONLY_API_KEY
);

// *** PINDAHKAN KOMPONEN INI KE SINI ***
const GameCardPlaceholder = () => (
  <div className="bg-gray-200 rounded-lg shadow-md animate-pulse">
    <div className="w-full h-48 bg-gray-300 rounded-t-lg"></div>
    <div className="p-4">
      <div className="h-5 w-3/4 bg-gray-300 rounded"></div>
      <div className="h-4 w-1/2 bg-gray-300 rounded mt-2"></div>
    </div>
  </div>
);

const CustomHits = () => {
    const { results, status } = useInstantSearch();

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-900">
                    {results?.query ? `Hasil Pencarian untuk "${results.query}"` : "Koleksi Terbaru"}
                </h2>
                {results?.query && (
                    <a href="/" className="text-blue-600 hover:underline font-semibold">
                        Reset Pencarian
                    </a>
                )}
            </div>
            <Suspense fallback={
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {Array.from({ length: 8 }).map((_, index) => (
                        <GameCardPlaceholder key={index} />
                    ))}
                </div>
            }>
                <Hits
                    hitComponent={GameList} // Langsung gunakan GameList di sini
                    classNames={{
                        list: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6",
                        item: "list-none h-full", // h-full agar kartu seragam
                    }}
                />
            </Suspense>
        </>
    );
};

const LandingPage = () => {
  return (
    // ... (Bagian JSX Anda dari sebelumnya tetap sama, tidak perlu diubah)
    // Cukup pastikan komponen GameCardPlaceholder sudah didefinisikan di atas
     <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <InstantSearch searchClient={searchClient} indexName="games">
      <Configure hitsPerPage={8} />
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50 py-4">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <a href="/" className="text-3xl font-extrabold text-blue-700 hover:text-blue-900 transition-colors">
            myGameON Hub
          </a>
          <nav>
            <a href="/request-game" className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-all duration-300 font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
              Request Game
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-700 to-purple-800 text-white pt-24 pb-32 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4 leading-tight tracking-tight">
            Pusat Database Game Anda
          </h1>
          <p className="text-lg md:text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Jelajahi koleksi game kami, temukan informasi detail, dan dapatkan link afiliasi Shopee terpercaya.
          </p>
          {/* Form dan tombol dihapus, hanya menyisakan input */}
          <div className="flex justify-center">
            <SearchBox
                placeholder="Ketik untuk mencari game..."
                className="w-full max-w-lg"
                classNames={{
                root: 'w-full',
                form: 'relative flex shadow-2xl rounded-lg',
                input: 'w-full p-4 pl-12 rounded-lg border-0 focus:ring-4 focus:ring-purple-300 focus:outline-none text-gray-800 text-lg',
                submit: 'absolute left-4 top-1/2 -translate-y-1/2 text-gray-400',
                submitIcon: 'w-6 h-6',
                reset: 'absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600',
                resetIcon: 'w-6 h-6'
              }}
            />
          </div>
        </div>
      </section>

      {/* Bagian Konten Utama */}
      <main id="game-list-section" className="max-w-7xl mx-auto px-6 py-12 -mt-16">
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
                <CustomHits />
                <div className="text-center mt-10">
                    <Pagination
                        classNames={{
                            root: 'flex justify-center items-center',
                            list: 'flex space-x-2',
                            item: 'list-none',
                            link: 'px-4 py-2 border rounded-md hover:bg-gray-100',
                            selectedItem: 'bg-blue-600 text-white border-blue-600',
                            disabledItem: 'opacity-50 cursor-not-allowed',
                        }}
                    />
                </div>
            </div>
        </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 py-8 px-6 text-center mt-12">
         <p>&copy; {new Date().getFullYear()} MyGameON Hub. All rights reserved.</p>
      </footer>
      </InstantSearch>
    </div>
  );
};

export default LandingPage;