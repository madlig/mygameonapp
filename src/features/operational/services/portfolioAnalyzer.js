const safeDiv = (a, b) => (b ? a / b : 0);

const SHOPEE_ADMIN_FEE_RATE = 0.075;
const PROCESSING_FEE_PER_ORDER = 1250;

export const computeOverviewKPIs = (data) => {
  if (!data) return null;

  const { ads, voucher, shopStats } = data;

  const totalRevenue = shopStats?.summary?.totalSales || 0;
  const totalOrders = shopStats?.summary?.totalOrders || 0;
  const totalVisitors = shopStats?.summary?.totalVisitors || 0;
  const totalBuyers = shopStats?.summary?.totalBuyers || 0;
  const newBuyers = shopStats?.summary?.newBuyers || 0;
  const returningBuyers = shopStats?.summary?.returningBuyers || 0;
  const canceledOrders = shopStats?.summary?.canceledOrders || 0;

  const adSpend = ads?.totals?.totalSpend || 0;
  const voucherCost = voucher?.summary?.totalCost || 0;
  const totalMarketingSpend = adSpend + voucherCost;

  const aov = safeDiv(totalRevenue, totalOrders);
  const conversionRate = safeDiv(totalBuyers, totalVisitors) * 100;
  const marketingCostRatio = safeDiv(totalMarketingSpend, totalRevenue) * 100;
  const roas = safeDiv(totalRevenue, totalMarketingSpend);

  const adminFee = (totalRevenue - voucherCost) * SHOPEE_ADMIN_FEE_RATE;
  const processingFee = totalOrders * PROCESSING_FEE_PER_ORDER;
  const netRevenue =
    totalRevenue - adminFee - processingFee - totalMarketingSpend;
  const profitMargin = safeDiv(netRevenue, totalRevenue) * 100;

  const repeatRate = safeDiv(returningBuyers, totalBuyers) * 100;
  const cancelRate =
    safeDiv(canceledOrders, totalOrders + canceledOrders) * 100;

  return {
    totalRevenue,
    totalOrders,
    totalVisitors,
    totalBuyers,
    newBuyers,
    returningBuyers,
    aov,
    conversionRate,
    marketingCostRatio,
    roas,
    adSpend,
    voucherCost,
    totalMarketingSpend,
    adminFee,
    processingFee,
    netRevenue,
    profitMargin,
    repeatRate,
    cancelRate,
    canceledOrders,
  };
};

export const computeAdsKPIs = (data) => {
  if (!data?.ads) return null;

  const { campaigns = [], totals = {} } = data.ads;
  const totalSpend = totals.totalSpend || 0;
  const totalClicks = totals.totalClicks || 0;
  const totalImpressions = totals.totalImpressions || 0;
  const totalConversions = totals.totalConversions || 0;
  const totalAdsRevenue = totals.totalRevenue || 0;

  const cpc = safeDiv(totalSpend, totalClicks);
  const cpo = safeDiv(totalSpend, totalConversions);
  const ctr = safeDiv(totalClicks, totalImpressions) * 100;
  const adRoas = safeDiv(totalAdsRevenue, totalSpend);
  const costPerImpression = safeDiv(totalSpend, totalImpressions) * 1000;

  const wastedCampaigns = campaigns.filter(
    (c) => c.spend > 0 && (c.conversions || 0) === 0
  );
  const wastedSpend = wastedCampaigns.reduce((s, c) => s + c.spend, 0);
  const wastedRatio = safeDiv(wastedSpend, totalSpend) * 100;

  const sorted = [...campaigns].sort(
    (a, b) => (b.revenue || 0) - (a.revenue || 0)
  );
  const topCampaigns = sorted.filter((c) => (c.revenue || 0) > 0).slice(0, 5);
  const worstCampaigns = wastedCampaigns
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 5);

  const highRoasCampaigns = campaigns
    .filter((c) => c.spend > 0 && safeDiv(c.revenue || 0, c.spend) > 3)
    .sort(
      (a, b) =>
        safeDiv(b.revenue || 0, b.spend) - safeDiv(a.revenue || 0, a.spend)
    );

  const totalVoucherAmount = totals.totalVoucherAmount || 0;
  const totalVoucheredSales = totals.totalVoucheredSales || 0;
  const voucherSynergyRate =
    safeDiv(totalVoucheredSales, totalAdsRevenue) * 100;

  return {
    totalSpend,
    totalClicks,
    totalImpressions,
    totalConversions,
    totalAdsRevenue,
    cpc,
    cpo,
    ctr,
    adRoas,
    costPerImpression,
    wastedSpend,
    wastedRatio,
    wastedCampaigns,
    topCampaigns,
    worstCampaigns,
    highRoasCampaigns,
    campaigns,
    totalVoucherAmount,
    totalVoucheredSales,
    voucherSynergyRate,
  };
};

