import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import {
  collection,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../../config/firebaseConfig";
import StatusColumn from "./components/StatusColumn";
import AddNewRequest from "./components/AddNewRequest";
import EditRequestModal from "./components/EditRequestModal";
import { moveGameToGamesTable } from "./services/moveGameToGamesTable.js";

const RequestsPage = () => {
  const [activeTab, setActiveTab] = useState("games"); // Game Requests / Pending
  const [requests, setRequests] = useState({
    "Requested List": [],
    "On Process": [],
    Uploaded: [],
  });
  const [pendingRequests, setPendingRequests] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [editModal, setEditModal] = useState({ isOpen: false, requestData: null });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "requests"), (snapshot) => {
      const requestsData = { "Requested List": [], "On Process": [], Uploaded: [] };
      const pendingData = [];

      snapshot.forEach((d) => {
        const data = d.data();
        const item = { id: d.id, ...data };
        if (data.statusColumn === "pending") {
          pendingData.push(item);
        } else if (requestsData[data.statusColumn]) {
          requestsData[data.statusColumn].push(item);
        }
      });

      setRequests(requestsData);
      setPendingRequests(pendingData);
    });

    return () => unsubscribe();
  }, []);

  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 2200,
    timerProgressBar: true,
  });

  const handleAcceptRequest = async (request) => {
    const q = query(
      collection(db, "requests"),
      where("game", "==", request.game),
      where("statusColumn", "==", "Requested List")
    );
    const existingGameSnapshot = await getDocs(q);

    if (!existingGameSnapshot.empty) {
      const existingDoc = existingGameSnapshot.docs[0];
      const existingData = existingDoc.data();

      const { isConfirmed } = await Swal.fire({
        title: "Game sudah ada",
        text: `${request.game} sudah ada di Requested List. Tambah request count?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Ya, tambah",
        cancelButtonText: "Batal",
      });

      if (isConfirmed) {
        const updatedRequestCount = (existingData.requestCount || 1) + 1;
        await updateDoc(doc(db, "requests", existingDoc.id), {
          requestCount: updatedRequestCount,
          latestDate: new Date().toISOString().split("T")[0],
        });
        await deleteDoc(doc(db, "requests", request.id));
        Toast.fire({ icon: "success", title: "Request merged ke Requested List" });
      }
    } else {
      await updateDoc(doc(db, "requests", request.id), { statusColumn: "Requested List" });
      Toast.fire({ icon: "success", title: "Request dipindahkan ke Requested List" });
    }
  };

  const handleRejectRequest = async (id) => {
    const result = await Swal.fire({
      title: "Tolak request?",
      text: "Request akan dihapus dari pending.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Tolak",
      cancelButtonText: "Batal",
    });
    if (!result.isConfirmed) return;
    await deleteDoc(doc(db, "requests", id));
    Toast.fire({ icon: "success", title: "Request ditolak dan dihapus" });
  };

  const handleDeleteRequest = async (id) => {
    const result = await Swal.fire({
      title: "Hapus request?",
      text: "Tindakan ini tidak dapat dibatalkan.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Hapus",
      cancelButtonText: "Batal",
    });
    if (!result.isConfirmed) return;
    try {
      await deleteDoc(doc(db, "requests", id));
      setRequests((prev) => {
        const newRequests = { ...prev };
        Object.keys(newRequests).forEach((status) => {
          newRequests[status] = newRequests[status].filter((r) => r.id !== id);
        });
        return newRequests;
      });
      Toast.fire({ icon: "success", title: "Request dihapus" });
    } catch (error) {
      console.error("Gagal menghapus request:", error);
      Swal.fire("Error", "Gagal menghapus request, coba lagi.", "error");
    }
  };

  // Move request to target status with confirmation + toast
  const handleMoveRequest = async (request, targetStatus) => {
    const labelMap = {
      "On Process": "Start process",
      Uploaded: "Mark uploaded",
      "Requested List": "Return to requested",
    };
    const actionLabel = labelMap[targetStatus] || `Move to ${targetStatus}`;

    const { isConfirmed } = await Swal.fire({
      title: `${actionLabel}?`,
      html: `Apakah Anda yakin ingin <strong>${actionLabel}</strong> untuk <em>${request.game}</em>?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: actionLabel,
      cancelButtonText: "Batal",
    });

    if (!isConfirmed) return;

    try {
      await updateDoc(doc(db, "requests", request.id), { statusColumn: targetStatus });
      // optimistic UI update
      setRequests((prev) => {
        const newRequests = { ...prev };
        Object.keys(newRequests).forEach((status) => {
          newRequests[status] = newRequests[status].filter((r) => r.id !== request.id);
        });
        if (!newRequests[targetStatus]) newRequests[targetStatus] = [];
        newRequests[targetStatus] = [{ ...request, statusColumn: targetStatus }, ...newRequests[targetStatus]];
        return newRequests;
      });
      Toast.fire({ icon: "success", title: `${actionLabel} berhasil` });
    } catch (error) {
      console.error("Gagal memindahkan request:", error);
      Swal.fire("Error", "Gagal memindahkan request. Coba lagi.", "error");
    }
  };

  const handleMoveToGames = async (request) => {
    const { isConfirmed } = await Swal.fire({
      title: "Pindahkan ke Games?",
      text: `Game "${request.game}" akan dipindahkan ke table Games dan dihapus dari Requests.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Move to Games",
      cancelButtonText: "Batal",
    });
    if (!isConfirmed) return;

    try {
      await moveGameToGamesTable(request.id, request.game);
      setRequests((prev) => {
        const newRequests = { ...prev };
        Object.keys(newRequests).forEach((status) => {
          newRequests[status] = newRequests[status].filter((r) => r.id !== request.id);
        });
        return newRequests;
      });
      Toast.fire({ icon: "success", title: "Berhasil dipindahkan ke Games" });
    } catch (err) {
      console.error("Gagal memindahkan request ke games:", err);
      Swal.fire("Error", "Gagal memindahkan ke Games.", "error");
    }
  };

  return (
    <div className="p-6 relative">
      <h1 className="text-2xl font-bold mb-4">Request Management</h1>

      <div className="flex border-b mb-4">
        <button
          className={`px-4 py-2 text-sm font-medium ${activeTab === "games" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-600"}`}
          onClick={() => setActiveTab("games")}
        >
          Game Requests
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${activeTab === "pending" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-600"}`}
          onClick={() => setActiveTab("pending")}
        >
          Pending Requests
        </button>
      </div>

      {activeTab === "pending" ? (
        <div className="p-4 bg-white shadow rounded">
          <h2 className="text-lg font-semibold mb-3">Pending Requests</h2>
          {pendingRequests.length === 0 ? (
            <p className="text-gray-500">Tidak ada request yang pending.</p>
          ) : (
            <ul className="space-y-2">
              {pendingRequests.map((request) => (
                <li key={request.id} className="p-3 flex justify-between items-center bg-gray-100 rounded shadow">
                  <div>
                    <div className="font-medium">{request.game}</div>
                    {request.usernameShopee && <div className="text-sm text-gray-600">by: {request.usernameShopee}</div>}
                  </div>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 bg-blue-500 text-white text-sm rounded" onClick={() => handleAcceptRequest(request)}>Terima</button>
                    <button className="px-3 py-1 bg-red-500 text-white text-sm rounded" onClick={() => handleRejectRequest(request.id)}>Tolak</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <>
          <div className="mb-4">
            <button className="px-4 py-2 bg-green-500 text-white rounded" onClick={() => setShowModal(true)}>Add Request Card</button>
          </div>

          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowModal(false)} />
              <AddNewRequest closeModal={() => setShowModal(false)} requests={requests} setRequests={setRequests} />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.keys(requests).map((status) => (
              <StatusColumn
                key={status}
                id={status}
                items={requests[status]}
                onEdit={(r) => setEditModal({ isOpen: true, requestData: r })}
                onDelete={handleDeleteRequest}
                onMove={handleMoveRequest}
                onMoveToGames={handleMoveToGames}
              />
            ))}
          </div>

          {editModal.isOpen && (
            <EditRequestModal
              request={editModal.requestData}
              onClose={() => setEditModal({ isOpen: false, requestData: null })}
              onSave={async (updatedRequest) => {
                const { id, statusColumn, ...data } = updatedRequest;
                const docRef = doc(db, "requests", id);
                await updateDoc(docRef, data);
                setRequests((prev) => ({
                  ...prev,
                  [statusColumn]: prev[statusColumn].map((req) => (req.id === id ? { ...req, ...data } : req)),
                }));
                setEditModal({ isOpen: false, requestData: null });
                Toast.fire({ icon: "success", title: "Request diperbarui" });
              }}
            />
          )}
        </>
      )}
    </div>
  );
};

export default RequestsPage;