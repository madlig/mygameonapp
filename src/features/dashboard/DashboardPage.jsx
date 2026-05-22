import React from "react";
import { useDashboardData } from "./hooks/useDashboardData";
import { PuzzlePieceIcon, ClipboardDocumentListIcon, BriefcaseIcon } from "@heroicons/react/24/outline";

const formatDeadline = (date) => {
  if (!date) return "No Deadline";
  // Handle Firestore Timestamp
  const d = date?.toDate ? date.toDate() : new Date(date);
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
};

const getRequestPriority = (requestCount) => {
  if (requestCount > 10) return { label: "Critical", style: "bg-red-100 border-l-4 border-red-500" };
  if (requestCount > 5) return { label: "High", style: "bg-orange-100 border-l-4 border-orange-500" };
  if (requestCount > 3) return { label: "Medium", style: "bg-yellow-100 border-l-4 border-yellow-500" };
  return { label: "Low", style: "bg-green-100 border-l-4 border-green-500" };
};

const timeAgo = (date) => {
  if (!date) return "";
  const d = date?.toDate ? date.toDate() : new Date(date);
  const seconds = Math.floor((new Date() - d) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " tahun lalu";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " bulan lalu";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " hari lalu";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " jam lalu";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " menit lalu";
  return Math.floor(seconds) + " detik lalu";
};

const ActivityItem = ({ activity }) => {
  let icon, text;

  switch (activity.type) {
    case "GAME_ADDED":
      icon = <PuzzlePieceIcon className="h-5 w-5 text-blue-500" />;
      text = (
        <>
          Game <span className="font-semibold">{activity.data.name}</span> telah ditambahkan.
        </>
      );
      break;
    case "TASK_CREATED":
      icon = <BriefcaseIcon className="h-5 w-5 text-green-500" />;
      text = (
        <>
          Task baru: <span className="font-semibold">{activity.data.title}</span>.
        </>
      );
      break;
    case "REQUEST_RECEIVED":
      icon = <ClipboardDocumentListIcon className="h-5 w-5 text-orange-500" />;
      text = (
        <>
          Request untuk <span className="font-semibold">{activity.data.game}</span> diterima.
        </>
      );
      break;
    default:
      return null;
  }

  return (
    <li className="flex items-center space-x-4 border-b pb-3 last:border-b-0">
      <div className="flex-shrink-0 bg-gray-100 p-2 rounded-full">{icon}</div>
      <div className="min-w-0">
        <p className="text-sm text-gray-700">{text}</p>
        <p className="text-xs text-gray-500 mt-1">{timeAgo(activity.date)}</p>
      </div>
    </li>
  );
};

const DashboardPage = () => {
  // FIX: destructure lengkap — priorityTasks & importantRequests sekarang ada di hook
  const {
    summaryStats,
    priorityTasks,
    importantRequests,
    recentActivities,
    loading,
    error,
  } = useDashboardData();

  if (loading) {
    return (
      <div className="p-6 text-center">
        <p>Memuat data dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Reminder */}
      <section className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-lg shadow">
        <p>
          <strong>Reminder:</strong> Pantau task aktif dan request yang menunggu review.
        </p>
      </section>

      {/* Statistik Ringkas */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {[
          { title: "Total Games", value: summaryStats.totalGames, color: "bg-blue-500" },
          { title: "Total Tasks", value: summaryStats.totalTasks, color: "bg-green-500" },
          { title: "Total Requests", value: summaryStats.totalRequests, color: "bg-yellow-500" },
          { title: "Total Feedback", value: summaryStats.totalFeedback, color: "bg-red-500" },
        ].map((stat, index) => (
          <div key={index} className={`${stat.color} text-white p-4 rounded-lg shadow`}>
            <h3 className="text-base font-medium truncate">{stat.title}</h3>
            <p className="text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </section>

      {/* Aktivitas Terbaru */}
      <section className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Aktivitas Terbaru</h2>
        <ul className="space-y-4">
          {/* FIX: recentActivities sudah pasti array (default []) dari hook */}
          {recentActivities.length > 0 ? (
            recentActivities.map((activity, index) => (
              <ActivityItem key={index} activity={activity} />
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">Tidak ada aktivitas terbaru.</p>
          )}
        </ul>
      </section>

      {/* Priority Tasks & Important Requests */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Task yang Harus Dikerjakan */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Task yang Harus Dikerjakan
          </h2>
          <ul className="space-y-4">
            {/* FIX: priorityTasks sudah pasti array dari hook, tidak akan crash */}
            {priorityTasks.length > 0 ? (
              priorityTasks.map((item) => {
                const progress =
                  item.status === "In Progress"
                    ? 50
                    : item.status === "Todo"
                    ? 10
                    : 0;
                return (
                  <li key={item.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="text-gray-600 truncate" title={item.title}>
                        {item.title}
                      </p>
                      <span className="text-sm text-gray-500 flex-shrink-0 ml-2">
                        {item.dueDate ? formatDeadline(item.dueDate) : "No Deadline"}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div
                        className="h-2 bg-blue-500 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    {item.priority && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          item.priority === "Urgent"
                            ? "bg-red-100 text-red-700"
                            : item.priority === "High"
                            ? "bg-orange-100 text-orange-700"
                            : item.priority === "Medium"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {item.priority}
                      </span>
                    )}
                  </li>
                );
              })
            ) : (
              <p className="text-gray-500 text-center py-4">
                Tidak ada task aktif saat ini. ✨
              </p>
            )}
          </ul>
        </div>

        {/* Request Prioritas */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Request Penting
          </h2>
          <ul className="space-y-4">
            {/* FIX: importantRequests sudah pasti array dari hook, tidak akan crash */}
            {importantRequests.length > 0 ? (
              importantRequests.map((item) => {
                const priority = getRequestPriority(item.requestCount || 1);
                return (
                  <li
                    key={item.id}
                    className={`p-4 rounded-lg shadow ${priority.style}`}
                  >
                    <div className="flex justify-between items-center">
                      <p
                        className="text-gray-800 font-medium truncate"
                        title={item.game}
                      >
                        {item.game}
                      </p>
                      <span className="text-sm text-gray-600 flex-shrink-0 ml-2">
                        {item.requestCount} votes
                      </span>
                    </div>
                    <span className="text-sm font-semibold">
                      Priority: {priority.label}
                    </span>
                  </li>
                );
              })
            ) : (
              <p className="text-gray-500 text-center py-4">
                Tidak ada request game saat ini. 🙌
              </p>
            )}
          </ul>
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;