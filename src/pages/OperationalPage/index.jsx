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
  updateDoc
} from 'firebase/firestore';
import Swal from 'sweetalert2';
// import { getAuth } from 'firebase/auth'; // Tidak diperlukan lagi jika tidak ada fitur login Admin secara langsung

import NetRevenueSection from './NetRevenueSection';
import AdminShiftSection from './AdminShiftSection';
import DailyRecapSection from './DailyRecapSection';

const OperationalPage = () => {
  // const auth = getAuth(); // Hapus atau biarkan jika masih ada bagian lain yang menggunakan autentikasi
  const [adminName, setAdminName] = useState(''); // Akan diisi dari pilihan dropdown
  const [activeShift, setActiveShift] = useState(null);
  const [dailyAdminSummaries, setDailyAdminSummaries] = useState({});
  const [grossIncomeInput, setGrossIncomeInput] = useState('');
  const [ordersCountInput, setOrdersCountInput] = useState('');

  const [dailyRecap, setDailyRecap] = useState({
    totalGrossIncomeToday: 0,
    totalAdminPayToday: 0,
    netRevenueToday: 0,
    netProfitToday: 0,
  });

  const [activeTab, setActiveTab] = useState('netRevenue');

  const calculateShiftPay = useCallback((totalDurationHours, totalGrossIncome) => {
    let basePay = 0;
    const bonusPercentage = 0.05;

    if (totalDurationHours < 4) {
      return Math.max(0, totalGrossIncome * 0.10);
    } else if (totalDurationHours < 8) {
      basePay = 20000;
    } else {
      if (totalDurationHours > 15) {
        basePay = 50000;
      } else {
        basePay = 30000;
      }
    }

    let totalOvertimePay = 0;
    const standardShiftHours = 8;

    if (totalDurationHours > standardShiftHours) {
      const overtimeHours = totalDurationHours - standardShiftHours;
      if (totalDurationHours > 15) {
        totalOvertimePay = overtimeHours * 2500;
      } else {
        const firstOvertimeHourRate = 3000;
        const subsequentOvertimeHourRate = 5000;
        if (overtimeHours <= 1) {
          totalOvertimePay = overtimeHours * firstOvertimeHourRate;
        } else {
          totalOvertimePay = firstOvertimeHourRate;
          totalOvertimePay += (overtimeHours - 1) * subsequentOvertimeHourRate;
        }
      }
    }

    const performanceBonus = totalGrossIncome * bonusPercentage;
    const totalPay = basePay + performanceBonus + totalOvertimePay;
    return Math.max(0, totalPay);
  }, []);

  const fetchShifts = useCallback(async () => {
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      // --- Poin 2: Penjelasan Penyimpanan dan Tampilan Log Shift ---
      // Log shift (dokumen di koleksi 'adminShifts') disimpan secara PERMANEN di Firestore.
      // Filter 'where' di bawah ini hanya untuk mengambil data yang RELEVAN untuk tampilan HARI INI.
      // Data shift dari hari/bulan sebelumnya TIDAK DIHAPUS, hanya tidak ditampilkan oleh query ini.

      const activeShiftQuery = query(
        collection(db, 'adminShifts'),
        where('status', '==', 'active'),
        orderBy('startTime', 'desc')
      );
      const activeSnapshot = await getDocs(activeShiftQuery);
      if (!activeSnapshot.empty) {
        const activeData = activeSnapshot.docs[0].data();
        setActiveShift({
          id: activeSnapshot.docs[0].id,
          ...activeData,
          startTime: activeData.startTime?.toDate ? activeData.startTime.toDate() : activeData.startTime,
        });
        // Set nama admin di state agar dropdown terpilih otomatis jika ada shift aktif
        setAdminName(activeData.adminName || '');
      } else {
        setActiveShift(null);
        setAdminName(''); // Kosongkan pilihan di dropdown jika tidak ada shift aktif
      }

      const historyQuery = query(
        collection(db, 'adminShifts'),
        where('status', '==', 'completed'),
        where('startTime', '>=', startOfDay),
        where('startTime', '<=', endOfDay),
        orderBy('startTime', 'asc')
      );
      const historySnapshot = await getDocs(historyQuery);

      let totalGrossIncomeOverallToday = 0;
      let totalAdminPayOverallToday = 0;
      let netRevenueToday = 0;

      const adminDailyAggregates = {};

      historySnapshot.docs.forEach(doc => {
        const data = doc.data();
        const startTimeDate = data.startTime?.toDate ? data.startTime.toDate() : data.startTime;
        const endTimeDate = data.endTime?.toDate ? data.endTime.toDate() : data.endTime;
        const shiftDurationMs = endTimeDate.getTime() - startTimeDate.getTime();
        const shiftDurationHours = shiftDurationMs / (1000 * 60 * 60);

        const admin = data.adminName || 'Unknown Admin';
        const grossIncome = data.grossIncome || 0;
        const ordersCount = data.ordersCount || 0;

        if (!adminDailyAggregates[admin]) {
          adminDailyAggregates[admin] = {
            totalDurationHours: 0,
            totalGrossIncome: 0,
            totalOrders: 0,
            segments: [],
          };
        }
        adminDailyAggregates[admin].totalDurationHours += shiftDurationHours;
        adminDailyAggregates[admin].totalGrossIncome += grossIncome;
        adminDailyAggregates[admin].totalOrders += ordersCount;
        adminDailyAggregates[admin].segments.push({ ...data, durationHours: shiftDurationHours, pay: 0 });
      });

      for (const admin in adminDailyAggregates) {
        const aggregatedData = adminDailyAggregates[admin];
        aggregatedData.totalPay = calculateShiftPay(aggregatedData.totalDurationHours, aggregatedData.totalGrossIncome);
        totalGrossIncomeOverallToday += aggregatedData.totalGrossIncome;
        totalAdminPayOverallToday += aggregatedData.totalPay;
      }
      setDailyAdminSummaries(adminDailyAggregates);

      const dailyRevenueQuery = query(
        collection(db, 'dailyRevenues'),
        where('date', '>=', startOfDay),
        where('date', '<=', endOfDay),
        orderBy('date', 'desc')
      );
      const dailyRevenueSnapshot = await getDocs(dailyRevenueQuery);
      if (!dailyRevenueSnapshot.empty) {
        const dailyRevenueData = dailyRevenueSnapshot.docs[0].data();
        netRevenueToday = dailyRevenueData.totalDailyRevenue || 0;
      }

      const netProfitToday = netRevenueToday - totalAdminPayOverallToday;

      setDailyRecap({
        totalGrossIncomeToday: totalGrossIncomeOverallToday,
        totalAdminPayToday: totalAdminPayOverallToday,
        netRevenueToday,
        netProfitToday,
      });

    } catch (error) {
      console.error("Error fetching shifts or daily revenues: ", error);
      Swal.fire('Error!', 'Gagal mengambil data. Silakan coba lagi.', 'error');
    }
  }, [calculateShiftPay]); // auth.currentUser?.displayName dihapus dari dependencies

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  const handleStartShift = async () => {
    // --- Poin 1: Validasi pilihan admin dari dropdown ---
    const finalAdminName = adminName.trim();
    if (!finalAdminName) {
        Swal.fire('Peringatan', 'Mohon pilih nama admin terlebih dahulu.', 'warning');
        return;
    }
    // const adminUid = auth.currentUser?.uid || 'anon_user'; // Jika tidak ada login, adminUid mungkin tidak relevan

    const q = query(collection(db, 'adminShifts'), where('status', '==', 'active'));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      Swal.fire('Error!', 'Sudah ada shift yang aktif. Selesaikan shift sebelumnya terlebih dahulu.', 'error');
      return;
    }

    try {
      const docRef = await addDoc(collection(db, 'adminShifts'), {
        adminName: finalAdminName,
        // adminUid: adminUid,
        startTime: serverTimestamp(),
        status: 'active',
        createdAt: serverTimestamp(),
        grossIncome: 0,
        ordersCount: 0,
      });
      setActiveShift({
        id: docRef.id,
        adminName: finalAdminName,
        startTime: new Date(),
        status: 'active',
        grossIncome: 0,
        ordersCount: 0,
      });
      Swal.fire('Berhasil!', `Shift untuk ${finalAdminName} telah dimulai.`, 'success');
      // Tidak perlu mengosongkan adminName di sini karena dropdown akan otomatis menampilkan nama yang aktif
      setGrossIncomeInput('');
      setOrdersCountInput('');
      fetchShifts();
    } catch (error) {
      console.error("Error starting shift: ", error);
      Swal.fire('Error!', 'Gagal memulai shift. Silakan coba lagi.', 'error');
    }
  };

  const handleEndShift = async () => {
    if (!activeShift) {
      Swal.fire('Peringatan', 'Tidak ada shift aktif untuk diselesaikan.', 'warning');
      return;
    }

    if (!grossIncomeInput || isNaN(parseFloat(grossIncomeInput)) || parseFloat(grossIncomeInput) < 0) {
      Swal.fire('Peringatan', 'Mohon masukkan Gross Income yang valid.', 'warning');
      return;
    }
    if (!ordersCountInput || isNaN(parseInt(ordersCountInput)) || parseInt(ordersCountInput) < 0) {
      Swal.fire('Peringatan', 'Mohon masukkan Jumlah Pesanan yang valid.', 'warning');
      return;
    }

    const endTime = new Date();
    const startTime = activeShift.startTime instanceof Date ? activeShift.startTime : activeShift.startTime.toDate();
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);

    try {
      const shiftDocRef = doc(db, 'adminShifts', activeShift.id);
      await updateDoc(shiftDocRef, {
        endTime: serverTimestamp(),
        duration: durationHours,
        grossIncome: parseFloat(grossIncomeInput),
        ordersCount: parseInt(ordersCountInput),
        status: 'completed'
      });

      Swal.fire('Berhasil!', `Shift untuk ${activeShift.adminName} telah selesai. Durasi: ${durationHours.toFixed(2)} jam. Gross Income: Rp ${parseFloat(grossIncomeInput).toLocaleString('id-ID')}. Jumlah Pesanan: ${parseInt(ordersCountInput)}.`, 'success');

      setActiveShift(null);
      setAdminName(''); // Setelah shift selesai, kosongkan pilihan admin di dropdown
      setGrossIncomeInput('');
      setOrdersCountInput('');
      await fetchShifts();

    } catch (error) {
      console.error("Error ending shift: ", error);
      Swal.fire('Error!', 'Gagal menyelesaikan shift. Silakan coba lagi.', 'error');
    }
  };

  const getActiveShiftDuration = () => {
    if (!activeShift || !activeShift.startTime) return "0 jam 0 menit";
    const now = new Date();
    const start = activeShift.startTime instanceof Date ? activeShift.startTime : activeShift.startTime.toDate();
    const diffMs = now.getTime() - start.getTime();

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    return `${hours} jam ${minutes} menit ${seconds} detik`;
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Operational Dashboard</h1>

      <div className="flex bg-gray-100 rounded-lg shadow-md overflow-hidden">
        <button
          className={`flex-1 py-3 text-center font-semibold transition-colors duration-200 ${
            activeTab === 'netRevenue' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setActiveTab('netRevenue')}
        >
          Net Revenue
        </button>
        <button
          className={`flex-1 py-3 text-center font-semibold transition-colors duration-200 ${
            activeTab === 'adminShift' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setActiveTab('adminShift')}
        >
          Admin Shift
        </button>
        <button
          className={`flex-1 py-3 text-center font-semibold transition-colors duration-200 ${
            activeTab === 'dailyRecap' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setActiveTab('dailyRecap')}
        >
          Daily Recap
        </button>
      </div>

      <div className="mt-6">
        {activeTab === 'netRevenue' && (
          <NetRevenueSection onRevenueSubmitSuccess={fetchShifts} />
        )}

        {activeTab === 'adminShift' && (
          <AdminShiftSection
            adminName={adminName}
            setAdminName={setAdminName}
            activeShift={activeShift}
            dailyAdminSummaries={dailyAdminSummaries}
            grossIncomeInput={grossIncomeInput}
            setGrossIncomeInput={setGrossIncomeInput}
            ordersCountInput={ordersCountInput}
            setOrdersCountInput={setOrdersCountInput}
            handleStartShift={handleStartShift}
            handleEndShift={handleEndShift}
            getActiveShiftDuration={getActiveShiftDuration}
          />
        )}

        {activeTab === 'dailyRecap' && (
          <DailyRecapSection dailyRecap={dailyRecap} />
        )}
      </div>
    </div>
  );
};

export default OperationalPage;