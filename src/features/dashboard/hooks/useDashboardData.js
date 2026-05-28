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
    monthlyRevenue: 0,
    monthlyNetRevenue: 0,
    monthlyAdSpend: 0,
  });

  const [recentActivities, setRecentActivities] = useState([]);

  // FIX: state baru yang sebelumnya tidak ada di hook tapi dipakai di DashboardPage
  const [priorityTasks, setPriorityTasks] = useState([]);
  const [importantRequests, setImportantRequests] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser) return;

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // ============================================================
        // 1. Basic Stats (Games, Tasks, Requests)
        // ============================================================
        const gamesSnapshot = await getDocs(collection(db, 'games'));
        const requestsSnapshot = await getDocs(collection(db, 'requests'));

        // FIX: Pakai global 'tasks' collection (sesuai TaskPage.jsx)
        // bukan user-scoped 'users/{uid}/tasks' yang ada di versi lama
        const tasksSnapshot = await getDocs(collection(db, 'tasks'));

        // ============================================================
        // 2. Priority Tasks — task yang belum 'Done', maksimal 5
        // ============================================================
        const activeTasks = tasksSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((task) => task.status !== 'Done')
          .sort((a, b) => {
            // Urutkan: Urgent > High > Medium > Low
            const priorityOrder = { Urgent: 0, High: 1, Medium: 2, Low: 3 };
            return (
              (priorityOrder[a.priority] ?? 9) -
              (priorityOrder[b.priority] ?? 9)
            );
          })
          .slice(0, 5);

        setPriorityTasks(activeTasks);

        // ============================================================
        // 3. Important Requests — urutkan by votes terbanyak, maks 5
        // ============================================================
        const allRequests = requestsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const topRequests = allRequests
          .filter(
            (req) =>
              req.status !== 'available' && req.status !== 'not_available'
          )
          .sort((a, b) => (b.votes || 1) - (a.votes || 1))
          .slice(0, 5)
          .map((req) => ({
            id: req.id,
            game: req.title || 'Tanpa Judul',
            requestCount: req.votes || 1,
          }));

        setImportantRequests(topRequests);

        // ============================================================
        // 4. Operational Stats (Bulan Ini) — from dailyRevenues
        // ============================================================
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        startOfMonth.setHours(0, 0, 0, 0);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);

        const opsQuery = query(
          collection(db, 'dailyRevenues'),
          where('date', '>=', startOfMonth),
          where('date', '<=', endOfMonth)
        );
        const opsSnapshot = await getDocs(opsQuery);

        let revenue = 0,
          netRevenue = 0,
          adSpendTotal = 0;

        opsSnapshot.docs.forEach((d) => {
          const data = d.data();
          revenue += data.grossIncome || 0;
          netRevenue += data.calculatedNetRevenue || 0;
          adSpendTotal += data.adSpend || 0;
        });

        // ============================================================
        // 5. Recent Activities — 3 game terbaru ditambahkan
        // FIX: Pakai field 'createdAt' (setelah cleanup script rename dateAdded → createdAt)
        // ============================================================
        let activities = [];
        try {
          const latestGames = await getDocs(
            query(
              collection(db, 'games'),
              orderBy('createdAt', 'desc'),
              limit(3)
            )
          );

          latestGames.forEach((doc) => {
            const data = doc.data();
            const rawDate =
              data.createdAt?.toDate?.() ||
              data.dateAdded?.toDate?.() ||
              new Date();
            activities.push({
              id: doc.id,
              type: 'GAME_ADDED',
              date: rawDate,
              data: { name: data.title || data.name || 'Tanpa Judul' },
            });
          });
        } catch {
          // Jika index belum ada, skip recent activities
          activities = [];
        }

        activities.sort((a, b) => b.date - a.date);

        // ============================================================
        // 6. Set semua state
        // ============================================================
        setSummaryStats({
          totalGames: gamesSnapshot.size,
          totalRequests: requestsSnapshot.size,
          totalTasks: tasksSnapshot.size,
          totalFeedback: 0,
          monthlyRevenue: revenue,
          monthlyNetRevenue: netRevenue,
          monthlyAdSpend: adSpendTotal,
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

  // FIX: Tambahkan priorityTasks & importantRequests ke return value
  return {
    summaryStats,
    recentActivities,
    priorityTasks,
    importantRequests,
    loading,
    error,
  };
};
