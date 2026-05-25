import React, { useMemo, useState } from 'react';
import {
  ShoppingCart,
  Search,
  Users,
  BarChart3,
  Globe,
  Layers,
  TrendingUp,
  Monitor,
  Video,
  Link2,
  Megaphone,
} from 'lucide-react';

const formatRupiah = (num) => {
  if (!num && num !== 0) return 'Rp 0';
  if (num >= 1000000) return `Rp ${(num / 1000000).toFixed(1)}jt`;
  if (num >= 1000) return `Rp ${(num / 1000).toFixed(0)}rb`;
  return `Rp ${Math.round(num).toLocaleString('id-ID')}`;
};

const TRAFFIC_COLORS = [
  'bg-blue-400',
  'bg-emerald-400',
  'bg-amber-400',
  'bg-purple-400',
  'bg-cyan-400',
  'bg-pink-400',
  'bg-orange-400',
  'bg-indigo-400',
];

const CHART_COLORS = [
  '#60A5FA',
  '#34D399',
  '#FBBF24',
  '#A78BFA',
  '#22D3EE',
  '#F472B6',
  '#FB923C',
  '#818CF8',
];

const QuickStat = ({ icon: Icon, color, label, value, sub }) => (
  <div className="bg-[#111317] border border-[#2A2F39] rounded-xl p-3">
    <div className={`inline-flex p-1.5 rounded-lg mb-2 ${color}`}>
      <Icon size={14} />
    </div>
    <p className="text-lg font-bold text-[#F3F4F6]">{value}</p>
    <p className="text-xs text-[#7E8796]">{label}</p>
    {sub && <p className="text-[10px] text-[#7E8796] mt-0.5">{sub}</p>}
  </div>
);

