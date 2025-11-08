require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

const { Team, Puzzle, Design } = require('./models');

const app = express();
app.use(cors());
app.use(express.json());

const MONGO = process.env.MONGO_URI ;
mongoose.connect(MONGO).then(()=>console.log('Mongo connected')).catch(e=>console.error(e));

// Helper: create a 6-char team code
function makeTeamCode() {
  return nanoid(6).toUpperCase();
}

/**
 * POST /api/register
 * body: { teamName, members: [{name,email,phone},{...},{...}] }
 * returns teamId, teamCode
 */
app.post('/api/register', async (req,res) => {
  try {
    const { teamName, members } = req.body;
    if (!teamName || !members || members.length !== 3) return res.status(400).json({ error: 'teamName and exactly 3 members required' });
    const teamCode = makeTeamCode();
    const team = await Team.create({ teamName, teamCode, members });
    return res.json({ ok: true, teamId: team._id, teamCode });
  } catch(err) {
    console.error(err);
    return res.status(500).json({ error: 'server error', detail: err.message });
  }
});

/**
 * POST /api/login
 * body: { teamCode }
 * returns team document (no password)
 */
app.post('/api/login', async (req,res) => {
  try {
    const { teamCode } = req.body;
    if(!teamCode) return res.status(400).json({ error: 'teamCode required' });
    const team = await Team.findOne({ teamCode });
    if(!team) return res.status(404).json({ error: 'Invalid team code' });
    return res.json({ ok: true, team });
  } catch(err) {
    console.error(err);
    return res.status(500).json({ error: 'server error' });
  }
});

/**
 * GET /api/puzzle/random/:teamId
 * returns a random puzzle (grid + clues). records which puzzle issued
 */
// ===================== GET RANDOM PUZZLE =====================
// server.js (or wherever your routes are)
// server.js (or where your routes are)
app.get('/api/puzzle/random/:teamId', async (req, res) => {
  try {
    const puzzles = await Puzzle.find({});
    if (!puzzles || puzzles.length === 0) return res.status(404).json({ error: 'No puzzles found' });

    const idx = Math.floor(Math.random() * puzzles.length);
    const p = puzzles[idx];

    // assign puzzle to team (optional)
    if (req.params.teamId) {
      try { await Team.findByIdAndUpdate(req.params.teamId, { 'stage1.puzzleId': p._id, 'stage1.solved': false }); } catch(e) { /* ignore update errors */ }
    }

    // Sanitized grid: keep null for blocks, replace letters with '' for player
    const sanitizedGrid = p.grid.map(row => row.map(cell => (cell === null ? null : '')));

    // Send clues including answers (frontend will only reveal 2 letters)
    const cluesWithAnswers = p.clues.map(c => ({
      id: c.id,
      direction: c.direction,
      r: c.r,
      c: c.c,
      length: c.length,
      clue: c.clue,
      answer: c.answer // include answer so frontend can prefill 2 letters
    }));

    return res.json({
      puzzle: {
        _id: p._id,
        grid: sanitizedGrid,
        clues: cluesWithAnswers
      }
    });
  } catch (err) {
    console.error('GET /api/puzzle/random failed:', err);
    res.status(500).json({ error: 'server error' });
  }
});



app.post('/api/puzzle/submit', async (req, res) => {
  try {
    const { teamId, puzzleId, filledGrid } = req.body;
    if (!teamId || !puzzleId || !Array.isArray(filledGrid))
      return res.status(400).json({ error: 'Invalid input' });

    const puzzle = await Puzzle.findById(puzzleId);
    if (!puzzle) return res.status(404).json({ error: 'Puzzle not found' });

    let isCorrect = true;

    for (let r = 0; r < puzzle.grid.length; r++) {
      for (let c = 0; c < puzzle.grid[r].length; c++) {
        const correct = (puzzle.grid[r][c] || '').toUpperCase();
        const given = (filledGrid[r]?.[c] || '').toUpperCase();

        // Only check actual letter cells (not spaces or null)
        if (correct.trim() && correct !== given) {
          isCorrect = false;
          break;
        }
      }
      if (!isCorrect) break;
    }

    if (isCorrect) {
      await Team.findByIdAndUpdate(teamId, {
        'stage1.solved': true,
        'stage1.coordinate': puzzle.coordinateAfterSolve,
        'stage1.solvedAt': new Date()
      });

      res.json({
        ok: true,
        coordinate: puzzle.coordinateAfterSolve,
        message: '✅ Correct! Coordinate unlocked.'
      });
    } else {
      res.json({ ok: false, message: '❌ Incorrect solution!' });
    }
  } catch (err) {
    console.error('❌ POST /api/puzzle/submit failed:', err);
    res.status(500).json({ error: 'Server error while submitting puzzle' });
  }
});


