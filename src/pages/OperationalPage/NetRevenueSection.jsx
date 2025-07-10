// src/pages/OperationalPage/NetRevenueSection.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebaseConfig'; // <--- JALUR INI BERUBAH
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  writeBatch,
  doc 
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Swal from 'sweetalert2';

const NetRevenueSection = ({ onRevenueSubmitSuccess }) => {
  // --- STATES UNTUK NET REVENUE CALCULATION ---
  const [ordersCount, setOrdersCount] = useState('');
  const [tempIndividualRevenues, setTempIndividualRevenues] = useState([]);
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [dailyReports, setDailyReports] = useState([]);
  const [selectedDateOption, setSelectedDateOption] = useState('today');
  const [manualSelectedDate, setManualSelectedDate] = useState(new Date());

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const [reportMonth, setReportMonth] = useState(currentMonth);
  const [reportYear, setReportYear] = useState(currentYear);

  // Utility untuk mendapatkan tanggal
  const getDateFromOption = (option) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (option) {
      case 'today':
        return today;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        return yesterday;
      case 'manual':
        return manualSelectedDate instanceof Date && !isNaN(manualSelectedDate) ? new Date(manualSelectedDate.setHours(0,0,0,0)) : today;
      default:
        return today;
    }
  };

  // --- FUNGSI UNTUK NET REVENUE CALCULATION ---
  const fetchDailyReports = async (month, year) => {
    try {
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0); 

      const q = query(
        collection(db, 'dailyRevenues'),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const reports = querySnapshot.docs.map(doc => {
        const data = doc.data();
        let reportDate = data.date;

        if (reportDate && typeof reportDate.toDate === 'function') {
          reportDate = reportDate.toDate();
        } else if (typeof reportDate === 'string') {
          try {
            reportDate = new Date(reportDate);
          } catch (e) {
            reportDate = null;
          }
        }
        
        return {
          id: doc.id,
          ...data,
          date: reportDate,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt
        };
      });
      setDailyReports(reports);
    } catch (error) {
      console.error("Error fetching daily reports: ", error);
    }
  };

  useEffect(() => {
    fetchDailyReports(reportMonth, reportYear);
  }, [reportMonth, reportYear]);

  useEffect(() => {
    const count = parseInt(ordersCount);
    if (!isNaN(count) && count > 0) {
      setTempIndividualRevenues(prev => {
        const newArr = Array(count).fill(0);
        for (let i = 0; i < Math.min(prev.length, count); i++) {
          newArr[i] = prev[i];
        }
        return newArr;
      });
    } else {
      setTempIndividualRevenues([]);
    }
  }, [ordersCount]);

  const handleTempIndividualRevenueChange = (index, value) => {
    setTempIndividualRevenues(prev => {
      const newRevenues = [...prev];
      newRevenues[index] = parseFloat(value) || 0;
      return newRevenues;
    });
  };

  const handleAddBatchToPending = () => {
    if (tempIndividualRevenues.length === 0) {
      Swal.fire('Peringatan!', 'Mohon masukkan jumlah pesanan dan isi pemasukan terlebih dahulu.', 'warning');
      return;
    }

    const validRevenues = tempIndividualRevenues.filter(val => val > 0);

    if (validRevenues.length === 0) {
      Swal.fire('Peringatan!', 'Tidak ada pemasukan valid yang dimasukkan. Mohon isi setidaknya satu pesanan.', 'warning');
      return;
    }

    const newPendingEntries = validRevenues.map(val => ({
      id: uuidv4(),
      value: val,
      timestamp: new Date()
    }));

    setPendingTransactions(prev => [...prev, ...newPendingEntries]);
    setOrdersCount('');
    setTempIndividualRevenues([]);
  };

  const handleRemovePendingTransaction = (id) => {
    setPendingTransactions(prev => prev.filter(item => item.id !== id));
  };

  const handleSubmitTodayRevenue = async () => {
    if (pendingTransactions.length === 0) {
      Swal.fire('Peringatan!', 'Tidak ada pemasukan untuk disimpan. Mohon tambahkan pesanan terlebih dahulu.', 'warning');
      return;
    }

    const totalDailyRevenue = pendingTransactions.reduce((sum, item) => sum + item.value, 0);
    const reportDateToSave = getDateFromOption(selectedDateOption);

    if (!(reportDateToSave instanceof Date) || isNaN(reportDateToSave)) {
      Swal.fire('Error!', 'Tanggal laporan tidak valid. Mohon pilih tanggal yang benar.', 'error');
      return;
    }

    // Cek apakah sudah ada laporan untuk tanggal yang sama
    const existingReportQuery = query(
      collection(db, 'dailyRevenues'),
      where('date', '==', reportDateToSave)
    );
    const existingReportSnapshot = await getDocs(existingReportQuery);

    try {
      if (!existingReportSnapshot.empty) {
        // Jika sudah ada, update dokumen yang ada
        const existingDocRef = doc(db, 'dailyRevenues', existingReportSnapshot.docs[0].id);
        const existingData = existingReportSnapshot.docs[0].data();
        const updatedTotalRevenue = existingData.totalDailyRevenue + totalDailyRevenue;
        const updatedOrdersCount = existingData.ordersCount + pendingTransactions.length;

        await updateDoc(existingDocRef, {
          totalDailyRevenue: updatedTotalRevenue,
          ordersCount: updatedOrdersCount,
          updatedAt: serverTimestamp()
        });
        Swal.fire('Berhasil!', 'Laporan pemasukan harian berhasil diperbarui (digabungkan)!', 'success');
      } else {
        // Jika belum ada, buat dokumen baru
        const newReport = {
          date: reportDateToSave,
          ordersCount: pendingTransactions.length,
          totalDailyRevenue: totalDailyRevenue,
          month: reportDateToSave.getMonth(),
          year: reportDateToSave.getFullYear(),
          createdAt: serverTimestamp()
        };
        await addDoc(collection(db, 'dailyRevenues'), newReport);
        Swal.fire('Berhasil!', 'Laporan pemasukan harian berhasil disimpan!', 'success');
      }
      
      setPendingTransactions([]);
      fetchDailyReports(reportMonth, reportYear);
      // Panggil callback untuk memberitahu OperationalPage agar me-refresh data shift/rekap
      if (onRevenueSubmitSuccess) {
        onRevenueSubmitSuccess();
      }

    } catch (error) {
      console.error("Error adding/updating document: ", error);
      Swal.fire('Error!', 'Gagal menyimpan/memperbarui laporan. Silakan coba lagi.', 'error');
    }
  };

  const handleDeleteMonthlyReports = async () => {
    const confirmDelete = await Swal.fire({
      title: 'Apakah Anda Yakin?',
      text: `Anda akan menghapus semua laporan pemasukan untuk ${new Date(reportYear, reportMonth).toLocaleString('id-ID', { month: 'long', year: 'numeric' })}. Tindakan ini tidak dapat dibatalkan.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    });

    if (!confirmDelete.isConfirmed) return;

    try {
      const batch = writeBatch(db);
      const startDate = new Date(reportYear, reportMonth, 1);
      const endDate = new Date(reportYear, reportMonth + 1, 0);

      const q = query(
        collection(db, 'dailyRevenues'),
        where('date', '>=', startDate),
        where('date', '<=', endDate)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        Swal.fire('Info', 'Tidak ada laporan untuk bulan ini yang bisa dihapus.', 'info');
        return;
      }

      querySnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      Swal.fire('Berhasil!', `Semua laporan untuk bulan ${new Date(reportYear, reportMonth).toLocaleString('id-ID', { month: 'long', year: 'numeric' })} berhasil dihapus.`, 'success');
      fetchDailyReports(reportMonth, reportYear);
    } catch (error) {
      console.error("Error deleting monthly reports: ", error);
      Swal.fire('Error!', 'Gagal menghapus laporan bulanan. Silakan coba lagi.', 'error');
    }
  };

  const totalPendingRevenue = pendingTransactions.reduce((sum, item) => sum + item.value, 0);
  const totalRevenueDisplayed = dailyReports.reduce((sum, report) => sum + report.totalDailyRevenue, 0);

  const months = Array.from({ length: 12 }, (_, i) => new Date(0, i).toLocaleString('id-ID', { month: 'long' }));
  const availableMonths = months.filter((_, index) => {
    if (reportYear === currentYear) {
      return index <= currentMonth;
    }
    return true;
  });
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 9 + i)
                              .filter(year => year <= currentYear)
                              .sort((a, b) => b - a);

  return (
    <section className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Net Revenue Calculation</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Tanggal Laporan:</label>
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            type="button"
            onClick={() => { setSelectedDateOption('today'); setManualSelectedDate(new Date()); }}
            className={`px-3 py-1 rounded-full text-sm ${selectedDateOption === 'today' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            Hari Ini
          </button>
          <button
            type="button"
            onClick={() => { 
              setSelectedDateOption('yesterday'); 
              const yesterday = new Date(); 
              yesterday.setDate(yesterday.getDate() - 1);
              setManualSelectedDate(yesterday);
            }}
            className={`px-3 py-1 rounded-full text-sm ${selectedDateOption === 'yesterday' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            Kemarin
          </button>
          <button
            type="button"
            onClick={() => setSelectedDateOption('manual')}
            className={`px-3 py-1 rounded-full text-sm ${selectedDateOption === 'manual' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            Pilih Tanggal Manual
          </button>
        </div>
        {selectedDateOption === 'manual' && (
          <div className="mt-2">
            <DatePicker
              selected={manualSelectedDate}
              onChange={(date) => { setManualSelectedDate(date); setSelectedDateOption('manual'); }}
              dateFormat="dd/MM/yyyy"
              className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
              maxDate={new Date()}
            />
          </div>
        )}
      </div>

      <div className="mb-4">
        <label htmlFor="ordersCount" className="block text-sm font-medium text-gray-700">
          Jumlah Pesanan yang Akan Diinput:
        </label>
        <input
          type="number"
          id="ordersCount"
          value={ordersCount}
          onChange={(e) => setOrdersCount(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., 12"
          min="0"
        />
      </div>

      {tempIndividualRevenues.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-md shadow-inner max-h-60 overflow-y-auto mb-4">
          <h3 className="text-md font-semibold text-gray-700 mb-3">Input Pemasukan Setiap Pesanan:</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {tempIndividualRevenues.map((revenue, index) => (
              <div key={index} className="flex items-center">
                <label htmlFor={`order-${index}`} className="text-sm text-gray-600 mr-2">#{index + 1}:</label>
                <input
                  type="number"
                  id={`order-${index}`}
                  value={revenue}
                  onChange={(e) => handleTempIndividualRevenueChange(index, e.target.value)}
                  className="block w-full border border-gray-300 rounded-md shadow-sm p-1.5 text-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Rp"
                  min="0"
                  step="any"
                />
              </div>
            ))}
          </div>
          <button
            onClick={handleAddBatchToPending}
            className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
          >
            Tambahkan ke Daftar Pending ({tempIndividualRevenues.length} Pesanan)
          </button>
        </div>
      )}

      {pendingTransactions.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow mb-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Daftar Pesanan Belum Disimpan: ({pendingTransactions.length} pesanan)</h3>
          <ul className="divide-y divide-gray-200">
            {pendingTransactions.map((item, index) => (
              <li key={item.id} className="py-2 flex justify-between items-center text-gray-800">
                <span>
                  Pesanan #{index + 1}: <span className="font-medium">Rp {item.value.toLocaleString('id-ID')}</span>
                  <span className="text-xs text-gray-500 ml-2">({item.timestamp.toLocaleTimeString('id-ID')})</span>
                </span>
                <button 
                  onClick={() => handleRemovePendingTransaction(item.id)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Hapus
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-4 pt-4 border-t border-gray-200 text-right">
            <span className="font-bold text-lg text-indigo-700">Total Pending: Rp {totalPendingRevenue.toLocaleString('id-ID')}</span>
          </div>
        </div>
      )}

      <button
        onClick={handleSubmitTodayRevenue}
        className="w-full bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={pendingTransactions.length === 0}
      >
        Submit Laporan Pemasukan (Total {pendingTransactions.length} Pesanan)
      </button>

      <div className="mt-6 p-4 bg-gray-100 rounded-lg shadow-inner">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Lihat Laporan Pemasukan Bulanan</h3>
        <div className="flex gap-4 mb-4">
          <select
            value={reportMonth}
            onChange={(e) => setReportMonth(parseInt(e.target.value))}
            className="block w-1/2 border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {availableMonths.map((monthName, index) => {
              const originalIndex = months.indexOf(monthName);
              return <option key={originalIndex} value={originalIndex}>{monthName}</option>;
            })}
          </select>
          <select
            value={reportYear}
            onChange={(e) => setReportYear(parseInt(e.target.value))}
            className="block w-1/2 border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <div className="p-3 bg-blue-50 rounded-md text-blue-800 mb-4">
          <p className="font-medium">Total Pemasukan Bulan Ini: Rp {totalRevenueDisplayed.toLocaleString('id-ID')}</p>
        </div>

        <h4 className="text-md font-semibold text-gray-700 mb-3">Detail Laporan Harian</h4>
        {dailyReports.length === 0 ? (
          <p className="text-gray-500">Belum ada laporan pemasukan untuk bulan yang dipilih.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {dailyReports.map(report => (
              <li key={report.id} className="py-2 flex justify-between items-center">
                <div>
                  <p className="text-gray-800 font-medium">
                    Tanggal: {report.date instanceof Date && !isNaN(report.date) ? report.date.toLocaleDateString('id-ID') : 'Tanggal Tidak Valid'}
                  </p>
                  <p className="text-sm text-gray-600">Total Pesanan: {report.ordersCount}</p>
                </div>
                <span className="font-bold text-lg text-green-700">Rp {report.totalDailyRevenue.toLocaleString('id-ID')}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-md font-semibold text-red-700 mb-2">Penghapusan Data Bulanan:</h4>
          <p className="text-sm text-gray-600 mb-3">
            Data laporan akan disimpan selama sebulan penuh. Anda dapat menghapus data bulan yang telah lalu setelah merekapnya.
          </p>
          {reportMonth === currentMonth && reportYear === currentYear ? (
            <p className="text-sm text-gray-500">Anda tidak bisa menghapus laporan untuk bulan ini.</p>
          ) : (
            dailyReports.length > 0 ? (
              <button
                onClick={handleDeleteMonthlyReports}
                className="w-full bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-700"
              >
                Hapus Semua Laporan Bulan {months[reportMonth]} {reportYear}
              </button>
            ) : (
              <p className="text-sm text-gray-500">Tidak ada laporan untuk bulan ini yang bisa dihapus.</p>
            )
          )}
        </div>
      </div>
    </section>
  );
};

export default NetRevenueSection;