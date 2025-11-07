import { useDrag } from "react-dnd";
import { XMarkIcon } from "@heroicons/react/24/solid"; // Tambahkan icon X

const ITEM_TYPE = "CARD";

const calculateDeadline = (latestDate) => {
  const deadlineDate = new Date(latestDate);
  deadlineDate.setDate(deadlineDate.getDate() + 14);
  const currentDate = new Date();
  const timeDiff = deadlineDate - currentDate;
  const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  return daysLeft > 0 ? `${daysLeft}d left` : "Expired";
};

const getPriorityStyle = (requestCount) => {
  if (requestCount > 10) return { label: "Critical", color: "bg-red-100 border-red-500 text-red-800" };
  if (requestCount > 5) return { label: "High", color: "bg-orange-100 border-orange-500 text-orange-800" };
  if (requestCount > 3) return { label: "Medium", color: "bg-yellow-100 border-yellow-500 text-yellow-800" };
  return { label: "Low", color: "bg-green-100 border-green-500 text-green-800" };
};

const getPlatformStyle = (platform) => {
  switch (platform) {
    case "OvaGames":
      return "bg-pink-200 text-pink-800";
    case "SteamRIP":
      return "bg-purple-200 text-purple-800";
    case "RepackGames":
      return "bg-blue-200 text-blue-800";
    default:
      return "bg-gray-200 text-gray-800";
  }
};

const RequestCard = ({ id, request, data, onEdit, onDone, onDelete }) => {
  const [{ isDragging }, dragRef] = useDrag({
    type: ITEM_TYPE,
    item: { id, ...data },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const priority = getPriorityStyle(request.requestCount);
  const deadline = priority.label === "Critical" ? calculateDeadline(request.latestDate) : null;

  return (
    <div
      ref={dragRef}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: "grab",
      }}
      className={`relative border rounded-lg shadow p-2 ${priority.color}`}
      data-index={data.index}
    >
      {/* Tombol Hapus (X) */}
      <button
        onClick={() => onDelete(request.id)}
        className="absolute top-1 right-1 text-red-600 hover:text-red-800 text-lg font-bold"
      >
        <XMarkIcon className="w-5 h-5" />
      </button>

      {/* Header dengan Prioritas dan Jumlah Request */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <div className={`px-2 py-0.5 text-xs font-bold uppercase border rounded-full ${priority.color}`}>
            {priority.label}
          </div>
          <div className="px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded-full">
            {`Req: ${request.requestCount}`}
          </div>
        </div>
      </div>

      {/* Konten Utama */}
      <div className="flex justify-between items-center">
        <h3 className="text-base font-semibold text-gray-800 truncate">{request.game}</h3>
        {deadline && (
          <p className="text-xs font-semibold text-red-600">{deadline}</p>
        )}
      </div>

      {/* Platform dalam bentuk badge */}
      <div className="flex flex-wrap gap-1 mt-1">
        {request.platforms.map((platform, index) => (
          <span
            key={index}
            className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${getPlatformStyle(platform)}`}
          >
            {platform}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center mt-2">
        {/* Data Earliest Date */}
        <p className="text-sm font-semibold text-gray-600">{request.earliestDate}</p>

        {/* Tombol Edit */}
        <button 
          className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded hover:bg-blue-600"
          onClick={() => onEdit(request)}
        >
          Edit
        </button>

        {/* Tombol Done */}
        {data.status === "Uploaded" && (
          <button
            className="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded hover:bg-green-600"
            onClick={() => {
              onDone(request)
            }} // Ensure this passes the correct `request` object
          >
            Done
          </button>
        )}
      </div>
    </div>
  );
}
export default RequestCard;
