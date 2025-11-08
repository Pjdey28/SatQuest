import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

export default function Dashboard() {
  const [team, setTeam] = useState(null);
  const teamId = localStorage.getItem("teamId");

  useEffect(() => {
    if (teamId) {
      axios.get(`/api/teams/${teamId}`).then(res => setTeam(res.data));
    }
  }, [teamId]);

  if (!team) return <div className="p-10 text-center">Loading...</div>;

  const { stage1, stage2, stage3 } = team;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-8">
        Welcome, {team.teamName}
      </h1>

      <div className="space-y-6">
        {/* Stage 1 */}
        <div className="p-6 rounded-2xl shadow bg-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Stage 1 – Crossword</h2>
            {stage1.solved ? (
              <p className="text-green-600">
                ✅ Completed – Coordinate: {stage1.coordinate}
              </p>
            ) : (
              <p className="text-gray-500">Not completed yet</p>
            )}
          </div>
          {!stage1.solved && (
            <Link
              to="/Crossword"
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              Start
            </Link>
          )}
        </div>


        {/* Stage 3 */}
        <div className="p-6 rounded-2xl shadow bg-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Stage 3 – Satellite Design</h2>
            {stage3.coins > 0 ? (
              <p className="text-green-600">Unlocked!</p>
            ) : (
              <p className="text-red-500">Locked – Finish Stage 2 to unlock</p>
            )}
          </div>
          {stage3.coins > 0 && (
            <Link
              to="/Designer"
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Open
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
