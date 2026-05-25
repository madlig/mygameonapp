import React from 'react';
import {
  Ticket,
  TrendingUp,
  Users,
  DollarSign,
  Award,
  ShoppingBag,
  BarChart3,
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

const VoucherAnalysisTab = ({ data }) => {
  if (!data) {
    return (
      <div className="text-center py-12 text-[#7E8796]">
        <p>
          Belum ada data voucher. Import Voucher Report untuk melihat analisis.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <MiniKPI
          label="Total Cost"
          value={formatRupiah(data.totalCost)}
          icon={DollarSign}
          color="bg-purple-500/15 text-purple-400"
        />
        <MiniKPI
          label="Influenced Sales"
          value={formatRupiah(data.influencedSales)}
          icon={TrendingUp}
          color="bg-emerald-500/15 text-emerald-400"
        />
        <MiniKPI
          label="ROI"
          value={`${data.roi.toFixed(0)}%`}
          icon={Award}
          color={
            data.roi > 500
              ? 'bg-emerald-500/15 text-emerald-400'
              : data.roi > 100
                ? 'bg-[#FFD100]/15 text-[#FFD100]'
                : 'bg-red-500/15 text-red-400'
          }
          sub="(Sales - Cost) / Cost"
        />
        <MiniKPI
          label="Claims"
          value={data.totalClaims.toLocaleString('id-ID')}
          icon={Users}
          color="bg-blue-500/15 text-blue-400"
          sub={`${data.totalUsage} used`}
        />
        <MiniKPI
          label="Usage Rate"
          value={`${data.usageRate.toFixed(1)}%`}
          icon={Ticket}
          color={
            data.usageRate >= 10
              ? 'bg-emerald-500/15 text-emerald-400'
              : 'bg-amber-500/15 text-amber-400'
          }
          sub={`CPO: ${formatRupiah(data.costPerOrder)}`}
        />
      </div>

      {/* Best Vouchers */}
      {data.bestVouchers.length > 0 && (
        <div className="bg-[#111317] border border-[#2A2F39] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#F3F4F6] mb-4 flex items-center gap-2">
            <Award size={14} className="text-[#FFD100]" /> Best Performing
            Vouchers
          </h3>
          <div className="space-y-3">
            {data.bestVouchers.map((v, i) => {
              const vRoi =
                safeDiv((v.influencedSales || 0) - (v.cost || 0), v.cost || 1) *
                100;
              const vUsageRate = safeDiv(v.usage || 0, v.claims || 1) * 100;
              return (
                <div
                  key={i}
                  className="flex items-center gap-4 p-3 bg-[#1A1F27] rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#F3F4F6] truncate">
                      {v.name}
                    </p>
                    <div className="flex flex-wrap gap-3 mt-1">
                      <span className="text-xs text-[#7E8796]">
                        Cost: {formatRupiah(v.cost)}
                      </span>
                      <span className="text-xs text-emerald-400">
                        Sales: {formatRupiah(v.influencedSales)}
                      </span>
                      <span className="text-xs text-[#7E8796]">
                        Usage: {vUsageRate.toFixed(0)}%
                      </span>
                      {v.buyers > 0 && (
                        <span className="text-xs text-blue-400/70">
                          {v.buyers} buyers
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={`text-sm font-bold ${vRoi > 500 ? 'text-emerald-400' : vRoi > 100 ? 'text-[#FFD100]' : 'text-[#C8CFDA]'}`}
                    >
                      {vRoi.toFixed(0)}% ROI
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Worst Vouchers Alert */}
      {data.worstVouchers && data.worstVouchers.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 size={16} className="text-amber-400" />
            <h3 className="text-sm font-semibold text-amber-400">
              Low ROI Vouchers
            </h3>
          </div>
          <p className="text-xs text-[#C8CFDA] mb-3">
            Voucher dengan ROI di bawah 2x — pertimbangkan untuk evaluasi:
          </p>
          <div className="space-y-1.5">
            {data.worstVouchers.map((v, i) => {
              const vRoi =
                safeDiv((v.influencedSales || 0) - (v.cost || 0), v.cost || 1) *
                100;
              return (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-[#C8CFDA] truncate flex-1 mr-2">
                    {v.name}
                  </span>
                  <span className="text-amber-400/70 mr-3">
                    {formatRupiah(v.cost)} spent
                  </span>
                  <span className="text-amber-400 font-medium shrink-0">
                    {vRoi.toFixed(0)}% ROI
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All Vouchers Table */}
      {data.vouchers.length > 0 && (
        <div className="bg-[#111317] border border-[#2A2F39] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#F3F4F6] mb-4">
            All Vouchers ({data.vouchers.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[#7E8796] border-b border-[#2A2F39]">
                  <th className="text-left py-2 pr-3">Voucher</th>
                  <th className="text-right py-2 px-2">Cost</th>
                  <th className="text-right py-2 px-2">Claims</th>
                  <th className="text-right py-2 px-2">Used</th>
                  <th className="text-right py-2 px-2">Usage %</th>
                  <th className="text-right py-2 px-2">Sales</th>
                  <th className="text-right py-2 px-2">Buyers</th>
                  <th className="text-right py-2 pl-2">ROI</th>
                </tr>
              </thead>
              <tbody>
                {data.vouchers.map((v, i) => {
                  const vRoi =
                    safeDiv(
                      (v.influencedSales || 0) - (v.cost || 0),
                      v.cost || 1
                    ) * 100;
                  const vUsageRate = safeDiv(v.usage || 0, v.claims || 1) * 100;
                  return (
                    <tr
                      key={i}
                      className="border-b border-[#2A2F39]/50 hover:bg-[#1A1F27]"
                    >
                      <td className="py-2.5 pr-3 text-[#C8CFDA] max-w-[160px] truncate">
                        {v.name}
                      </td>
                      <td className="py-2.5 px-2 text-right text-[#C8CFDA]">
                        {formatRupiah(v.cost)}
                      </td>
                      <td className="py-2.5 px-2 text-right text-[#7E8796]">
                        {(v.claims || 0).toLocaleString('id-ID')}
                      </td>
                      <td className="py-2.5 px-2 text-right text-[#C8CFDA]">
                        {(v.usage || 0).toLocaleString('id-ID')}
                      </td>
                      <td className="py-2.5 px-2 text-right text-[#7E8796]">
                        {vUsageRate.toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-2 text-right text-emerald-400">
                        {formatRupiah(v.influencedSales)}
                      </td>
                      <td className="py-2.5 px-2 text-right text-blue-400/70">
                        {(v.buyers || 0).toLocaleString('id-ID')}
                      </td>
                      <td
                        className={`py-2.5 pl-2 text-right font-medium ${vRoi > 500 ? 'text-emerald-400' : vRoi > 100 ? 'text-[#FFD100]' : 'text-red-400'}`}
                      >
                        {v.cost > 0 ? `${vRoi.toFixed(0)}%` : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Daily Voucher Performance */}
      {data.daily.length > 0 && (
        <div className="bg-[#111317] border border-[#2A2F39] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#F3F4F6] mb-4 flex items-center gap-2">
            <ShoppingBag size={14} className="text-purple-400" />
            Daily Voucher Performance
          </h3>
          <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
            {data.daily.map((d, i) => {
              const maxSales = Math.max(
                ...data.daily.map((x) => x.sales || 0),
                1
              );
              const pct = ((d.sales || 0) / maxSales) * 100;
              const dateLabel =
                d.date instanceof Date
                  ? `${d.date.getDate()}/${d.date.getMonth() + 1}`
                  : String(d.date || '').slice(-5);
              return (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-[#7E8796] w-10 shrink-0">
                    {dateLabel}
                  </span>
                  <div className="flex-1 h-5 bg-[#1A1F27] rounded overflow-hidden relative">
                    <div
                      className="h-full bg-purple-500/40 rounded"
                      style={{ width: `${pct}%` }}
                    />
                    {(d.voucherCost || 0) > 0 && (
                      <div
                        className="absolute top-0 h-full bg-red-400/30 rounded"
                        style={{
                          width: `${Math.min(((d.voucherCost || 0) / maxSales) * 100, 100)}%`,
                        }}
                      />
                    )}
                  </div>
                  <span className="text-xs text-emerald-400/80 w-16 text-right shrink-0">
                    {formatRupiah(d.sales || 0)}
                  </span>
                  <span className="text-xs text-[#7E8796] w-14 text-right shrink-0">
                    {formatRupiah(d.voucherCost || 0)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-3 pt-2 border-t border-[#2A2F39]">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-2 rounded bg-purple-500/40" />
              <span className="text-[10px] text-[#7E8796]">Sales</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-2 rounded bg-red-400/30" />
              <span className="text-[10px] text-[#7E8796]">Voucher Cost</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoucherAnalysisTab;