/**
 * POST /api/stage2/tokens
 * Set tokens for a team (manual or called by judge). Because you don't want a judge UI, you can call this endpoint manually
 * body: { teamId, tokens }
 */


/**
 * POST /api/stage3/convert
 * Convert tokens -> coins (configurable rate). body: { teamId, rate }
 * updates team.stage3.coins
 */
app.post("/api/stage3/addcoins", async (req, res) => {
  try {
    const { teamId, coins } = req.body;
    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ error: "Team not found" });
    team.stage3.coins += Number(coins);
    await team.save();
    res.json({ message: "Coins added", coins: team.stage3.coins });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});


/**
 * POST /api/design/submit
 * Submit design for stage3. Body includes: { teamId, platformSize ('2','4','8'), orbit, solar, components: [{code,name,r,c,grid_span,cost,power}] }
 * Server validates: totalCost <= coins, totalPower <= solar limit (we use simple rules), placements within grid and no overlap.
 */
app.post("/api/design/submit", async (req, res) => {
  try {
    const {
      teamId,
      platformSize,
      orbit,
      solar,
      batteries,
      components,
    } = req.body;

    if (!teamId)
      return res.status(400).json({ error: "Missing teamId" });

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ error: "Team not found" });

    const teamCode = team.code || team.teamCode || team.name || "Unknown Team";
    const coins = team.stage3?.coins ?? 0;

    // --- Derived values ---
    const platformName =
      platformSize === 4
        ? "CubeSat (1U)"
        : platformSize === 6
        ? "Mini Satellite"
        : platformSize === 8
        ? "Medium Satellite"
        : "Large Satellite";

    const sensors = (components || []).map((c) => c.name);

    const totalCost = (components || []).reduce(
      (sum, c) => sum + (c.cost || 0),
      0
    );

    const totalPower = (components || []).reduce(
      (sum, c) => sum + (c.power || 0),
      0
    );

    const batteryStorage = (batteries || []).reduce((sum, code) => {
      if (code === "B01") return sum + 100;
      if (code === "B02") return sum + 500;
      return sum;
    }, 0);

    let solarPower = 100;
    if (solar === "P02") solarPower = 500;
    if (solar === "P03") solarPower = 1200;

    if (totalPower > solarPower)
      return res
        .status(400)
        .json({ error: "Power overload: exceeds solar capacity" });

    if (totalCost > coins)
      return res.status(400).json({ error: "Budget exceeded" });

    const runtimeHours = batteryStorage / Math.max(totalPower, 1);

    // --- Create design document ---
    const design = await Design.create({
      teamId,
      teamCode,
      platform: platformName,
      orbit,
      sensors,
      solar,
      batteries,
      powerDraw: totalPower,
      batteryStorage,
      runtimeHours,
      totalCost,
      remainingCoins: coins - totalCost,
    });

    // --- Deduct coins and link design ---
    team.stage3.design = design._id;
    team.stage3.coins = coins - totalCost;
    await team.save();

    res.json({
      ok: true,
      design,
      message: "Design saved successfully",
      remainingCoins: team.stage3.coins,
    });
  } catch (err) {
    console.error("❌ /api/design/submit error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /api/team/:teamId
 */
app.get('/api/team/:teamId', async (req,res) => {
  try {
    const team = await Team.findById(req.params.teamId);
    if(!team) return res.status(404).json({ error:'not found' });
    return res.json({ ok:true, team });
  } catch(err) {
    console.error(err);
    res.status(500).json({ error:'server error' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, ()=>console.log('Server running on', PORT));