export const computeVoucherKPIs = (data) => {
  if (!data?.voucher) return null;

  const { summary = {}, daily = [], vouchers = [] } = data.voucher;
  const totalCost = summary.totalCost || 0;
  const totalClaims = summary.totalClaims || 0;
  const totalUsage = summary.totalUsage || 0;
  const influencedSales = summary.influencedSales || 0;

  const roi = safeDiv(influencedSales - totalCost, totalCost) * 100;
  const usageRate = safeDiv(totalUsage, totalClaims) * 100;
  const costPerOrder = safeDiv(totalCost, totalUsage);

  const sortedVouchers = [...vouchers].sort(
    (a, b) => (b.influencedSales || 0) - (a.influencedSales || 0)
  );
  const bestVouchers = sortedVouchers
    .filter((v) => (v.influencedSales || 0) > 0)
    .slice(0, 3);
  const worstVouchers = sortedVouchers
    .filter((v) => v.cost > 0 && safeDiv(v.influencedSales || 0, v.cost) < 2)
    .slice(0, 3);

  return {
    totalCost,
    totalClaims,
    totalUsage,
    influencedSales,
    roi,
    usageRate,
    costPerOrder,
    daily,
    vouchers: sortedVouchers,
    bestVouchers,
    worstVouchers,
  };
};

export const computeProductKPIs = (data) => {
  if (!data?.shopStats) return null;

  const {
    topProducts = [],
    trafficSources = [],
    daily = [],
    adsSources = [],
    summary = {},
  } = data.shopStats;

  const totalVisitors = summary.totalVisitors || 0;
  const searchTraffic = trafficSources.find((s) =>
    s.source?.toLowerCase().includes('pencarian')
  );
  const searchShare = searchTraffic?.salesRatio || 0;

  const topByRevenue = [...topProducts].sort(
    (a, b) => (b.salesRatio || 0) - (a.salesRatio || 0)
  );

  const dailySorted = [...daily].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  const channelBreakdown = data.shopStats.channelBreakdown || null;
  const dailyPerSource = (data.shopStats.dailyPerSource || [])
    .slice()
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return {
    topProducts: topByRevenue,
    trafficSources,
    adsSources,
    daily: dailySorted,
    dailyPerSource,
    channelBreakdown,
    totalVisitors,
    searchShare,
    newBuyers: summary.newBuyers || 0,
    returningBuyers: summary.returningBuyers || 0,
    repeatRate:
      safeDiv(summary.returningBuyers || 0, summary.totalBuyers || 1) * 100,
  };
};

