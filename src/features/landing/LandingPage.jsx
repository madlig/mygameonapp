import React, { Suspense, lazy } from 'react';
import { algoliasearch } from 'algoliasearch';
import {
  InstantSearch,
  SearchBox,
  Hits,
  Pagination,
  Configure,
  useInstantSearch,
} from 'react-instantsearch';
import 'instantsearch.css/themes/satellite.css';

const GameList = lazy(() => import('./components/GameList'));

const searchClient = algoliasearch(
  import.meta.env.VITE_ALGOLIA_APP_ID,
  import.meta.env.VITE_ALGOLIA_SEARCH_ONLY_API_KEY
);

const GameCardPlaceholder = () => (
  <div className="flex flex-col rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900">
    <div className="w-full aspect-[4/3] bg-neutral-800" />
    <div className="px-4 py-4">
      <div className="h-5 w-3/4 bg-neutral-700 rounded mb-2" />
      <div className="h-4 w-1/2 bg-neutral-700 rounded" />
    </div>
  </div>
);

const EmptyState = ({ query }) => (
  <div className="text-center py-12">
    <h3 className="text-xl font-semibold text-neutral-100">
      Tidak ada hasil untuk &quot;{query}&quot;.
    </h3>
    <p className="text-neutral-400 mt-2">
      Mau kami tambahkan game ini ke daftar?
    </p>
    <div className="mt-4 flex gap-3 justify-center">
      <a
        href="/request-game"
        className="inline-block bg-[#ffd100] text-neutral-900 px-5 py-2.5 rounded-lg hover:brightness-95 transition-all font-semibold"
      >
        Ajukan Request Game
      </a>
      <a
        href="/"
        className="inline-block border border-neutral-600 text-neutral-100 px-5 py-2.5 rounded-lg hover:bg-neutral-800 transition-all font-semibold"
      >
        Reset Pencarian
      </a>
    </div>
  </div>
);

const CustomHits = () => {
  const { results, status } = useInstantSearch();
  const isLoading = status === 'loading' || status === 'stalled';

  if (results?.query && results.nbHits === 0 && !isLoading) {
    return (
      <>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-neutral-100">
            Hasil Pencarian untuk &quot;{results.query}&quot;
          </h2>
          <a href="/" className="text-yellow-400 hover:underline font-semibold">
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
        <h2 className="text-2xl md:text-3xl font-bold text-neutral-100">
          {results?.query
            ? `Hasil Pencarian untuk "${results.query}"`
            : 'Koleksi Terbaru'}
        </h2>
        {results?.query && (
          <a href="/" className="text-yellow-400 hover:underline font-semibold">
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
            list: 'grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:gap-6',
            item: 'list-none h-full',
          }}
        />
      </Suspense>
    </>
  );
};

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <section className="relative overflow-hidden bg-neutral-900 border-b border-neutral-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,209,0,0.12),_transparent_45%)]" />
        <div className="relative max-w-7xl mx-auto px-6 py-20 md:py-28">
          <div className="max-w-3xl">
            <p className="inline-flex items-center rounded-full border border-yellow-400/40 bg-yellow-400/10 px-3 py-1 text-sm text-yellow-300 mb-6">
              Jasa Instalasi Game Profesional
            </p>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight">
              Main Game Impian Tanpa Ribet.
            </h1>
            <p className="mt-5 text-lg md:text-xl text-neutral-300 max-w-2xl">
              Hemat, Cepat, dan Aman. Nikmati ribuan game offline dengan
              launcher khusus yang memudahkan instalasi.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#game-search"
                className="inline-flex items-center justify-center rounded-lg bg-[#ffd100] px-6 py-3 font-semibold text-neutral-900 hover:brightness-95 transition"
              >
                Cari Game Sekarang
              </a>
              <a
                href="#launcher"
                className="inline-flex items-center justify-center rounded-lg border border-white/70 px-6 py-3 font-semibold text-white hover:bg-white hover:text-neutral-900 transition"
              >
                Download Launcher
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-14 md:py-16">
        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <div className="w-11 h-11 rounded-full bg-yellow-400/20 text-yellow-300 grid place-items-center mb-4">
              <span className="text-xl" aria-hidden="true">
                🚀
              </span>
            </div>
            <h3 className="text-lg font-bold text-neutral-100">
              Server Google Drive
            </h3>
            <p className="text-neutral-400 mt-2">
              Download super cepat tanpa limitasi speed.
            </p>
          </article>

          <article className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <div className="w-11 h-11 rounded-full bg-yellow-400/20 text-yellow-300 grid place-items-center mb-4">
              <span className="text-xl" aria-hidden="true">
                🛡️
              </span>
            </div>
            <h3 className="text-lg font-bold text-neutral-100">
              MyGameON Launcher
            </h3>
            <p className="text-neutral-400 mt-2">
              Satu klik untuk install &amp; update. Bebas virus.
            </p>
          </article>

          <article className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <div className="w-11 h-11 rounded-full bg-yellow-400/20 text-yellow-300 grid place-items-center mb-4">
              <span className="text-xl" aria-hidden="true">
                🎧
              </span>
            </div>
            <h3 className="text-lg font-bold text-neutral-100">Full Support</h3>
            <p className="text-neutral-400 mt-2">
              Bantuan instalasi jarak jauh jika mengalami kendala.
            </p>
          </article>
        </div>
      </section>

      <section id="launcher" className="max-w-7xl mx-auto px-6 pb-6">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 text-neutral-300">
          <p className="text-sm">
            Launcher segera tersedia untuk publik. Tombol &quot;Download
            Launcher&quot; saat ini masih placeholder.
          </p>
        </div>
      </section>

      <section
        id="game-search"
        className="max-w-7xl mx-auto px-6 py-12 md:py-14"
      >
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-6 md:p-8 shadow-2xl">
          <div className="mb-8">
            <h2 className="text-3xl md:text-4xl font-extrabold text-neutral-100">
              Katalog Game Kami
            </h2>
            <p className="text-neutral-400 mt-2">
              Temukan game favorit Anda lalu lanjutkan proses instalasi dengan
              cepat.
            </p>
          </div>

          <InstantSearch searchClient={searchClient} indexName="games">
            <Configure hitsPerPage={8} />

            <div className="mb-8" role="search" aria-label="Pencarian game">
              <SearchBox
                placeholder="Ketik judul game..."
                classNames={{
                  root: 'w-full',
                  form: 'relative flex w-full',
                  input:
                    'w-full rounded-xl border border-neutral-700 bg-neutral-950 text-neutral-100 p-4 pl-12 focus:outline-none focus:ring-2 focus:ring-yellow-400/60 focus:border-yellow-400/60',
                  submit:
                    'absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400',
                  submitIcon: 'w-5 h-5',
                  reset:
                    'absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200',
                  resetIcon: 'w-5 h-5',
                }}
              />
            </div>

            <CustomHits />

            <div className="text-center mt-10">
              <Pagination
                classNames={{
                  root: 'flex justify-center items-center',
                  list: 'flex flex-wrap gap-2',
                  item: 'list-none',
                  link: 'px-4 py-2 border border-neutral-700 rounded-md text-neutral-200 hover:bg-neutral-800',
                  selectedItem:
                    'bg-[#ffd100] text-neutral-900 border-[#ffd100]',
                  disabledItem: 'opacity-50 cursor-not-allowed',
                }}
              />
            </div>
          </InstantSearch>
        </div>
      </section>

      <footer className="border-t border-neutral-800 text-neutral-500 py-8 px-6 text-center">
        <p>
          &copy; {new Date().getFullYear()} MyGameON Hub. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
