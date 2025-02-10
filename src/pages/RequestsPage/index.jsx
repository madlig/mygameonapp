import React, { useState, useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { collection, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "../../config/firebaseConfig";
import StatusColumn from "./StatusColumn";
import AddNewRequest from "./AddNewRequest";
import EditRequestModal from "./EditRequestModal";
import MoveToGamesModal from "./MoveToGamesModal";

const RequestPage = () => {
  const [requests, setRequests] = useState({
    "Requested List": [],
    "On Process": [],
    Uploaded: [],
  });

  const [showModal, setShowModal] = useState(false); // Modal visibility
  const [editModal, setEditModal] = useState({
    isOpen: false,
    requestData: null,
  });
  const [moveToGamesModal, setMoveToGamesModal] = useState({
    isOpen: false,
    prefillData: null,
  });

  useEffect(() => {
    const fetchRequests = async () => {
      const querySnapshot = await getDocs(collection(db, "requests"));
      const requestsData = {
        "Requested List": [],
        "On Process": [],
        Uploaded: [],
      };

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        requestsData[data.statusColumn].push({
          id: doc.id,
          ...data,
        });
      });

      setRequests(requestsData);
    };

    fetchRequests();
  }, []);

  const moveCard = async (source, destination) => {
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
    await updateDoc(cardDoc, { statusColumn: destination.status });
  };

  const handleSaveEdit = async (updatedRequest) => {
    const { id, statusColumn, ...data } = updatedRequest;

    const docRef = doc(db, "requests", id);
    await updateDoc(docRef, data);

    setRequests((prev) => ({
      ...prev,
      [statusColumn]: prev[statusColumn].map((req) =>
        req.id === id ? { ...req, ...data } : req
      ),
    }));

    setEditModal({ isOpen: false, requestData: null });
  };

  const handleMoveToGames = async (request) => {
    try {
      // Delete request from Firestore
      await deleteDoc(doc(db, "requests", request.id));

      // Update local state
      setRequests((prev) => ({
        ...prev,
        Uploaded: prev.Uploaded.filter((req) => req.id !== request.id),
      }));

      setMoveToGamesModal({ isOpen: false, prefillData: null });
    } catch (error) {
      console.error("Error transferring request to games:", error);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="p-6 relative">
        <h1 className="text-2xl font-bold mb-4">Request Management</h1>

        {/* Add Request Card Button */}
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
            onSave={handleSaveEdit}
          />
        )}

        {/* Move to Games Modal */}
        {moveToGamesModal.isOpen && (
          <MoveToGamesModal
            onClose={() =>
              setMoveToGamesModal({ isOpen: false, prefillData: null })
            }
            onConfirm={handleMoveToGames}
            prefillData={moveToGamesModal.prefillData}
          />
        )}

        {/* Konten dengan efek redup */}
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
              moveCard={moveCard}
              showModal={showModal}
              onEdit={(request) =>
                setEditModal({ isOpen: true, requestData: request })
              }
              onDone={(request) => {
                console.log("Passing request to MoveToGamesModal:", request);
                setMoveToGamesModal({ isOpen: true, prefillData: request }) // Ensure `request` includes the `name` field
              }}              
            />
          ))}
        </div>
      </div>
    </DndProvider>
  );
};

export default RequestPage;
