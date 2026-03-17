import React, { useMemo } from 'react';

const chartHeight = 180;
const chartWidth = 680;

const toPath = (points) => {
  if (!points.length) return '';
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');
};

const buildSeries = (rows, key, maxValue) =>
  rows.map((row, index) => {
    const x = (index / Math.max(rows.length - 1, 1)) * (chartWidth - 24) + 12;
    const y =
      chartHeight -
      (Number(row[key] || 0) / Math.max(maxValue, 1)) * (chartHeight - 24) -
      12;
    return { x, y };
  });

const ChartCard = ({ title, rows, lines }) => {
  const maxValue = useMemo(
    () =>
      Math.max(
        1,
        ...rows.flatMap((row) =>
          lines.map((line) => Number(row[line.key] || 0))
        )
      ),
    [rows, lines]
  );

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      <div className="mt-3 overflow-x-auto">
        <svg width={chartWidth} height={chartHeight} className="min-w-full">
          <rect
            x="0"
            y="0"
            width={chartWidth}
            height={chartHeight}
            fill="#f8fafc"
            rx="12"
          />
          {lines.map((line) => {
            const points = buildSeries(rows, line.key, maxValue);
            return (
              <path
                key={line.key}
                d={toPath(points)}
                fill="none"
                stroke={line.color}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            );
          })}
        </svg>
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-xs">
        {lines.map((line) => (
          <span
            key={line.key}
            className="inline-flex items-center gap-2 text-gray-600"
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: line.color }}
            />
            {line.label}
          </span>
        ))}
      </div>
    </article>
  );
};

const FinancialCharts = ({ revenueReport }) => {
  const rows = useMemo(
    () =>
      [...revenueReport].sort((a, b) => a.date.getTime() - b.date.getTime()),
    [revenueReport]
  );

  if (!rows.length) {
    return (
      <section className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500">
        Tidak ada data untuk menampilkan Financial Timeline.
      </section>
    );
  }

  return (
    <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <ChartCard
        title="Gross vs Voucher vs Ads"
        rows={rows}
        lines={[
          { key: 'grossIncome', label: 'Gross Revenue', color: '#0284c7' },
          { key: 'voucherCost', label: 'Voucher Cost', color: '#d97706' },
          { key: 'adSpend', label: 'Ads Spend', color: '#e11d48' },
        ]}
      />
      <ChartCard
        title="Net Revenue Trend"
        rows={rows}
        lines={[
          {
            key: 'calculatedNetRevenue',
            label: 'Net Revenue',
            color: '#059669',
          },
        ]}
      />
    </section>
  );
};

export default FinancialCharts;
