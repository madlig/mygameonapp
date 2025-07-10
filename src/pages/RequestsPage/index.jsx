import React, { useState, useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { collection, doc, updateDoc, deleteDoc, onSnapshot, query, where, getDocs } from "firebase/firestore";
import { db } from "../../config/firebaseConfig";
import StatusColumn from "./StatusColumn";
import AddNewRequest from "./AddNewRequest";
import EditRequestModal from "./EditRequestModal";
import { moveGameToGamesTable } from "./moveGameToGamesTable"; // Sesuaikan path

const RequestPage = () => {
  const [activeTab, setActiveTab] = useState("games"); // Default: Pending Requests
  const [requests, setRequests] = useState({
    "Requested List": [],
    "On Process": [],
    Uploaded: [],
  });
  const [pendingRequests, setPendingRequests] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [editModal, setEditModal] = useState({
    isOpen: false,
    requestData: null,
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "requests"), (snapshot) => {
      const requestsData = {
        "Requested List": [],
        "On Process": [],
        Uploaded: [],
      };
      const pendingData = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.statusColumn === "pending") {
          pendingData.push({ id: doc.id, ...data });
        } else if (requestsData[data.statusColumn]) {
          requestsData[data.statusColumn].push({ id: doc.id, ...data });
        }
      });

      setRequests(requestsData);
      setPendingRequests(pendingData);
    });

    return () => unsubscribe();
  }, []);

  const handleAcceptRequest = async (request) => {
    const { id, game } = request;
  
    // Cek apakah game sudah ada di Requested List
    const q = query(collection(db, "requests"), where("game", "==", game), where("statusColumn", "==", "Requested List"));
    const existingGameSnapshot = await getDocs(q);
  
    if (!existingGameSnapshot.empty) {
      const existingDoc = existingGameSnapshot.docs[0]; // Ambil dokumen pertama yang cocok
      const existingData = existingDoc.data();
      
      const confirmMove = window.confirm("Game sudah terdaftar, apakah mau tetap dilanjutkan?");
      
      if (confirmMove) {
        // Update requestCount hanya bertambah +1
        const updatedRequestCount = (existingData.requestCount || 1) + 1;
        await updateDoc(doc(db, "requests", existingDoc.id), {
          requestCount: updatedRequestCount,
          latestDate: new Date().toISOString().split("T")[0]
        });
  
        // **Hapus request dari Pending Requests**
        await deleteDoc(doc(db, "requests", id));
      } else {
        // Hapus request dari Firestore jika admin memilih "Tidak"
        await deleteDoc(doc(db, "requests", id));
      }
    } else {
      // Jika game belum ada, pindahkan ke Requested List
      await updateDoc(doc(db, "requests", id), { statusColumn: "Requested List" });
    }
  };
  

  const handleRejectRequest = async (id) => {
    await deleteDoc(doc(db, "requests", id));
  };

  const handleDeleteRequest = async (id) => {
    const confirmDelete = window.confirm("Apakah Anda yakin ingin menghapus request ini?");
    
    if (!confirmDelete) return; // Jika user membatalkan, hentikan fungsi
  
    try {
      await deleteDoc(doc(db, "requests", id));
      setRequests((prevRequests) => {
        const newRequests = { ...prevRequests };
        Object.keys(newRequests).forEach((status) => {
          newRequests[status] = newRequests[status].filter((req) => req.id !== id);
        });
        return newRequests;
      });
    } catch (error) {
      console.error("Gagal menghapus request:", error);
    }
  };
  
  
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="p-6 relative">
        <h1 className="text-2xl font-bold mb-4">Request Management</h1>

        {/* Tab Navigation */}
        <div className="flex border-b mb-4">
          <button 
              className={`px-4 py-2 text-sm font-medium focus:outline-none border-b-2 transition-all duration-200 ${activeTab === "games" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`} 
              onClick={() => setActiveTab("games")}
          >
              Game Requests
          </button>
          <button 
              className={`px-4 py-2 text-sm font-medium focus:outline-none border-b-2 transition-all duration-200 ${activeTab === "pending" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`} 
              onClick={() => setActiveTab("pending")}
          >
              Pending Requests
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === "pending" ? (
            <div className="p-4 bg-white shadow rounded">
              <h2 className="text-lg font-semibold mb-3">Pending Requests</h2>
              {pendingRequests.length === 0 ? (
                <p className="text-gray-500">Tidak ada request yang pending.</p>
              ) : (
                <ul className="space-y-2">
                  {pendingRequests.map((request) => (
                    <li key={request.id} className="p-3 flex justify-between items-center bg-gray-100 rounded shadow">
                      <span className="font-medium">{request.game}</span>
                      <div className="flex space-x-2">
                        <button 
                          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                          onClick={() => handleAcceptRequest(request)}
                        >
                          Terima
                        </button>
                        <button 
                          className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                          onClick={() => handleRejectRequest(request.id)}
                        >
                          Tolak
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <>
              {/* Ini adalah Game Requests (kode yang sudah ada tetap dipertahankan) */}
              <button
                className="mb-4 px-4 py-2 bg-green-500 text-white text-sm font-medium rounded hover:bg-green-600"
                onClick={() => setShowModal(true)}
              >
                Add Request Card
              </button>

              {/* Overlay dan Modal */}
              {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                  <div
                    className="absolute inset-0 bg-black bg-opacity-50"
                    onClick={() => setShowModal(false)}
                  ></div>
                  <AddNewRequest
                    closeModal={() => setShowModal(false)}
                    requests={requests}
                    setRequests={setRequests}
                  />
                </div>
              )}

              {/* Modal Edit */}
              {editModal.isOpen && (
                <EditRequestModal
                  request={editModal.requestData}
                  onClose={() => setEditModal({ isOpen: false, requestData: null })}
                  onSave={(updatedRequest) => {
                    const { id, statusColumn, ...data } = updatedRequest;
                    const docRef = doc(db, "requests", id);
                    updateDoc(docRef, data);

                    setRequests((prev) => ({
                      ...prev,
                      [statusColumn]: prev[statusColumn].map((req) =>
                        req.id === id ? { ...req, ...data } : req
                      ),
                    }));

                    setEditModal({ isOpen: false, requestData: null });
                  }}
                />
              )}

              {/* Grid Status Columns */}
              <div
                className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-300 ${
                  showModal ? "opacity-50 pointer-events-none" : "opacity-100"
                }`}
              >
                {Object.keys(requests).map((status) => (
                  <StatusColumn
                    key={status}
                    id={status}
                    items={requests[status]}
                    moveCard={(source, destination) => {
                      const sourceStatus = requests[source.status];
                      const destinationStatus = requests[destination.status];

                      const [movedCard] = sourceStatus.splice(source.index, 1);
                      movedCard.statusColumn = destination.status;

                      destinationStatus.splice(destination.index, 0, movedCard);

                      setRequests((prev) => ({
                        ...prev,
                        [source.status]: sourceStatus,
                        [destination.status]: destinationStatus,
                      }));

                      const cardDoc = doc(db, "requests", movedCard.id);
                      updateDoc(cardDoc, { statusColumn: destination.status });
                    }}
                    showModal={showModal}
                    onEdit={(request) =>
                      setEditModal({ isOpen: true, requestData: request })
                    }
                    onDone={(request) => {
                      console.log("Tombol Move to Games diklik!", request);
                  
                      moveGameToGamesTable(request.id, request.game)
                          .then(() => {
                              setRequests((prevRequests) => {
                                  const newRequests = { ...prevRequests };
                                  Object.keys(newRequests).forEach((status) => {
                                      newRequests[status] = newRequests[status].filter(
                                          (req) => req.id !== request.id
                                      );
                                  });
                                  return newRequests;
                              });
                          })
                          .catch((error) => console.error("Gagal memperbarui UI:", error));
                  }}
                  onDelete={handleDeleteRequest}                  
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </DndProvider>
  );
};

export default RequestPage;
