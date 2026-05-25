import React from 'react';
import {
  Megaphone,
  TrendingUp,
  MousePointerClick,
  AlertTriangle,
  Zap,
  Ticket,
  Target,
  ShoppingCart,
} from 'lucide-react';

const formatRupiah = (num) => {
  if (!num && num !== 0) return 'Rp 0';
  if (num >= 1000000) return `Rp ${(num / 1000000).toFixed(1)}jt`;
  if (num >= 1000) return `Rp ${(num / 1000).toFixed(0)}rb`;
  return `Rp ${Math.round(num).toLocaleString('id-ID')}`;
};

const safeDiv = (a, b) => (b ? a / b : 0);

const MiniKPI = ({ label, value, icon: Icon, color, sub }) => (
  <div className="bg-[#111317] border border-[#2A2F39] rounded-xl p-3">
    <div className={`inline-flex p-1.5 rounded-lg mb-2 ${color}`}>
      <Icon size={14} />
    </div>
    <p className="text-lg font-bold text-[#F3F4F6]">{value}</p>
    <p className="text-xs text-[#7E8796]">{label}</p>
    {sub && <p className="text-[10px] text-[#7E8796] mt-0.5">{sub}</p>}
  </div>
);

const AdsPerformanceTab = ({ data }) => {
  if (!data) {
    return (
      <div className="text-center py-12 text-[#7E8796]">
        <p>
          Belum ada data iklan. Import Ads Report untuk melihat performa
          kampanye.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards - 2 rows */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniKPI
          label="Total Spend"
          value={formatRupiah(data.totalSpend)}
          icon={Megaphone}
          color="bg-blue-500/15 text-blue-400"
        />
        <MiniKPI
          label="Ad Revenue"
          value={formatRupiah(data.totalAdsRevenue)}
          icon={TrendingUp}
          color="bg-emerald-500/15 text-emerald-400"
        />
        <MiniKPI
          label="Ad ROAS"
          value={`${data.adRoas.toFixed(2)}x`}
          icon={Target}
          color={
            data.adRoas >= 3
              ? 'bg-emerald-500/15 text-emerald-400'
              : data.adRoas >= 1
                ? 'bg-amber-500/15 text-amber-400'
                : 'bg-red-500/15 text-red-400'
          }
          sub="Revenue / Spend"
        />
        <MiniKPI
          label="Conversions"
          value={data.totalConversions.toLocaleString('id-ID')}
          icon={ShoppingCart}
          color="bg-purple-500/15 text-purple-400"
          sub={`CPO: ${formatRupiah(data.cpo)}`}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniKPI
          label="CPC"
          value={formatRupiah(data.cpc)}
          icon={MousePointerClick}
          color="bg-cyan-500/15 text-cyan-400"
          sub={`${data.totalClicks.toLocaleString('id-ID')} clicks`}
        />
        <MiniKPI
          label="CTR"
          value={`${data.ctr.toFixed(2)}%`}
          icon={Zap}
          color={
            data.ctr >= 1.5
              ? 'bg-emerald-500/15 text-emerald-400'
              : 'bg-amber-500/15 text-amber-400'
          }
          sub={`${data.totalImpressions.toLocaleString('id-ID')} impressions`}
        />
        <MiniKPI
          label="CPM"
          value={formatRupiah(data.costPerImpression)}
          icon={Megaphone}
          color="bg-indigo-500/15 text-indigo-400"
          sub="per 1,000 impr"
        />
        <MiniKPI
          label="Wasted Spend"
          value={formatRupiah(data.wastedSpend)}
          icon={AlertTriangle}
          color="bg-red-500/15 text-red-400"
          sub={`${data.wastedRatio.toFixed(1)}% of budget`}
        />
      </div>

      {/* Voucher Synergy */}
      {data.totalVoucherAmount > 0 && (
        <div className="bg-purple-500/10 border border-purple-500/25 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Ticket size={16} className="text-purple-400" />
            <h3 className="text-sm font-semibold text-purple-300">
              Ads + Voucher Synergy
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-[#7E8796]">Voucher Amount in Ads</p>
              <p className="text-sm font-bold text-[#F3F4F6]">
                {formatRupiah(data.totalVoucherAmount)}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#7E8796]">Vouchered Sales</p>
              <p className="text-sm font-bold text-emerald-400">
                {formatRupiah(data.totalVoucheredSales)}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#7E8796]">Synergy Rate</p>
              <p className="text-sm font-bold text-purple-400">
                {data.voucherSynergyRate.toFixed(1)}%
              </p>
              <p className="text-[10px] text-[#7E8796]">
                vouchered / ad revenue
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Wasted Spend Alert */}
      {data.wastedSpend > 0 && (
        <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-red-400" />
            <h3 className="text-sm font-semibold text-red-400">
              Wasted Ad Spend
            </h3>
            <span className="text-xs text-red-400/70 ml-auto">
              {data.wastedRatio.toFixed(1)}% of total budget
            </span>
          </div>
          <p className="text-xs text-[#C8CFDA] mb-3">
            {data.wastedCampaigns.length} kampanye menghabiskan budget tanpa
            konversi:
          </p>
          <div className="space-y-1.5">
            {data.wastedCampaigns.slice(0, 5).map((c, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-[#C8CFDA] truncate flex-1 mr-2">
                  {c.name}
                </span>
                <span className="text-red-400 font-medium shrink-0">
                  {formatRupiah(c.spend)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Performing Campaigns */}
      {data.topCampaigns.length > 0 && (
        <div className="bg-[#111317] border border-[#2A2F39] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#F3F4F6] mb-4 flex items-center gap-2">
            <Zap size={14} className="text-emerald-400" /> Top Performing
            Campaigns
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[#7E8796] border-b border-[#2A2F39]">
                  <th className="text-left py-2 pr-3">Campaign</th>
                  <th className="text-right py-2 px-2">Spend</th>
                  <th className="text-right py-2 px-2">Revenue</th>
                  <th className="text-right py-2 px-2">ROAS</th>
                  <th className="text-right py-2 pl-2">Conv</th>
                </tr>
              </thead>
              <tbody>
                {data.topCampaigns.map((c, i) => (
                  <tr
                    key={i}
                    className="border-b border-[#2A2F39]/50 hover:bg-[#1A1F27]"
                  >
                    <td className="py-2.5 pr-3 text-[#C8CFDA] max-w-[200px] truncate">
                      {c.name}
                    </td>
                    <td className="py-2.5 px-2 text-right text-[#C8CFDA]">
                      {formatRupiah(c.spend)}
                    </td>
                    <td className="py-2.5 px-2 text-right text-emerald-400 font-medium">
                      {formatRupiah(c.revenue)}
                    </td>
                    <td className="py-2.5 px-2 text-right text-[#FFD100]">
                      {safeDiv(c.revenue || 0, c.spend).toFixed(1)}x
                    </td>
                    <td className="py-2.5 pl-2 text-right text-[#C8CFDA]">
                      {c.conversions || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* All Campaigns */}
      <div className="bg-[#111317] border border-[#2A2F39] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[#F3F4F6] mb-4">
          All Campaigns ({data.campaigns.length})
        </h3>
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-[#111317]">
              <tr className="text-[#7E8796] border-b border-[#2A2F39]">
                <th className="text-left py-2 pr-3">Campaign</th>
                <th className="text-right py-2 px-2">Impr</th>
                <th className="text-right py-2 px-2">Clicks</th>
                <th className="text-right py-2 px-2">CTR</th>
                <th className="text-right py-2 px-2">Spend</th>
                <th className="text-right py-2 px-2">Revenue</th>
                <th className="text-right py-2 px-2">ROAS</th>
                <th className="text-right py-2 pl-2">Voucher</th>
              </tr>
            </thead>
            <tbody>
              {data.campaigns.map((c, i) => {
                const roas = safeDiv(c.revenue || 0, c.spend);
                const ctr = safeDiv(c.clicks || 0, c.impressions || 0) * 100;
                const isWasted = c.spend > 0 && (c.conversions || 0) === 0;
                return (
                  <tr
                    key={i}
                    className={`border-b border-[#2A2F39]/50 hover:bg-[#1A1F27] ${isWasted ? 'bg-red-500/5' : ''}`}
                  >
                    <td className="py-2 pr-3 text-[#C8CFDA] max-w-[180px] truncate">
                      {c.name}
                    </td>
                    <td className="py-2 px-2 text-right text-[#7E8796]">
                      {(c.impressions || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="py-2 px-2 text-right text-[#C8CFDA]">
                      {(c.clicks || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="py-2 px-2 text-right text-[#7E8796]">
                      {ctr.toFixed(2)}%
                    </td>
                    <td className="py-2 px-2 text-right text-[#C8CFDA]">
                      {formatRupiah(c.spend)}
                    </td>
                    <td
                      className={`py-2 px-2 text-right font-medium ${(c.revenue || 0) > 0 ? 'text-emerald-400' : 'text-[#7E8796]'}`}
                    >
                      {formatRupiah(c.revenue || 0)}
                    </td>
                    <td
                      className={`py-2 px-2 text-right font-medium ${roas >= 3 ? 'text-emerald-400' : roas >= 1 ? 'text-[#FFD100]' : 'text-red-400'}`}
                    >
                      {c.spend > 0 ? `${roas.toFixed(1)}x` : '-'}
                    </td>
                    <td className="py-2 pl-2 text-right text-purple-400/80">
                      {(c.voucherAmount || 0) > 0
                        ? formatRupiah(c.voucherAmount)
                        : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdsPerformanceTab;
