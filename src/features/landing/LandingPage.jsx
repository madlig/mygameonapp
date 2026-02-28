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
    <div className="min-h-screen bg-[#111317] text-[#F3F4F6]">
      <section className="relative overflow-hidden border-b border-[#2A2F39]">
        <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,209,0,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,209,0,0.08)_1px,transparent_1px)] [background-size:20px_20px]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(255,209,0,0.14),transparent_40%),radial-gradient(circle_at_90%_20%,rgba(255,255,255,0.06),transparent_28%)]" />

        <div className="relative max-w-7xl mx-auto px-6 py-20 md:py-24">
          <div className="max-w-4xl">
            <p className="inline-flex items-center rounded-md border border-[#FFD100]/30 bg-[#FFD100]/10 px-3 py-1 text-xs font-semibold tracking-widest text-[#FFD100] mb-6">
              GAMER STREET | MYGAMEON
            </p>

            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight">
              Cari Game Favoritmu Sekarang, Request Jika Belum Tersedia.
            </h1>

            <p className="mt-5 text-lg md:text-xl text-[#C8CFDA] max-w-3xl">
              Katalog terus diperbarui. Game yang belum tersedia bisa direquest,
              lalu diproses jika file tersedia.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#game-search"
                className="inline-flex items-center justify-center rounded-lg bg-[#FFD100] px-6 py-3 font-bold text-[#111317] hover:brightness-95 transition"
              >
                Cari Game Sekarang
              </a>
              <a
                href="/request-game"
                className="inline-flex items-center justify-center rounded-lg border border-[#F3F4F6]/70 px-6 py-3 font-semibold text-[#F3F4F6] hover:bg-[#F3F4F6] hover:text-[#111317] transition"
              >
                Request Game
              </a>
              <a
                href="/request-status"
                className="inline-flex items-center justify-center rounded-lg border border-[#2F3643] bg-[#1A1F27] px-6 py-3 font-semibold text-[#C8CFDA] hover:border-[#FFD100]/40 hover:text-[#F3F4F6] transition"
              >
                Cek Status Request
              </a>
            </div>

            <p className="mt-3 text-xs text-[#9CA3AF]">
              Request diproses sesuai ketersediaan file.
            </p>

            <div className="mt-8 flex flex-wrap gap-2 text-xs">
              <span className="rounded-sm border border-[#2F3643] bg-[#1A1F27] px-2.5 py-1 text-[#C8CFDA]">
                Katalog terus update
              </span>
              <span className="rounded-sm border border-[#2F3643] bg-[#1A1F27] px-2.5 py-1 text-[#C8CFDA]">
                Request tanpa login
              </span>
              <span className="rounded-sm border border-[#2F3643] bg-[#1A1F27] px-2.5 py-1 text-[#C8CFDA]">
                Support jika terkendala
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-14 md:py-16">
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold">
            Kenapa Pilih MyGameON?
          </h2>
          <p className="text-[#9CA3AF] mt-2">
            Dibuat untuk gamer yang mau proses cepat dan jelas.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-xl border border-[#2A2F39] bg-[#1A1F27] p-6">
            <div className="w-11 h-11 rounded-md border border-[#FFD100]/35 bg-[#FFD100]/10 text-[#FFD100] grid place-items-center mb-4">
              <span className="text-sm font-bold" aria-hidden="true">
                01
              </span>
            </div>
            <h3 className="text-lg font-bold text-[#F3F4F6]">
              Cari Cepat, Ketemu Lebih Mudah
            </h3>
            <p className="text-[#9CA3AF] mt-2">
              Gunakan pencarian untuk menemukan game favoritmu dalam hitungan
              detik.
            </p>
          </article>

          <article className="rounded-xl border border-[#2A2F39] bg-[#1A1F27] p-6">
            <div className="w-11 h-11 rounded-md border border-[#FFD100]/35 bg-[#FFD100]/10 text-[#FFD100] grid place-items-center mb-4">
              <span className="text-sm font-bold" aria-hidden="true">
                02
              </span>
            </div>
            <h3 className="text-lg font-bold text-[#F3F4F6]">
              Belum Ada? Tetap Bisa Request
            </h3>
            <p className="text-[#9CA3AF] mt-2">
              Kalau game belum tersedia, kirim request dan tim kami akan cek
              ketersediaannya.
            </p>
          </article>

          <article className="rounded-xl border border-[#2A2F39] bg-[#1A1F27] p-6">
            <div className="w-11 h-11 rounded-md border border-[#FFD100]/35 bg-[#FFD100]/10 text-[#FFD100] grid place-items-center mb-4">
              <span className="text-sm font-bold" aria-hidden="true">
                03
              </span>
            </div>
            <h3 className="text-lg font-bold text-[#F3F4F6]">
              Proses Jelas, Tidak Bikin Bingung
            </h3>
            <p className="text-[#9CA3AF] mt-2">
              Setiap request diproses bertahap supaya kamu tahu progresnya.
            </p>
          </article>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-6">
        <div className="rounded-xl border border-[#2A2F39] bg-[#1A1F27] p-6 md:p-7">
          <h3 className="text-2xl font-bold text-[#F3F4F6]">
            Mulai Dalam 3 Langkah
          </h3>
          <div className="mt-4 grid gap-3 md:grid-cols-3 text-sm">
            <div className="rounded-lg bg-[#111317] border border-[#2A2F39] p-3 text-[#C8CFDA]">
              1. Cari game di katalog
            </div>
            <div className="rounded-lg bg-[#111317] border border-[#2A2F39] p-3 text-[#C8CFDA]">
              2. Jika belum ada, kirim request
            </div>
            <div className="rounded-lg bg-[#111317] border border-[#2A2F39] p-3 text-[#C8CFDA]">
              3. Tunggu konfirmasi ketersediaan
            </div>
          </div>
          <p className="mt-4 text-sm text-[#9CA3AF]">
            Simple, cepat, dan transparan dari awal.
          </p>
        </div>
      </section>

      <section
        id="game-search"
        className="max-w-7xl mx-auto px-6 py-12 md:py-14"
      >
        <div className="rounded-2xl border border-[#2A2F39] bg-[#1A1F27] p-6 md:p-8 shadow-2xl">
          <div className="mb-8">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#F3F4F6]">
              Katalog Game Kami
            </h2>
            <p className="text-[#9CA3AF] mt-2">
              Cari dulu di katalog. Kalau belum ada, kamu bisa lanjut request.
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
                    'w-full rounded-xl border border-[#2F3643] bg-[#111317] text-[#F3F4F6] p-4 pl-12 focus:outline-none focus:ring-2 focus:ring-[#FFD100]/60 focus:border-[#FFD100]/50',
                  submit:
                    'absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]',
                  submitIcon: 'w-5 h-5',
                  reset:
                    'absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#F3F4F6]',
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
                  link: 'px-4 py-2 border border-[#2F3643] rounded-md text-[#C8CFDA] hover:bg-[#111317]',
                  selectedItem: 'bg-[#FFD100] text-[#111317] border-[#FFD100]',
                  disabledItem: 'opacity-50 cursor-not-allowed',
                }}
              />
            </div>
          </InstantSearch>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-14">
        <div className="rounded-xl border border-[#2A2F39] bg-[#1A1F27] p-6 md:p-8">
          <h3 className="text-2xl font-bold text-[#F3F4F6]">
            Game yang Kamu Cari Belum Ada?
          </h3>
          <p className="mt-2 text-[#9CA3AF]">
            Kirim request sekarang. Kami review satu per satu dan memproses
            request jika file tersedia.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href="/request-game"
              className="inline-flex items-center justify-center rounded-lg bg-[#FFD100] px-5 py-3 font-bold text-[#111317] hover:brightness-95 transition"
            >
              Kirim Request Sekarang
            </a>
            <a
              href="/request-status"
              className="inline-flex items-center justify-center rounded-lg border border-[#2F3643] px-5 py-3 font-semibold text-[#C8CFDA] hover:bg-[#111317] transition"
            >
              Cek Status Request
            </a>
          </div>
          <p className="mt-3 text-xs text-[#9CA3AF]">
            Request yang masuk lebih dulu akan diproses lebih dulu.
          </p>
        </div>
      </section>

      <footer className="border-t border-[#2A2F39] text-[#7E8796] py-8 px-6 text-center">
        <p>
          &copy; {new Date().getFullYear()} MyGameON Hub. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
