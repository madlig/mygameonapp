import React, { useState } from "react";
import { useDrop } from "react-dnd";
import RequestCard from "./RequestCard";

const ITEM_TYPE = "CARD";

const StatusColumn = ({ id, items, moveCard, onEdit, onDone, onDelete }) => { // Tambahkan onDone sebagai prop
  const [hoverIndex, setHoverIndex] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const [{ isOver }, dropRef] = useDrop({
    accept: ITEM_TYPE,
    hover: (draggedItem, monitor) => {
      if (!monitor.isOver()) return;

      setIsDragging(true);
      const clientOffset = monitor.getClientOffset();

      // Tentukan indeks posisi hover
      const hoverIndex = items.findIndex((_, index) => {
        const element = document.querySelector(`[data-index="${index}-${id}"]`);
        if (!element) return false;
        const { top, bottom, left, right } = element.getBoundingClientRect();
        const inHorizontalRange =
          clientOffset.x >= left && clientOffset.x <= right;
        const inVerticalRange =
          clientOffset.y >= top && clientOffset.y <= bottom;
        return inHorizontalRange && inVerticalRange;
      });

      setHoverIndex(hoverIndex === -1 ? items.length : hoverIndex);
    },
    drop: (draggedItem) => {
      moveCard(
        { status: draggedItem.status, index: draggedItem.index },
        { status: id, index: hoverIndex }
      );
      setHoverIndex(null);
      setIsDragging(false);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div
      ref={dropRef}
      className={`bg-white p-6 rounded-lg border-2 border-gray-300 shadow-lg`}
    >
      <h2 className="text-xl font-semibold text-gray-700 mb-4">{id}</h2>
      <div className="grid grid-cols-2 gap-4">
        {items.map((item, index) => (
          <div key={item.id} data-index={`${index}-${id}`}>
            {isDragging && hoverIndex === index && <Placeholder />}
            <RequestCard
              id={item.id}
              request={item}
              data={{ status: id, index }}
              onEdit={onEdit} // Pass onEdit to RequestCard
              onDone={onDone} // Pass onDone to RequestCard
              onDelete={onDelete} // Tambahkan onDelete
            />
          </div>
        ))}
        {isDragging && hoverIndex === items.length && <Placeholder />}
      </div>
    </div>
  );
};


const Placeholder = () => (
  <div
    className="mb-2 rounded bg-gray-300 opacity-50"
    style={{
      height: "80px", // Sesuaikan dengan tinggi kartu
      transition: "background-color 0.2s ease",
    }}
  ></div>
);

export default StatusColumn;
