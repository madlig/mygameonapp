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
  <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
      <h3 className="text-sm font-semibold text-gray-700">
        Daily Financial Table
      </h3>
      <button
        onClick={onSortToggle}
        className="rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
      >
        Sort Date: {sortDirection === 'desc' ? 'Newest' : 'Oldest'}
      </button>
    </div>
    <div className="max-h-[520px] overflow-auto">
      <table className="min-w-full">
        <thead className="sticky top-0 bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              Date
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              Gross Income
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              Voucher Cost
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              Ads Spend
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              Net Revenue
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.length > 0 ? (
            rows.map((row) => {
              const edited = editedRowIds.has(row.id);
              return (
                <tr
                  key={row.id}
                  className={edited ? 'bg-amber-50/60' : 'bg-white'}
                >
                  <td className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">
                    {row.date.toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">
                    {formatCurrency(row.grossIncome)}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <input
                      type="number"
                      value={row.voucherCost ?? 0}
                      onChange={(event) =>
                        onCellChange(row.id, 'voucherCost', event.target.value)
                      }
                      className="w-32 rounded-md border border-gray-200 px-2 py-1 text-sm"
                    />
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <input
                      type="number"
                      value={row.adSpend ?? 0}
                      onChange={(event) =>
                        onCellChange(row.id, 'adSpend', event.target.value)
                      }
                      className="w-32 rounded-md border border-gray-200 px-2 py-1 text-sm"
                    />
                  </td>
                  <td className="px-4 py-2 text-sm font-semibold text-emerald-700 whitespace-nowrap">
                    {formatCurrency(row.calculatedNetRevenue)}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td
                colSpan="5"
                className="px-4 py-6 text-center text-sm text-gray-500"
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