export const generateRecommendations = (data) => {
  const recommendations = [];
  const adsKPIs = computeAdsKPIs(data);
  const voucherKPIs = computeVoucherKPIs(data);
  const overviewKPIs = computeOverviewKPIs(data);
  const productKPIs = computeProductKPIs(data);

  if (adsKPIs) {
    if (adsKPIs.wastedSpend > 0) {
      recommendations.push({
        priority: 'high',
        category: 'cut',
        title: 'Hentikan Kampanye Tanpa Konversi',
        description: `${adsKPIs.wastedCampaigns.length} kampanye menghabiskan Rp ${formatK(adsKPIs.wastedSpend)} tanpa menghasilkan penjualan. Nonaktifkan atau ubah target.`,
        impact: adsKPIs.wastedSpend,
        campaigns: adsKPIs.wastedCampaigns.map((c) => c.name),
      });
    }

    if (adsKPIs.highRoasCampaigns.length > 0) {
      const top = adsKPIs.highRoasCampaigns[0];
      recommendations.push({
        priority: 'high',
        category: 'scale',
        title: 'Naikkan Budget Kampanye ROAS Tinggi',
        description: `"${top.name}" memiliki ROAS ${safeDiv(top.revenue || 0, top.spend).toFixed(1)}x. Tingkatkan budget 20-30% untuk scale up pendapatan.`,
        impact: (top.revenue || 0) * 0.25,
        campaigns: adsKPIs.highRoasCampaigns.slice(0, 3).map((c) => c.name),
      });
    }

    if (adsKPIs.ctr < 1.5) {
      recommendations.push({
        priority: 'medium',
        category: 'optimize',
        title: 'Optimasi CTR Iklan',
        description: `CTR rata-rata ${adsKPIs.ctr.toFixed(2)}% di bawah benchmark 1.5%. Perbaiki gambar produk dan judul iklan.`,
        impact: null,
      });
    }
  }

  if (voucherKPIs) {
    if (voucherKPIs.usageRate < 30) {
      recommendations.push({
        priority: 'medium',
        category: 'optimize',
        title: 'Tingkatkan Penggunaan Voucher',
        description: `Hanya ${voucherKPIs.usageRate.toFixed(1)}% voucher diklaim yang digunakan. Pertimbangkan minimum pembelanjaan lebih rendah atau periode lebih panjang.`,
        impact: null,
      });
    }

    if (voucherKPIs.worstVouchers.length > 0) {
      recommendations.push({
        priority: 'low',
        category: 'cut',
        title: 'Evaluasi Voucher ROI Rendah',
        description: `${voucherKPIs.worstVouchers.length} voucher memiliki ROI di bawah 2x. Pertimbangkan untuk menghentikan atau mendesain ulang.`,
        impact: voucherKPIs.worstVouchers.reduce(
          (s, v) => s + (v.cost || 0),
          0
        ),
      });
    }
  }

  if (overviewKPIs) {
    if (overviewKPIs.repeatRate < 15) {
      recommendations.push({
        priority: 'medium',
        category: 'strategic',
        title: 'Bangun Program Repeat Purchase',
        description: `Repeat rate hanya ${overviewKPIs.repeatRate.toFixed(1)}%. Gunakan voucher khusus returning customer dan follow-up chat.`,
        impact: null,
      });
    }

    if (overviewKPIs.cancelRate > 5) {
      recommendations.push({
        priority: 'medium',
        category: 'optimize',
        title: 'Kurangi Tingkat Pembatalan',
        description: `Cancel rate ${overviewKPIs.cancelRate.toFixed(1)}% terlalu tinggi. Analisis alasan pembatalan dan perbaiki deskripsi produk.`,
        impact: overviewKPIs.canceledOrders * overviewKPIs.aov,
      });
    }

    if (overviewKPIs.marketingCostRatio > 35) {
      recommendations.push({
        priority: 'high',
        category: 'strategic',
        title: 'Efisienkan Marketing Spend',
        description: `Marketing cost ratio ${overviewKPIs.marketingCostRatio.toFixed(1)}% melebihi 35%. Fokus budget pada channel dengan ROAS tertinggi.`,
        impact: null,
      });
    }
  }

  if (productKPIs) {
    if (productKPIs.searchShare > 50) {
      recommendations.push({
        priority: 'low',
        category: 'strategic',
        title: 'Diversifikasi Sumber Traffic',
        description: `${productKPIs.searchShare.toFixed(1)}% traffic dari pencarian. Eksplorasi Shopee Live, Feed, dan Rekomendasi untuk mengurangi ketergantungan.`,
        impact: null,
      });
    }
  }

  return recommendations.sort((a, b) => {
    const p = { high: 0, medium: 1, low: 2 };
    return (p[a.priority] ?? 2) - (p[b.priority] ?? 2);
  });
};

const formatK = (num) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}jt`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}rb`;
  return String(Math.round(num));
};

export const computeAllAnalytics = (data) => ({
  overview: computeOverviewKPIs(data),
  ads: computeAdsKPIs(data),
  voucher: computeVoucherKPIs(data),
  product: computeProductKPIs(data),
  recommendations: generateRecommendations(data),
});
