import React from 'react';
import { useJoki } from '../../contexts/JokiContext';

const JokiToolbar = () => {
  const { searchQuery, setSearchQuery, filter, setFilter } = useJoki();

  return (
    <div className="bg-white border border-gray-300 border-b-0 p-3 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
      <input
        type="text"
        className="w-full sm:w-[300px] p-2.5 border border-slate-300 rounded-md outline-none"
        placeholder="🔍 Cari nama customer..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      
      <div className="flex flex-wrap gap-1.5">
        <button
          className={`px-3 py-2 rounded-md transition ${filter === 'ALL' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => setFilter('ALL')}
        >
          ALL
        </button>
        <button
          className={`px-3 py-2 rounded-md transition ${filter === 'RUNNING' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => setFilter('RUNNING')}
        >
          RUNNING
        </button>
        <button
          className={`px-3 py-2 rounded-md transition ${filter === 'PAUSED' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => setFilter('PAUSED')}
        >
          PAUSED
        </button>
      </div>
    </div>
  );
};

export default JokiToolbar;
