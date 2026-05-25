import React from 'react';

const formatCurrency = (value) =>
  `Rp ${Number(value || 0).toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

const DailyFinancialTable = ({
  rows,
  editedRowIds,
  sortDirection,
  onSortToggle,
  onCellChange,
}) => (
  <section className="rounded-xl border border-[#2A2F39] bg-[#1A1F27]">
    <div className="flex items-center justify-between border-b border-[#2A2F39] px-4 py-3">
      <h3 className="text-sm font-semibold text-[#C8CFDA]">
        Daily Financial Table
      </h3>
      <button
        onClick={onSortToggle}
        className="rounded-md border border-[#2A2F39] px-3 py-1.5 text-xs text-[#7E8796] hover:bg-[#2A2F39] hover:text-[#C8CFDA] transition-colors"
      >
        Sort: {sortDirection === 'desc' ? 'Newest' : 'Oldest'}
      </button>
    </div>
    <div className="max-h-[520px] overflow-auto">
      <table className="min-w-full">
        <thead className="sticky top-0 bg-[#111317]">
          <tr>
            <th className="px-4 py-2 text-left text-[10px] font-bold text-[#7E8796] uppercase tracking-wider">
              Date
            </th>
            <th className="px-4 py-2 text-left text-[10px] font-bold text-[#7E8796] uppercase tracking-wider">
              Gross
            </th>
            <th className="px-4 py-2 text-left text-[10px] font-bold text-[#7E8796] uppercase tracking-wider">
              Voucher
            </th>
            <th className="px-4 py-2 text-left text-[10px] font-bold text-[#7E8796] uppercase tracking-wider">
              Ads
            </th>
            <th className="px-4 py-2 text-left text-[10px] font-bold text-[#7E8796] uppercase tracking-wider">
              Net Revenue
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#2A2F39]">
          {rows.length > 0 ? (
            rows.map((row) => {
              const edited = editedRowIds.has(row.id);
              return (
                <tr
                  key={row.id}
                  className={
                    edited
                      ? 'bg-yellow-500/5'
                      : 'bg-transparent hover:bg-[#111317]/50'
                  }
                >
                  <td className="px-4 py-2 text-sm text-[#C8CFDA] whitespace-nowrap">
                    {row.date.toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </td>
                  <td className="px-4 py-2 text-sm text-[#C8CFDA] whitespace-nowrap">
                    {formatCurrency(row.grossIncome)}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <input
                      type="number"
                      value={row.voucherCost ?? 0}
                      onChange={(event) =>
                        onCellChange(row.id, 'voucherCost', event.target.value)
                      }
                      className="w-28 rounded-md border border-[#2A2F39] bg-[#111317] px-2 py-1 text-sm text-[#C8CFDA] focus:outline-none focus:ring-1 focus:ring-[#FFD100]/40"
                    />
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <input
                      type="number"
                      value={row.adSpend ?? 0}
                      onChange={(event) =>
                        onCellChange(row.id, 'adSpend', event.target.value)
                      }
                      className="w-28 rounded-md border border-[#2A2F39] bg-[#111317] px-2 py-1 text-sm text-[#C8CFDA] focus:outline-none focus:ring-1 focus:ring-[#FFD100]/40"
                    />
                  </td>
                  <td className="px-4 py-2 text-sm font-semibold text-emerald-400 whitespace-nowrap">
                    {formatCurrency(row.calculatedNetRevenue)}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td
                colSpan="5"
                className="px-4 py-6 text-center text-sm text-[#7E8796]"
              >
                Tidak ada data finansial pada periode ini.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </section>
);

export default DailyFinancialTable;
