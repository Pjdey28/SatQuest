const mongoose = require('mongoose');

const MemberSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String
}, { _id: false });

const PuzzleSchema = new mongoose.Schema({
  code: String,
  grid: [[String]], // correct letters or null for block
  clues: [{
    id: String,
    direction: String,
    r: Number,
    c: Number,
    length: Number,
    clue: String,
    answer: String
  }],
  coordinateAfterSolve: { r: Number, c: Number }
}, { timestamps: true });

const designSchema = new mongoose.Schema({
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true },
  teamCode: { type: String }, // Optional readable team code

  platform: { type: String, required: true },
  orbit: { type: String, required: true },
  sensors: [{ type: String }], // names of sensors placed
  solar: { type: String, required: true },
  batteries: [{ type: String, required: true }],

  powerDraw: Number,
  batteryStorage: Number,
  runtimeHours: Number,

  totalCost: Number,
  remainingCoins: Number,

  createdAt: { type: Date, default: Date.now }
});

const TeamSchema = new mongoose.Schema({
  teamName: { type: String, required: true, unique: true },
  teamCode: { type: String, required: true, unique: true }, // login code
  members: { type: [MemberSchema], default: [] }, // expect 3 members
  createdAt: { type: Date, default: Date.now },

  // Stage progress
  stage1: {
    puzzleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Puzzle' },
    solved: { type: Boolean, default: false },
    solvedAt: Date,
    coordinate: { r:Number, c:Number }
  },
  stage3: {
    coins: { type: Number, default: 0 },
    design: {  type: mongoose.Schema.Types.ObjectId, ref: "Design" }
  }
});

const Team = mongoose.model('Team', TeamSchema);
const Puzzle = mongoose.model('Puzzle', PuzzleSchema);
const Design = mongoose.model('Design', designSchema);

module.exports = { Team, Puzzle, Design };
