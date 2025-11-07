
const DashboardPage = () => {
  return (
    <div className="p-6 space-y-6">
      {/* Reminder */}
      <section className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-lg shadow">
        <p>
          <strong>Reminder:</strong> Ada 3 task overdue. Harap segera
          diselesaikan.
        </p>
      </section>

      {/* Statistik Ringkas */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { title: "Total Games", value: 120, color: "bg-blue-500" },
          { title: "Total Tasks", value: 45, color: "bg-green-500" },
          { title: "Total Requests", value: 30, color: "bg-yellow-500" },
          { title: "Total Feedback", value: 15, color: "bg-red-500" },
        ].map((stat, index) => (
          <div
            key={index}
            className={`${stat.color} text-white p-4 rounded-lg shadow`}
          >
            <h3 className="text-lg font-medium">{stat.title}</h3>
            <p className="text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </section>

      {/* Aktivitas Terbaru */}
      <section className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Aktivitas Terbaru
        </h2>
        <ul className="space-y-4">
          {[
            {
              activity: "Game 'Valorant' ditambahkan oleh Admin.",
              time: "2 jam yang lalu",
            },
            {
              activity: "Request untuk game 'Apex Legends' diterima.",
              time: "5 jam yang lalu",
            },
            {
              activity: "Task 'Upload Game Assets' selesai oleh User.",
              time: "1 hari yang lalu",
            },
          ].map((item, index) => (
            <li
              key={index}
              className="flex items-center space-x-4 border-b pb-2 last:border-b-0"
            >
              <div className="bg-gray-200 p-2 rounded-full">
                <span className="text-gray-600 text-sm">{item.time}</span>
              </div>
              <p className="text-gray-600">{item.activity}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Prioritas Overview & Request Prioritas */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Task yang Harus Dikerjakan */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Task yang Harus Dikerjakan
          </h2>
          <ul className="space-y-4">
            {[
              { task: "Update Database", deadline: "20 Dec", progress: 50 },
              { task: "Add New Game", deadline: "22 Dec", progress: 30 },
              { task: "Review Feedback", deadline: "25 Dec", progress: 80 },
            ].map((item, index) => (
              <li key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-gray-600">{item.task}</p>
                  <span className="text-sm text-gray-500">
                    Deadline: {item.deadline}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-2 bg-blue-500 rounded-full"
                    style={{ width: `${item.progress}%` }}
                  ></div>
                </div>
              </li>
            ))}
          </ul>
        </div>

  {/* Request Prioritas */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Request Penting
        </h2>
        <ul className="space-y-4">
          {[
            { request: "Game 'Minecraft'", deadline: "20 Dec", priority: "High" },
            { request: "Game 'Among Us'", deadline: "22 Dec", priority: "Medium" },
            { request: "Game 'Fortnite'", deadline: "25 Dec", priority: "Low" },
          ].map((item, index) => (
            <li
              key={index}
              className={`p-4 rounded-lg shadow ${
                item.priority === "High"
                  ? "bg-red-100 border-l-4 border-red-500"
                  : item.priority === "Medium"
                  ? "bg-yellow-100 border-l-4 border-yellow-500"
                  : "bg-green-100 border-l-4 border-green-500"
              }`}
            >
              <div className="flex justify-between items-center">
                <p className="text-gray-800">{item.request}</p>
                <span className="text-sm text-gray-600">
                  Deadline: {item.deadline}
                </span>
              </div>
              <span className="text-sm font-medium">
                Priority: {item.priority}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>

      {/* Prioritas Overview
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Task yang Harus Dikerjakan
          </h2>
          <ul className="space-y-4">
            {[
              {
                task: "Update Database",
                deadline: "20 Dec",
                progress: 50,
              },
              {
                task: "Add New Game",
                deadline: "22 Dec",
                progress: 30,
              },
              {
                task: "Review Feedback",
                deadline: "25 Dec",
                progress: 80,
              },
            ].map((item, index) => (
              <li key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-gray-600">{item.task}</p>
                  <span className="text-sm text-gray-500">
                    Deadline: {item.deadline}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-2 bg-blue-500 rounded-full"
                    style={{ width: `${item.progress}%` }}
                  ></div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Request Prioritas */}
      {/* <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Request Penting
          </h2>
          <ul className="space-y-4">
            {[
              {
                request: "Game 'Minecraft'",
                deadline: "20 Dec",
                priority: "High",
              },
              {
                request: "Game 'Among Us'",
                deadline: "22 Dec",
                priority: "Medium",
              },
              {
                r equest: "Game 'Fortnite'",
                deadline: "25 Dec",
                priority: "Low",
              },
            ].map((item, index) => (
              <li
                key={index}
                className={`p-4 rounded-lg shadow ${
                  item.priority === "High"
                    ? "bg-red-100 border-l-4 border-red-500"
                    : item.priority === "Medium"
                    ? "bg-yellow-100 border-l-4 border-yellow-500"
                    : "bg-green-100 border-l-4 border-green-500"
                }`}
              >
                <div className="flex justify-between items-center">
                  <p className="text-gray-800">{item.request}</p>
                  <span className="text-sm text-gray-600">
                    Deadline: {item.deadline}
                  </span>
                </div>
                <span className="text-sm font-medium">
                  Priority: {item.priority}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section> */}
    </div>
  );
};

export default DashboardPage;
