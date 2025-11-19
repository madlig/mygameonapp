import { useState, useEffect } from "react";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "../../../config/firebaseConfig";
import { useAuth } from "../../../contexts/AuthContext";

// Fungsi pembantu untuk konversi tanggal yang aman
const safeToDate = (firestoreDate) => {
  if (!firestoreDate) return null;
  if (typeof firestoreDate.toDate === 'function') {
    return firestoreDate.toDate();
  }
  const d = new Date(firestoreDate);
  if (!isNaN(d.getTime())) {
    return d;
  }
  return null;
};

export const useDashboardData = () => {
  const { currentUser } = useAuth();
  const [summaryStats, setSummaryStats] = useState({
    totalGames: 0,
    totalTasks: 0,
    totalRequests: 0,
    totalFeedback: 0,
  });
  
  const [priorityTasks, setPriorityTasks] = useState([]);
  
  // 1. State baru untuk menampung important requests
  const [importantRequests, setImportantRequests] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser) return;

    const fetchAllDashboardData = async () => {
      setLoading(true);
      try {
        // --- Promise yang sudah ada ---
        const gamesPromise = getDocs(collection(db, "games"));
        const requestsPromise = getDocs(collection(db, "requests"));
        const totalTasksPromise = getDocs(
          query(collection(db, `users/${currentUser.uid}/tasks`))
        );

        const latestGamesPromise = getDocs(query(collection(db, "games"), orderBy("dateAdded", "desc"), limit(5)));
        const latestTasksPromise = getDocs(query(collection(db, `users/${currentUser.uid}/tasks`), orderBy("createdAt", "desc"), limit(5)));
        const latestRequestsPromise = getDocs(query(collection(db, "requests"), orderBy("earliestDate", "desc"), limit(5)));

        const priorityTasksQuery = query(
          collection(db, `users/${currentUser.uid}/tasks`),
          where("status", "!=", "Done"),
          orderBy("priority"),
          limit(5)
        );
        const priorityTasksPromise = getDocs(priorityTasksQuery);
        
        // 2. Promise baru untuk mengambil important requests
        const importantRequestsQuery = query(
            collection(db, "requests"),
            orderBy("requestCount", "desc"), // Urutkan berdasarkan jumlah request (terbanyak)
            limit(5)                         // Ambil 5 teratas
        );
        const importantRequestsPromise = getDocs(importantRequestsQuery);

        // 3. Menunggu semua data selesai diambil
        const [
            gamesSnapshot,
            requestsSnapshot,
            totalTasksSnapshot,
            priorityTasksSnapshot,
            importantRequestsSnapshot, // <-- Hasil dari promise baru
            latestGamesSnapshot, 
            latestTasksSnapshot, 
            latestRequestsSnapshot
          ] = await Promise.all([
            gamesPromise,
            requestsPromise,
            totalTasksPromise,
            priorityTasksPromise,
            importantRequestsPromise,
            latestGamesPromise, 
            latestTasksPromise, 
            latestRequestsPromise // <-- Tambahkan promise baru di sini
        ]);

        // --- Set state untuk summary stats (tidak berubah) ---
        setSummaryStats({
          totalGames: gamesSnapshot.size,
          totalTasks: totalTasksSnapshot.size,
          totalRequests: requestsSnapshot.size,
          totalFeedback: 15,
        });

        // --- Set state untuk priority tasks (tidak berubah) ---
        const fetchedTasks = priorityTasksSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            deadline: doc.data().deadline?.toDate(),
        }));
        setPriorityTasks(fetchedTasks);

        // 4. Set state baru untuk important requests
        const fetchedRequests = importantRequestsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        setImportantRequests(fetchedRequests);

        // Gunakan safeToDate untuk semua konversi tanggal
        const gamesActivities = latestGamesSnapshot.docs.map(d => ({ type: 'GAME_ADDED', data: d.data(), date: safeToDate(d.data().dateAdded) }));
        const tasksActivities = latestTasksSnapshot.docs.map(d => ({ type: 'TASK_CREATED', data: d.data(), date: safeToDate(d.data().createdAt) }));
        const requestsActivities = latestRequestsSnapshot.docs.map(d => ({ type: 'REQUEST_RECEIVED', data: d.data(), date: safeToDate(d.data().earliestDate) }));

        const allActivities = [...gamesActivities, ...tasksActivities, ...requestsActivities]
            .filter(activity => activity.date !== null) // Hanya proses aktivitas yang tanggalnya valid
            .sort((a, b) => b.date - a.date)
            .slice(0, 5);

        setRecentActivities(allActivities);
        
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Gagal memuat data dashboard.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllDashboardData();
  }, [currentUser]);

  // 5. Kembalikan data requests dari hook
  return { summaryStats, priorityTasks, importantRequests, recentActivities, loading, error };
};