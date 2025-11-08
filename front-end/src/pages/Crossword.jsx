import React, { useState, useEffect } from "react";
import { api } from "../api";
import { motion } from "framer-motion";

export default function Crossword() {
  const teamId = localStorage.getItem("teamId");
  const [puzzle, setPuzzle] = useState(null);
  const [grid, setGrid] = useState([]); // player's working grid ('' or letter or null)
  const [clues, setClues] = useState([]);
  const [solved, setSolved] = useState(false);
  const [msg, setMsg] = useState("");

  // fetch puzzle
  const startPuzzle = async () => {
    setMsg("Loading puzzle...");
    try {
      const res = await api.get(`/api/puzzle/random/${teamId}`);
      const p = res.data.puzzle;
      if (!p) { setMsg("No puzzle returned"); return; }

      // Build workingGrid from sanitized grid ('' and null)
      const working = p.grid.map(row => row.map(cell => (cell === null ? null : (cell || ""))));
      // Save clues (with answers included)
      setClues(p.clues || []);

      // Prefill first 2 letters of each clue's answer into working grid
      for (const cl of p.clues || []) {
        const ans = (cl.answer || "").toUpperCase();
        for (let i = 0; i < Math.min(2, ans.length); i++) {
          if (cl.direction === "across") {
            const r = cl.r, c = cl.c + i;
            if (working[r] && working[r][c] !== null) working[r][c] = ans[i];
          } else { // down
            const r = cl.r + i, c = cl.c;
            if (working[r] && working[r][c] !== null) working[r][c] = ans[i];
          }
        }
      }

      setPuzzle(p);
      setGrid(working);
      setSolved(false);
      setMsg("");
    } catch (err) {
      console.error("Failed to load puzzle:", err);
      setMsg("Failed to load puzzle from server.");
    }
  };

  // helper: return numeric clue index string (like 1,2,3) if any clue starts here
  const clueNumberAt = (r, c) => {
    const found = clues.find(cl => cl.r === r && cl.c === c);
    if (!found) return "";
    // numeric part of id (1A -> 1)
    return found.id.replace(/\D/g, "") || found.id;
  };

  // handle user typing; update grid and also enforce intersection consistency
  const handleChange = (r, c, ch) => {
    if (!grid || !grid[r] || grid[r][c] === null) return;
    const letter = (ch || "").toUpperCase().slice(0,1);
    setGrid(prev => {
      const copy = prev.map(row => [...row]);
      copy[r][c] = letter;
      return copy;
    });
  };

  // submit filledGrid to server
  const submit = async () => {
    if (!puzzle) return;
    setMsg("Submitting...");
    try {
      const res = await api.post("/api/puzzle/submit", {
        teamId,
        puzzleId: puzzle._id || puzzle.id,
        filledGrid: grid
      });
      if (res.data?.ok) {
        setSolved(true);
        setMsg("Correct! Coordinate: " + JSON.stringify(res.data.coordinate));
      } else {
        setMsg(res.data?.message || "Incorrect.");
      }
    } catch (err) {
      console.error("Submit error:", err);
      setMsg("Server error on submit.");
    }
  };

  // Render nothing until puzzle loaded
  if (!puzzle) {
    return (
      <div className="flex flex-col items-center justify-center p-10">
        <motion.button
          onClick={startPuzzle}
          whileHover={{ scale: 1.05 }}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg"
        >
          Start Random Puzzle
        </motion.button>
        {msg && <div className="mt-4 text-red-400">{msg}</div>}
      </div>
    );
  }

const rows = grid.length;
const cols = grid[0]?.length || 0;
const cellSize = 48;
const gridStyle = {
  display: "grid",
  gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
  gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
  gap: "6px",
};

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-center">Stage 1 – Crossword Challenge</h2>

      <div className="flex gap-8 items-start">
        {/* Grid */}
        <motion.div style={gridStyle} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {grid.map((row, r) =>
            row.map((cell, c) => {
              const isBlock = cell === null;
              // show number if clue starts here
              const num = clueNumberAt(r, c);
              return (
                <div key={`${r}-${c}`} style={{ position: "relative", width: cellSize, height: cellSize }}>
                  {num ? (
                    <div style={{ position: "absolute", top: 2, left: 2, fontSize: 10, color: "white" }}>{num}</div>
                  ) : null}
                  {isBlock ? (
                    <div style={{ background: "#111827", width: "100%", height: "100%", borderRadius: 4 }} />
                  ) : (
                    <input
                      value={cell || ""}
                      onChange={(e) => handleChange(r, c, e.target.value)}
                      maxLength={1}
                      disabled={solved}
                      style={{
                        width: "100%",
                        height: "100%",
                        textAlign: "center",
                        fontWeight: 700,
                        fontSize: 18,
                        textTransform: "uppercase",
                        border: "2px solid #d1d5db",
                        borderRadius: 6,
                        outline: "none",
                        boxSizing: "border-box"
                      }}
                    />
                  )}
                </div>
              );
            })
          )}
        </motion.div>

        {/* Clues */}
        <div style={{ width: 360 }}>
          <div className="bg-blue-300 p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-3">🔍 Crossword Clues</h3>

            <div>
              <div className="mb-2 text-sm text-gray-700 font-semibold">Across</div>
              {clues.filter(cl => cl.direction.toLowerCase().startsWith("across") || cl.direction.toLowerCase()==="a").map(cl => (
                <div key={cl.id} className="bg-blue-700 p-3 rounded mb-2 shadow-sm">
                  <div className="font-semibold">{cl.id} — {cl.clue}</div>
                  <div className="text-xs text-black">Length: {cl.length}</div>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <div className="mb-2 text-sm text-gray-700 font-semibold">Down</div>
              {clues.filter(cl => cl.direction.toLowerCase().startsWith("down") || cl.direction.toLowerCase()==="d").map(cl => (
                <div key={cl.id} className="bg-blue-700 p-3 rounded mb-2 shadow-sm">
                  <div className="font-semibold">{cl.id} — {cl.clue}</div>
                  <div className="text-xs text-black">Length: {cl.length}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 text-sm text-gray-600">
              Note: first 2 letters of each answer are pre-filled for fairness.
            </div>
            <div className="mt-4">
              <button onClick={submit} className="px-4 py-2 bg-green-600 text-white rounded">Submit Solution</button>
            </div>

            {msg && <div className="mt-3 text-sm text-red-500">{msg}</div>}
            {solved && <div className="mt-3 text-sm text-green-600">Solved ✔</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