const ChannelCard = ({ icon: Icon, color, label, value, pct }) => (
  <div className="bg-[#1A1F27] rounded-lg p-3 flex items-center gap-3">
    <div className={`p-2 rounded-lg shrink-0 ${color}`}>
      <Icon size={16} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-[#7E8796]">{label}</p>
      <p className="text-sm font-bold text-[#F3F4F6]">{formatRupiah(value)}</p>
    </div>
    {pct != null && (
      <span className="text-xs font-medium text-[#C8CFDA] shrink-0">
        {pct.toFixed(1)}%
      </span>
    )}
  </div>
);

const ProductIntelligenceTab = ({ data }) => {
  const [trendView, setTrendView] = useState('orders');

  const channelBreakdown = data?.channelBreakdown;
  const dailyPerSource = data?.dailyPerSource || [];

  // Group dailyPerSource by date for trend visualization
  const trendData = useMemo(() => {
    if (!dailyPerSource.length) return { dates: [], sources: [], matrix: {} };

    const sourcesSet = new Set();
    const datesSet = new Set();
    const matrix = {};

    for (const row of dailyPerSource) {
      if (!row.date || !row.source) continue;
      const dt = row.date instanceof Date ? row.date : new Date(row.date);
      const key = `${dt.getMonth() + 1}/${dt.getDate()}`;
      datesSet.add(key);
      sourcesSet.add(row.source);
      if (!matrix[key]) matrix[key] = {};
      matrix[key][row.source] = {
        orders: row.orders || 0,
        sales: row.sales || 0,
        visitors: row.visitors || 0,
      };
    }

    const dates = [...datesSet];
    const sources = [...sourcesSet].sort((a, b) => {
      const totalA = dates.reduce(
        (s, d) => s + (matrix[d]?.[a]?.orders || 0),
        0
      );
      const totalB = dates.reduce(
        (s, d) => s + (matrix[d]?.[b]?.orders || 0),
        0
      );
      return totalB - totalA;
    });

    return { dates, sources: sources.slice(0, 8), matrix };
  }, [dailyPerSource]);

  // Calculate max value for trend chart scaling
  const trendMax = useMemo(() => {
    if (!trendData.dates.length) return 1;
    let max = 0;
    for (const date of trendData.dates) {
      let total = 0;
      for (const src of trendData.sources) {
        total += trendData.matrix[date]?.[src]?.[trendView] || 0;
      }
      if (total > max) max = total;
    }
    return max || 1;
  }, [trendData, trendView]);

  if (!data) {
    return (
      <div className="text-center py-12 text-[#7E8796]">
        <p>
          Belum ada data produk. Import Shop Stats untuk melihat intelligence.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickStat
          icon={Globe}
          color="bg-blue-500/15 text-blue-400"
          label="Total Visitors"
          value={data.totalVisitors.toLocaleString('id-ID')}
        />
        <QuickStat
          icon={Search}
          color="bg-amber-500/15 text-amber-400"
          label="Search Traffic"
          value={`${data.searchShare.toFixed(1)}%`}
          sub="dari total penjualan"
        />
        <QuickStat
          icon={Users}
          color="bg-emerald-500/15 text-emerald-400"
          label="New Buyers"
          value={data.newBuyers.toLocaleString('id-ID')}
        />
        <QuickStat
          icon={Users}
          color="bg-pink-500/15 text-pink-400"
          label="Repeat Rate"
          value={`${data.repeatRate.toFixed(1)}%`}
          sub={`${data.returningBuyers} returning`}
        />
      </div>

      {/* Channel Breakdown */}
      {channelBreakdown && (
        <div className="bg-[#111317] border border-[#2A2F39] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#F3F4F6] mb-4 flex items-center gap-2">
            <Layers size={14} className="text-[#FFD100]" />
            Sales Channel Breakdown
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <ChannelCard
              icon={Monitor}
              color="bg-blue-500/15 text-blue-400"
              label="Halaman Produk"
              value={channelBreakdown.fromProductPage || 0}
              pct={
                channelBreakdown.totalSales
                  ? ((channelBreakdown.fromProductPage || 0) /
                      channelBreakdown.totalSales) *
                    100
                  : 0
              }
            />
            <ChannelCard
              icon={Megaphone}
              color="bg-purple-500/15 text-purple-400"
              label="Iklan Shopee"
              value={channelBreakdown.fromAds || 0}
              pct={
                channelBreakdown.totalSales
                  ? ((channelBreakdown.fromAds || 0) /
                      channelBreakdown.totalSales) *
                    100
                  : 0
              }
            />
            <ChannelCard
              icon={Link2}
              color="bg-emerald-500/15 text-emerald-400"
              label="Affiliate"
              value={channelBreakdown.fromAffiliate || 0}
              pct={
                channelBreakdown.totalSales
                  ? ((channelBreakdown.fromAffiliate || 0) /
                      channelBreakdown.totalSales) *
                    100
                  : 0
              }
            />
            {(channelBreakdown.fromLive || 0) > 0 && (
              <ChannelCard
                icon={Video}
                color="bg-red-500/15 text-red-400"
                label="Live Penjual"
                value={channelBreakdown.fromLive}
              />
            )}
            {(channelBreakdown.fromVideo || 0) > 0 && (
              <ChannelCard
                icon={Video}
                color="bg-pink-500/15 text-pink-400"
                label="Video Penjual"
                value={channelBreakdown.fromVideo}
              />
            )}
          </div>
          {channelBreakdown.totalSales > 0 && (
            <div className="mt-4 pt-3 border-t border-[#2A2F39] flex justify-between items-center">
              <span className="text-xs text-[#7E8796]">
                Total Channel Sales
              </span>
              <span className="text-sm font-bold text-[#F3F4F6]">
                {formatRupiah(channelBreakdown.totalSales)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Traffic Sources + Ads Sources side by side */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-[#111317] border border-[#2A2F39] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#F3F4F6] mb-4 flex items-center gap-2">
            <Globe size={14} className="text-blue-400" /> Traffic Sources
          </h3>
          <div className="space-y-3">
            {data.trafficSources.map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-[#C8CFDA] w-28 shrink-0 truncate">
                  {s.source}
                </span>
                <div className="flex-1 h-3 bg-[#1A1F27] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${TRAFFIC_COLORS[i % TRAFFIC_COLORS.length]}`}
                    style={{
                      width: `${Math.min(s.salesRatio || s.percentage || 0, 100)}%`,
                    }}
                  />
                </div>
                <span className="text-xs text-[#7E8796] w-12 text-right shrink-0">
                  {(s.salesRatio || s.percentage || 0).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {data.adsSources.length > 0 && (
          <div className="bg-[#111317] border border-[#2A2F39] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-[#F3F4F6] mb-4 flex items-center gap-2">
              <BarChart3 size={14} className="text-purple-400" /> Ads Breakdown
            </h3>
            <div className="space-y-3">
              {data.adsSources.map((s, i) => (
                <div key={i}>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#C8CFDA] w-28 shrink-0 truncate">
                      {s.source}
                    </span>
                    <div className="flex-1 h-3 bg-[#1A1F27] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${TRAFFIC_COLORS[(i + 3) % TRAFFIC_COLORS.length]}`}
                        style={{
                          width: `${Math.min(s.salesRatio || s.percentage || 0, 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-[#7E8796] w-12 text-right shrink-0">
                      {(s.salesRatio || s.percentage || 0).toFixed(1)}%
                    </span>
                  </div>
                  {(s.spend != null || s.roas != null) && (
                    <div className="flex gap-3 ml-[7.5rem] mt-1">
                      {s.spend != null && (
                        <span className="text-[10px] text-[#7E8796]">
                          Spend: {formatRupiah(s.spend)}
                        </span>
                      )}
                      {s.roas != null && (
                        <span className="text-[10px] text-emerald-400/70">
                          ROAS: {s.roas.toFixed(1)}x
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Daily Traffic Trend per Source */}
      {trendData.dates.length > 0 && (
        <div className="bg-[#111317] border border-[#2A2F39] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#F3F4F6] flex items-center gap-2">
              <TrendingUp size={14} className="text-cyan-400" /> Daily Traffic
              Trend per Source
            </h3>
            <div className="flex gap-1">
              {[
                { key: 'orders', label: 'Orders' },
                { key: 'sales', label: 'Sales' },
                { key: 'visitors', label: 'Visitors' },
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setTrendView(opt.key)}
                  className={`px-2.5 py-1 text-[10px] font-medium rounded-md transition-colors ${
                    trendView === opt.key
                      ? 'bg-[#FFD100]/15 text-[#FFD100] border border-[#FFD100]/25'
                      : 'text-[#7E8796] hover:text-[#C8CFDA] border border-[#2A2F39]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stacked bar chart */}
          <div className="overflow-x-auto pb-6">
            <div
              className="flex items-end gap-[3px] min-w-[600px]"
              style={{ height: '180px' }}
            >
              {trendData.dates.map((date) => {
                const segments = trendData.sources.map((src, si) => ({
                  source: src,
                  value: trendData.matrix[date]?.[src]?.[trendView] || 0,
                  color: CHART_COLORS[si % CHART_COLORS.length],
                }));
                const total = segments.reduce((s, seg) => s + seg.value, 0);
                const barHeight = (total / trendMax) * 100;

                return (
                  <div
                    key={date}
                    className="flex-1 flex flex-col items-center group relative"
                  >
                    <div
                      className="w-full flex flex-col-reverse rounded-t"
                      style={{ height: `${Math.max(barHeight, 2)}%` }}
                    >
                      {segments.map((seg, si) => {
                        const segPct =
                          total > 0 ? (seg.value / total) * 100 : 0;
                        if (segPct === 0) return null;
                        return (
                          <div
                            key={si}
                            className="w-full opacity-80 group-hover:opacity-100 transition-opacity first:rounded-b last:rounded-t"
                            style={{
                              height: `${segPct}%`,
                              backgroundColor: seg.color,
                              minHeight: segPct > 0 ? '2px' : 0,
                            }}
                          />
                        );
                      })}
                    </div>
                    <span className="text-[8px] text-[#7E8796] mt-1 whitespace-nowrap">
                      {date}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 pt-3 border-t border-[#2A2F39]">
            {trendData.sources.map((src, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{
                    backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                  }}
                />
                <span className="text-[10px] text-[#C8CFDA] truncate max-w-[120px]">
                  {src}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Products */}
      {data.topProducts.length > 0 && (
        <div className="bg-[#111317] border border-[#2A2F39] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#F3F4F6] mb-4 flex items-center gap-2">
            <ShoppingCart size={14} className="text-[#FFD100]" /> Top Products
            by Sales Contribution
          </h3>
          <div className="space-y-2">
            {data.topProducts.slice(0, 10).map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-[#7E8796] w-5 shrink-0 text-right">
                  {i + 1}
                </span>
                <span className="text-xs text-[#C8CFDA] flex-1 truncate">
                  {p.name}
                </span>
                <div className="w-32 h-3 bg-[#1A1F27] rounded-full overflow-hidden shrink-0">
                  <div
                    className="h-full rounded-full bg-[#FFD100]/60"
                    style={{
                      width: `${Math.min((p.salesRatio || p.salesPercentage || 0) * 2, 100)}%`,
                    }}
                  />
                </div>
                <span className="text-xs text-[#FFD100] w-12 text-right shrink-0 font-medium">
                  {(p.salesRatio || p.salesPercentage || 0).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily table */}
      {data.daily.length > 0 && (
        <div className="bg-[#111317] border border-[#2A2F39] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#F3F4F6] mb-4">
            Daily Orders & Sales
          </h3>
          <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-[#111317]">
                <tr className="text-[#7E8796] border-b border-[#2A2F39]">
                  <th className="text-left py-2 pr-3">Date</th>
                  <th className="text-right py-2 px-2">Visitors</th>
                  <th className="text-right py-2 px-2">Orders</th>
                  <th className="text-right py-2 pl-2">Sales</th>
                </tr>
              </thead>
              <tbody>
                {data.daily.map((d, i) => {
                  const dateLabel =
                    d.date instanceof Date
                      ? `${d.date.getDate()}/${d.date.getMonth() + 1}/${d.date.getFullYear()}`
                      : String(d.date || '');
                  return (
                    <tr
                      key={i}
                      className="border-b border-[#2A2F39]/50 hover:bg-[#1A1F27]"
                    >
                      <td className="py-2 pr-3 text-[#C8CFDA]">{dateLabel}</td>
                      <td className="py-2 px-2 text-right text-[#7E8796]">
                        {(d.visitors || 0).toLocaleString('id-ID')}
                      </td>
                      <td className="py-2 px-2 text-right text-[#C8CFDA]">
                        {(d.orders || 0).toLocaleString('id-ID')}
                      </td>
                      <td className="py-2 pl-2 text-right text-emerald-400">
                        {formatRupiah(d.sales || 0)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductIntelligenceTab;
