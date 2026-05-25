// src/features/operational/OperationalPage.jsx
//
// E-Commerce Portfolio Analytics Dashboard
// Page-level period selector + tab-based navigation.

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../../config/firebaseConfig';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { Loader2, Upload, CalendarDays, ChevronDown } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import PortfolioTabs from './components/PortfolioTabs';
import OverviewTab from './components/OverviewTab';
import AdsPerformanceTab from './components/AdsPerformanceTab';
import VoucherAnalysisTab from './components/VoucherAnalysisTab';
import ProductIntelligenceTab from './components/ProductIntelligenceTab';
import ActionPlanTab from './components/ActionPlanTab';
import DailyOpsTab from './components/DailyOpsTab';
import ShopeeImportModal from './components/ShopeeImportModal';
import { loadPortfolioDataInRange } from './services/portfolioFirestore';
import { computeAllAnalytics } from './services/portfolioAnalyzer';

const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const PRESETS = [
  { key: 'thisMonth', label: 'Bulan Ini' },
  { key: 'lastMonth', label: 'Bulan Lalu' },
  { key: '7days', label: '7 Hari' },
  { key: 'yesterday', label: 'Kemarin' },
  { key: 'today', label: 'Hari Ini' },
];

const OperationalPage = () => {
  /* ── Portfolio state ── */
  const [portfolioData, setPortfolioData] = useState(null);
  const [portfolioTab, setPortfolioTab] = useState('overview');
  const [showImportModal, setShowImportModal] = useState(false);
  const [portfolioLoading, setPortfolioLoading] = useState(true);

  /* ── Page-level date state ── */
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [activePreset, setActivePreset] = useState('thisMonth');
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  /* ── Daily ops state ── */
  const [revenueReport, setRevenueReport] = useState([]);
  const [revenueLoading, setRevenueLoading] = useState(false);

  /* ════════════════════════════════════════════
     Portfolio fetch — merges all imported periods
     that overlap the selected date range.
     ════════════════════════════════════════════ */
  const fetchPortfolioForRange = useCallback(async (start, end) => {
    setPortfolioLoading(true);
    try {
      const data = await loadPortfolioDataInRange(start, end);
      setPortfolioData(data);
    } catch (err) {
      console.error('Error loading portfolio:', err);
    } finally {
      setPortfolioLoading(false);
    }
  }, []);

  const analytics = useMemo(
    () => (portfolioData ? computeAllAnalytics(portfolioData) : null),
    [portfolioData]
  );

  const periodLabel = useMemo(() => {
    if (!portfolioData) return null;
    const s = portfolioData.periodStart;
    const e = portfolioData.periodEnd;
    if (!s || !e) return null;
    const fmt = (d) => {
      const dt = d instanceof Date ? d : new Date(d);
      return dt.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    };
    const range = `${fmt(s)} — ${fmt(e)}`;
    const count = portfolioData.periodCount || 1;
    return count > 1 ? `${count} periode • ${range}` : range;
  }, [portfolioData]);

  /* ════════════════════════════════════════════
     Daily Ops fetch (page-level)
     ════════════════════════════════════════════ */
  const fetchDataForPeriod = useCallback(async (start, end) => {
    setRevenueLoading(true);
    try {
      const startOfDay = new Date(start);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(end);
      endOfDay.setHours(23, 59, 59, 999);

      const revenueQuery = query(
        collection(db, 'dailyRevenues'),
        where('date', '>=', startOfDay),
        where('date', '<=', endOfDay),
        orderBy('date', 'desc')
      );
      const snapshot = await getDocs(revenueQuery);
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        date: d.data().date.toDate(),
      }));
      setRevenueReport(data);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    } finally {
      setRevenueLoading(false);
    }
  }, []);

  // Single entry point: a date range drives BOTH portfolio analytics
  // (merge-on-read) and daily ops (per-day Firestore query).
  const applyRange = useCallback(
    (start, end) => {
      fetchPortfolioForRange(start, end);
      fetchDataForPeriod(start, end);
    },
    [fetchPortfolioForRange, fetchDataForPeriod]
  );

  const handlePresetClick = useCallback(
    (preset) => {
      const now = new Date();
      let start = new Date();
      let end = new Date();

      if (preset === 'today') {
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
      } else if (preset === 'yesterday') {
        start.setDate(now.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end.setDate(now.getDate() - 1);
        end.setHours(23, 59, 59, 999);
      } else if (preset === '7days') {
        start.setDate(now.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
      } else if (preset === 'thisMonth') {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      } else if (preset === 'lastMonth') {
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
      }

      setStartDate(start);
      setEndDate(end);
      setActivePreset(preset);
      setShowCustomDatePicker(false);
      applyRange(start, end);
    },
    [applyRange]
  );

  const handleImportedRangeDetected = useCallback(
    (minDate, maxDate) => {
      if (!(minDate instanceof Date) || !(maxDate instanceof Date)) return;
      const s = new Date(minDate);
      s.setHours(0, 0, 0, 0);
      const e = new Date(maxDate);
      e.setHours(23, 59, 59, 999);
      setStartDate(s);
      setEndDate(e);
      setActivePreset('custom');
      setShowCustomDatePicker(true);
      applyRange(s, e);
    },
    [applyRange]
  );

  // Initialize with "this month"
  useEffect(() => {
    handlePresetClick('thisMonth');
  }, [handlePresetClick]);

  /* ── Recap for Daily Ops ── */
  const recapData = useMemo(() => {
    const rows = revenueReport;
    const totalGross = rows.reduce((s, r) => s + toNum(r.grossIncome), 0);
    const totalCanceled = rows.reduce((s, r) => s + toNum(r.canceledValue), 0);
    const totalReturned = rows.reduce((s, r) => s + toNum(r.returnedValue), 0);
    const adjustedGross = totalGross - totalCanceled - totalReturned;
    const totalNet = rows.reduce(
      (s, r) => s + toNum(r.calculatedNetRevenue),
      0
    );
    const successfulOrders = rows.reduce(
      (s, r) => s + toNum(r.successfulOrders),
      0
    );
    const totalAdSpend = rows.reduce((s, r) => s + toNum(r.adSpend), 0);

    return {
      totalGrossRevenue: totalGross,
      totalAdjustedGross: adjustedGross,
      totalNetRevenue: totalNet,
      totalSuccessfulOrders: successfulOrders,
      totalAdSpend,
      totalAdminPay: 0,
      netProfit: totalNet,
    };
  }, [revenueReport]);

  /* ════════════════════════════════════════════
     Render
     ════════════════════════════════════════════ */
  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-[#F3F4F6] mb-1">
              E-Commerce Analytics
            </h1>
            <p className="text-[#7E8796] text-sm">
              Portfolio analytics &amp; daily operations.
              {periodLabel && (
                <span className="ml-2 text-[#C8CFDA]">{periodLabel}</span>
              )}
            </p>
          </div>
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg bg-[#FFD100] text-[#0D1117] hover:bg-[#FFD100]/90 transition-colors self-start md:self-auto"
          >
            <Upload size={14} />
            Import Analytics
          </button>
        </div>

        {/* ── Page-level Period Selector ── */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <CalendarDays size={14} className="text-[#7E8796]" />
          <span className="text-xs text-[#7E8796] mr-1">
            {startDate.toLocaleDateString('id-ID', {
              day: '2-digit',
              month: 'short',
            })}
            {' — '}
            {endDate.toLocaleDateString('id-ID', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </span>
          <div className="h-4 w-px bg-[#2A2F39] mx-1" />
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => handlePresetClick(p.key)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                activePreset === p.key
                  ? 'bg-[#FFD100]/15 text-[#FFD100] border border-[#FFD100]/40'
                  : 'bg-[#1A1F27] text-[#7E8796] border border-[#2A2F39] hover:text-[#C8CFDA]'
              }`}
            >
              {p.label}
            </button>
          ))}
          <button
            onClick={() => setShowCustomDatePicker((v) => !v)}
            className={`px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all ${
              activePreset === 'custom' || showCustomDatePicker
                ? 'bg-[#FFD100]/15 text-[#FFD100] border border-[#FFD100]/40'
                : 'bg-[#1A1F27] text-[#7E8796] border border-[#2A2F39] hover:text-[#C8CFDA]'
            }`}
          >
            Custom <ChevronDown size={10} />
          </button>
        </div>

        {showCustomDatePicker && (
          <div className="flex flex-wrap items-end gap-3 p-3 rounded-lg bg-[#1A1F27] border border-[#2A2F39] mb-4">
            <div>
              <label className="block text-[10px] text-[#7E8796] mb-1">
                Mulai
              </label>
              <DatePicker
                selected={startDate}
                onChange={(d) => setStartDate(d)}
                className="px-2.5 py-1.5 rounded-lg bg-[#111317] border border-[#2A2F39] text-[#C8CFDA] text-xs w-32 focus:outline-none focus:ring-2 focus:ring-[#FFD100]/40"
                dateFormat="dd/MM/yyyy"
              />
            </div>
            <div>
              <label className="block text-[10px] text-[#7E8796] mb-1">
                Selesai
              </label>
              <DatePicker
                selected={endDate}
                onChange={(d) => setEndDate(d)}
                className="px-2.5 py-1.5 rounded-lg bg-[#111317] border border-[#2A2F39] text-[#C8CFDA] text-xs w-32 focus:outline-none focus:ring-2 focus:ring-[#FFD100]/40"
                dateFormat="dd/MM/yyyy"
              />
            </div>
            <button
              onClick={() => {
                setActivePreset('custom');
                applyRange(startDate, endDate);
              }}
              className="px-3 py-1.5 rounded-lg bg-[#FFD100] text-[#111317] text-xs font-bold hover:brightness-95 transition-all"
            >
              Tampilkan
            </button>
          </div>
        )}

        {/* ── Tabs ── */}
        <PortfolioTabs activeTab={portfolioTab} onTabChange={setPortfolioTab} />

        {/* ── Tab Content ── */}
        <div className="mt-4">
          {portfolioTab === 'dailyops' ? (
            <DailyOpsTab
              revenueReport={revenueReport}
              recapData={recapData}
              loading={revenueLoading}
              onRefreshRequest={() => fetchDataForPeriod(startDate, endDate)}
              onImportedRangeDetected={handleImportedRangeDetected}
            />
          ) : portfolioLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="animate-spin text-[#FFD100] w-6 h-6" />
            </div>
          ) : analytics ? (
            <>
              {portfolioTab === 'overview' && (
                <OverviewTab data={analytics.overview} />
              )}
              {portfolioTab === 'ads' && (
                <AdsPerformanceTab data={analytics.ads} />
              )}
              {portfolioTab === 'voucher' && (
                <VoucherAnalysisTab data={analytics.voucher} />
              )}
              {portfolioTab === 'product' && (
                <ProductIntelligenceTab data={analytics.product} />
              )}
              {portfolioTab === 'action' && (
                <ActionPlanTab recommendations={analytics.recommendations} />
              )}
            </>
          ) : (
            <div className="text-center py-16 bg-[#111317] border border-[#2A2F39] rounded-xl">
              <Upload size={32} className="mx-auto text-[#7E8796] mb-3" />
              <p className="text-sm text-[#C8CFDA]">Belum ada data portfolio</p>
              <p className="text-xs text-[#7E8796] mt-1">
                Import file laporan Shopee (Ads, Voucher, Shop Stats) untuk
                memulai analisis
              </p>
              <button
                onClick={() => setShowImportModal(true)}
                className="mt-4 px-4 py-2 text-xs font-medium rounded-lg bg-[#FFD100]/15 text-[#FFD100] border border-[#FFD100]/25 hover:bg-[#FFD100]/25 transition-colors"
              >
                Import Sekarang
              </button>
            </div>
          )}
        </div>

        {/* ── Import Modal ── */}
        {showImportModal && (
          <ShopeeImportModal
            onClose={() => setShowImportModal(false)}
            onSuccess={() => applyRange(startDate, endDate)}
          />
        )}
      </div>
    </div>
  );
};

export default OperationalPage;
