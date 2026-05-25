import React from 'react';
import {
  TrendingUp,
  ShoppingBag,
  Users,
  Eye,
  Wallet,
  Target,
  Megaphone,
  Ticket,
  Shield,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

const formatRupiah = (num) => {
  if (!num && num !== 0) return 'Rp 0';
  if (num >= 1000000) return `Rp ${(num / 1000000).toFixed(1)}jt`;
  if (num >= 1000) return `Rp ${(num / 1000).toFixed(0)}rb`;
  return `Rp ${Math.round(num).toLocaleString('id-ID')}`;
};

const formatNumber = (num) => {
  if (!num && num !== 0) return '0';
  return Math.round(num).toLocaleString('id-ID');
};

const KPICard = ({ icon: Icon, iconColor, label, value, subtitle }) => (
  <div className="bg-[#111317] border border-[#2A2F39] rounded-xl p-4 hover:border-[#FFD100]/20 transition-colors">
    <div className="flex items-start justify-between mb-3">
      <div className={`p-2 rounded-lg ${iconColor}`}>
        <Icon size={18} />
      </div>
    </div>
    <p className="text-xl font-bold text-[#F3F4F6]">{value}</p>
    <p className="text-xs text-[#7E8796] mt-1">{label}</p>
    {subtitle && <p className="text-xs text-[#C8CFDA] mt-0.5">{subtitle}</p>}
  </div>
);

const CostRow = ({ label, value, total, color, icon: Icon }) => {
  const pct = total ? (value / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      {Icon && (
        <div className="shrink-0">
          <Icon size={12} className="text-[#7E8796]" />
        </div>
      )}
      <span className="text-xs text-[#7E8796] w-32 shrink-0">{label}</span>
      <div className="flex-1 h-2.5 bg-[#1A1F27] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <span className="text-xs text-[#C8CFDA] w-20 text-right font-medium">
        {formatRupiah(value)}
      </span>
      <span className="text-xs text-[#7E8796] w-12 text-right">
        {pct.toFixed(1)}%
      </span>
    </div>
  );
};

const OverviewTab = ({ data }) => {
  if (!data) {
    return (
      <div className="text-center py-12 text-[#7E8796]">
        <p>Belum ada data. Import laporan Shopee untuk melihat analytics.</p>
      </div>
    );
  }

  const isHealthy = data.profitMargin >= 30;
  const isGoodRoas = data.roas >= 3;

  return (
    <div className="space-y-6">
      {/* Revenue & Orders Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <KPICard
          icon={Wallet}
          iconColor="bg-[#FFD100]/15 text-[#FFD100]"
          label="Total Revenue"
          value={formatRupiah(data.totalRevenue)}
          subtitle={`Net: ${formatRupiah(data.netRevenue)}`}
        />
        <KPICard
          icon={ShoppingBag}
          iconColor="bg-emerald-500/15 text-emerald-400"
          label="Total Orders"
          value={formatNumber(data.totalOrders)}
          subtitle={`AOV: ${formatRupiah(data.aov)}`}
        />
        <KPICard
          icon={Eye}
          iconColor="bg-blue-500/15 text-blue-400"
          label="Visitors"
          value={formatNumber(data.totalVisitors)}
          subtitle={`CVR: ${data.conversionRate.toFixed(2)}%`}
        />
        <KPICard
          icon={Users}
          iconColor="bg-purple-500/15 text-purple-400"
          label="Buyers"
          value={formatNumber(data.totalBuyers)}
          subtitle={`New: ${formatNumber(data.newBuyers)} | Return: ${formatNumber(data.returningBuyers)}`}
        />
      </div>

      {/* Performance Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard
          icon={TrendingUp}
          iconColor={
            isGoodRoas
              ? 'bg-emerald-500/15 text-emerald-400'
              : 'bg-amber-500/15 text-amber-400'
          }
          label="ROAS"
          value={`${data.roas.toFixed(2)}x`}
          subtitle="Revenue / Marketing Spend"
        />
        <KPICard
          icon={Target}
          iconColor={
            isHealthy
              ? 'bg-emerald-500/15 text-emerald-400'
              : 'bg-red-500/15 text-red-400'
          }
          label="Profit Margin"
          value={`${data.profitMargin.toFixed(1)}%`}
          subtitle={`Marketing: ${data.marketingCostRatio.toFixed(1)}%`}
        />
        <KPICard
          icon={Users}
          iconColor="bg-pink-500/15 text-pink-400"
          label="Repeat Rate"
          value={`${data.repeatRate.toFixed(1)}%`}
          subtitle={`${formatNumber(data.returningBuyers)} returning`}
        />
        <KPICard
          icon={ShoppingBag}
          iconColor={
            data.cancelRate > 5
              ? 'bg-red-500/15 text-red-400'
              : 'bg-emerald-500/15 text-emerald-400'
          }
          label="Cancel Rate"
          value={`${data.cancelRate.toFixed(1)}%`}
          subtitle={`${formatNumber(data.canceledOrders)} cancelled`}
        />
      </div>

      {/* Marketing Efficiency + Cost Breakdown */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Marketing Efficiency */}
        <div className="bg-[#111317] border border-[#2A2F39] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#F3F4F6] mb-4 flex items-center gap-2">
            <Megaphone size={14} className="text-blue-400" />
            Marketing Efficiency
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#1A1F27] rounded-lg p-3">
                <p className="text-xs text-[#7E8796]">Ad Spend</p>
                <p className="text-sm font-bold text-blue-400">
                  {formatRupiah(data.adSpend)}
                </p>
                <p className="text-[10px] text-[#7E8796] mt-0.5">
                  {data.totalRevenue
                    ? ((data.adSpend / data.totalRevenue) * 100).toFixed(1)
                    : 0}
                  % of revenue
                </p>
              </div>
              <div className="bg-[#1A1F27] rounded-lg p-3">
                <p className="text-xs text-[#7E8796]">Voucher Cost</p>
                <p className="text-sm font-bold text-purple-400">
                  {formatRupiah(data.voucherCost)}
                </p>
                <p className="text-[10px] text-[#7E8796] mt-0.5">
                  {data.totalRevenue
                    ? ((data.voucherCost / data.totalRevenue) * 100).toFixed(1)
                    : 0}
                  % of revenue
                </p>
              </div>
            </div>
            <div className="bg-[#1A1F27] rounded-lg p-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-[#7E8796]">Total Marketing Spend</p>
                <p className="text-sm font-bold text-[#F3F4F6]">
                  {formatRupiah(data.totalMarketingSpend)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#7E8796]">Cost Ratio</p>
                <p
                  className={`text-sm font-bold ${data.marketingCostRatio <= 25 ? 'text-emerald-400' : data.marketingCostRatio <= 35 ? 'text-amber-400' : 'text-red-400'}`}
                >
                  {data.marketingCostRatio.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="bg-[#111317] border border-[#2A2F39] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#F3F4F6] mb-4 flex items-center gap-2">
            <CreditCard size={14} className="text-amber-400" />
            Cost Breakdown
          </h3>
          <div className="space-y-3">
            <CostRow
              label="Ad Spend"
              value={data.adSpend}
              total={data.totalRevenue}
              color="bg-blue-400"
              icon={Megaphone}
            />
            <CostRow
              label="Voucher Cost"
              value={data.voucherCost}
              total={data.totalRevenue}
              color="bg-purple-400"
              icon={Ticket}
            />
            <CostRow
              label="Admin Fee (7.5%)"
              value={data.adminFee}
              total={data.totalRevenue}
              color="bg-amber-400"
              icon={Shield}
            />
            <CostRow
              label="Processing Fee"
              value={data.processingFee}
              total={data.totalRevenue}
              color="bg-gray-400"
              icon={CreditCard}
            />
          </div>
          <div className="mt-4 pt-3 border-t border-[#2A2F39] flex justify-between items-center">
            <span className="text-sm text-[#C8CFDA] flex items-center gap-1.5">
              {data.netRevenue >= 0 ? (
                <ArrowUpRight size={14} className="text-emerald-400" />
              ) : (
                <ArrowDownRight size={14} className="text-red-400" />
              )}
              Net Profit
            </span>
            <span
              className={`text-lg font-bold ${data.netRevenue >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
            >
              {formatRupiah(data.netRevenue)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
