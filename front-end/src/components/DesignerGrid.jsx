import React, { useState, useEffect } from "react";

export default function DesignerGrid({ gridSize, placed, onPlaceChange }) {
  const [localPlaced, setLocalPlaced] = useState(placed || []);
  const [selectedItem, setSelectedItem] = useState(null); // mobile tap-select item
  const isMobile = window.matchMedia("(max-width: 768px)").matches;

  // 🔹 Add this useEffect block right after defining isMobile
  useEffect(() => {
    const handleSelect = (e) => {
      if (isMobile) setSelectedItem(e.detail);
    };
    document.addEventListener("mobileItemSelect", handleSelect);
    return () => document.removeEventListener("mobileItemSelect", handleSelect);
  }, [isMobile]);
  // ✅ This allows DraggableItem (tap selection) to communicate with the grid

  const handleDrop = (e, r, c) => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData("item"));
    placeItem(data, r, c);
  };

  const handleTapPlace = (r, c) => {
    if (!selectedItem) return;
    placeItem(selectedItem, r, c);
    setSelectedItem(null);
  };

  const placeItem = (data, r, c) => {
    const span = data.grid_span || 1;
    if (r + span > gridSize || c + span > gridSize) return;

    // prevent overlap
    for (let i = r; i < r + span; i++) {
      for (let j = c; j < c + span; j++) {
        if (localPlaced.some(p => i >= p.r && i < p.r + p.grid_span && j >= p.c && j < p.c + p.grid_span)) {
          return;
        }
      }
    }

    const newPlaced = [...localPlaced, { ...data, r, c }];
    setLocalPlaced(newPlaced);
    onPlaceChange(newPlaced);
  };

  const handleRemove = (code) => {
    const filtered = localPlaced.filter(p => p.code !== code);
    setLocalPlaced(filtered);
    onPlaceChange(filtered);
  };

  const handleDragOver = (e) => e.preventDefault();

  return (
    <div
      className="relative grid gap-px bg-slate-900"
      style={{
        gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
        gridTemplateRows: `repeat(${gridSize}, 1fr)`,
        width: "100%",
        aspectRatio: "1 / 1",
        touchAction: "none",
      }}
    >
      {/* Grid cells */}
      {Array.from({ length: gridSize * gridSize }).map((_, i) => {
        const r = Math.floor(i / gridSize);
        const c = i % gridSize;
        return (
          <div
            key={i}
            className="border border-slate-700"
            onDrop={(e) => !isMobile && handleDrop(e, r, c)}
            onDragOver={(e) => !isMobile && handleDragOver(e)}
            onClick={() => isMobile && handleTapPlace(r, c)}
            style={{
              minHeight: isMobile ? "38px" : "24px", // larger cells for touch
            }}
          />
        );
      })}

      {/* Render placed items */}
      {localPlaced.map((p, idx) => (
        <div
          key={`${p.code}-${idx}`}
          onClick={() => handleRemove(p.code)}
          className="absolute flex items-center justify-center text-[10px] sm:text-xs text-white bg-emerald-600 hover:bg-red-600 cursor-pointer rounded-sm select-none"
          style={{
            top: `calc(${(p.r / gridSize) * 100}%)`,
            left: `calc(${(p.c / gridSize) * 100}%)`,
            width: `calc(${(p.grid_span / gridSize) * 100}%)`,
            height: `calc(${(p.grid_span / gridSize) * 100}%)`,
          }}
        >
          {p.name}
        </div>
      ))}
    </div>
  );
}
