import React, { useState, Suspense, lazy } from "react";

// Lazy Load untuk komponen
const SearchGame = lazy(() => import("./SearchGame"));
const RequestGame = lazy(() => import("./RequestGame"));

const LandingPage = () => {
  const [activeTab, setActiveTab] = useState("search");

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">GameFinder</h1>
          <nav>
            <ul className="flex space-x-6">
              <li>
                <button
                  onClick={() => setActiveTab("search")}
                  className={`pb-2 border-b-2 transition-all ${
                    activeTab === "search"
                      ? "border-blue-500 text-blue-600 font-semibold"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Cari Game
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab("request")}
                  className={`pb-2 border-b-2 transition-all ${
                    activeTab === "request"
                      ? "border-blue-500 text-blue-600 font-semibold"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Request Game
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Konten dengan Lazy Loading */}
      <main className="max-w-6xl mx-auto px-6 py-10 bg-white shadow-lg rounded-md mt-6">
        <Suspense fallback={<p className="text-center text-gray-600">Loading...</p>}>
          {activeTab === "search" ? <SearchGame /> : <RequestGame />}
        </Suspense>
      </main>
    </div>
  );
};

export default LandingPage;
