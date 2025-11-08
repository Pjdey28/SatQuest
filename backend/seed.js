require("dotenv").config();
const mongoose = require("mongoose");
const { Puzzle } = require("./models");

const MONGO = process.env.MONGO_URI;

async function seed() {
  await mongoose.connect(MONGO);
  console.log("✅ Connected to MongoDB");

  await Puzzle.deleteMany({});
  console.log("🧹 Cleared existing puzzles");

  // Helper to create empty grid
  function makeGrid(rows, cols) {
    return Array.from({ length: rows }, () => Array(cols).fill(null));
  }

  // Helper: place word (across/down)
  function placeWord(grid, r, c, dir, word) {
    for (let i = 0; i < word.length; i++) {
      if (dir === "across") grid[r][c + i] = word[i];
      else grid[r + i][c] = word[i];
    }
  }

  const puzzles = [];

  // 🛰️ Example Puzzle 1 — Real crossword layout
  let g1 = makeGrid(8, 10);
  placeWord(g1, 0, 1, "across", "PAYLOAD");
  placeWord(g1, 1, 0, "down", "DATA");
  placeWord(g1, 3, 2, "across", "SENSOR");
  placeWord(g1, 6, 1, "across", "RADIO");

  const clues1 = [
    { id: "1A", direction: "across", r: 0, c: 1, length: 7, clue: "Satellite instruments", answer: "PAYLOAD" },
    { id: "2D", direction: "down", r: 1, c: 0, length: 4, clue: "Transmitted information", answer: "DATA" },
    { id: "3A", direction: "across", r: 3, c: 2, length: 6, clue: "Detects environmental data", answer: "SENSOR" },
    { id: "4A", direction: "across", r: 6, c: 1, length: 5, clue: "Communication wave type", answer: "RADIO" },
  ];

  puzzles.push({
    code: "SAT1",
    grid: g1,
    clues: clues1,
    coordinateAfterSolve: { r: 4, c: 5 },
  });

  // ✅ Insert to DB
  for (const p of puzzles) {
    await new Puzzle(p).save();
    console.log("🧩 Seeded:", p.code);
  }

  console.log("✅ Done seeding variable-size puzzles");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding error:", err);
  process.exit(1);
});
