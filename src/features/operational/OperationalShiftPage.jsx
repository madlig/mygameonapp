import React, { useCallback, useEffect, useState } from 'react';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import Swal from 'sweetalert2';
import DatePicker from 'react-datepicker';
import { db } from '../../config/firebaseConfig';
import AdminShiftSection from './components/AdminShiftSection';
import EndShiftModal from './components/EndShiftModal';

const OperationalShiftPage = () => {
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [shiftReport, setShiftReport] = useState([]);
  const [adminName, setAdminName] = useState('');
  const [activeShift, setActiveShift] = useState(null);
  const [grossIncomeInput, setGrossIncomeInput] = useState('');
  const [ordersCountInput, setOrdersCountInput] = useState('');
  const [isEndShiftModalOpen, setIsEndShiftModalOpen] = useState(false);
  const [endShiftLoading, setEndShiftLoading] = useState(false);

  const calculateShiftPay = useCallback((hours, grossIncome) => {
    let basePay = 0;
    if (hours < 4) return Math.max(0, grossIncome * 0.1);
    if (hours < 8) basePay = 20000;
    else basePay = hours > 15 ? 50000 : 30000;

    let overtime = 0;
    if (hours > 8) {
      const extra = hours - 8;
      if (hours > 15) overtime = extra * 2500;
      else overtime = extra <= 1 ? extra * 3000 : 3000 + (extra - 1) * 5000;
    }

    const bonus = grossIncome * 0.05;
    return Math.max(0, basePay + overtime + bonus);
  }, []);

  const fetchShiftReport = useCallback(async () => {
    setLoading(true);
    try {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const shiftQuery = query(
        collection(db, 'adminShifts'),
        where('status', '==', 'completed'),
        where('startTime', '>=', start),
        where('startTime', '<=', end),
        orderBy('startTime', 'asc')
      );
      const snapshot = await getDocs(shiftQuery);

      const grouped = {};
      snapshot.docs.forEach((item) => {
        const data = item.data();
        const shiftDate = data.startTime.toDate();
        const key = `${shiftDate.toISOString().split('T')[0]}_${data.adminName}`;
        if (!grouped[key]) {
          grouped[key] = {
            date: shiftDate,
            adminName: data.adminName,
            totalDurationHours: 0,
            totalGrossIncome: 0,
            totalOrders: 0,
          };
        }
        grouped[key].totalDurationHours += data.duration || 0;
        grouped[key].totalGrossIncome += data.grossIncome || 0;
        grouped[key].totalOrders += data.ordersCount || 0;
      });

      const report = Object.values(grouped)
        .map((row) => ({
          ...row,
          pay: calculateShiftPay(row.totalDurationHours, row.totalGrossIncome),
        }))
        .sort((a, b) => b.date - a.date);

      setShiftReport(report);
    } catch (error) {
      console.error('Failed to fetch shift report:', error);
      Swal.fire('Error', 'Gagal mengambil laporan shift.', 'error');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, calculateShiftPay]);

  const fetchActiveShift = useCallback(async () => {
    const activeQuery = query(
      collection(db, 'adminShifts'),
      where('status', '==', 'active')
    );
    const snapshot = await getDocs(activeQuery);
    if (snapshot.empty) {
      setActiveShift(null);
      return;
    }
    const data = snapshot.docs[0].data();
    setActiveShift({
      id: snapshot.docs[0].id,
      ...data,
      startTime: data.startTime.toDate(),
    });
    setAdminName(data.adminName);
  }, []);

  useEffect(() => {
    const now = new Date();
    setStartDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setEndDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    fetchActiveShift();
  }, [fetchActiveShift]);

  useEffect(() => {
    fetchShiftReport();
  }, [fetchShiftReport]);

  const handleStartShift = async () => {
    if (!adminName.trim()) {
      Swal.fire('Peringatan', 'Pilih nama admin.', 'warning');
      return;
    }
    if (activeShift) {
      Swal.fire('Error', 'Sudah ada shift aktif.', 'error');
      return;
    }
    try {
      await addDoc(collection(db, 'adminShifts'), {
        adminName: adminName.trim(),
        startTime: serverTimestamp(),
        status: 'active',
      });
      await fetchActiveShift();
      Swal.fire('Berhasil!', 'Shift dimulai.', 'success');
    } catch {
      Swal.fire('Error', 'Gagal memulai shift.', 'error');
    }
  };

  const handleEndShift = async () => {
    if (!activeShift) return;
    if (!grossIncomeInput || !ordersCountInput) {
      Swal.fire(
        'Peringatan',
        'Isi Gross Income dan Jumlah Pesanan.',
        'warning'
      );
      return;
    }

    setEndShiftLoading(true);
    try {
      const endTime = new Date();
      const duration =
        (endTime.getTime() - activeShift.startTime.getTime()) / 3600000;
      await updateDoc(doc(db, 'adminShifts', activeShift.id), {
        endTime: serverTimestamp(),
        duration,
        grossIncome: parseFloat(grossIncomeInput),
        ordersCount: parseInt(ordersCountInput, 10),
        status: 'completed',
      });

      setIsEndShiftModalOpen(false);
      setGrossIncomeInput('');
      setOrdersCountInput('');
      await fetchActiveShift();
      await fetchShiftReport();
      Swal.fire('Berhasil!', 'Shift selesai.', 'success');
    } catch {
      Swal.fire('Error', 'Gagal menyelesaikan shift.', 'error');
    } finally {
      setEndShiftLoading(false);
    }
  };

  const getActiveShiftDuration = () => {
    if (!activeShift?.startTime) return '0 jam 0 menit 0 detik';
    const diff = Date.now() - activeShift.startTime.getTime();
    if (diff <= 0) return '0 jam 0 menit 0 detik';
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${hours} jam ${minutes} menit ${seconds} detik`;
  };

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h1 className="text-xl font-bold text-gray-800">Shift Workspace</h1>
        <p className="mt-1 text-xs text-gray-500">
          Halaman khusus untuk manajemen shift admin dan payroll.
        </p>
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
          <button
            onClick={fetchShiftReport}
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Refresh Laporan
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-500">Memuat data shift...</p>
      ) : (
        <AdminShiftSection
          shiftReport={shiftReport}
          adminName={adminName}
          setAdminName={setAdminName}
          activeShift={activeShift}
          handleStartShift={handleStartShift}
          handleEndShift={() => setIsEndShiftModalOpen(true)}
          getActiveShiftDuration={getActiveShiftDuration}
        />
      )}

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

export default OperationalShiftPage;
