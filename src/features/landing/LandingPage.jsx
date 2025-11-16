import React, { Suspense, lazy } from "react";
import { algoliasearch } from "algoliasearch";
import {
  InstantSearch,
  SearchBox,
  Hits,
  Pagination,
  Configure,
  useInstantSearch,
} from "react-instantsearch";
import "instantsearch.css/themes/satellite.css";

const GameList = lazy(() => import("./components/GameList"));

const searchClient = algoliasearch(
  import.meta.env.VITE_ALGOLIA_APP_ID,
  import.meta.env.VITE_ALGOLIA_SEARCH_ONLY_API_KEY
);

const GameCardPlaceholder = () => (
  <div className="flex flex-col">
    <div className="w-full aspect-[4/3] bg-gray-200" />
    <div className="px-4 py-4">
      <div className="h-5 w-3/4 bg-gray-200 rounded mb-2" />
      <div className="h-4 w-1/2 bg-gray-200 rounded" />
    </div>
  </div>
);

const EmptyState = ({ query }) => (
  <div className="text-center py-12">
    <h3 className="text-xl font-semibold text-gray-800">Tidak ada hasil untuk “{query}”.</h3>
    <p className="text-gray-600 mt-2">Mau kami tambahkan game ini ke daftar?</p>
    <div className="mt-4 flex gap-3 justify-center">
      <a
        href="/request-game"
        className="inline-block bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-all font-semibold"
      >
        Ajukan Request Game
      </a>
      <a
        href="/"
        className="inline-block bg-gray-100 text-gray-800 px-5 py-2.5 rounded-lg hover:bg-gray-200 transition-all font-semibold"
      >
        Reset Pencarian
      </a>
    </div>
  </div>
);

const CustomHits = () => {
  const { results, status } = useInstantSearch();
  const isLoading = status === "loading" || status === "stalled";

  if (results?.query && results.nbHits === 0 && !isLoading) {
    return (
      <>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">
            Hasil Pencarian untuk "{results.query}"
          </h2>
          <a href="/" className="text-blue-600 hover:underline font-semibold">
            Reset Pencarian
          </a>
        </div>
        <EmptyState query={results.query} />
      </>
    );
  }

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
      <Suspense
        fallback={
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <GameCardPlaceholder key={index} />
            ))}
          </div>
        }
      >
        <Hits
          hitComponent={GameList}
          classNames={{
            list: "grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:gap-6",
            item: "list-none h-full", // tiap <li> sesuaikan tinggi kartu
          }}
        />
      </Suspense>
    </>
  );
};

const LandingPage = () => {
  const storeUrl =
    import.meta.env.VITE_SHOPEE_STORE_URL || "https://shopee.co.id/mygameon";
  const waNumber = import.meta.env.VITE_WHATSAPP_NUMBER || "6285121309829";
  const heroWaLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(
    "Halo, saya ingin konsultasi pencarian game."
  )}`;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <InstantSearch searchClient={searchClient} indexName="games">
        <Configure hitsPerPage={8} />

        <header className="bg-white shadow-sm sticky top-0 z-50 py-4">
          <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
            <a
              href="/"
              className="text-3xl font-extrabold text-blue-700 hover:text-blue-900 transition-colors"
            >
              myGameON Hub
            </a>
            <nav className="flex gap-3">
              <a
                href={storeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:inline-block bg-orange-500 text-white px-5 py-2.5 rounded-lg hover:bg-orange-600 font-semibold"
              >
                Belanja di Shopee
              </a>
              <a
                href={heroWaLink}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:inline-block bg-green-500 text-white px-5 py-2.5 rounded-lg hover:bg-green-600 font-semibold"
              >
                Chat WhatsApp
              </a>
              <a
                href="/request-game"
                className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Request Game
              </a>
            </nav>
          </div>
        </header>

        <section className="relative bg-gradient-to-r from-blue-700 to-purple-800 text-white pt-24 pb-28 px-6 text-center overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-20"></div>
          <div className="relative max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-extrabold mb-4 leading-tight tracking-tight">
              Pusat Database Game Anda
            </h1>
            <p className="text-lg md:text-xl opacity-90 mb-6 max-w-2xl mx-auto">
              Cari game, checkout di Shopee, atau chat kami via WhatsApp.
            </p>
            <div className="flex justify-center" role="search" aria-label="Pencarian game">
              <SearchBox
                placeholder="Ketik untuk mencari game..."
                classNames={{
                  root: "w-full max-w-lg",
                  form: "relative flex shadow-2xl rounded-lg w-full",
                  input:
                    "w-full p-4 pl-12 rounded-lg border-0 focus:ring-4 focus:ring-purple-300 focus:outline-none text-gray-800 text-lg",
                  submit: "absolute left-4 top-1/2 -translate-y-1/2 text-gray-400",
                  submitIcon: "w-6 h-6",
                  reset: "absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600",
                  resetIcon: "w-6 h-6",
                }}
              />
            </div>
            <div className="mt-5 flex items-center justify-center gap-3 md:hidden">
              <a
                href={storeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-orange-500 text-white px-5 py-2.5 rounded-lg hover:bg-orange-600 font-semibold"
              >
                Belanja di Shopee
              </a>
              <a
                href={heroWaLink}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-500 text-white px-5 py-2.5 rounded-lg hover:bg-green-600 font-semibold"
              >
                Chat WhatsApp
              </a>
            </div>
          </div>
        </section>

        <main className="max-w-7xl mx-auto px-6 py-12 -mt-16">
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
            <CustomHits />
            <div className="text-center mt-10">
              <Pagination
                classNames={{
                  root: "flex justify-center items-center",
                  list: "flex space-x-2",
                  item: "list-none",
                  link: "px-4 py-2 border rounded-md hover:bg-gray-100",
                  selectedItem: "bg-blue-600 text-white border-blue-600",
                  disabledItem: "opacity-50 cursor-not-allowed",
                }}
              />
            </div>
          </div>
        </main>

        <footer className="bg-gray-800 text-gray-400 py-8 px-6 text-center mt-12">
          <p>&copy; {new Date().getFullYear()} MyGameON Hub. All rights reserved.</p>
        </footer>
      </InstantSearch>
    </div>
  );
};

export default LandingPage;