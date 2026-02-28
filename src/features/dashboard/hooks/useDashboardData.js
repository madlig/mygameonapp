import { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../../../config/firebaseConfig';
import { useAuth } from '../../../contexts/AuthContext';

export const useDashboardData = () => {
  const { currentUser } = useAuth();

  const [summaryStats, setSummaryStats] = useState({
    totalGames: 0,
    totalTasks: 0,
    totalRequests: 0,
    totalFeedback: 0,
    // Field Baru untuk Operational
    monthlyRevenue: 0,
    monthlyNetRevenue: 0,
    monthlyAdSpend: 0,
    monthlyShifts: 0,
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser) return;

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // 1. Basic Stats (Games, Tasks, Requests)
        // Optimasi: Gunakan count() dari firestore di masa depan untuk hemat read
        // Saat ini kita pakai cara manual dulu sesuai kode lama
        const gamesSnapshot = await getDocs(collection(db, 'games'));
        const requestsSnapshot = await getDocs(collection(db, 'requests'));

        // Task user saat ini
        const tasksQuery = query(
          collection(db, 'users', currentUser.uid, 'tasks')
        );
        const tasksSnapshot = await getDocs(tasksQuery);

        // 2. Operational Stats (Bulan Ini)
        // Kita ambil data dari 'operational_daily_recap' untuk bulan berjalan
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
          .toISOString()
          .split('T')[0];
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
          .toISOString()
          .split('T')[0];

        // Query ke koleksi agregasi
        const opsQuery = query(
          collection(db, 'operational_daily_recap'), // Pastikan nama koleksi sesuai
          where('date', '>=', startOfMonth),
          where('date', '<=', endOfMonth)
        );

        const opsSnapshot = await getDocs(opsQuery);

        let revenue = 0;
        let netRevenue = 0;
        let adSpend = 0;
        let shifts = 0;

        opsSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          revenue += data.totalRevenue || 0;
          netRevenue += data.totalNetRevenue || 0;
          adSpend += data.adSpend || 0;
          shifts += data.totalShifts || 0;
        });

        // 3. Recent Activities (Gabungan)
        // Simulasi penggabungan data terbaru
        const latestGames = await getDocs(
          query(collection(db, 'games'), orderBy('dateAdded', 'desc'), limit(3))
        );

        const activities = [];
        latestGames.forEach((doc) => {
          activities.push({
            id: doc.id,
            type: 'GAME_ADDED',
            date: doc.data().dateAdded?.toDate() || new Date(),
            data: { name: doc.data().title },
          });
        });

        // Sort activities by date
        activities.sort((a, b) => b.date - a.date);

        setSummaryStats({
          totalGames: gamesSnapshot.size,
          totalRequests: requestsSnapshot.size,
          totalTasks: tasksSnapshot.size,
          totalFeedback: 0, // Placeholder
          monthlyRevenue: revenue,
          monthlyNetRevenue: netRevenue,
          monthlyAdSpend: adSpend,
          monthlyShifts: shifts,
        });

        setRecentActivities(activities);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Gagal memuat data dashboard.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentUser]);

  return { summaryStats, recentActivities, loading, error };
};
