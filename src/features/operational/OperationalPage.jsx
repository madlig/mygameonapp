// src/pages/OperationalPage/index.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../config/firebaseConfig';
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import Swal from 'sweetalert2';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import NetRevenueSection from './components/NetRevenueSection';
import AdminShiftSection from './components/AdminShiftSection';
import DailyRecapSection from './components/DailyRecapSection';

const OperationalPage = () => {
    // --- STATE KONTROL UTAMA ---
    const [activeTab, setActiveTab] = useState('dailyRecap');
    const [loading, setLoading] = useState(false);

    // --- STATE UNTUK KONTROL TANGGAL (TERPUSAT) ---
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [activePreset, setActivePreset] = useState('thisMonth');
    const [showManualDateRange, setShowManualDateRange] = useState(false);
    
    // --- STATE UNTUK DATA ---
    const [shiftReport, setShiftReport] = useState([]);
    const [revenueReport, setRevenueReport] = useState([]);
    const [recapData, setRecapData] = useState({});

    // --- STATE UNTUK SHIFT AKTIF ---
    const [adminName, setAdminName] = useState('');
    const [activeShift, setActiveShift] = useState(null);
    const [grossIncomeInput, setGrossIncomeInput] = useState('');
    const [ordersCountInput, setOrdersCountInput] = useState('');
    
    const calculateShiftPay = useCallback((totalDurationHours, totalGrossIncome) => {
        let basePay = 0; const bonusPercentage = 0.05;
        if (totalDurationHours < 4) return Math.max(0, totalGrossIncome * 0.10);
        if (totalDurationHours < 8) basePay = 20000;
        else basePay = totalDurationHours > 15 ? 50000 : 30000;
        let totalOvertimePay = 0; const standardShiftHours = 8;
        if (totalDurationHours > standardShiftHours) {
            const overtimeHours = totalDurationHours - standardShiftHours;
            if (totalDurationHours > 15) { totalOvertimePay = overtimeHours * 2500; }
            else { const first = 3000, subsequent = 5000; totalOvertimePay = overtimeHours <= 1 ? overtimeHours * first : first + (overtimeHours - 1) * subsequent; }
        }
        const performanceBonus = totalGrossIncome * bonusPercentage;
        return Math.max(0, basePay + performanceBonus + totalOvertimePay);
    }, []);

    const fetchDataForPeriod = useCallback(async (start, end) => {
        setLoading(true);
        try {
            const startOfDay = new Date(start); startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(end); endOfDay.setHours(23, 59, 59, 999);

            // Fetch Data Shift Admin
            const shiftQuery = query(collection(db, 'adminShifts'), where('status', '==', 'completed'), where('startTime', '>=', startOfDay), where('startTime', '<=', endOfDay), orderBy('startTime', 'asc'));
            const shiftSnapshot = await getDocs(shiftQuery);
            const dailyAdminAggregates = {};
            shiftSnapshot.docs.forEach(doc => {
                const data = doc.data(); const startTime = data.startTime.toDate();
                const groupKey = `${startTime.toISOString().split('T')[0]}_${data.adminName}`;
                if (!dailyAdminAggregates[groupKey]) {
                    dailyAdminAggregates[groupKey] = { date: startTime, adminName: data.adminName, totalDurationHours: 0, totalGrossIncome: 0, totalOrders: 0 };
                }
                dailyAdminAggregates[groupKey].totalDurationHours += data.duration || 0;
                dailyAdminAggregates[groupKey].totalGrossIncome += data.grossIncome || 0;
                dailyAdminAggregates[groupKey].totalOrders += data.ordersCount || 0;
            });
            const calculatedShiftReport = Object.values(dailyAdminAggregates).map(reportData => {
                const pay = calculateShiftPay(reportData.totalDurationHours, reportData.totalGrossIncome);
                return { ...reportData, pay };
            }).sort((a, b) => b.date - a.date);
            setShiftReport(calculatedShiftReport);

            // Fetch Data Pemasukan (Net Revenue)
            const revenueQuery = query(collection(db, 'dailyRevenues'), where('date', '>=', startOfDay), where('date', '<=', endOfDay), orderBy('date', 'desc'));
            const revenueSnapshot = await getDocs(revenueQuery);
            const calculatedRevenueReport = revenueSnapshot.docs.map(doc => ({
                id: doc.id, ...doc.data(), date: doc.data().date.toDate(),
            }));
            setRevenueReport(calculatedRevenueReport);

            // Kalkulasi Data untuk Recap
            const totalAdminPay = calculatedShiftReport.reduce((sum, report) => sum + report.pay, 0);
            const totalGrossRevenue = calculatedRevenueReport.reduce((sum, report) => sum + report.grossIncome, 0);
            const totalNetRevenue = calculatedRevenueReport.reduce((sum, report) => sum + (report.calculatedNetRevenue || 0), 0);
            const totalSuccessfulOrders = calculatedRevenueReport.reduce((sum, report) => sum + report.successfulOrders, 0);
            const totalAdSpend = calculatedRevenueReport.reduce((sum, report) => sum + report.adSpend || 0, 0);

            const netProfit = totalNetRevenue - totalAdminPay;
            const salaryPercentage = totalNetRevenue > 0 ? (totalAdminPay / totalNetRevenue) * 100 : 0;
            const avgRevenuePerOrder = totalSuccessfulOrders > 0 ? totalNetRevenue / totalSuccessfulOrders : 0;

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

        } catch (error) { console.error("Error fetching data:", error); } 
        finally { setLoading(false); }
    }, [calculateShiftPay]);
    
    const handlePresetClick = (preset) => {
        const now = new Date();
        let start = new Date(), end = new Date();
        if (preset === 'today') {} 
        else if (preset === 'yesterday') { start.setDate(now.getDate() - 1); end.setDate(now.getDate() - 1); } 
        else if (preset === 'thisMonth') { start = new Date(now.getFullYear(), now.getMonth(), 1); end = new Date(now.getFullYear(), now.getMonth() + 1, 0); } 
        else if (preset === 'lastMonth') { start = new Date(now.getFullYear(), now.getMonth() - 1, 1); end = new Date(now.getFullYear(), now.getMonth(), 0); }
        setStartDate(start); setEndDate(end);
        setActivePreset(preset);
        setShowManualDateRange(false);
        fetchDataForPeriod(start, end);
    };
    
    const fetchActiveShift = async () => {
        const q = query(collection(db, 'adminShifts'), where('status', '==', 'active'));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            const data = snapshot.docs[0].data();
            setActiveShift({ id: snapshot.docs[0].id, ...data, startTime: data.startTime.toDate() });
            setAdminName(data.adminName);
        } else {
            setActiveShift(null);
        }
    };
    
    useEffect(() => {
        handlePresetClick('thisMonth');
        fetchActiveShift();
    }, [fetchDataForPeriod]); // fetch is memoized, so this runs once
    
    const handleStartShift = async () => {
        if (!adminName.trim()) { Swal.fire('Peringatan', 'Pilih nama admin.', 'warning'); return; }
        if (activeShift) { Swal.fire('Error!', 'Sudah ada shift yang aktif.', 'error'); return; }
        try {
            await addDoc(collection(db, 'adminShifts'), { adminName: adminName.trim(), startTime: serverTimestamp(), status: 'active' });
            Swal.fire('Berhasil!', `Shift untuk ${adminName.trim()} dimulai.`, 'success');
            fetchActiveShift();
        } catch (error) { Swal.fire('Error!', 'Gagal memulai shift.', 'error'); }
    };

    const handleEndShift = async () => {
        if (!grossIncomeInput || !ordersCountInput) { Swal.fire('Peringatan', 'Isi Gross Income dan Jumlah Pesanan.', 'warning'); return; }
        try {
            const shiftDocRef = doc(db, 'adminShifts', activeShift.id);
            const endTime = new Date();
            const durationHours = (endTime.getTime() - activeShift.startTime.getTime()) / 3600000;
            await updateDoc(shiftDocRef, {
                endTime: serverTimestamp(),
                duration: durationHours,
                grossIncome: parseFloat(grossIncomeInput),
                ordersCount: parseInt(ordersCountInput),
                status: 'completed'
            });
            Swal.fire('Berhasil!', `Shift untuk ${activeShift.adminName} selesai.`, 'success');
            setGrossIncomeInput(''); setOrdersCountInput('');
            fetchActiveShift(); // Refresh active shift status
            fetchDataForPeriod(startDate, endDate); // Refresh reports
        } catch (error) { Swal.fire('Error!', 'Gagal menyelesaikan shift.', 'error'); }
    };

    const getActiveShiftDuration = () => {
        if (!activeShift?.startTime) return "0 jam 0 menit 0 detik";
        const now = new Date();
        const diffMs = now.getTime() - activeShift.startTime.getTime();
        if (diffMs <= 0) return "0 jam 0 menit 0 detik";
        const hours = Math.floor(diffMs / 3600000);
        const minutes = Math.floor((diffMs % 3600000) / 60000);
        const seconds = Math.floor((diffMs % 60000) / 1000);
        return `${hours} jam ${minutes} menit ${seconds} detik`;
    };

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Operational Dashboard</h1>
            
            <div className="flex bg-gray-100 rounded-lg shadow-md">
                <button className={`flex-1 py-3 font-semibold ${activeTab === 'dailyRecap' ? 'bg-blue-600 text-white' : ''}`} onClick={() => setActiveTab('dailyRecap')}>Daily Recap</button>
                <button className={`flex-1 py-3 font-semibold ${activeTab === 'adminShift' ? 'bg-blue-600 text-white' : ''}`} onClick={() => setActiveTab('adminShift')}>Admin Shift</button>
                <button className={`flex-1 py-3 font-semibold ${activeTab === 'netRevenue' ? 'bg-blue-600 text-white' : ''}`} onClick={() => setActiveTab('netRevenue')}>Net Revenue</button>
            </div>
            
            <div className="p-4 bg-white rounded-lg shadow-md space-y-4">
                <div className="flex flex-wrap gap-2">
                    <button onClick={() => handlePresetClick('today')} className={`px-4 py-2 text-sm rounded-md ${activePreset === 'today' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>Hari Ini</button>
                    <button onClick={() => handlePresetClick('yesterday')} className={`px-4 py-2 text-sm rounded-md ${activePreset === 'yesterday' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>Kemarin</button>
                    <button onClick={() => handlePresetClick('thisMonth')} className={`px-4 py-2 text-sm rounded-md ${activePreset === 'thisMonth' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>Bulan Ini</button>
                    <button onClick={() => handlePresetClick('lastMonth')} className={`px-4 py-2 text-sm rounded-md ${activePreset === 'lastMonth' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>Bulan Lalu</button>
                    <button onClick={() => setShowManualDateRange(!showManualDateRange)} className={`px-4 py-2 text-sm rounded-md ${showManualDateRange ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>Pilih Tanggal Manual</button>
                </div>
                {showManualDateRange && (
                    <div className="pt-2 flex items-end space-x-4 border-t mt-4">
                        <div><label className="block text-sm">Tanggal Mulai</label><DatePicker selected={startDate} onChange={date => { setStartDate(date); setActivePreset(null); }} className="mt-1 p-2 border rounded-md" /></div>
                        <div><label className="block text-sm">Tanggal Selesai</label><DatePicker selected={endDate} onChange={date => { setEndDate(date); setActivePreset(null); }} className="mt-1 p-2 border rounded-md" /></div>
                        <button onClick={() => fetchDataForPeriod(startDate, endDate)} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Tampilkan</button>
                    </div>
                )}
            </div>
            
            <div className="mt-6">
                {loading ? <p className="text-center text-gray-500">Memuat data...</p> : (
                    <>
                        {activeTab === 'dailyRecap' && <DailyRecapSection data={recapData} />}
                        {activeTab === 'adminShift' && 
                            <AdminShiftSection
                                shiftReport={shiftReport}
                                onRefreshRequest={() => fetchDataForPeriod(startDate, endDate)}
                                adminName={adminName} setAdminName={setAdminName} activeShift={activeShift}
                                handleStartShift={handleStartShift} handleEndShift={handleEndShift}
                                getActiveShiftDuration={getActiveShiftDuration}
                                grossIncomeInput={grossIncomeInput} setGrossIncomeInput={setGrossIncomeInput}
                                ordersCountInput={ordersCountInput} setOrdersCountInput={setOrdersCountInput}
                            />
                        }
                        {activeTab === 'netRevenue' && 
                            <NetRevenueSection
                                revenueReport={revenueReport}
                                onRefreshRequest={() => fetchDataForPeriod(startDate, endDate)}
                                onRevenueSubmitSuccess={() => fetchDataForPeriod(startDate, endDate)}
                            />
                        }
                    </>
                )}
            </div>
        </div>
    );
};

export default OperationalPage;