import React from 'react';

const cardConfig = [
  { key: 'gross', title: 'Gross Revenue', tone: 'text-sky-700' },
  { key: 'voucher', title: 'Voucher Cost', tone: 'text-amber-700' },
  { key: 'ads', title: 'Ads Spend', tone: 'text-rose-700' },
  { key: 'net', title: 'Net Revenue', tone: 'text-emerald-700' },
  { key: 'payroll', title: 'Admin Payroll', tone: 'text-violet-700' },
  { key: 'profit', title: 'Net Profit', tone: 'text-indigo-700' },
];

const formatCurrency = (value) =>
  `Rp ${Number(value || 0).toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

const OperationalSummaryCards = ({ metrics }) => {
  const map = {
    gross: metrics.totalGrossRevenue,
    voucher: metrics.totalVoucherCost,
    ads: metrics.totalAdSpend,
    net: metrics.totalNetRevenue,
    payroll: metrics.totalAdminPay,
    profit: metrics.netProfit,
  };

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {cardConfig.map((card) => (
        <article
          key={card.key}
          className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          <p className="text-xs uppercase tracking-wide text-gray-500">
            {card.title}
          </p>
          <p className={`mt-2 text-2xl font-bold ${card.tone}`}>
            {formatCurrency(map[card.key])}
          </p>
          <p className="mt-1 text-xs text-gray-500">Periode aktif dashboard</p>
        </article>
      ))}
    </section>
  );
};

export default OperationalSummaryCards;
