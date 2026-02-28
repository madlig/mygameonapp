// src/pages/OperationalPage/index.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../config/firebaseConfig';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  doc,
  updateDoc,
} from 'firebase/firestore';
import Swal from 'sweetalert2';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import EndShiftModal from './components/EndShiftModal';

import NetRevenueSection from './components/NetRevenueSection';
import AdminShiftSection from './components/AdminShiftSection';
import DailyRecapSection from './components/DailyRecapSection';

const OperationalPage = () => {
  const [activeTab, setActiveTab] = useState('dailyRecap');
  const [loading, setLoading] = useState(false);

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [activePreset, setActivePreset] = useState('thisMonth');
  const [showManualDateRange, setShowManualDateRange] = useState(false);

  const [shiftReport, setShiftReport] = useState([]);
  const [revenueReport, setRevenueReport] = useState([]);
  const [recapData, setRecapData] = useState({});

  const [adminName, setAdminName] = useState('');
  const [activeShift, setActiveShift] = useState(null);
  const [grossIncomeInput, setGrossIncomeInput] = useState('');
  const [ordersCountInput, setOrdersCountInput] = useState('');

  const [isEndShiftModalOpen, setIsEndShiftModalOpen] = useState(false);
  const [endShiftLoading, setEndShiftLoading] = useState(false);

  const calculateShiftPay = useCallback(
    (totalDurationHours, totalGrossIncome) => {
      let basePay = 0;
      const bonusPercentage = 0.05;
      if (totalDurationHours < 4) return Math.max(0, totalGrossIncome * 0.1);
      if (totalDurationHours < 8) basePay = 20000;
      else basePay = totalDurationHours > 15 ? 50000 : 30000;
      let totalOvertimePay = 0;
      const standardShiftHours = 8;
      if (totalDurationHours > standardShiftHours) {
        const overtimeHours = totalDurationHours - standardShiftHours;
        if (totalDurationHours > 15) {
          totalOvertimePay = overtimeHours * 2500;
        } else {
          const first = 3000,
            subsequent = 5000;
          totalOvertimePay =
            overtimeHours <= 1
              ? overtimeHours * first
              : first + (overtimeHours - 1) * subsequent;
        }
      }
      const performanceBonus = totalGrossIncome * bonusPercentage;
      return Math.max(0, basePay + performanceBonus + totalOvertimePay);
    },
    []
  );

  const fetchDataForPeriod = useCallback(
    async (start, end) => {
      setLoading(true);
      try {
        const startOfDay = new Date(start);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(end);
        endOfDay.setHours(23, 59, 59, 999);

        // Fetch admin shifts
        const shiftQuery = query(
          collection(db, 'adminShifts'),
          where('status', '==', 'completed'),
          where('startTime', '>=', startOfDay),
          where('startTime', '<=', endOfDay),
          orderBy('startTime', 'asc')
        );
        const shiftSnapshot = await getDocs(shiftQuery);
        const dailyAdminAggregates = {};
        shiftSnapshot.docs.forEach((docItem) => {
          const d = docItem.data();
          const startTime = d.startTime.toDate();
          const groupKey = `${startTime.toISOString().split('T')[0]}_${d.adminName}`;
          if (!dailyAdminAggregates[groupKey]) {
            dailyAdminAggregates[groupKey] = {
              date: startTime,
              adminName: d.adminName,
              totalDurationHours: 0,
              totalGrossIncome: 0,
              totalOrders: 0,
            };
          }
          dailyAdminAggregates[groupKey].totalDurationHours += d.duration || 0;
          dailyAdminAggregates[groupKey].totalGrossIncome += d.grossIncome || 0;
          dailyAdminAggregates[groupKey].totalOrders += d.ordersCount || 0;
        });
        const calculatedShiftReport = Object.values(dailyAdminAggregates)
          .map((reportData) => {
            const pay = calculateShiftPay(
              reportData.totalDurationHours,
              reportData.totalGrossIncome
            );
            return { ...reportData, pay };
          })
          .sort((a, b) => b.date - a.date);
        setShiftReport(calculatedShiftReport);

        // Fetch revenues
        const revenueQuery = query(
          collection(db, 'dailyRevenues'),
          where('date', '>=', startOfDay),
          where('date', '<=', endOfDay),
          orderBy('date', 'desc')
        );
        const revenueSnapshot = await getDocs(revenueQuery);
        const calculatedRevenueReport = revenueSnapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          date: d.data().date.toDate(),
        }));
        setRevenueReport(calculatedRevenueReport);

        // Aggregate recap
        const totalAdminPay = calculatedShiftReport.reduce(
          (sum, r) => sum + r.pay,
          0
        );
        const totalGrossRevenue = calculatedRevenueReport.reduce(
          (sum, r) => sum + (r.grossIncome || 0),
          0
        );
        const totalNetRevenue = calculatedRevenueReport.reduce(
          (sum, r) => sum + (r.calculatedNetRevenue || 0),
          0
        );
        const totalSuccessfulOrders = calculatedRevenueReport.reduce(
          (sum, r) => sum + (r.successfulOrders || 0),
          0
        );
        const totalAdSpend = calculatedRevenueReport.reduce(
          (sum, r) => sum + (r.adSpend || 0),
          0
        );

        const netProfit = totalNetRevenue - totalAdminPay;
        const salaryPercentage =
          totalNetRevenue > 0 ? (totalAdminPay / totalNetRevenue) * 100 : 0;
        const avgRevenuePerOrder =
          totalSuccessfulOrders > 0
            ? totalNetRevenue / totalSuccessfulOrders
            : 0;

        setRecapData({
          totalGrossRevenue,
          totalAdminPay,
          totalNetRevenue,
          netProfit,
          salaryPercentage,
          avgRevenuePerOrder,
          totalSuccessfulOrders,
          totalAdSpend,
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    },
    [calculateShiftPay]
  );

  const handlePresetClick = useCallback(
    (preset) => {
      const now = new Date();
      let start = new Date(),
        end = new Date();
      if (preset === 'today') {
        // set start to today's 00:00:00 and end to today's 23:59:59.999
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        end = new Date(now);
        end.setHours(23, 59, 59, 999);
      } else if (preset === 'yesterday') {
        start.setDate(now.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end.setDate(now.getDate() - 1);
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
      setShowManualDateRange(false);
      fetchDataForPeriod(start, end);
    },
    [fetchDataForPeriod]
  );

  const fetchActiveShift = async () => {
    const q = query(
      collection(db, 'adminShifts'),
      where('status', '==', 'active')
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const data = snapshot.docs[0].data();
      setActiveShift({
        id: snapshot.docs[0].id,
        ...data,
        startTime: data.startTime.toDate(),
      });
      setAdminName(data.adminName);
    } else {
      setActiveShift(null);
    }
  };

  useEffect(() => {
    handlePresetClick('thisMonth');
    fetchActiveShift();
  }, [handlePresetClick]);

  const handleStartShift = async () => {
    if (!adminName.trim()) {
      Swal.fire('Peringatan', 'Pilih nama admin.', 'warning');
      return;
    }
    if (activeShift) {
      Swal.fire('Error!', 'Sudah ada shift yang aktif.', 'error');
      return;
    }
    try {
      await addDoc(collection(db, 'adminShifts'), {
        adminName: adminName.trim(),
        startTime: serverTimestamp(),
        status: 'active',
      });
      Swal.fire(
        'Berhasil!',
        `Shift untuk ${adminName.trim()} dimulai.`,
        'success'
      );
      fetchActiveShift();
    } catch {
      Swal.fire('Error!', 'Gagal memulai shift.', 'error');
    }
  };

  const handleEndShift = async () => {
    if (!grossIncomeInput || !ordersCountInput) {
      Swal.fire(
        'Peringatan',
        'Isi Gross Income dan Jumlah Pesanan.',
        'warning'
      );
      return;
    }
    setEndShiftLoading(true); // Mulai loading
    try {
      const shiftDocRef = doc(db, 'adminShifts', activeShift.id);
      const endTime = new Date();
      const durationHours =
        (endTime.getTime() - activeShift.startTime.getTime()) / 3600000;
      await updateDoc(shiftDocRef, {
        endTime: serverTimestamp(),
        duration: durationHours,
        grossIncome: parseFloat(grossIncomeInput),
        ordersCount: parseInt(ordersCountInput),
        status: 'completed',
      });
      Swal.fire(
        'Berhasil!',
        `Shift untuk ${activeShift.adminName} selesai.`,
        'success'
      );
      setGrossIncomeInput('');
      setOrdersCountInput('');
      setIsEndShiftModalOpen(false); // Tutup modal
      fetchActiveShift();
      fetchDataForPeriod(startDate, endDate);
    } catch {
      Swal.fire('Error!', 'Gagal menyelesaikan shift.', 'error');
    } finally {
      setEndShiftLoading(false); // Selesai loading
    }
  };

  const getActiveShiftDuration = () => {
    if (!activeShift?.startTime) return '0 jam 0 menit 0 detik';
    const now = new Date();
    const diffMs = now.getTime() - activeShift.startTime.getTime();
    if (diffMs <= 0) return '0 jam 0 menit 0 detik';
    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);
    return `${hours} jam ${minutes} menit ${seconds} detik`;
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">
        Operational Dashboard
      </h1>

      {/* Tabs (responsive: scrollable on small screens) */}
      <div className="overflow-x-auto no-scrollbar">
        <div className="inline-flex bg-white rounded-lg shadow p-1">
          <button
            onClick={() => setActiveTab('dailyRecap')}
            className={`px-4 py-2 rounded-md ${activeTab === 'dailyRecap' ? 'bg-blue-600 text-white' : 'text-gray-700'}`}
          >
            Daily Recap
          </button>
          <button
            onClick={() => setActiveTab('adminShift')}
            className={`ml-2 px-4 py-2 rounded-md ${activeTab === 'adminShift' ? 'bg-blue-600 text-white' : 'text-gray-700'}`}
          >
            Admin Shift
          </button>
          <button
            onClick={() => setActiveTab('netRevenue')}
            className={`ml-2 px-4 py-2 rounded-md ${activeTab === 'netRevenue' ? 'bg-blue-600 text-white' : 'text-gray-700'}`}
          >
            Net Revenue
          </button>
        </div>
      </div>

      {/* Preset buttons */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap gap-3">
          {['today', 'yesterday', 'thisMonth', 'lastMonth'].map((p) => (
            <button
              key={p}
              onClick={() => handlePresetClick(p)}
              className={`px-3 py-2 rounded-md text-sm ${activePreset === p ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              {p === 'today'
                ? 'Hari Ini'
                : p === 'yesterday'
                  ? 'Kemarin'
                  : p === 'thisMonth'
                    ? 'Bulan Ini'
                    : 'Bulan Lalu'}
            </button>
          ))}
          <button
            onClick={() => setShowManualDateRange(!showManualDateRange)}
            className="px-3 py-2 rounded-md bg-gray-100 text-gray-700"
          >
            Pilih Tanggal Manual
          </button>
        </div>

        {showManualDateRange && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div>
              <label className="text-sm text-gray-600">Tanggal Mulai</label>
              <DatePicker
                selected={startDate}
                onChange={(d) => setStartDate(d)}
                className="mt-1 p-2 w-full border rounded-md"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Tanggal Selesai</label>
              <DatePicker
                selected={endDate}
                onChange={(d) => setEndDate(d)}
                className="mt-1 p-2 w-full border rounded-md"
              />
            </div>
            <div>
              <button
                onClick={() => fetchDataForPeriod(startDate, endDate)}
                className="w-full bg-indigo-600 text-white px-3 py-2 rounded-md"
              >
                Tampilkan
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content area */}
      <div>
        {loading ? (
          <p className="text-center text-gray-500">Memuat data...</p>
        ) : (
          <>
            {activeTab === 'dailyRecap' && (
              <DailyRecapSection data={recapData} />
            )}
            {activeTab === 'adminShift' && (
              <AdminShiftSection
                shiftReport={shiftReport}
                onRefreshRequest={() => fetchDataForPeriod(startDate, endDate)}
                adminName={adminName}
                setAdminName={setAdminName}
                activeShift={activeShift}
                handleStartShift={handleStartShift}
                handleEndShift={() => setIsEndShiftModalOpen(true)}
                getActiveShiftDuration={getActiveShiftDuration}
              />
            )}
            {activeTab === 'netRevenue' && (
              <NetRevenueSection
                revenueReport={revenueReport}
                onRefreshRequest={() => fetchDataForPeriod(startDate, endDate)}
                onRevenueSubmitSuccess={() =>
                  fetchDataForPeriod(startDate, endDate)
                }
              />
            )}
          </>
        )}
      </div>
      <EndShiftModal
        isOpen={isEndShiftModalOpen}
        onClose={() => setIsEndShiftModalOpen(false)}
        onConfirm={handleEndShift}
        grossIncome={grossIncomeInput}
        setGrossIncome={setGrossIncomeInput}
        ordersCount={ordersCountInput}
        setOrdersCount={setOrdersCountInput}
        loading={endShiftLoading}
      />
    </div>
  );
};

export default OperationalPage;
