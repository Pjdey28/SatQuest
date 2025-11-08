import React from "react";

export default function DraggableItem({ item, onMobileSelect }) {
  const isMobile = window.matchMedia("(max-width: 768px)").matches;

  const handleDragStart = (e) => {
    if (isMobile) return; // prevent dragging on mobile
    e.dataTransfer.setData("item", JSON.stringify(item));
  };

  const handleClick = () => {
    if (isMobile && onMobileSelect) {
      onMobileSelect(item);
      alert(`✅ ${item.name} selected. Tap on grid to place.`);
    }
  };

  return (
    <div
      draggable={!isMobile}
      onDragStart={handleDragStart}
      onClick={handleClick}
      className="p-3 rounded-lg border-2 border-slate-700 bg-slate-800 hover:bg-slate-700 cursor-pointer transition-all text-white text-sm"
    >
      <div className="font-semibold">{item.name}</div>
      <div className="text-xs text-slate-400">
        Cost: {item.cost} | Power: {item.draw}W | Size: {item.grid_span}x{item.grid_span}
      </div>
    </div>
  );
}
