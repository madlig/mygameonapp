import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  doc,
  updateDoc,
  serverTimestamp,
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
    totalDirectOrders: 0,
    pendingDirectOrders: 0,
    directOrdersRevenue: 0,
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [priorityTasks, setPriorityTasks] = useState([]);
  const [importantRequests, setImportantRequests] = useState([]);
  const [directOrders, setDirectOrders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      // ============================================================
      // 1. Basic Stats (Games, Tasks, Requests) - Resilient Queries
      // ============================================================
      let totalGames = 0;
      try {
        const gamesSnapshot = await getDocs(collection(db, 'games'));
        totalGames = gamesSnapshot.size;
      } catch (err) {
        console.warn('Games query warning:', err);
      }

      let totalRequests = 0;
      try {
        const requestsSnapshot = await getDocs(collection(db, 'requests'));
        totalRequests = requestsSnapshot.size;
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
      } catch (err) {
        console.warn('Requests query warning:', err);
      }

      let totalTasks = 0;
      try {
        const tasksSnapshot = await getDocs(collection(db, 'tasks'));
        totalTasks = tasksSnapshot.size;
        const activeTasks = tasksSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((task) => task.status !== 'Done')
          .sort((a, b) => {
            const priorityOrder = { Urgent: 0, High: 1, Medium: 2, Low: 3 };
            return (
              (priorityOrder[a.priority] ?? 9) -
              (priorityOrder[b.priority] ?? 9)
            );
          })
          .slice(0, 5);

        setPriorityTasks(activeTasks);
      } catch (err) {
        console.warn('Tasks query warning:', err);
      }

      // ============================================================
      // 4. Operational Stats (Bulan Ini) — from dailyRevenues
      // ============================================================
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      startOfMonth.setHours(0, 0, 0, 0);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);

      let revenue = 0,
        netRevenue = 0,
        adSpendTotal = 0;

      try {
        const opsQuery = query(
          collection(db, 'dailyRevenues'),
          where('date', '>=', startOfMonth),
          where('date', '<=', endOfMonth)
        );
        const opsSnapshot = await getDocs(opsQuery);
        opsSnapshot.docs.forEach((d) => {
          const data = d.data();
          revenue += data.grossIncome || 0;
          netRevenue += data.calculatedNetRevenue || 0;
          adSpendTotal += data.adSpend || 0;
        });
      } catch (opsErr) {
        console.warn('Ops query warning:', opsErr);
      }

      // ============================================================
      // 5. Direct Web Orders (QRIS Checkout)
      // ============================================================
      let directOrdersList = [];
      try {
        const ordersQuery = query(
          collection(db, 'direct_orders'),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
        const ordersSnapshot = await getDocs(ordersQuery);
        ordersSnapshot.forEach((d) => {
          directOrdersList.push({ id: d.id, ...d.data() });
        });
      } catch (orderQueryErr) {
        console.warn('direct_orders index not ready, querying basic:', orderQueryErr);
        try {
          const basicOrders = await getDocs(collection(db, 'direct_orders'));
          basicOrders.forEach((d) => {
            directOrdersList.push({ id: d.id, ...d.data() });
          });
          directOrdersList.sort((a, b) => {
            const da = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
            const dbTime = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
            return dbTime - da;
          });
        } catch (basicErr) {
          console.warn('direct_orders read error:', basicErr);
        }
      }

      // Merge local offline orders fallback if present
      try {
        const localSaved = JSON.parse(localStorage.getItem('mygameon_offline_orders') || '[]');
        if (Array.isArray(localSaved) && localSaved.length > 0) {
          const existingIds = new Set(directOrdersList.map((o) => o.invoiceId));
          localSaved.forEach((lo) => {
            if (!existingIds.has(lo.invoiceId)) {
              directOrdersList.push({ id: lo.invoiceId, ...lo });
            }
          });
        }
      } catch {
        // Ignore localStorage parse errors
      }

      setDirectOrders(directOrdersList);

      const directOrdersRevenue = directOrdersList
        .filter((o) => o.status === 'completed')
        .reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);

      const pendingDirectOrders = directOrdersList.filter(
        (o) => o.status === 'pending_verification'
      ).length;

      // ============================================================
      // 6. Recent Activities — 3 game terbaru ditambahkan
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
        activities = [];
      }

      activities.sort((a, b) => b.date - a.date);

      // ============================================================
      // 7. Set summary state
      // ============================================================
      setSummaryStats({
        totalGames,
        totalRequests,
        totalTasks,
        totalFeedback: 0,
        monthlyRevenue: revenue,
        monthlyNetRevenue: netRevenue,
        monthlyAdSpend: adSpendTotal,
        totalDirectOrders: directOrdersList.length,
        pendingDirectOrders,
        directOrdersRevenue,
      });

      setRecentActivities(activities);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Gagal memuat data dashboard.');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Status update function
  const updateOrderStatus = async (orderId, newStatus) => {
    setDirectOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );

    // Update summary counters optimistically
    setSummaryStats((prev) => {
      const updated = directOrders.map((o) =>
        o.id === orderId ? { ...o, status: newStatus } : o
      );
      const pendingCount = updated.filter(
        (o) => o.status === 'pending_verification'
      ).length;
      const compRevenue = updated
        .filter((o) => o.status === 'completed')
        .reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);

      return {
        ...prev,
        pendingDirectOrders: pendingCount,
        directOrdersRevenue: compRevenue,
      };
    });

    try {
      const orderDocRef = doc(db, 'direct_orders', orderId);
      await updateDoc(orderDocRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Could not update order in Firestore (or offline order):', err);
      try {
        const localSaved = JSON.parse(
          localStorage.getItem('mygameon_offline_orders') || '[]'
        );
        const updatedLocal = localSaved.map((o) =>
          o.id === orderId || o.invoiceId === orderId
            ? { ...o, status: newStatus }
            : o
        );
        localStorage.setItem(
          'mygameon_offline_orders',
          JSON.stringify(updatedLocal)
        );
      } catch {}
    }
  };

  return {
    summaryStats,
    recentActivities,
    priorityTasks,
    importantRequests,
    directOrders,
    updateOrderStatus,
    refreshDashboard: fetchDashboardData,
    loading,
    error,
  };
};

