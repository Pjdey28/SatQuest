import React from 'react';

export default function ComponentCard({ item, onPick }) {
  return (
    <div className="card mb-2 p-3">
      <div className="flex justify-between items-center">
        <div>
          <div className="font-semibold">{item.name}</div>
          <div className="text-sm text-gray-300">Cost: {item.cost} | Power: {item.power}W | Size: {item.grid_span}x{item.grid_span}</div>
        </div>
        <button className="px-3 py-1 bg-indigo-600 rounded" onClick={() => onPick(item)}>Use</button>
      </div>
    </div>
  );
}
